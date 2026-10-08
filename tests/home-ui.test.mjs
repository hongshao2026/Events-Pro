import {chooseDiscoveryStatus,selectPlannerOption} from './discovery-actions.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {chromium} from 'playwright';

const output=resolve('.sites-runtime/qa/home');await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
const context=await browser.newContext({viewport:{width:390,height:900},offline:true,reducedMotion:'reduce'});
const page=await context.newPage(),checks=[],errors=[],requests=[];
// Keep the baseline deterministic while normal UI timers and focus restoration still run.
await page.clock.setFixedTime(new Date('2026-10-08T04:00:00Z'));
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
const pass=name=>{checks.push(name);console.log('PASS',name);};
const file=pathToFileURL(resolve('release/WPT赛事自选表.html')).href;
const wpt='wpt-wynn-2026',triton='triton-one-cyprus-2026',kpc='kpc-jeju-2026';
const qpc='qpc-circuit-2026',jpf='jeju-poker-festival-2026';
const titles={[wpt]:'WPT World Championship 2026',[triton]:'Triton ONE North Cyprus 2026',[kpc]:'KPC Poker Series Jeju 2026',[qpc]:'QPC Circuit 2026',[jpf]:'Jeju Poker Festival 2026'};
const card=id=>page.locator(`.festival-card[data-series-id="${id}"]`);
const group=name=>page.getByRole('region',{name,exact:true});
const pin=(id,pinned=false)=>page.getByRole('button',{name:`${pinned?'取消置顶':'置顶'} ${titles[id]}`,exact:true});
const ids=locator=>locator.locator('.festival-card').evaluateAll(nodes=>nodes.map(n=>n.dataset.seriesId));
const savedSettings=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('events-pro-settings-v1')));
const savedSelections=()=>page.evaluate(()=>localStorage.getItem('poker-planner-local-v2'));
const focusRestored=async locator=>{const name=await locator.getAttribute('aria-label');await page.waitForFunction(label=>document.activeElement?.getAttribute('aria-label')===label,name);};
const atTime=async instant=>{await page.clock.setFixedTime(new Date(instant));await page.evaluate(()=>window.dispatchEvent(new Event('focus')));};
const region=name=>page.locator('label.region-option').filter({hasText:new RegExp('^'+name+'$')});
const nav=name=>page.locator('.bottom-nav').getByRole('button',{name:name==='我的自选'?/我的自选/:name,exact:true}).click();
try{
 await page.goto(file);await card(wpt).waitFor();assert.equal(await page.title(),'赛事 · Events Pro');
 assert.deepEqual(await page.locator('.festival-card').evaluateAll(nodes=>nodes.map(n=>n.dataset.seriesId)),[kpc,'qpc-circuit-2026','jeju-poker-festival-2026',triton,wpt]);
 assert.deepEqual(await ids(group('正在进行')),[]);assert.deepEqual(await ids(group('即将到来')),[kpc,qpc,jpf,triton,wpt]);
 assert.equal(await page.locator('details').count(),0);assert.equal(await group('置顶赛事').count(),0);
 assert.equal(await page.locator('.mobile-event').count(),0);assert.equal(await page.getByRole('button',{name:'登录',exact:true}).count(),0);
 for(const id of [kpc,'qpc-circuit-2026','jeju-poker-festival-2026',triton,wpt])assert.equal(await card(id).locator('img').evaluate(img=>img.complete&&img.naturalWidth>0&&img.src.startsWith('data:')),true);
 assert.match(await card(triton).innerText(),/22 项赛事.*29 个起始场次/s);
 assert.match(await card(kpc).innerText(),/KPC Poker Series Jeju 2026/);assert.match(await card(kpc).innerText(),/济州岛/);
 assert.match(await card('jeju-poker-festival-2026').innerText(),/Jeju Poker Festival 2026/);
 pass('homepage groups all five upcoming festivals in date order, retains an empty ongoing section, bundled logos, counts and disabled authentication');
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const rect=await page.locator('.app-shell').boundingBox();assert.ok(rect.width<=480.1);
  await page.screenshot({path:resolve(output,`catalog-${width}.png`)});
 }
 await page.setViewportSize({width:390,height:900});pass('merged catalog fits phones and centered desktop layout');
 const selectionBeforePin=await savedSelections(),homeUrl=page.url();
 await pin(kpc).focus();await page.keyboard.press('Space');await group('置顶赛事').locator(`[data-series-id="${kpc}"]`).waitFor();await focusRestored(pin(kpc,true));
 assert.equal(await pin(kpc,true).getAttribute('aria-pressed'),'true');assert.equal(page.url(),homeUrl);assert.equal(await card(kpc).count(),1);
 assert.ok((await group('置顶赛事').boundingBox()).y<(await group('正在进行').boundingBox()).y);assert.equal(await pin(kpc,true).evaluate(button=>button.closest('a')===null),true);
 assert.deepEqual(await ids(group('即将到来')),[qpc,jpf,triton,wpt]);assert.equal((await savedSettings()).profile.pinnedSeriesId,kpc);
 assert.match(await page.locator('.series-results').innerText(),/4\s*个赛事系列/);
 await page.reload();await group('置顶赛事').locator(`[data-series-id="${kpc}"]`).waitFor();assert.equal(await pin(kpc,true).getAttribute('aria-pressed'),'true');
 await region('北美').click();assert.deepEqual(await ids(group('置顶赛事')),[kpc]);assert.deepEqual(await ids(group('即将到来')),[wpt]);assert.match(await page.locator('.series-results').innerText(),/1\s*个赛事系列/);
 await region('南美').click();await page.getByRole('heading',{name:'南美暂无赛事',exact:true}).waitFor();assert.deepEqual(await ids(group('置顶赛事')),[kpc]);assert.match(await page.locator('.series-results').innerText(),/0\s*个赛事系列/);
 await region('全部地区').click();const priorSettings=await savedSettings();
 await page.evaluate(()=>{window.homeOriginalWrite=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError');};});
 await pin(triton).click();await page.locator('.series-pin-error[role="alert"]').waitFor();assert.match(await page.locator('.series-pin-error').innerText(),/未能保存/);
 assert.deepEqual(await savedSettings(),priorSettings);assert.deepEqual(await ids(group('置顶赛事')),[kpc]);assert.equal(await pin(triton).getAttribute('aria-pressed'),'false');
 await page.evaluate(()=>{Storage.prototype.setItem=window.homeOriginalWrite;});await pin(triton).focus();await page.keyboard.press('Enter');await group('置顶赛事').locator(`[data-series-id="${triton}"]`).waitFor();await focusRestored(pin(triton,true));
 assert.deepEqual(await ids(group('置顶赛事')),[triton]);assert.deepEqual(await ids(group('即将到来')),[kpc,qpc,jpf,wpt]);assert.equal(await card(triton).count(),1);assert.equal((await savedSettings()).profile.pinnedSeriesId,triton);assert.equal(await page.locator('.series-pin-error').count(),0);
 for(const width of [320,390]){await page.setViewportSize({width,height:900});await page.evaluate(()=>scrollTo(0,0));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);const pinRect=await pin(triton,true).boundingBox();assert.ok(pinRect.width>=44&&pinRect.height>=44);await page.screenshot({path:resolve(output,`pinned-${width}.png`)});}
 // A native Ctrl-click opens a background tab without a window.opener or page popup event.
 const beforePopup=page.url(),popupPromise=context.waitForEvent('page');await card(triton).click({modifiers:['Control']});const popup=await popupPromise;await popup.waitForLoadState();assert.ok(popup.url().includes('view=discover')&&popup.url().includes('series='+triton));assert.equal(page.url(),beforePopup);await popup.close();
 // A same-document storage write simulates another tab winning before its storage event arrives.
 const externalSettings={...await savedSettings()};externalSettings.revision++;externalSettings.profile={...externalSettings.profile,pinnedSeriesId:wpt};
 await page.evaluate(settings=>localStorage.setItem('events-pro-settings-v1',JSON.stringify(settings)),externalSettings);await pin(wpt).click();await group('置顶赛事').locator(`[data-series-id="${wpt}"]`).waitFor();await focusRestored(pin(wpt,true));
 assert.deepEqual(await savedSettings(),externalSettings);assert.deepEqual(await ids(group('置顶赛事')),[wpt]);assert.match(await page.locator('.series-pin-error').innerText(),/另一窗口已更新设置/);
 await pin(triton).click();await group('置顶赛事').locator(`[data-series-id="${triton}"]`).waitFor();await focusRestored(pin(triton,true));assert.equal(await page.locator('.series-pin-error').count(),0);
 await pin(triton,true).click();await group('置顶赛事').waitFor({state:'hidden'});await focusRestored(pin(triton));assert.deepEqual(await ids(group('即将到来')),[kpc,qpc,jpf,triton,wpt]);assert.equal((await savedSettings()).profile.pinnedSeriesId,null);
 assert.equal(await savedSelections(),selectionBeforePin);await page.reload();await card(wpt).waitFor();assert.equal(await group('置顶赛事').count(),0);
 pass('one keyboard-accessible pin survives reload and region changes; failures retain data, stale writes accept latest state without overwrite or lost focus, and modified links remain native');
 for(const label of ['南美']){await region(label).click();assert.equal(await page.locator('.festival-card').count(),0);await page.getByRole('heading',{name:label+'暂无赛事',exact:true}).waitFor();}
 await page.reload();await page.getByRole('heading',{name:'南美暂无赛事',exact:true}).waitFor();
 await page.screenshot({path:resolve(output,'empty-region.png')});await page.getByRole('button',{name:'显示全部地区',exact:true}).click();assert.equal(await page.locator('.festival-card').count(),5);
 await page.getByRole('radio',{name:'全部地区',exact:true}).focus();await page.keyboard.press('ArrowRight',{delay:50});await card('qpc-circuit-2026').waitFor();assert.deepEqual(await page.locator('.festival-card').evaluateAll(nodes=>nodes.map(n=>n.dataset.seriesId)),[kpc,'qpc-circuit-2026','jeju-poker-festival-2026']);
 await region('欧洲').click();assert.equal(await card(triton).count(),1);assert.equal(await card(wpt).count(),0);
 pass('region filtering, keyboard selection, empty recovery and reload persistence remain functional');
 const href=await card(triton).getAttribute('href');assert.ok(href.includes('series='+triton)&&href.includes('view=discover'));
 await card(triton).focus();await page.keyboard.press('Enter');await page.getByRole('heading',{name:/完整赛程$/}).waitFor();assert.equal(await page.locator('main h1').evaluate(e=>e===document.activeElement),true);assert.match(await page.locator('.series-header').innerText(),/EET/);assert.match(await page.locator('.results-bar').innerText(),/29.*22/s);
 const first=page.locator(`.mobile-event[data-entry-id="${triton}/T01/T01-D1A"]`);
 await chooseDiscoveryStatus(page,first,'参加');
 await page.getByRole('textbox',{name:'搜索赛事',exact:true}).fill('T12');
 await page.getByRole('button',{name:'返回赛事列表',exact:true}).click();assert.equal(await page.getByRole('radio',{name:'欧洲',exact:true}).getAttribute('aria-checked'),'true');
 await page.reload();await card(triton).waitFor();assert.equal(await page.locator('.festival-card').count(),1);
 await nav('我的日程');await page.locator('.agenda-row').first().waitFor();assert.ok(page.url().includes('series='+triton));
 assert.equal(await page.locator('.agenda-row[data-status="skip"], .agenda-row[data-status="undecided"]').count(),0);
 assert.ok((await page.locator('.agenda-row').evaluateAll(rows=>rows.map(r=>r.dataset.activityId))).every(id=>id.startsWith(triton+'/')));
 pass('Triton card, home/back/reload and personal calendar preserve the chosen series and latest attend/watch rule');
 await nav('赛事');await region('北美').click();await card(wpt).click();
 assert.equal(await page.getByRole('textbox',{name:'搜索赛事',exact:true}).inputValue(),'');assert.match(await page.locator('.series-header').innerText(),/PST/);
 await chooseDiscoveryStatus(page,page.locator(`.mobile-event[data-entry-id="${wpt}/W01/R0"]`),'关注');
 await nav('我的自选');await page.locator('.shortlist-table').waitFor();assert.equal(await page.locator('.shortlist-table tr[data-entry-id]').count(),2);assert.match(await page.locator('.shortlist-table').innerText(),/Merit Royal Diamond.*Wynn Las Vegas/s);
 await page.goBack();await page.getByRole('heading',{name:/完整赛程$/}).waitFor();
 pass('opening another festival resets incompatible filters and retains selections across both series');
 await page.getByRole('button',{name:'返回赛事列表',exact:true}).click();await page.goBack();await page.getByRole('heading',{name:/完整赛程$/}).waitFor();
 await page.goForward();await card(wpt).waitFor();assert.equal(await page.getByRole('radio',{name:'北美',exact:true}).getAttribute('aria-checked'),'true');
 await card(wpt).locator('img').evaluate(img=>img.dispatchEvent(new Event('error')));await card(wpt).locator('.series-logo').getByText('WPT',{exact:true}).waitFor();assert.equal(await card(wpt).locator('img').count(),0);assert.equal(await card(wpt).locator('.series-logo').innerText(),'WPT');
 pass('browser history and image-failure text fallback survive integration');
 await card(wpt).click();await page.locator('.series-header img').evaluate(img=>img.dispatchEvent(new Event('error')));await page.locator('.series-header .series-logo').getByText('WPT',{exact:true}).waitFor();
 assert.equal(await page.locator('.series-header .series-logo').innerText(),'WPT');
 for(const name of ['Triton ONE · 北塞浦路斯 2026','QPC Circuit · 河内 2026']){
  await selectPlannerOption(page,'赛事系列',name);
  assert.equal(await page.locator('.series-header img').evaluate(img=>img.complete&&img.naturalWidth>0&&img.src.startsWith('data:')),true);
 }
 pass('compact headers render both official logos; one brand image failure cannot suppress the next series logo');
 await page.goto(file+'#view=discover&series=missing');await page.getByRole('heading',{name:'没有找到这项赛事',exact:true}).waitFor();assert.equal(await page.locator('.mobile-event').count(),0);
 await page.getByRole('button',{name:'返回赛事首页',exact:true}).last().click();await page.getByRole('radio',{name:'全部地区',exact:true}).waitFor();
 await page.goto(file+'#q=W01&from=2026-11-27&to=2026-11-27');await page.getByRole('heading',{name:/完整赛程$/}).waitFor();assert.equal(await page.locator('.mobile-event').count(),2);
 assert.equal(await page.getByRole('textbox',{name:'搜索赛事',exact:true}).inputValue(),'W01');
 pass('unknown series offers recovery; old filtered WPT links still open their detailed schedule');
 await page.goto(file+'#view=home&region=all');await card(wpt).waitFor();const savedBeforePhases=await savedSelections();
 await atTime('2026-10-09T14:59:59Z');assert.deepEqual(await ids(group('正在进行')),[]);assert.equal(await group('即将到来').locator(`[data-series-id="${kpc}"]`).count(),1);
 await atTime('2026-10-09T15:00:00Z');await group('正在进行').locator(`[data-series-id="${kpc}"]`).waitFor();assert.deepEqual(await ids(group('正在进行')),[kpc]);assert.deepEqual(await ids(group('即将到来')),[qpc,jpf,triton,wpt]);
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:resolve(output,'ongoing-390.png')});
 await atTime('2026-10-21T14:59:59Z');await group('正在进行').locator(`[data-series-id="${qpc}"]`).waitFor();assert.deepEqual(await ids(group('正在进行')),[kpc,qpc]);
 await atTime('2026-10-21T15:00:00Z');await page.locator('details').waitFor();assert.deepEqual(await ids(group('正在进行')),[qpc]);assert.equal(await page.locator('details').evaluate(e=>e.open),false);assert.equal(await card(kpc).isVisible(),false);
 const ended=page.locator('details');await ended.locator('summary').focus();await page.keyboard.press('Enter');await card(kpc).waitFor();assert.deepEqual(await ids(ended),[kpc]);
 await pin(kpc).click();await group('置顶赛事').locator(`[data-series-id="${kpc}"]`).waitFor();await focusRestored(pin(kpc,true));assert.equal(await card(kpc).count(),1);assert.equal(await page.locator('details').count(),0);
 await pin(kpc,true).click();await group('置顶赛事').waitFor({state:'hidden'});await focusRestored(pin(kpc));assert.equal(await page.locator('details').evaluate(e=>e.open),true);assert.equal(await card(kpc).isVisible(),true);
 await atTime('2026-10-21T17:00:00Z');await page.waitForFunction(()=>!Array.from(document.querySelectorAll('section[aria-label="正在进行"] .festival-card')).length);assert.deepEqual(await ids(group('正在进行')),[]);assert.deepEqual(await ids(ended),[kpc,qpc]);
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:resolve(output,'timezone-phases-390.png'),fullPage:true});await card(kpc).focus();await page.keyboard.press('Enter');await page.getByRole('heading',{name:/完整赛程$/}).waitFor();assert.ok(page.url().includes('series='+kpc));assert.equal(await savedSelections(),savedBeforePhases);
 pass('festival-local midnight starts and inclusive end dates refresh on focus; Korean and Vietnamese phases differ correctly, archived cards expand and navigate, and unpinning an ended event keeps keyboard focus');
 await atTime('2026-10-21T16:00:00Z');await page.goto(file+'#view=home&region=all');await page.locator('details summary').click();await pin(kpc).click();await group('置顶赛事').locator(`[data-series-id="${kpc}"]`).waitFor();
 // Reload resets the archive to closed; a stale removal must not focus its hidden descendant.
 await page.reload();await pin(kpc,true).waitFor();assert.equal(await page.locator('details').count(),0);
 const otherWindow={...await savedSettings()};otherWindow.revision++;otherWindow.profile={...otherWindow.profile,pinnedSeriesId:qpc};await page.evaluate(settings=>localStorage.setItem('events-pro-settings-v1',JSON.stringify(settings)),otherWindow);
 await pin(kpc,true).click();await group('置顶赛事').locator(`[data-series-id="${qpc}"]`).waitFor();await page.waitForFunction(()=>document.querySelector('.series-results')===document.activeElement);
 assert.deepEqual(await savedSettings(),otherWindow);assert.equal(await page.locator('details').evaluate(e=>e.open),false);assert.equal(await card(kpc).isVisible(),false);assert.match(await page.locator('.series-pin-error').innerText(),/另一窗口已更新设置/);assert.equal(await savedSelections(),savedBeforePhases);
 pass('stale removal of an ended pin keeps the newer saved pin and restores focus to visible results instead of a collapsed archive');
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);pass('all combined homepage flows remain offline without browser errors');
}finally{await fs.writeFile(resolve(output,'results.json'),JSON.stringify({checks,errors,requests},null,2));await browser.close();}
