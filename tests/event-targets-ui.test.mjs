import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {openDiscoveryDetails,closeDiscoveryDetails,chooseDiscoveryStatus,setDiscoveryFilterChecked,switchDiscoverySeries} from './discovery-actions.mjs';

const output=resolve('.sites-runtime/qa/event-targets');await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
const context=await browser.newContext({viewport:{width:320,height:950},offline:true,reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(15000);
const checks=[],errors=[],requests=[];page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(/^https?:/.test(request.url()))requests.push(request.url());});
const pass=message=>{checks.push(message);console.log('PASS',message);};
const data=JSON.parse(await fs.readFile('lib/kpc-jeju-2026.json','utf8')),wpt=JSON.parse(await fs.readFile('lib/schedule.json','utf8')),series='kpc-jeju-2026',file=pathToFileURL(resolve('release/WPT赛事自选表.html')).href;
const source=id=>data.find(event=>event.id===id),entry=id=>`${series}/${id}/${source(id).starts[0].id}`,row=id=>page.locator(`.mobile-event[data-entry-id="${entry(id)}"]`),sheet=()=>page.locator('.event-detail-sheet');
const nav=name=>page.locator('.bottom-nav').getByRole('button',{name:name==='我的自选'?/我的自选/:name,exact:true}).click();
const discover=async id=>{await nav('赛事');await page.locator(`.festival-card[data-series-id="${series}"]`).click();await page.getByRole('textbox',{name:'搜索赛事',exact:true}).fill(id);await row(id).waitFor();};
const targets=detail=>detail.locator('.detail-section').filter({has:page.getByRole('heading',{name:'目标赛事',exact:true})});
const trimmed=async detail=>{
 for(const name of ['续赛安排','补充说明','资料来源'])assert.equal(await detail.getByRole('heading',{name,exact:true}).count(),0);
 assert.equal(await detail.locator('.detail-notes,.detail-source').count(),0);assert.equal(await detail.getByRole('link',{name:'官网本场赛程 ↗',exact:true}).count(),0);
};
const close=async selector=>{await page.keyboard.press('Escape');await page.locator(selector).waitFor({state:'hidden'});};
const openShortlist=async id=>{await nav('我的自选');await page.locator(`.shortlist-table tr[data-entry-id="${entry(id)}"] .shortlist-entry-button`).click();await page.locator('.shortlist-detail-sheet').waitFor();return page.locator('.shortlist-detail-sheet .detail');};
const openAgenda=async id=>{await nav('我的日程');await page.locator(`.agenda-row[data-entry-id="${entry(id)}"]`).click();await page.locator('.agenda-detail-sheet').waitFor();return page.locator('.agenda-detail-sheet .detail');};
const saved=()=>page.evaluate(()=>localStorage.getItem('poker-planner-local-v2'));
try{
 await page.goto(file+`#view=discover&series=${series}&q=KPC20`);await row('KPC20').waitFor();await openDiscoveryDetails(page,row('KPC20'));
 const single=sheet().locator('.detail');await trimmed(single);assert.equal(await targets(single).count(),0);assert.equal((await single.innerText()).includes(source('KPC20').notes),false);assert.equal(await sheet().locator('.event-detail-source-updated').count(),0);assert.doesNotMatch(await sheet().innerText(),/资料更新：/);assert.match(await single.innerText(),/10\/13 00:15.*第 8 级/s);const singleText=await single.innerText();
 for(const width of [320,390]){await page.setViewportSize({width,height:950});assert.equal(await sheet().evaluate(element=>element.scrollWidth>element.clientWidth+1),false);await sheet().screenshot({path:resolve(output,`single-day-${width}.png`)});}await closeDiscoveryDetails(page);await chooseDiscoveryStatus(page,row('KPC20'),'参加');
 for(const [open,selector]of [[openShortlist,'.shortlist-detail-sheet'],[openAgenda,'.agenda-detail-sheet']]){const detail=await open('KPC20');await trimmed(detail);assert.equal(await targets(detail).count(),0);assert.equal(await detail.innerText(),singleText);await close(selector);}
 pass('a single-day KPC20 has no target, notes, source or update blocks; discovery, shortlist and agenda share the same remaining facts');

 await discover('KPCMS01');await openDiscoveryDetails(page,row('KPCMS01'));const satellite=targets(sheet().locator('.detail'));assert.equal(await satellite.count(),1);assert.match(await satellite.innerText(),/ME\s*DAY\s*1B/i);assert.equal(await satellite.getByRole('link').count(),0);const satelliteText=await satellite.innerText();await trimmed(sheet().locator('.detail'));await sheet().screenshot({path:resolve(output,'satellite-target.png')});await closeDiscoveryDetails(page);await chooseDiscoveryStatus(page,row('KPCMS01'),'关注');
 for(const [open,selector]of [[openShortlist,'.shortlist-detail-sheet'],[openAgenda,'.agenda-detail-sheet']]){const detail=await open('KPCMS01');await trimmed(detail);assert.equal(await targets(detail).innerText(),satelliteText);await close(selector);}
 await nav('我的自选');assert.match(await page.locator('.cart-budget [data-currency="KRW"]').innerText(),/₩400,000/);
 pass('satellites show the official target flight consistently across all three entry points without charging watched satellites to the budget');

 await discover('KPC01');await openDiscoveryDetails(page,row('KPC01'));const openingTargets=targets(sheet().locator('.detail'));assert.match(await openingTargets.innerText(),/Final Day.*10\/11 12:00.*KST/s);assert.doesNotMatch(await openingTargets.innerText(),/Day 1A|10\/10 11:00/);assert.equal(await sheet().getByRole('button',{name:/查看此赛事的 3 个起始组/}).count(),1);await closeDiscoveryDetails(page);await chooseDiscoveryStatus(page,row('KPC01'),'参加');
 await discover('KPC08');await chooseDiscoveryStatus(page,row('KPC08'),'参加');await nav('我的自选');const before=await page.locator('.cart-budget').innerText(),savedBefore=await saved();assert.match(before,/₩2,500,000/);
 await nav('我的日程');await page.locator(`.agenda-row[data-activity-id="${series}/KPC08/continuation/0"]`).click();let detail=page.locator('.agenda-detail-sheet .detail');await trimmed(detail);assert.match(await targets(detail).innerText(),/Final Day.*10\/16 13:00.*KST/s);assert.doesNotMatch(await targets(detail).innerText(),/Day 2|10\/15/);assert.match(await detail.innerText(),/报名费\s+晋级续赛，不新增买入/);assert.equal(await page.locator('.agenda-detail-actions .classification').count(),0);await close('.agenda-detail-sheet');
 for(const event of ['KPC01','KPC08']){const index=source(event).continuations.length-1;await page.locator(`.agenda-row[data-activity-id="${series}/${event}/continuation/${index}"]`).click();detail=page.locator('.agenda-detail-sheet .detail');assert.equal(await targets(detail).count(),0);assert.match(await detail.innerText(),/沿用晋级筹码/);assert.match(await detail.innerText(),/不新增买入/);assert.equal(await page.locator('.agenda-detail-actions .classification').count(),0);await close('.agenda-detail-sheet');}
 await nav('我的自选');assert.equal(await page.locator('.cart-budget').innerText(),before);assert.equal(await saved(),savedBefore);
 pass('starting flights target later stages; a continuation targets only subsequent stages, final days never target themselves, and all continuation details remain read-only with no added buy-in');

 await discover('KPC20');await switchDiscoverySeries(page,'WPT · Wynn 2026');await setDiscoveryFilterChecked(page,'显示官方补充卫星',true);await page.getByRole('textbox',{name:'搜索赛事',exact:true}).fill('S21');const unknown=wpt.find(event=>event.id==='S21');await openDiscoveryDetails(page,page.locator(`.mobile-event[data-entry-id="wpt-wynn-2026/S21/${unknown.starts[0].id}"]`));assert.match(await targets(sheet().locator('.detail')).innerText(),/目标赛事未公布/);assert.equal(await targets(sheet().locator('.detail')).getByRole('link').count(),0);await trimmed(sheet().locator('.detail'));await sheet().screenshot({path:resolve(output,'unknown-satellite-target.png')});assert.equal(await saved(),savedBefore);
 pass('a Double Play satellite without an explicit official target says the target is unpublished instead of guessing an event');
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);pass('concise target details remain offline and preserve all saved participation');
}finally{await fs.writeFile(resolve(output,'results.json'),JSON.stringify({checks,errors,requests},null,2));await browser.close();}
