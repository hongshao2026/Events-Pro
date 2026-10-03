import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {chromium} from 'playwright';

const output=resolve('.sites-runtime/qa/home');await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
const context=await browser.newContext({viewport:{width:390,height:900},offline:true,reducedMotion:'reduce'});
const page=await context.newPage(),checks=[],errors=[],requests=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
const pass=name=>{checks.push(name);console.log('PASS',name);};
const file=pathToFileURL(resolve('release/WPT赛事自选表.html')).href;
const wpt='wpt-wynn-2026',triton='triton-one-cyprus-2026';
const card=id=>page.locator(`.festival-card[data-series-id="${id}"]`);
const region=name=>page.locator('label.region-option').filter({hasText:new RegExp('^'+name+'$')});
const nav=name=>page.locator('.bottom-nav').getByRole('button',{name:name==='我的自选'?/我的自选/:name,exact:true}).click();
try{
 await page.goto(file);await card(wpt).waitFor();assert.equal(await page.title(),'赛事 · Events Pro');
 assert.deepEqual(await page.locator('.festival-card').evaluateAll(nodes=>nodes.map(n=>n.dataset.seriesId)),[triton,wpt]);
 assert.equal(await page.locator('.mobile-event').count(),0);assert.equal(await page.getByRole('button',{name:'登录',exact:true}).count(),0);
 assert.equal(await card(wpt).locator('img').evaluate(img=>img.complete&&img.naturalWidth>0&&img.src.startsWith('data:')),true);
 assert.match(await card(triton).innerText(),/22 项赛事.*29 个起始场次/s);
 pass('homepage retains both festivals in date order, bundled WPT logo, counts and disabled authentication');
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const rect=await page.locator('.app-shell').boundingBox();assert.ok(rect.width<=480.1);
  await page.screenshot({path:resolve(output,`catalog-${width}.png`)});
 }
 await page.setViewportSize({width:390,height:900});pass('merged catalog fits phones and centered desktop layout');
 for(const label of ['亚太','南美']){await region(label).click();assert.equal(await page.locator('.festival-card').count(),0);await page.getByRole('heading',{name:label+'暂无赛事',exact:true}).waitFor();}
 await page.reload();await page.getByRole('heading',{name:'南美暂无赛事',exact:true}).waitFor();
 await page.screenshot({path:resolve(output,'empty-region.png')});await page.getByRole('button',{name:'显示全部地区',exact:true}).click();assert.equal(await page.locator('.festival-card').count(),2);
 await page.getByRole('radio',{name:'全部地区',exact:true}).focus();await page.keyboard.press('ArrowRight',{delay:50});await page.getByRole('heading',{name:'亚太暂无赛事',exact:true}).waitFor();
 await region('欧洲').click();assert.equal(await card(triton).count(),1);assert.equal(await card(wpt).count(),0);
 pass('region filtering, keyboard selection, empty recovery and reload persistence remain functional');
 const href=await card(triton).getAttribute('href');assert.ok(href.includes('series='+triton)&&href.includes('view=discover'));
 await card(triton).focus();await page.keyboard.press('Enter');await page.getByRole('heading',{name:'完整赛程',exact:true}).waitFor();assert.equal(await page.locator('main h1').evaluate(e=>e===document.activeElement),true);assert.match(await page.locator('.series-header').innerText(),/EET/);assert.match(await page.locator('.results-bar').innerText(),/29.*22/s);
 const first=page.locator(`.mobile-event[data-entry-id="${triton}/T01/T01-D1A"]`);
 await first.locator('.class-option').filter({hasText:/^参加$/}).click();
 await page.getByRole('textbox',{name:'搜索赛事',exact:true}).fill('T12');
 await page.getByRole('link',{name:'返回赛事列表',exact:true}).click();assert.equal(await page.getByRole('radio',{name:'欧洲',exact:true}).getAttribute('aria-checked'),'true');
 await page.reload();await card(triton).waitFor();assert.equal(await page.locator('.festival-card').count(),1);
 await nav('我的日程');await page.locator('.agenda-row').first().waitFor();assert.ok(page.url().includes('series='+triton));
 assert.equal(await page.locator('.agenda-row[data-status="skip"], .agenda-row[data-status="undecided"]').count(),0);
 assert.ok((await page.locator('.agenda-row').evaluateAll(rows=>rows.map(r=>r.dataset.activityId))).every(id=>id.startsWith(triton+'/')));
 pass('Triton card, home/back/reload and personal calendar preserve the chosen series and latest attend/watch rule');
 await nav('赛事');await region('北美').click();await card(wpt).click();
 assert.equal(await page.getByRole('textbox',{name:'搜索赛事',exact:true}).inputValue(),'');assert.match(await page.locator('.series-header').innerText(),/PST/);
 await page.locator(`.mobile-event[data-entry-id="${wpt}/W01/R0"]`).locator('.class-option').filter({hasText:/^关注$/}).click();
 await nav('我的自选');assert.equal(await page.locator('.cart-entry').count(),2);assert.match(await page.locator('.cart-scroll').innerText(),/Merit Royal Diamond.*Wynn Las Vegas/s);
 await page.getByRole('button',{name:'关闭我的自选',exact:true}).click();
 pass('opening another festival resets incompatible filters and retains selections across both series');
 await page.getByRole('link',{name:'返回赛事列表',exact:true}).click();await page.goBack();await page.getByRole('heading',{name:'完整赛程',exact:true}).waitFor();
 await page.goForward();await card(wpt).waitFor();assert.equal(await page.getByRole('radio',{name:'北美',exact:true}).getAttribute('aria-checked'),'true');
 await card(wpt).locator('img').evaluate(img=>img.dispatchEvent(new Event('error')));assert.equal(await card(wpt).locator('img').count(),0);assert.equal(await card(wpt).locator('.series-logo').innerText(),'WPT');
 pass('browser history and image-failure text fallback survive integration');
 await page.goto(file+'#view=discover&series=missing');await page.getByRole('heading',{name:'没有找到这项赛事',exact:true}).waitFor();assert.equal(await page.locator('.mobile-event').count(),0);
 await page.getByRole('button',{name:'返回赛事首页',exact:true}).last().click();await page.getByRole('radio',{name:'全部地区',exact:true}).waitFor();
 await page.goto(file+'#q=W01&from=2026-11-27&to=2026-11-27');await page.getByRole('heading',{name:'完整赛程',exact:true}).waitFor();assert.equal(await page.locator('.mobile-event').count(),2);
 assert.equal(await page.getByRole('textbox',{name:'搜索赛事',exact:true}).inputValue(),'W01');
 pass('unknown series offers recovery; old filtered WPT links still open their detailed schedule');
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);pass('all combined homepage flows remain offline without browser errors');
}finally{await fs.writeFile(resolve(output,'results.json'),JSON.stringify({checks,errors,requests},null,2));await browser.close();}
