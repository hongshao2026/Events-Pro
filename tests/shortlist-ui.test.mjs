import {chooseDiscoveryStatus} from './discovery-actions.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {chromium} from 'playwright';

const output=resolve('.sites-runtime/qa/shortlist');await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
const context=await browser.newContext({viewport:{width:390,height:900},offline:true,reducedMotion:'reduce'});
const page=await context.newPage(),checks=[],errors=[],requests=[];
page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(/^https?:/.test(request.url()))requests.push(request.url());});
const pass=name=>{checks.push(name);console.log('PASS',name);};
const file=pathToFileURL(resolve('release/WPT赛事自选表.html')).href;
const key='poker-planner-local-v2',legacyKey='wpt-2026-local-selections-v1';
const first='wpt-wynn-2026/W01/R0',second='wpt-wynn-2026/W01/R3',watch='wpt-wynn-2026/W02/R1',triton='triton-one-cyprus-2026/T01/T01-D1A';
const rows=()=>page.locator('.shortlist-table tr[data-entry-id]');
const row=id=>page.locator(`.shortlist-table tr[data-entry-id="${id}"]`);
const detail=()=>page.locator('.shortlist-detail-sheet');
const actions=()=>page.locator('.shortlist-detail-actions');
const entryButton=id=>row(id).getByRole('button',{name:/^查看 .+ 详情$/});
const nav=name=>page.locator('.bottom-nav').getByRole('button',{name:name==='我的自选'?/我的自选/:name,exact:true}).click();
const filter=name=>page.getByRole('group',{name:'自选分类',exact:true}).getByRole('button',{name:new RegExp('^'+name)});
const budgetCell=id=>row(id).locator('[data-column="budget"]');
const budgetAmount=async id=>{
 const text=await budgetCell(id).innerText(),match=text.match(/\$([\d,]+)/);
 assert.ok(match,`Budget cell for ${id} must expose its USD contribution: ${text}`);return Number(match[1].replaceAll(',',''));
};
const savedState=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,key);
const setBudgetMode=async label=>{await page.getByRole('combobox',{name:'预算计算方式',exact:true}).click();await page.getByRole('option',{name:label,exact:true}).click();};
const showDetail=async id=>{await entryButton(id).click();await detail().waitFor();};

