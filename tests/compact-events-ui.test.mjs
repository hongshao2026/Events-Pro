import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {openDiscoveryDetails,closeDiscoveryDetails,chooseDiscoveryStatus,setDiscoveryFilterChecked} from './discovery-actions.mjs';

const output=resolve('.sites-runtime/qa/compact-events');await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
const context=await browser.newContext({viewport:{width:390,height:950},offline:true,reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(15000);
const checks=[],errors=[],requests=[],metrics=[];
page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(/^https?:/.test(request.url()))requests.push(request.url());});
const pass=message=>{checks.push(message);console.log('PASS',message);};
const kpc=JSON.parse(await fs.readFile('lib/kpc-jeju-2026.json','utf8')),qpc=JSON.parse(await fs.readFile('lib/qpc-circuit-2026.json','utf8'));
const opening=kpc.find(event=>event.id==='KPC01'),openingId=`kpc-jeju-2026/KPC01/${opening.starts[0].id}`;
const file=pathToFileURL(resolve('release/WPT赛事自选表.html')).href;
const row=id=>page.locator(`.mobile-event[data-entry-id="${id}"]`),sheet=()=>page.locator('.event-detail-sheet');
const search=term=>page.getByRole('textbox',{name:'搜索赛事',exact:true}).fill(term);
const discover=async series=>{await page.goto(file+'#view=discover&series='+series);await page.waitForFunction(expected=>document.querySelector('.mobile-event')?.dataset.entryId?.startsWith(expected+'/'),series);};
const nav=name=>page.locator('.bottom-nav').getByRole('button',{name:name==='我的自选'?/我的自选/:name,exact:true}).click();
const classify=async label=>{await sheet().locator('.class-option').filter({hasText:new RegExp('^'+label+'$')}).click();assert.equal(await sheet().getByRole('radio',{name:label,exact:true}).getAttribute('aria-checked'),'true');};
const fits=async(locator,label)=>assert.equal(await locator.evaluate(element=>element.scrollWidth>element.clientWidth+1),false,label);
const overlaps=(a,b)=>a.x<b.x+b.width-1&&a.x+a.width>b.x+1&&a.y<b.y+b.height-1&&a.y+a.height>b.y+1;
const completeAmount=async(locator,label)=>{
 const geometry=await locator.evaluate(element=>{const range=document.createRange();range.selectNodeContents(element);const fragments=Array.from(range.getClientRects()).filter(rect=>rect.width>0&&rect.height>0),box=element.getBoundingClientRect(),content=element.closest('.event-row-content').getBoundingClientRect();return {lines:new Set(fragments.map(rect=>Math.round(rect.top))).size,contained:fragments.every(rect=>rect.left>=box.left-1&&rect.right<=box.right+1&&rect.left>=content.left-1&&rect.right<=content.right+1)};});
 assert.equal(geometry.lines,1,`${label} remains one complete amount`);assert.equal(geometry.contained,true,`${label} is fully visible inside the information column`);
};
const actionCorner=async(card,selector)=>{
 const box=await card.boundingBox(),action=await card.locator(selector).boundingBox();
 assert.ok(box.x+box.width-action.x-action.width>=0&&box.x+box.width-action.x-action.width<=16,'Plan control stays against the right edge');
 assert.ok(box.y+box.height-action.y-action.height>=0&&box.y+box.height-action.y-action.height<=14,'Plan control stays against the bottom edge');
 for(const content of await card.locator('.event-time-block,.event-cutoff-block,.event-title-banner,.event-buyin,.event-guarantee,.mobile-event-meta').all())assert.equal(overlaps(action,await content.boundingBox()),false,`Plan control does not overlap ${await content.getAttribute('class')}`);
};
const savedStatus=id=>page.evaluate(id=>JSON.parse(localStorage.getItem('poker-planner-local-v2')).state.selections[id]?.status||'undecided',id);
const trimmedDetails=async detail=>{
 for(const name of ['续赛安排','补充说明','资料来源'])assert.equal(await detail.getByRole('heading',{name,exact:true}).count(),0,name+' is no longer a detail section');
 assert.equal(await detail.getByRole('link',{name:'官网本场赛程 ↗',exact:true}).count(),0);
};
const grouped=async detail=>{
 for(const name of ['报名信息','比赛结构','目标赛事'])assert.equal(await detail.getByRole('heading',{name,exact:true}).count(),1,name);
 assert.match(await detail.innerText(),/开赛时间.*10\/10 11:00.*KST/s);assert.match(await detail.innerText(),/报名截止.*10\/10 15:25.*第 8 级/s);
 assert.match(await detail.innerText(),/起始筹码.*25,000.*级别时长.*30 分钟/s);assert.match(await detail.innerText(),/Final Day.*10\/11 12:00.*KST/s);await trimmedDetails(detail);
};

