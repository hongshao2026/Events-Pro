import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {openDiscoveryDetails,chooseDiscoveryStatus,readDiscoveryOption,readDiscoveryFilterChecked} from './discovery-actions.mjs';

const output=resolve('.sites-runtime/qa/event-tags');await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
const context=await browser.newContext({viewport:{width:320,height:950},offline:true,reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(15000);
const checks=[],errors=[],requests=[];page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(/^https?:/.test(request.url()))requests.push(request.url());});
const pass=message=>{checks.push(message);console.log('PASS',message);};
const file=pathToFileURL(resolve('release/WPT赛事自选表.html')).href,key='poker-planner-local-v2';
const data=Object.fromEntries(await Promise.all([['wpt-wynn-2026','schedule'],['triton-one-cyprus-2026','triton-cyprus-2026'],['qpc-circuit-2026','qpc-circuit-2026'],['kpc-jeju-2026','kpc-jeju-2026'],['jeju-poker-festival-2026','jeju-poker-festival-2026']].map(async([series,name])=>[series,JSON.parse(await fs.readFile(`lib/${name}.json`,'utf8'))])));
const entryId=(series,id)=>{const event=data[series].find(event=>event.id===id);assert.ok(event,id);return `${series}/${id}/${event.starts[0].id}`;};
const row=id=>page.locator(`.mobile-event[data-entry-id="${id}"]`),sheet=()=>page.locator('.event-detail-sheet');
const params=()=>new URLSearchParams(new URL(page.url()).hash.slice(1));
const readSaved=()=>page.evaluate(key=>localStorage.getItem(key),key);
const settledTag=async(game,series)=>{
 await sheet().waitFor({state:'hidden'});await page.waitForFunction(()=>document.querySelector('.results-bar>span')===document.activeElement);
 assert.equal(params().get('game'),game);assert.equal(params().get('series'),series);assert.equal(params().get('view'),'discover');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
};

try{
 const series='qpc-circuit-2026',id=entryId(series,'QPC01');
 await page.goto(file+`#view=discover&series=${series}&q=QPC01`);await row(id).waitFor();await chooseDiscoveryStatus(page,row(id),'参加');
 const saved=await readSaved();
 // A constrained deep link must not prevent a detail tag from finding the whole category.
 await page.goto(file+`#view=discover&series=${series}&q=QPC01&from=2026-10-12&to=2026-10-12&buyinMin=1000&buyinMax=1200&buyinCurrency=CNY&statuses=attend&page=2`);await row(id).waitFor();
 await row(id).locator('.event-row-open').scrollIntoViewIfNeeded();const priorUrl=page.url(),priorScroll=await page.evaluate(()=>scrollY);
 await openDiscoveryDetails(page,row(id));const tag=sheet().getByRole('button',{name:'筛选：德州扑克',exact:true});assert.equal(await tag.innerText(),'#德州扑克');
 await tag.focus();await page.keyboard.press('Enter');await settledTag('nlh',series);
 for(const filter of ['q','from','to','buyinMin','buyinMax','buyinCurrency','statuses','page'])assert.equal(params().has(filter),false,filter);
 assert.equal(await page.getByRole('textbox',{name:'搜索赛事',exact:true}).inputValue(),'');assert.equal(await readDiscoveryFilterChecked(page,'全部赛事'),'true');
 assert.match(await page.locator('.results-bar').innerText(),/找到\s*72\s*个场次/);assert.equal(await readSaved(),saved);
 await page.reload();await row(id).waitFor();assert.equal(params().get('game'),'nlh');assert.match(await readDiscoveryOption(page,'赛事类型'),/德州扑克/);
 await page.goBack();await row(id).waitFor();await page.waitForFunction(()=>document.querySelector('.results-bar>span')===document.activeElement);
 assert.equal(page.url(),priorUrl);assert.equal(await page.getByRole('textbox',{name:'搜索赛事',exact:true}).inputValue(),'QPC01');assert.ok(Math.abs(await page.evaluate(()=>scrollY)-priorScroll)<=2,'Back restores the prior filtered list position');
 assert.equal(await sheet().count(),0);assert.equal(await readSaved(),saved);
 pass('keyboard tag activation clears restrictive search/date/money/status/page filters, persists on reload and restores the prior list with Back without changing selections');

 for(const item of [
  {series:'wpt-wynn-2026',event:'W03',label:'奥马哈',game:'omaha'},
  {series:'triton-one-cyprus-2026',event:'T13',label:'奥马哈',game:'omaha',count:3},
  {series:'qpc-circuit-2026',event:data['qpc-circuit-2026'].find(event=>event.kind==='satellite').id,label:'卫星赛',game:'satellite',count:19},
  {series:'kpc-jeju-2026',event:'KPC63',label:'混合游戏',game:'mixed-games'},
  {series:'jeju-poker-festival-2026',event:'JPF-21',label:'奥马哈',game:'omaha'},
 ]){
  const id=entryId(item.series,item.event);await page.goto(file+`#view=discover&series=${item.series}&q=${encodeURIComponent(item.event)}`);await row(id).waitFor();
  const source=data[item.series].find(event=>event.id===item.event),metadata=await row(id).locator('.mobile-event-meta>span').allInnerTexts();
  assert.deepEqual(metadata,[...(source.restricted?['资格限制']:[]),...(source.supplement?['官方补充']:[])],'Only eligibility and supplemental-source notices remain in the compact list');
  await openDiscoveryDetails(page,row(id));const tag=sheet().getByRole('button',{name:`筛选：${item.label}`,exact:true});assert.equal(await tag.innerText(),'#'+item.label);
  if(item.event==='KPC63')assert.equal(await sheet().getByRole('button',{name:'筛选：奥马哈',exact:true}).count(),0,'NLH/PLO mixed is not a pure Omaha tag');
  await tag.click();await settledTag(item.game,item.series);assert.equal(params().has('q'),false);assert.equal(await readSaved(),saved);
  if(item.count)assert.match(await page.locator('.results-bar').innerText(),new RegExp(`找到\\s*${item.count}\\s*个场次`));
  const shown=await page.locator('.mobile-event').evaluateAll(nodes=>nodes.map(node=>node.dataset.entryId));assert.ok(shown.length>0);assert.ok(shown.every(id=>id.startsWith(item.series+'/')));
  if(item.event==='KPC63')assert.ok(shown.every(id=>!id.includes('/KPC15/')));
  await page.screenshot({path:resolve(output,`${item.series}-${item.game}-320.png`)});
  await page.reload();assert.equal(params().get('game'),item.game);await page.locator('.mobile-event').first().waitFor();
 }
 pass('real events across all five series expose working tags; satellites, pure Omaha and NLH/PLO mixed stay distinct and category URLs survive reload');
 const drawEvent=data['kpc-jeju-2026'].find(event=>event.title.includes('SINGLE DRAW')),drawId=entryId('kpc-jeju-2026',drawEvent.id);
 await page.goto(file+`#view=discover&series=kpc-jeju-2026&q=${drawEvent.id}`);await row(drawId).waitFor();await openDiscoveryDetails(page,row(drawId));
 assert.match(await sheet().locator('.event-detail-tags').innerText(),/#抽牌/);assert.equal(await sheet().getByRole('button',{name:'筛选：抽牌',exact:true}).count(),0);
 pass('specific draw-game detail metadata remains accurate without adding a fifth game-filter category');
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);pass('tag discovery remains fully offline and never modifies saved participation or budget state');
}finally{await fs.writeFile(resolve(output,'results.json'),JSON.stringify({checks,errors,requests},null,2));await browser.close();}
