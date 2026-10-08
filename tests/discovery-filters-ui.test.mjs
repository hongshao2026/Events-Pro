import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {chooseDiscoveryStatus,openDiscoveryFilters,finishDiscoveryFilters,selectPlannerOption,setDiscoveryFilterChecked,readDiscoveryOption,resetDiscoveryFilters,switchDiscoverySeries} from './discovery-actions.mjs';

const output=resolve('.sites-runtime/qa/discovery-filters');await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
const context=await browser.newContext({viewport:{width:390,height:950},offline:true,reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(15000);
const checks=[],errors=[],requests=[],metrics=[];page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(/^https?:/.test(request.url()))requests.push(request.url());});
const pass=message=>{checks.push(message);console.log('PASS',message);};
const data=JSON.parse(await fs.readFile('lib/kpc-jeju-2026.json','utf8')),opening=data.find(event=>event.id==='KPC01'),series='kpc-jeju-2026';
const id=`${series}/KPC01/${opening.starts[0].id}`,file=pathToFileURL(resolve('release/WPT赛事自选表.html')).href;
const first=()=>page.locator(`.mobile-event[data-entry-id="${id}"]`),sheet=()=>page.locator('.discovery-filter-sheet'),trigger=()=>page.getByRole('button',{name:'赛程筛选',exact:true}),date=()=>page.getByRole('button',{name:/^选择赛事日期/});
const params=()=>new URLSearchParams(new URL(page.url()).hash.slice(1));
const saved=()=>page.evaluate(()=>localStorage.getItem('poker-planner-local-v2'));
const focusReturned=()=>page.waitForFunction(()=>document.querySelector('button[aria-label="赛程筛选"]')===document.activeElement);
try{
 await page.goto(file+`#view=discover&series=${series}`);await first().waitFor();
 for(const width of [390,320]){
  await page.setViewportSize({width,height:950});await page.evaluate(()=>window.scrollTo(0,0));
  const box=await first().boundingBox();assert.ok(box.y<=330,`The first event is visible near the top at ${width}px: y=${box.y}`);metrics.push({width,firstRow:box});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal(await page.getByRole('combobox',{name:'赛事系列',exact:true}).count(),0);assert.equal(await page.getByRole('combobox',{name:'报名费筛选',exact:true}).count(),0);assert.equal(await page.getByRole('checkbox',{name:'全部赛事',exact:true}).count(),0);
  assert.equal(await page.getByRole('button',{name:'返回赛事列表',exact:true}).count(),1);assert.equal(await page.locator('.series-header img').evaluate(image=>image.complete&&image.naturalWidth>0),true);
  assert.match(await page.locator('.series-header').innerText(),/KST/);assert.match(await date().innerText(),/全部日期/);assert.equal(await page.getByRole('textbox',{name:'搜索赛事',exact:true}).count(),1);
  await page.screenshot({path:resolve(output,`first-screen-${width}.png`)});
 }
 pass('320/390px first screens show the first event within 330px, compact series identity, permanent search/date and one filter entry');

 await chooseDiscoveryStatus(page,first(),'参加');const baseline=await saved();
 await trigger().focus();await page.keyboard.press('Enter');await sheet().waitFor();
 assert.equal(await sheet().getByRole('textbox',{name:'搜索赛事',exact:true}).count(),0);assert.equal(await sheet().getByRole('button',{name:/^选择赛事日期/}).count(),0);
 await setDiscoveryFilterChecked(page,'全部赛事',false,{keepOpen:true});assert.equal(await page.locator('.mobile-event').count(),0);
 await setDiscoveryFilterChecked(page,'筛选正在关注',true,{keepOpen:true});assert.equal(await page.locator('.mobile-event').count(),0);assert.match(await sheet().getByRole('button',{name:/^完成筛选，显示 \d+ 个场次$/}).innerText(),/0 个场次/);
 await finishDiscoveryFilters(page);await focusReturned();assert.equal(await page.locator('.mobile-event').count(),0);assert.equal(params().get('statuses'),'watch');assert.equal(await saved(),baseline);
 await page.reload();await page.getByRole('heading',{name:/完整赛程$/}).waitFor();assert.equal(await page.locator('.mobile-event').count(),0);assert.equal(await sheet().count(),0);
 await setDiscoveryFilterChecked(page,'全部赛事',true);await first().waitFor();
 pass('keyboard-opened filters apply classifications immediately, show zero-result counts, restore focus and persist on reload without changing selections');

 await openDiscoveryFilters(page);await selectPlannerOption(page,'报名费筛选','₩500,000 及以下 · KRW',{keepOpen:true});
 assert.equal(await sheet().isVisible(),true);await selectPlannerOption(page,'赛事类型','卫星赛',{keepOpen:true});await selectPlannerOption(page,'排序','按币种 · 报名费升序',{keepOpen:true});
 const expected=data.filter(event=>event.kind==='satellite'&&event.currency==='KRW').flatMap(event=>event.starts.filter(slot=>(slot.buyin??event.buyin)!==null&&(slot.buyin??event.buyin)<=500000).map(slot=>({id:`${series}/${event.id}/${slot.id}`,buyin:slot.buyin??event.buyin})));
 assert.ok(expected.length>0);assert.match(await sheet().getByRole('button',{name:/^完成筛选，显示 \d+ 个场次$/}).innerText(),new RegExp(`${expected.length} 个场次`));
 assert.equal(await sheet().getByRole('checkbox',{name:'显示官方补充卫星',exact:true}).count(),0);
 await sheet().getByRole('combobox',{name:'保底筛选',exact:true}).click();const popup=await page.locator('.filter-popup').boundingBox();assert.ok(popup.x>=0&&popup.x+popup.width<=320);
 await page.screenshot({path:resolve(output,'select-popup-320.png')});await page.keyboard.press('Escape');assert.equal(await sheet().isVisible(),true);await page.keyboard.press('Escape');await sheet().waitFor({state:'hidden'});await focusReturned();
 const shown=await page.locator('.mobile-event').evaluateAll(nodes=>nodes.map(node=>node.dataset.entryId));assert.equal(shown.length,expected.length);assert.ok(shown.every(id=>expected.some(entry=>entry.id===id)));
 const amounts=shown.map(id=>expected.find(entry=>entry.id===id).buyin);assert.deepEqual(amounts,[...amounts].sort((a,b)=>a-b));
 await page.reload();await page.locator('.mobile-event').first().waitFor();assert.match(await readDiscoveryOption(page,'报名费筛选'),/₩500,000.*KRW/);assert.equal(await readDiscoveryOption(page,'赛事类型'),'卫星赛');assert.equal(await saved(),baseline);
 await resetDiscoveryFilters(page);await first().waitFor();
 pass('multiple native-currency/game/sort controls stay in one sheet, nested select Escape is contained, and completed/reloaded results match the real schedule');

 await date().click();await page.locator('.festival-calendar').getByRole('button',{name:'2026年10月10日 星期六',exact:true}).click();await page.getByRole('button',{name:'应用日期',exact:true}).click();
 assert.equal(params().get('from'),'2026-10-10');assert.ok((await page.locator('.mobile-event .event-time-block').evaluateAll(nodes=>nodes.map(node=>node.dateTime))).every(value=>value.startsWith('2026-10-10T')));
 const chosenDate=page.url();await date().click();await page.locator('.festival-calendar').getByRole('button',{name:'2026年10月12日 星期一',exact:true}).click();await page.locator('.festival-calendar').getByRole('button',{name:'取消',exact:true}).click();assert.equal(page.url(),chosenDate);
 await date().click();await page.locator('.festival-calendar').getByRole('button',{name:'全部日期',exact:true}).click();await page.locator('.festival-calendar').waitFor({state:'hidden'});
 assert.equal(params().has('from'),false);assert.equal(params().has('to'),false);assert.match(await date().innerText(),/全部日期/);assert.match(await page.locator('.results-bar').innerText(),/86.*场次/);
 pass('one date trigger supports apply/cancel and resets all dates inside its popover');

 await switchDiscoverySeries(page,'WPT · Wynn 2026');await setDiscoveryFilterChecked(page,'显示官方补充卫星',true);assert.match(await page.locator('.results-bar').innerText(),/113.*场次/);
 await switchDiscoverySeries(page,'Triton ONE · 北塞浦路斯 2026');assert.match(await page.locator('.results-bar').innerText(),/29.*场次/);assert.equal(params().has('supp'),false);assert.equal(await page.getByRole('textbox',{name:'搜索赛事',exact:true}).inputValue(),'');
 await page.locator('.bottom-nav').getByRole('button',{name:'我的日程',exact:true}).click();assert.equal(await page.getByRole('combobox',{name:'赛事系列',exact:true}).count(),1);
 await selectPlannerOption(page,'赛事系列','KPC · 济州岛 2026');assert.equal(await page.locator('.agenda-row[data-status="attend"]').count(),2);
 await page.locator('.bottom-nav').getByRole('button',{name:/我的自选/}).click();assert.match(await page.locator('.cart-budget [data-currency="KRW"]').innerText(),/₩800,000/);assert.equal(await saved(),baseline);
 pass('changing discovery series uses the real homepage cards, resets incompatible filters, keeps the calendar selector and preserves participation budgets');
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);pass('header and filter-sheet workflows remain fully offline without browser errors');
}finally{await fs.writeFile(resolve(output,'results.json'),JSON.stringify({checks,errors,requests,metrics},null,2));await browser.close();}
