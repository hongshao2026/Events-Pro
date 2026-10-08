import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const output=resolve('.sites-runtime/qa/compact-events');await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
const context=await browser.newContext({viewport:{width:390,height:950},offline:true,reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(15000);
const checks=[],errors=[],requests=[],metrics=[];
page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(/^https?:/.test(request.url()))requests.push(request.url());});
const pass=message=>{checks.push(message);console.log('PASS',message);};
const kpc=JSON.parse(await fs.readFile('lib/kpc-jeju-2026.json','utf8')),qpc=JSON.parse(await fs.readFile('lib/qpc-circuit-2026.json','utf8'));
const opening=kpc.find(event=>event.id==='KPC01'),openingId=`kpc-jeju-2026/KPC01/${opening.starts[0].id}`;
const file=pathToFileURL(resolve('release/WPT赛事自选表.html')).href;
const row=id=>page.locator(`.mobile-event[data-entry-id="${id}"]`);
const search=term=>page.getByRole('textbox',{name:'搜索赛事',exact:true}).fill(term);
const discover=async series=>{await page.goto(file+'#view=discover&series='+series);await page.waitForFunction(expected=>document.querySelector('.mobile-event')?.dataset.entryId?.startsWith(expected+'/'),series);};
const nav=name=>page.locator('.bottom-nav').getByRole('button',{name:name==='我的自选'?/我的自选/:name,exact:true}).click();
const choose=(locator,label)=>locator.locator('.class-option').filter({hasText:new RegExp('^'+label+'$')}).click();
const fits=async(locator,label)=>assert.equal(await locator.evaluate(element=>element.scrollWidth>element.clientWidth+1),false,label);
const grouped=async detail=>{
 for(const name of ['报名信息','比赛结构','续赛安排','资料来源'])assert.equal(await detail.getByRole('heading',{name,exact:true}).count(),1,name);
 assert.match(await detail.innerText(),/开赛时间.*10\/10 11:00.*KST/s);
 assert.match(await detail.innerText(),/报名截止.*10\/10 15:25.*第 8 级/s);
 assert.match(await detail.innerText(),/起始筹码.*25,000.*级别时长.*30 分钟/s);
 assert.match(await detail.innerText(),/共享整项赛事保底/);
 assert.equal(await detail.getByRole('link',{name:'官网本场赛程 ↗',exact:true}).getAttribute('href'),opening.starts[0].sourceUrl);
};