try{
 await page.goto(file+'#view=shortlist');await page.getByRole('heading',{name:'我的自选',exact:true}).waitFor();
 assert.equal(await rows().count(),0);assert.equal(await page.getByRole('dialog').count(),0);
 assert.equal(await page.getByRole('button',{name:'导出图片',exact:true}).isDisabled(),true);
 const state={selections:{[first]:{status:'attend',version:1},[second]:{status:'attend',version:1},[watch]:{status:'watch',version:1},[triton]:{status:'watch',version:1}},pending:{},revision:1,budgetMode:'flights'};
 await page.evaluate(([key,state])=>localStorage.setItem(key,JSON.stringify({app:'wpt-planner',schemaVersion:2,savedAt:'2026-10-08T00:00:00Z',state})),[key,state]);
 await page.reload();await row(first).waitFor();
 assert.equal(await rows().count(),4);assert.equal(await page.getByRole('dialog').count(),0);
 assert.equal(await page.getByRole('combobox',{name:'赛事系列',exact:true}).count(),0);
 assert.equal(await page.locator('.bottom-nav').getByRole('button',{name:/我的自选/}).getAttribute('aria-current'),'page');
 assert.match(await page.title(),/我的自选/);
 for(const label of ['赛事','开赛时间','报名费','状态','计入预算'])assert.ok((await page.locator('.shortlist-table thead').innerText()).includes(label));
 assert.match(await page.locator('.cart-budget').innerText(),/\$1,200/);assert.match(await page.locator('.cart-budget').innerText(),/¥8,082.12/);
 assert.equal(await budgetAmount(first),600);assert.equal(await budgetAmount(second),600);assert.equal(await budgetAmount(watch),0);assert.equal(await budgetAmount(triton),0);
 assert.equal(await row(watch).getAttribute('data-status'),'watch');assert.equal(await row(first).getAttribute('data-status'),'attend');
 pass('shortlist is a direct, reloadable table page with cross-series selections and attendance-only USD/CNY budgets');

 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:900});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const shell=await page.locator('.app-shell').boundingBox();assert.ok(shell.width<=480.1);
  const scroller=page.locator('.shortlist-table-scroll');
  assert.equal(await scroller.evaluate(element=>element.scrollWidth>element.clientWidth),true);
  await scroller.evaluate(element=>{element.scrollLeft=0;});
  const firstCell=row(first).locator('th,td').first(),before=await firstCell.boundingBox();
  assert.equal(await firstCell.evaluate(element=>getComputedStyle(element).position),'sticky');
  await scroller.evaluate(element=>{element.scrollLeft=element.scrollWidth;});
  assert.ok(await scroller.evaluate(element=>element.scrollLeft)>0);
  const after=await firstCell.boundingBox();assert.ok(Math.abs(before.x-after.x)<2,'The event column stays readable while other columns scroll');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:resolve(output,`table-${width}-scrolled.png`)});
  await scroller.evaluate(element=>{element.scrollLeft=0;});
  await page.screenshot({path:resolve(output,`table-${width}.png`)});
 }
 await page.setViewportSize({width:390,height:900});
 const scroller=page.getByRole('region',{name:'自选赛事表格',exact:true});await scroller.focus();
 assert.equal(await scroller.evaluate(element=>element===document.activeElement),true);
 await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('.shortlist-table-scroll').scrollLeft>0);
 pass('320/390px phones and centered desktop have only internal horizontal scrolling, a sticky event column and keyboard access');

 await filter('正在关注').click();assert.equal(await rows().count(),2);assert.equal(await filter('正在关注').getAttribute('aria-pressed'),'true');
 assert.match(await page.locator('.cart-budget').innerText(),/\$1,200/);assert.equal(await budgetAmount(watch),0);
 await filter('计划参加').click();assert.equal(await rows().count(),2);await filter('全部自选').click();assert.equal(await rows().count(),4);
 await setBudgetMode('同一赛事只算一次');assert.match(await page.locator('.cart-budget').innerText(),/\$600/);
 const grouped=[await budgetAmount(first),await budgetAmount(second)];assert.deepEqual(grouped.slice().sort((a,b)=>a-b),[0,600]);
 assert.equal(await budgetAmount(watch),0);assert.equal(await budgetAmount(triton),0);
 await page.reload();await row(first).waitFor();assert.match(await page.locator('.cart-budget').innerText(),/\$600/);assert.equal((await savedState()).budgetMode,'events');
 pass('category filters retain the global budget; event mode counts one row per event and survives reload');

 await page.getByRole('button',{name:'日历',exact:true}).click();await page.getByRole('heading',{name:'我的日程表',exact:true}).waitFor();
 const calendarDay=page.locator('.schedule-calendar-panel').getByRole('button',{name:/^2026年11月27日/});await calendarDay.click();
 await page.getByRole('button',{name:'表格',exact:true}).click();await row(first).waitFor();assert.ok(page.url().includes('view=shortlist'));
 await page.goBack();await page.getByRole('heading',{name:'我的日程表',exact:true}).waitFor();assert.ok(page.url().includes('day=2026-11-27'));
 await page.goForward();await row(first).waitFor();await page.reload();await row(first).waitFor();assert.equal(await rows().count(),4);
 pass('calendar/table switching and browser Back/Forward restore the calendar day and shortlist route');

 await entryButton(first).focus();await page.keyboard.press('Enter');await detail().waitFor();assert.match(await detail().innerText(),/11\/27 11:00/);
 await page.keyboard.press('Escape');await detail().waitFor({state:'hidden'});await page.waitForFunction(id=>document.querySelector(`.shortlist-table tr[data-entry-id="${id}"] .shortlist-entry-button`)===document.activeElement,first);assert.equal(await entryButton(first).evaluate(element=>element===document.activeElement),true);
 await showDetail(first);const beforeFailure=await savedState();
 await page.evaluate(()=>{window.shortlistSavedSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError');};});
 await actions().locator('label.class-option').filter({hasText:/^不考虑$/}).click();await actions().getByRole('alert').waitFor();
 assert.equal(await row(first).getAttribute('data-status'),'attend');assert.match(await page.locator('.cart-budget').innerText(),/\$600/);assert.deepEqual(await savedState(),beforeFailure);
 await page.screenshot({path:resolve(output,'failed-save-detail.png')});
 await page.evaluate(()=>{Storage.prototype.setItem=window.shortlistSavedSetItem;});await page.keyboard.press('Escape');await detail().waitFor({state:'hidden'});
 await page.getByRole('button',{name:'重新读取',exact:true}).click();
 await showDetail(first);await actions().locator('label.class-option').filter({hasText:/^不考虑$/}).click();assert.equal(await row(first).count(),0);
 await page.keyboard.press('Escape');await detail().waitFor({state:'hidden'});await page.waitForFunction(()=>document.querySelector('.shortlist-summary')===document.activeElement);assert.equal(await page.locator('.shortlist-summary').evaluate(element=>element===document.activeElement),true);
 assert.equal(await budgetAmount(second),600);assert.match(await page.locator('.cart-budget').innerText(),/\$600/);
 await nav('我的日程');assert.equal(await page.locator(`.agenda-row[data-entry-id="${first}"]`).count(),0);assert.equal(await page.locator(`.agenda-row[data-entry-id="${second}"]`).count(),1);
 pass('detail keyboard focus, failed writes and successful reclassification preserve storage and synchronize table/calendar budgets');

 await page.goto(file+'#view=shortlist&series=missing');await page.getByRole('heading',{name:'我的自选',exact:true}).waitFor();assert.equal(await rows().count(),3);
 pass('cross-series shortlist remains available when a stale URL names an unknown active series');

 await page.evaluate(([key,legacyKey])=>{localStorage.removeItem(key);localStorage.setItem(legacyKey,JSON.stringify({app:'wpt-planner',schemaVersion:1,savedAt:'2026-10-02T10:00:00Z',selections:{W05:{status:'attend',flight:'',version:1}}}));},[key,legacyKey]);
 await page.goto(file+'#view=shortlist');await page.reload();
 const pending=page.locator('.shortlist-pending[data-event-id="W05"]');await pending.waitFor();
 assert.equal(await rows().count(),0);assert.match(await page.locator('.cart-budget').innerText(),/\$800/);assert.match(await pending.innerText(),/待安排/);
 await filter('正在关注').click();assert.equal(await pending.count(),0);assert.match(await page.locator('.cart-budget').innerText(),/\$800/);await filter('计划参加').click();await pending.waitFor();
 await pending.getByRole('button',{name:'选择起始组 →',exact:true}).click();await page.getByRole('heading',{name:/完整赛程$/}).waitFor();
 assert.equal(await page.getByRole('textbox',{name:'搜索赛事',exact:true}).inputValue(),'W05');
 const planned=page.locator('.mobile-event').first(),plannedId=await planned.getAttribute('data-entry-id');
 await chooseDiscoveryStatus(page,planned,'参加');await nav('我的自选');await row(plannedId).waitFor();
 assert.equal(await pending.count(),0);assert.equal(await rows().count(),1);assert.match(await page.locator('.cart-budget').innerText(),/\$800/);assert.equal(Object.keys((await savedState()).pending).length,0);
 assert.equal(await page.evaluate(legacyKey=>localStorage.getItem(legacyKey)!==null,legacyKey),true);
 await page.screenshot({path:resolve(output,'legacy-assigned.png')});
 pass('legacy unassigned attendance stays pending with one budget and becomes exactly one chosen starting flight');

 await page.evaluate(([key,state])=>localStorage.setItem(key,JSON.stringify({app:'wpt-planner',schemaVersion:2,savedAt:'2026-10-09T00:00:00Z',state})),[key,state]);
 await page.reload();await row(first).waitFor();await page.setViewportSize({width:320,height:900});
 const remove=id=>row(id).locator('.remove-selection');
 await page.locator('.shortlist-table-scroll').evaluate(element=>{element.scrollLeft=element.scrollWidth;});
 for(const id of [first,watch]){
  const target=await remove(id).boundingBox();assert.ok(target.x>=0&&target.x+target.width<=320,'Removal stays in the visible fixed event column');assert.ok(target.width>=44&&target.height>=44,'Removal has a 44px touch target');
 }
 await page.screenshot({path:resolve(output,'direct-removal-320.png')});
 await filter('正在关注').click();await remove(watch).focus();await page.keyboard.press('Space');
 assert.equal(await row(watch).count(),0);assert.equal((await savedState()).selections[watch].status,'undecided');assert.equal(await row(triton).count(),1);
 assert.match(await page.locator('.cart-budget').innerText(),/\$1,200/);assert.equal(await page.getByRole('dialog').count(),0);
 await page.waitForFunction(()=>document.querySelector('.shortlist-summary')===document.activeElement);
 await page.reload();assert.equal(await row(watch).count(),0);assert.equal(await rows().count(),3);
 const beforeRemovalFailure=await savedState(),rawBeforeRemovalFailure=await page.evaluate(key=>localStorage.getItem(key),key);
 await page.evaluate(()=>{window.directRemovalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError');};});
 await remove(first).click();await page.getByRole('button',{name:'重新读取',exact:true}).waitFor();
 assert.deepEqual(await savedState(),beforeRemovalFailure);assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),rawBeforeRemovalFailure);
 assert.equal(await row(first).count(),1);assert.match(await page.locator('.cart-budget').innerText(),/\$1,200/);assert.equal(await remove(first).isEnabled(),true);
 await page.evaluate(()=>{Storage.prototype.setItem=window.directRemovalSetItem;});await page.getByRole('button',{name:'重新读取',exact:true}).click();
 await remove(first).click();assert.equal(await row(first).count(),0);assert.equal(await row(second).count(),1);assert.equal((await savedState()).selections[first].status,'undecided');
 assert.match(await page.locator('.cart-budget').innerText(),/\$600/);
 await nav('我的日程');assert.equal(await page.locator(`.agenda-row[data-entry-id="${first}"]`).count(),0);assert.equal(await page.locator(`.agenda-row[data-entry-id="${second}"]`).count(),1);assert.equal(await page.locator(`.agenda-row[data-entry-id="${watch}"]`).count(),0);
 await nav('我的自选');await remove(second).click();assert.match(await page.locator('.cart-budget').innerText(),/\$0/);
 await remove(triton).click();assert.equal(await rows().count(),0);assert.equal(await page.getByRole('button',{name:'导出图片',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'去挑比赛',exact:true}).waitFor();await page.reload();assert.equal(await rows().count(),0);
 pass('visible row removal works offline at 320px without opening detail; failed writes preserve data, keyboard focus recovers and each flight synchronizes budgets/calendar independently');
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);pass('table, detail and migration workflows remain fully offline without browser errors');
}finally{
 await fs.writeFile(resolve(output,'results.json'),JSON.stringify({checks,errors,requests},null,2));await browser.close();
}
