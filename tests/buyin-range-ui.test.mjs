import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {chooseDiscoveryStatus,openDiscoveryFilters,finishDiscoveryFilters,setDiscoveryBuyinRange,readDiscoveryBuyinRange,setDiscoveryFilterChecked,resetDiscoveryFilters,selectPlannerOption,switchDiscoverySeries} from './discovery-actions.mjs';

const output=resolve('.sites-runtime/qa/buyin-range');await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
const context=await browser.newContext({viewport:{width:390,height:950},offline:true,reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(15000);
await page.clock.setFixedTime(new Date('2026-10-08T04:00:00Z'));
const checks=[],errors=[],requests=[];page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(/^https?:/.test(request.url()))requests.push(request.url());});
const pass=message=>{checks.push(message);console.log('PASS',message);};
const series='kpc-jeju-2026',data=JSON.parse(await fs.readFile('lib/kpc-jeju-2026.json','utf8')),opening=data.find(event=>event.id==='KPC01'),id=`${series}/${opening.id}/${opening.starts[0].id}`;
const file=pathToFileURL(resolve('release/WPT赛事自选表.html')).href,rates={CNY:1,USD:6.7351,VND:0.000258,HKD:0.8584,KRW:0.004958};
const popover=()=>page.locator('.discovery-filter-popover'),row=id=>page.locator(`.mobile-event[data-entry-id="${id}"]`),params=()=>new URLSearchParams(new URL(page.url()).hash.slice(1));
const min=()=>popover().getByRole('textbox',{name:'最低报名费',exact:true}),max=()=>popover().getByRole('textbox',{name:'最高报名费',exact:true});
const shown=()=>page.locator('.mobile-event').evaluateAll(nodes=>nodes.map(node=>node.dataset.entryId));
const saved=()=>page.evaluate(()=>localStorage.getItem('poker-planner-local-v2'));
const nav=name=>page.locator('.bottom-nav').getByRole('button',{name:name==='我的自选'?/我的自选/:name,exact:true}).click();
const discover=async()=>{await nav('赛事');await page.locator(`.festival-card[data-series-id="${series}"]`).click();};
const preference=async label=>{await nav('我的');await selectPlannerOption(page,'显示货币',label);await discover();};
const changeRate=async(label,value)=>{await nav('我的');await page.getByRole('button',{name:/管理后台/}).click();await page.getByRole('textbox',{name:label,exact:true}).fill(value);await page.getByRole('button',{name:'保存汇率',exact:true}).click();await discover();};
const expected=(currency,lower,upper,fx=rates)=>data.flatMap(event=>event.starts.flatMap(slot=>{
 const native=slot.buyin??event.buyin;if(native===null)return [];
 const amount=event.currency===currency?native:fx[event.currency]&&fx[currency]?native*fx[event.currency]/fx[currency]:null;if(amount===null)return [];
 const rounded=Number(amount.toFixed(currency==='KRW'||currency==='VND'?0:2));
 return (lower===null||rounded>=lower)&&(upper===null||rounded<=upper)?[`${series}/${event.id}/${slot.id}`]:[];
}));
const check=async ids=>{assert.match(await page.locator('.results-bar').innerText(),new RegExp(`找到\\s*${ids.length}\\s*个场次`));const visible=await shown();assert.ok(visible.every(id=>ids.includes(id)));assert.equal(visible.length,Math.min(ids.length,15));};
const assertCleared=()=>{for(const key of ['buyinMin','buyinMax','buyinCurrency'])assert.equal(params().has(key),false,key);};
try{
 await page.goto(file+`#view=discover&series=${series}`);await row(id).waitFor();
 await setDiscoveryFilterChecked(page,'全部赛事',false);await setDiscoveryFilterChecked(page,'筛选计划参加',true);assert.equal(await page.locator('.mobile-event').count(),0);
 await openDiscoveryFilters(page);await min().fill('-');await popover().getByRole('alert').waitFor();await page.getByRole('textbox',{name:'搜索赛事',exact:true}).click();await popover().waitFor({state:'hidden'});
 await page.getByRole('button',{name:'查看全部赛事',exact:true}).click();await row(id).waitFor();await openDiscoveryFilters(page);
 assert.equal(await min().inputValue(),'');assert.equal(await max().inputValue(),'');assert.equal(await popover().getByRole('alert').count(),0);assert.equal(await popover().getByRole('button',{name:/^完成筛选/}).isDisabled(),false);await finishDiscoveryFilters(page);
 pass('resetting an empty result outside the dropdown also clears invalid local drafts and restores an enabled completion action');
 await chooseDiscoveryStatus(page,row(id),'参加');const baseline=await saved();
 await setDiscoveryBuyinRange(page,'3000','40000');await check(expected('CNY',3000,40000));assert.equal(params().get('buyinMin'),'3000');assert.equal(params().get('buyinMax'),'40000');assert.equal(params().get('buyinCurrency'),'CNY');
 assert.equal(await row(id).count(),1);assert.ok((await shown()).some(id=>id.includes('/KPC03/')),'One CNY range includes both KRW and USD entry prices');
 await page.reload();await row(id).waitFor();assert.deepEqual(await readDiscoveryBuyinRange(page),{min:'3000',max:'40000'});
 await setDiscoveryBuyinRange(page,'3966.40','3966.40');await check(expected('CNY',3966.4,3966.4));assert.equal(await row(id).count(),1,'Displayed converted boundary is inclusive');
 for(const width of [390,320]){await page.setViewportSize({width,height:950});await openDiscoveryFilters(page);assert.match(await popover().innerText(),/CNY/);assert.equal(await min().getAttribute('inputmode'),'decimal');assert.equal(await max().getAttribute('inputmode'),'decimal');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:resolve(output,`range-${width}.png`)});await finishDiscoveryFilters(page);}
 pass('CNY ranges compare mixed native currencies at displayed precision, include equal boundaries, persist on reload and fit phone screens');

 await openDiscoveryFilters(page);const validUrl=page.url(),validRows=await shown();
 for(const [field,value]of [['min','.'],['min','-1'],['min','3967'],['max','12..3']]){
  await (field==='min'?min():max()).fill(value);await popover().getByRole('alert').waitFor();assert.equal(await popover().getByRole('button',{name:/^完成筛选/}).isDisabled(),true);
  assert.equal(await min().getAttribute('aria-invalid'),'true');assert.equal(await max().getAttribute('aria-invalid'),'true');assert.match(await min().getAttribute('aria-describedby'),/buyin-range-error/);
  assert.equal(page.url(),validUrl);assert.deepEqual(await shown(),validRows);assert.equal(await (field==='min'?min():max()).inputValue(),value);
  await (field==='min'?min():max()).fill('3966.40');await popover().getByRole('alert').waitFor({state:'hidden'});assert.equal(await popover().getByRole('button',{name:/^完成筛选/}).isDisabled(),false);
 }
 await min().fill('-');await popover().getByRole('alert').waitFor();await popover().getByRole('button',{name:'重置筛选',exact:true}).click();await finishDiscoveryFilters(page);assertCleared();await check(data.flatMap(event=>event.starts.map(slot=>`${series}/${event.id}/${slot.id}`)));
 pass('incomplete, negative, malformed and reversed drafts show errors while preserving the last valid rows and URL; reset recovers without altering selections');

 await setDiscoveryBuyinRange(page,'3000','40000');await preference('美元 · USD');assertCleared();assert.deepEqual(await readDiscoveryBuyinRange(page),{min:'',max:''});
 assert.equal(await page.locator('.discovery-filter-trigger>b').count(),0,'A currency-change notice is not an active filter');await openDiscoveryFilters(page);assert.match(await popover().getByRole('status').innerText(),/币种|货币/);await finishDiscoveryFilters(page);
 await setDiscoveryBuyinRange(page,'5000','5000');await check(expected('USD',5000,5000));await openDiscoveryFilters(page);assert.match(await popover().innerText(),/USD/);await finishDiscoveryFilters(page);
 await openDiscoveryFilters(page);await popover().getByRole('button',{name:'清空最低报名费',exact:true}).click();await finishDiscoveryFilters(page);await check(expected('USD',null,5000));assert.equal(params().has('buyinMin'),false);
 await openDiscoveryFilters(page);await min().fill('5000');await popover().getByRole('button',{name:'清空最高报名费',exact:true}).click();await finishDiscoveryFilters(page);await check(expected('USD',5000,null));assert.equal(params().has('buyinMax'),false);
 await openDiscoveryFilters(page);await popover().getByRole('button',{name:'清空最低报名费',exact:true}).click();await finishDiscoveryFilters(page);assertCleared();await check(data.flatMap(event=>event.starts.map(slot=>`${series}/${event.id}/${slot.id}`)));
 await preference('仅显示原币');await openDiscoveryFilters(page);assert.match(await popover().innerText(),/KRW/);await finishDiscoveryFilters(page);await setDiscoveryBuyinRange(page,'800000','800000');await check(expected('KRW',800000,800000));
 pass('changing display currency clears numeric bounds; same-currency and original-display ranges use explicit units and either bound can be cleared independently');

 await preference('人民币 · CNY');await setDiscoveryBuyinRange(page,'3966.40','3966.40');await setDiscoveryFilterChecked(page,'全部赛事',false);await setDiscoveryFilterChecked(page,'筛选计划参加',true);
 await page.getByRole('button',{name:/^选择赛事日期/}).click();await page.locator('.festival-calendar').getByRole('button',{name:'2026年10月10日 星期六',exact:true}).click();await page.getByRole('button',{name:'应用日期',exact:true}).click();assert.deepEqual(await shown(),[id]);const combinedUrl=page.url();
 await nav('我的');await page.goBack();await row(id).waitFor();assert.equal(page.url(),combinedUrl);assert.deepEqual(await shown(),[id]);await page.reload();await row(id).waitFor();assert.equal(page.url(),combinedUrl);assert.deepEqual(await readDiscoveryBuyinRange(page),{min:'3966.4',max:'3966.4'});assert.equal(await saved(),baseline);
 await page.goto(file+`#view=discover&series=${series}&buyinMin=5000&buyinMax=5000&buyinCurrency=USD`);await page.locator('.mobile-event').first().waitFor();assert.deepEqual(await readDiscoveryBuyinRange(page),{min:'33675.5',max:'33675.5'});assert.equal(params().get('buyinCurrency'),'CNY');await check(expected('CNY',33675.5,33675.5));
 await page.goto(file+`#view=discover&series=${series}&buyin=USD%3A5000&gtd=999999999999&sort=gtd&game=draw`);await page.locator('.mobile-event').first().waitFor();assert.deepEqual(await readDiscoveryBuyinRange(page),{min:'',max:'33675.5'});await check(expected('CNY',null,33675.5));
 for(const retired of ['buyin','gtd','sort','game'])assert.equal(params().has(retired),false,retired);
 const times=await page.locator('.event-time-block').evaluateAll(nodes=>nodes.map(node=>node.dateTime));assert.deepEqual(times,[...times].sort());
 pass('ranges combine with selected status and dates through reload/Back; legacy buy-in links convert while retired guarantee, sorting and unsupported category filters cannot hide rows');

 await resetDiscoveryFilters(page);await switchDiscoverySeries(page,'JPF · 济州岛 2026');await page.getByRole('textbox',{name:'搜索赛事',exact:true}).fill('JPF-1');const unknown=page.locator('.mobile-event').filter({hasText:'JPF ANNUAL'});assert.equal(await unknown.count(),1);assert.match(await unknown.innerText(),/未公布/);
 await setDiscoveryBuyinRange(page,'0','');assert.equal(await unknown.count(),0);await openDiscoveryFilters(page);assert.match(await popover().innerText(),/未公布|未知/);await finishDiscoveryFilters(page);await setDiscoveryBuyinRange(page,'','');assert.equal(await unknown.count(),1);
 await switchDiscoverySeries(page,'KPC · 济州岛 2026');await preference('韩元 · KRW');await changeRate('韩元汇率','');await setDiscoveryBuyinRange(page,'800000','800000');await check(expected('KRW',800000,800000,{...rates,KRW:null}));assert.equal(await row(id).count(),1);
 await preference('人民币 · CNY');await setDiscoveryBuyinRange(page,'0','40000');await check(expected('CNY',0,40000,{...rates,KRW:null}));assert.ok((await shown()).every(id=>data.find(event=>id.includes('/'+event.id+'/')).currency==='USD'));
 await openDiscoveryFilters(page);assert.match(await popover().innerText(),/汇率/);await finishDiscoveryFilters(page);await setDiscoveryBuyinRange(page,'','');await check(data.flatMap(event=>event.starts.map(slot=>`${series}/${event.id}/${slot.id}`)));
 await page.goto(file+`#view=discover&series=${series}&buyin=KRW%3A500000`);await row(id).waitFor();assertCleared();assert.equal(await page.locator('.discovery-filter-trigger>b').count(),0,'A missing-rate migration notice is not an active filter');await openDiscoveryFilters(page);assert.match(await popover().getByRole('status').innerText(),/缺少汇率|汇率.*旧链接|旧链接.*汇率/);await finishDiscoveryFilters(page);
 await page.goto(file+`#view=discover&series=${series}&buyinMin=-1&buyinCurrency=CNY`);await row(id).waitFor();assertCleared();assert.equal(await page.locator('.discovery-filter-trigger>b').count(),0,'An invalid-link notice is not an active filter');await openDiscoveryFilters(page);assert.match(await popover().getByRole('status').innerText(),/区间无效/);await finishDiscoveryFilters(page);
 await nav('我的自选');assert.match(await page.locator('.cart-budget [data-currency="KRW"]').innerText(),/₩800,000/);assert.equal(await saved(),baseline);
 pass('unknown fees and missing cross-rates are excluded only for active ranges; same-native-currency comparison still works without an FX rate, and legacy conversion failure is visible without losing budgets');
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);pass('range filtering remains offline and never changes saved participation or native-currency budgets');
}finally{await fs.writeFile(resolve(output,'results.json'),JSON.stringify({checks,errors,requests},null,2));await browser.close();}