try{
 await discover('kpc-jeju-2026');const first=row(openingId);await first.waitFor();
 assert.match(await first.innerText(),/10\/10.*11:00/s);assert.match(await first.innerText(),/Day 1A/);assert.match(await first.innerText(),/#1\b/);
 assert.equal(await first.locator('.classification,.detail').count(),0,'The list is a preview; rules and four-way actions live in the detail');
 assert.doesNotMatch(await first.innerText(),/德州扑克|保底由各起始组共享/);assert.match(await first.innerText(),/整赛保底.*₩180,000,000/s);
 assert.match(await first.locator('.event-cutoff-block.registration-summary').innerText(),/截买.*10\/10.*15:25.*KST/s);
 assert.equal(await first.locator('.event-cutoff-block time').getAttribute('datetime'),'2026-10-10T15:25');
 for(const width of [390,320]){
  await page.setViewportSize({width,height:950});await fits(page.locator('html'),'No horizontal page scroll');await fits(first,'Event row stays inside phone width');
  const open=await first.locator('.event-row-open').boundingBox(),card=await first.boundingBox(),quick=await first.locator('.quick-watch').boundingBox();
  assert.ok(open.width>card.width*.85,'The row opens details across its content');assert.ok(quick.width>=40&&quick.height>=40,'Quick watch remains a usable touch target');
  assert.ok(card.height<=150,`A normal event stays compact at ${width}px: ${card.height}px`);
  const title=await first.locator('.event-title').boundingBox(),flight=await first.locator('.event-flight').boundingBox();
  assert.ok(Math.abs(title.y-flight.y)<=2,'Flight remains on the same title line');assert.equal(await first.locator('.event-title').evaluate(element=>getComputedStyle(element).whiteSpace),'nowrap');
  const start=await first.locator('.event-time-block').boundingBox(),cutoff=await first.locator('.event-cutoff-block').boundingBox(),info=await first.locator('.event-row-content').boundingBox();
  assert.ok(start.x+start.width<=cutoff.x&&cutoff.x+cutoff.width<=info.x,'Three distinct columns read start, cutoff, event information from left to right');assert.ok(Math.abs(start.y-cutoff.y)<=1,'Both time columns align at the top');
  assert.match(await first.locator('.event-time-block').innerText(),/开赛.*10\/10.*11:00.*KST/s);await completeAmount(first.locator('.price-amount>span'),'Native buy-in');await completeAmount(first.locator('.converted-price'),'Converted buy-in');
  const native=await first.locator('.price-amount>span').boundingBox(),converted=await first.locator('.converted-price').boundingBox();
  assert.equal(overlaps(native,converted),false,'Original and converted amounts may wrap without overlapping');await actionCorner(first,'.quick-watch');
  metrics.push({width,card,start,cutoff,info,quick});await first.screenshot({path:resolve(output,`after-card-${width}.png`)});
 }
 await first.locator('.event-row-open').click({position:{x:15,y:20}});await sheet().waitFor();await grouped(sheet().locator('.detail'));assert.equal(await sheet().locator('.event-detail-source-updated').count(),0);assert.doesNotMatch(await sheet().innerText(),/资料更新：/);
 await fits(sheet(),'Event detail fits a 320px phone');await sheet().screenshot({path:resolve(output,'grouped-discovery-320.png')});
 await page.keyboard.press('Escape');await sheet().waitFor({state:'hidden'});await page.waitForFunction(id=>document.querySelector(`.mobile-event[data-entry-id="${id}"] .event-row-open`)===document.activeElement,openingId);assert.equal(await first.locator('.event-row-open').evaluate(element=>element===document.activeElement),true);
 pass('three-column rows show aligned start/cutoff blocks and complete event amounts, with an unobstructed lower-right watch action and accessible whole-row details at 320/390px');

 await first.locator('.quick-watch').click();assert.equal(await savedStatus(openingId),'watch');assert.equal(await sheet().count(),0);assert.equal(await first.locator('.quick-watch').innerText(),'不关注');assert.match(await first.locator('.quick-watch').getAttribute('aria-label'),/^不关注 /);await actionCorner(first,'.quick-watch');
 await page.reload();assert.equal(await row(openingId).getAttribute('data-status'),'watch');
 await setDiscoveryFilterChecked(page,'全部赛事',false);await setDiscoveryFilterChecked(page,'筛选正在关注',true);
 await first.locator('.quick-watch').focus();await page.keyboard.press('Space');assert.equal(await savedStatus(openingId),'undecided');assert.equal(await first.count(),0);
 await page.waitForFunction(()=>document.querySelector('.results-bar>span')===document.activeElement);assert.ok(page.url().includes('statuses=watch'));
 await setDiscoveryFilterChecked(page,'全部赛事',true);
 for(const [label,status]of [['参加','attend'],['关注','watch'],['不考虑','skip'],['待定','undecided']]){
  await chooseDiscoveryStatus(page,first,label);assert.equal(await savedStatus(openingId),status);await page.reload();assert.equal(await row(openingId).getAttribute('data-status'),status);
 }
 await openDiscoveryDetails(page,first);await sheet().getByRole('radio',{name:'待定',exact:true}).focus();await page.keyboard.press('ArrowRight');
 // Radix moves roving radio focus on its scheduled keyboard update.
 await page.waitForFunction(()=>document.querySelector('.event-detail-actions [role="radio"][aria-label="参加"]')===document.activeElement);
 assert.equal(await sheet().getByRole('radio',{name:'参加',exact:true}).evaluate(element=>element===document.activeElement),true);await page.keyboard.press('Space');
 assert.equal(await savedStatus(openingId),'attend');await closeDiscoveryDetails(page);
 assert.equal(await first.locator('.quick-watch').count(),0);assert.match(await first.locator('.event-planned').innerText(),/参加/);await actionCorner(first,'.event-planned');
 pass('quick watch toggles and persists; all four plans remain available in the sheet, with keyboard activation and no shortcut that downgrades attendance');

 await openDiscoveryDetails(page,first);const savedBeforeFailure=await page.evaluate(()=>localStorage.getItem('poker-planner-local-v2'));
 await page.evaluate(()=>{window.originalPlanWrite=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError');};});
 await sheet().locator('.class-option').filter({hasText:/^关注$/}).click();await sheet().getByRole('alert').waitFor();
 assert.equal(await sheet().getByRole('radio',{name:'参加',exact:true}).getAttribute('aria-checked'),'true');assert.equal(await page.evaluate(()=>localStorage.getItem('poker-planner-local-v2')),savedBeforeFailure);
 await page.evaluate(()=>{Storage.prototype.setItem=window.originalPlanWrite;});await closeDiscoveryDetails(page);await page.getByRole('button',{name:'重新读取',exact:true}).click();
 pass('a failed classification write reports the error inside the sheet and preserves the attended selection and its budget');

 await setDiscoveryFilterChecked(page,'筛选不考虑',false);await openDiscoveryDetails(page,first);await classify('不考虑');
 assert.equal(await first.count(),0);assert.equal(await sheet().isVisible(),true);await classify('关注');assert.equal(await first.count(),1);await classify('参加');await closeDiscoveryDetails(page);
 await openDiscoveryDetails(page,first);await classify('不考虑');await closeDiscoveryDetails(page);assert.equal(await first.count(),0);
 await page.waitForFunction(()=>document.querySelector('.results-bar>span')===document.activeElement);
 await setDiscoveryFilterChecked(page,'筛选不考虑',true);await first.locator('.quick-watch').click();assert.equal(await savedStatus(openingId),'watch');await chooseDiscoveryStatus(page,first,'参加');
 await search('KPC');const later=page.locator('.mobile-event').nth(4),laterId=await later.getAttribute('data-entry-id');await later.locator('.event-row-open').scrollIntoViewIfNeeded();
 const priorUrl=page.url(),priorScroll=await page.evaluate(()=>scrollY),priorCount=await page.locator('.mobile-event').count();
 await openDiscoveryDetails(page,later);await closeDiscoveryDetails(page);
 // Radix restores focus during its unmount cleanup, after the sheet becomes hidden.
 await page.waitForFunction(id=>document.querySelector(`.mobile-event[data-entry-id="${id}"] .event-row-open`)===document.activeElement,laterId);
 assert.equal(page.url(),priorUrl);assert.equal(await page.getByRole('textbox',{name:'搜索赛事',exact:true}).inputValue(),'KPC');
 assert.equal(await page.locator('.mobile-event').count(),priorCount);assert.ok(Math.abs(await page.evaluate(()=>scrollY)-priorScroll)<=2,'Closing detail returns to the same list position');
 assert.equal(await later.locator('.event-row-open').evaluate(element=>element===document.activeElement),true);await search('');
 pass('classification can continue when filtering removes the source row; returning preserves search, row count, scroll and keyboard focus');

 await nav('我的自选');const budgetBefore=await page.locator('.cart-budget').innerText();await page.locator(`.shortlist-table tr[data-entry-id="${openingId}"] .shortlist-entry-button`).click();
 await grouped(page.locator('.shortlist-detail-sheet .detail'));await page.keyboard.press('Escape');await page.locator('.shortlist-detail-sheet').waitFor({state:'hidden'});
 await nav('我的日程');await page.locator(`.agenda-row[data-entry-id="${openingId}"]`).click();await grouped(page.locator('.agenda-detail-sheet .detail'));
 await page.keyboard.press('Escape');await page.locator('.agenda-detail-sheet').waitFor({state:'hidden'});
 const continuation=page.locator('.agenda-row[data-activity-id="kpc-jeju-2026/KPC01/continuation/0"]');assert.equal(await continuation.count(),1);await continuation.click();const finalDetail=page.locator('.agenda-detail-sheet .detail');
 assert.match(await finalDetail.innerText(),/沿用晋级筹码/);assert.match(await finalDetail.innerText(),/不增加买入|不新增买入/);assert.doesNotMatch(await finalDetail.innerText(),/10\/10 15:25/);
 assert.equal(await finalDetail.getByRole('heading',{name:'目标赛事',exact:true}).count(),0,'A final day cannot be listed as its own target');await trimmedDetails(finalDetail);assert.equal(await page.locator('.agenda-detail-actions .classification').count(),0);
 await page.keyboard.press('Escape');await page.locator('.agenda-detail-sheet').waitFor({state:'hidden'});await nav('我的自选');assert.equal(await page.locator('.cart-budget').innerText(),budgetBefore);
 pass('discovery, shortlist and agenda share concise rules and later-stage targets; final days do not target themselves, stay read-only and add no budget');

 await discover('qpc-circuit-2026');await search('QPC47');const imperial=qpc.find(event=>event.id==='QPC47'),overnight=row(`qpc-circuit-2026/QPC47/${imperial.starts[2].id}`);
 assert.match(await overnight.locator('.event-cutoff-block').innerText(),/10\/21.*00:40.*ICT/s);assert.equal(await overnight.locator('.event-cutoff-block time').getAttribute('datetime'),'2026-10-21T00:40');assert.match(await overnight.locator('.event-time-block').innerText(),/10\/20/);await search('QPC31');const ambiguous=page.locator('.mobile-event');
 assert.match(await ambiguous.locator('.event-cutoff-block').innerText(),/见详情/);assert.doesNotMatch(await ambiguous.locator('.event-cutoff-block').innerText(),/12:00|13:05/);assert.equal(await ambiguous.locator('.event-cutoff-block time').count(),0);
 await openDiscoveryDetails(page,ambiguous);assert.match(await sheet().innerText(),/未标日期/);assert.match(await sheet().innerText(),/13:05/);await closeDiscoveryDetails(page);
 await discover('triton-one-cyprus-2026');await search('T21');assert.match(await page.locator('.event-cutoff-block').innerText(),/11\/13.*00:30.*EET/s);assert.match(await page.locator('.event-time-block').innerText(),/11\/12/);
 assert.equal(await page.locator('.event-guarantee b').innerText(),'无保底');await openDiscoveryDetails(page,page.locator('.mobile-event'));assert.equal(await sheet().locator('.event-detail-prize strong').innerText(),'无保底');await closeDiscoveryDetails(page);
 await search('T06');assert.match(await page.locator('.mobile-event').innerText(),/资格限制/);await page.locator('.event-title').click();assert.match(await sheet().locator('.detail').innerText(),/仅限女性/);await closeDiscoveryDetails(page);
 await discover('kpc-jeju-2026');await search('KPC63');assert.equal(await page.locator('.mobile-event-meta').count(),0);
 await openDiscoveryDetails(page,page.locator('.mobile-event'));assert.equal(await sheet().getByRole('button',{name:'筛选：混合游戏',exact:true}).count(),1);assert.match(await sheet().locator('.detail').innerText(),/混合/);await closeDiscoveryDetails(page);
 await discover('wpt-wynn-2026');await search('W01');assert.match(await page.locator('.event-cutoff-block').first().innerText(),/未公布/);assert.doesNotMatch(await page.locator('.event-cutoff-block').first().innerText(),/\d{2}:\d{2}/);
 await discover('jeju-poker-festival-2026');await search('JPF-3');const levelOnly=page.locator('.mobile-event[data-entry-id^="jeju-poker-festival-2026/JPF-3/"]').first();assert.match(await levelOnly.locator('.event-cutoff-block').innerText(),/第\s*9\s*级/);assert.doesNotMatch(await levelOnly.locator('.event-cutoff-block').innerText(),/\d{2}:\d{2}/);
 pass('cross-day deadlines and source ambiguity remain visible; game labels move into details, eligibility stays in the list, and absent guarantees read 无保底');

 await discover('qpc-circuit-2026');await search('QPC01');const longTitle='QPC 国际扑克锦标赛超长赛事名称 INTERNATIONAL HIGH ROLLER CHAMPIONSHIP QUALIFIER';
 await page.evaluate(title=>localStorage.setItem('events-pro-settings-v1',JSON.stringify({version:1,revision:1,profile:{username:'',currency:'CNY'},fx:{rates:{CNY:1,USD:6.7351,VND:0.000258,HKD:0.8584,KRW:0.004958},asOf:'2026-10-08',source:'中国银行折算价'},eventOverrides:{QPC01:{title,buyin:999999999999,guarantee:1000000000000}}})),longTitle);
 await page.reload();const longCard=page.locator('.mobile-event').first();assert.match(await longCard.locator('.event-title').innerText(),/CHAMPIONSHIP QUALIFIER/);
 for(const width of [320,390]){
  await page.setViewportSize({width,height:950});await fits(page.locator('html'),'Long names and large values do not widen the page');await fits(longCard,'Long row content stays contained');
  const title=await longCard.locator('.event-title').evaluate(element=>({height:element.getBoundingClientRect().height,lineHeight:parseFloat(getComputedStyle(element).lineHeight),whiteSpace:getComputedStyle(element).whiteSpace,textOverflow:getComputedStyle(element).textOverflow,clipped:element.scrollWidth>element.clientWidth}));
  assert.equal(title.whiteSpace,'nowrap');assert.equal(title.textOverflow,'ellipsis');assert.ok(title.clipped);assert.ok(title.height<=title.lineHeight+1,'Long title remains one line');
  const titleBox=await longCard.locator('.event-title').boundingBox(),flightBox=await longCard.locator('.event-flight').boundingBox();assert.ok(Math.abs(titleBox.y-flightBox.y)<=2,'Flight stays visible beside a truncated name');
  assert.match(await longCard.innerText(),/₫999,999,999,999/);assert.match(await longCard.innerText(),/₫1,000,000,000,000/);
  await completeAmount(longCard.locator('.price-amount>span'),'Large native buy-in');await completeAmount(longCard.locator('.converted-price'),'Large converted buy-in');await actionCorner(longCard,'.quick-watch');
  const guarantee=await longCard.locator('.event-guarantee b').evaluate(element=>{const range=document.createRange();range.selectNodeContents(element);const lines=Array.from(range.getClientRects()).filter(rect=>rect.width>0&&rect.height>0),box=element.getBoundingClientRect();return {text:element.textContent,lines:lines.length,contained:lines.every(rect=>rect.left>=box.left-1&&rect.right<=box.right+1)};});
  assert.equal(guarantee.text,'₫1,000,000,000,000');assert.equal(guarantee.lines,1,'A long guarantee stays one complete amount instead of splitting its final digits');assert.equal(guarantee.contained,true,'The complete guarantee fits its visible box');
  await longCard.screenshot({path:resolve(output,`long-title-values-${width}.png`)});
  await openDiscoveryDetails(page,longCard);await fits(sheet(),'Long detail is contained');assert.match(await sheet().innerText(),/CHAMPIONSHIP QUALIFIER/);await sheet().screenshot({path:resolve(output,`long-detail-${width}.png`)});await closeDiscoveryDetails(page);
 }
 await page.evaluate(()=>{const key='events-pro-settings-v1',settings=JSON.parse(localStorage.getItem(key));settings.profile.currency='HKD';settings.fx.rates.HKD=null;settings.revision++;localStorage.setItem(key,JSON.stringify(settings));});
 await page.reload();await page.setViewportSize({width:320,height:950});await fits(page.locator('html'),'Missing-rate notice fits the row');assert.match(await longCard.innerText(),/₫999,999,999,999/);assert.match(await longCard.locator('.converted-price').innerText(),/汇率未设置/);assert.doesNotMatch(await longCard.innerText(),/HK\$0/);
 pass('long names ellipsize on one list line while flights and full amounts remain visible; complete titles and rules are available in the detail at 320/390px');
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);pass('row, sheet, planning and source workflows remain fully offline without browser errors');
}finally{await fs.writeFile(resolve(output,'results.json'),JSON.stringify({checks,errors,requests,metrics},null,2));await browser.close();}