try{
 await discover('kpc-jeju-2026');const first=row(openingId);await first.waitFor();
 assert.match(await first.locator('.mobile-event-top').innerText(),/10\/10.*11:00.*Day 1A.*#1/s);
 assert.equal(await first.locator('.status-badge').count(),0,'The selected action carries classification without a duplicate badge');
 assert.doesNotMatch(await first.innerText(),/德州扑克|保底由各起始组共享/);
 assert.match(await first.innerText(),/整赛保底.*₩180,000,000/s);
 assert.match(await first.locator('.registration-summary').innerText(),/15:25/);
 for(const width of [390,320]){
  await page.setViewportSize({width,height:950});await fits(page.locator('html'),'No horizontal page scroll');await fits(first,'Card stays inside phone width');
  for(const option of await first.locator('.class-option').all()){const box=await option.boundingBox();assert.ok(box.width>=44&&box.height>=40,JSON.stringify(box));}
  metrics.push({width,card:await first.boundingBox()});await first.screenshot({path:resolve(output,`after-card-${width}.png`)});
 }
 pass('compact KPC card retains date, flight, official number, original/converted price, whole-event guarantee and registration deadline at 320/390px');

 for(const [label,status]of [['参加','attend'],['关注','watch'],['不考虑','skip'],['待定','undecided']]){
  await choose(first,label);assert.equal(await first.getAttribute('data-status'),status);
  assert.equal(await first.getByRole('radio',{name:label,exact:true}).getAttribute('aria-checked'),'true');
  await page.reload();assert.equal(await row(openingId).getAttribute('data-status'),status);
 }
 await first.getByRole('radio',{name:'待定',exact:true}).focus();await page.keyboard.press('ArrowRight');
 assert.equal(await first.getByRole('radio',{name:'参加',exact:true}).evaluate(element=>element===document.activeElement),true);await page.keyboard.press('Space');
 await page.waitForFunction(id=>document.querySelector(`.mobile-event[data-entry-id="${id}"]`)?.dataset.status==='attend',openingId);
 assert.equal(await first.getByRole('radio',{name:'参加',exact:true}).evaluate(element=>element===document.activeElement),true);
 pass('all four classifications save immediately, survive reload and retain arrow-key navigation with keyboard activation');

 await first.locator('.event-title').click();await grouped(first.locator('.detail'));await fits(first.locator('.detail'),'Expanded detail fits a 320px phone');
 await first.locator('.detail').screenshot({path:resolve(output,'grouped-discovery-320.png')});
 await nav('我的自选');const budgetBefore=await page.locator('.cart-budget').innerText();
 await page.locator(`.shortlist-table tr[data-entry-id="${openingId}"] .shortlist-entry-button`).click();
 await grouped(page.locator('.shortlist-detail-sheet .detail'));await page.keyboard.press('Escape');await page.locator('.shortlist-detail-sheet').waitFor({state:'hidden'});
 await nav('我的日程');await page.locator(`.agenda-row[data-entry-id="${openingId}"]`).click();
 await grouped(page.locator('.agenda-detail-sheet .detail'));await page.keyboard.press('Escape');await page.locator('.agenda-detail-sheet').waitFor({state:'hidden'});
 const continuation=page.locator('.agenda-row[data-activity-id="kpc-jeju-2026/KPC01/continuation/0"]');assert.equal(await continuation.count(),1);await continuation.click();
 const finalDetail=page.locator('.agenda-detail-sheet .detail');
 assert.match(await finalDetail.innerText(),/晋级|续赛/);assert.match(await finalDetail.innerText(),/沿用晋级筹码/);assert.match(await finalDetail.innerText(),/不增加买入|不新增买入|无新增买入/);
 assert.doesNotMatch(await finalDetail.innerText(),/10\/10 15:25/,'Final must not inherit the starting flight registration deadline');
 assert.equal(await finalDetail.getByRole('link',{name:'官网本场赛程 ↗',exact:true}).getAttribute('href'),opening.continuations[0].sourceUrl);
 assert.equal(await page.locator('.agenda-detail-actions .classification').count(),0);
 await page.keyboard.press('Escape');await page.locator('.agenda-detail-sheet').waitFor({state:'hidden'});await nav('我的自选');assert.equal(await page.locator('.cart-budget').innerText(),budgetBefore);
 pass('discovery, shortlist and agenda share grouped rules and exact sources; conditional final remains read-only and adds no budget');

 await discover('qpc-circuit-2026');await search('QPC47');
 const imperial=qpc.find(event=>event.id==='QPC47'),overnight=row(`qpc-circuit-2026/QPC47/${imperial.starts[2].id}`);
 assert.match(await overnight.locator('.registration-summary').innerText(),/10\/21.*00:40/s);
 await search('QPC31');const ambiguous=page.locator('.mobile-event');assert.match(await ambiguous.locator('.registration-summary').innerText(),/见详情/);
 assert.doesNotMatch(await ambiguous.locator('.registration-summary').innerText(),/12:00|13:05/);
 await ambiguous.locator('.event-title').click();assert.match(await ambiguous.locator('.detail').innerText(),/未标日期/);assert.match(await ambiguous.locator('.detail').innerText(),/13:05/);
 await discover('triton-one-cyprus-2026');await search('T21');assert.match(await page.locator('.registration-summary').innerText(),/11\/13.*00:30/s);
 await search('T06');assert.match(await page.locator('.mobile-event').innerText(),/资格限制/);await page.locator('.event-title').click();assert.match(await page.locator('.detail').innerText(),/仅限女性/);
 await discover('kpc-jeju-2026');await search('KPC63');assert.match(await page.locator('.mobile-event-meta').innerText(),/混合|奥马哈|PLO/);
 pass('overnight deadlines keep their calendar date; ambiguous source notes remain visible without inventing a closing time, and special-game/eligibility tags stay in the list');

 await discover('qpc-circuit-2026');await search('QPC01');
 const longTitle='QPC 国际扑克锦标赛超长赛事名称 INTERNATIONAL HIGH ROLLER CHAMPIONSHIP QUALIFIER';
 await page.evaluate(title=>{localStorage.setItem('events-pro-settings-v1',JSON.stringify({version:1,revision:1,profile:{username:'',currency:'CNY'},fx:{rates:{CNY:1,USD:6.7351,VND:0.000258,HKD:0.8584,KRW:0.004958},asOf:'2026-10-08',source:'中国银行折算价'},eventOverrides:{QPC01:{title,buyin:999999999999,guarantee:1000000000000}}}));},longTitle);
 await page.reload();const longCard=page.locator('.mobile-event').first();assert.equal(await longCard.locator('.event-title').innerText(),longTitle);
 for(const width of [320,390]){
  await page.setViewportSize({width,height:950});await fits(page.locator('html'),'Long title and large values do not widen page');await fits(longCard,'Long card content stays contained');await fits(longCard.locator('.event-title'),'Long title wraps without clipping');
  assert.match(await longCard.locator('.mobile-money').innerText(),/₫999,999,999,999/);assert.match(await longCard.locator('.mobile-money').innerText(),/₫1,000,000,000,000/);
  const money=await longCard.locator('.mobile-money').boundingBox(),actions=await longCard.locator('.classification').boundingBox();assert.ok(money.y+money.height<=actions.y+1,'Amounts do not overlap action targets');
  await longCard.screenshot({path:resolve(output,`long-title-values-${width}.png`)});
 }
 pass('managed long bilingual names and trillion-unit native amounts remain complete and usable on 320/390px phones');
 await page.evaluate(()=>{const key='events-pro-settings-v1',settings=JSON.parse(localStorage.getItem(key));settings.profile.currency='HKD';settings.fx.rates.HKD=null;settings.revision++;localStorage.setItem(key,JSON.stringify(settings));});
 await page.reload();await page.setViewportSize({width:320,height:950});await fits(page.locator('html'),'Missing-rate notice fits the compact card');await fits(longCard,'Missing-rate notice stays inside the card');
 assert.match(await longCard.locator('.mobile-money').innerText(),/₫999,999,999,999/);assert.match(await longCard.locator('.converted-price').innerText(),/汇率未设置/);assert.doesNotMatch(await longCard.locator('.mobile-money').innerText(),/HK\$0/);
 pass('missing preferred-currency rates keep the native amount and explicit notice on a narrow card');
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);pass('compact cards and shared detail remain fully offline without browser errors');
}finally{await fs.writeFile(resolve(output,'results.json'),JSON.stringify({checks,errors,requests,metrics},null,2));await browser.close();}
