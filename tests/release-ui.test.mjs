import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
import {releaseServer} from './release-test-server.mjs';
import {readReleaseConfig} from '../scripts/release-config.mjs';

const server=await releaseServer(),output='.sites-runtime/qa/release';await mkdir(output,{recursive:true});
const config=await readReleaseConfig(),contactReady=!!(config.operatorName.trim()&&config.operatorCountry.trim()&&config.supportEmail.trim());
const checks=[];
try{
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true,...(name==='chromium'&&process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[],external=[];
   page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith(server.url))external.push(request.url());});
   await page.goto(server.url+'/#view=profile');await page.getByRole('button',{name:'隐私政策',exact:true}).click();
   const sheet=page.locator('.legal-sheet');await sheet.waitFor();assert.match(await sheet.innerText(),/不会自动发送给运营者/);assert.equal(await sheet.locator('.legal-draft-note').count(),contactReady?0:1);
   await sheet.getByRole('button',{name:'繁體中文',exact:true}).click();assert.equal(await sheet.locator('.legal-scroll').getAttribute('lang'),'zh-Hant');assert.match(await sheet.innerText(),/隱私權政策/);
   for(const width of [320,390,480]){await page.setViewportSize({width,height:650});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.ok((await sheet.boundingBox()).width<=width);await sheet.locator('.legal-scroll').evaluate(element=>element.scrollTo(0,element.scrollHeight));assert.ok(await sheet.getByRole('heading',{name:'政策更新',exact:true}).isVisible());}
   await page.keyboard.press('Escape');await sheet.waitFor({state:'hidden'});await page.waitForFunction(()=>document.activeElement?.textContent==='隐私政策');
   await page.getByRole('button',{name:'帮助与支持',exact:true}).click();assert.match(await sheet.innerText(),/两份独立备份/);await page.keyboard.press('Escape');
   await page.getByRole('button',{name:'使用说明',exact:true}).click();assert.match(await sheet.innerText(),/不产生席位或报名确认/);await page.keyboard.press('Escape');
   checks.push(`${name}: readable policies, Traditional Chinese, narrow scroll, keyboard and focus`);
   await page.evaluate(()=>{localStorage.setItem('unrelated-test-record','keep');localStorage.setItem('events-pro-settings-v1',JSON.stringify({version:1,revision:1,profile:{username:'测试玩家',currency:'CNY',pinnedSeriesId:'kpc-jeju-2026'},fx:{rates:{CNY:1,USD:6.7351,VND:0.000258,HKD:0.8584,KRW:0.004958},asOf:'2026-10-08',source:'测试'},eventOverrides:{}}));localStorage.setItem('poker-planner-local-v2',JSON.stringify({app:'wpt-planner',schemaVersion:2,savedAt:'2026-10-08T00:00:00Z',state:{revision:1,budgetMode:'flights',selections:{'wpt-wynn-2026/W01/R0':{status:'attend',version:1}},pending:{}}}));});
   await page.reload();await page.getByRole('button',{name:'清除本机记录',exact:true}).click();const dialog=page.getByRole('alertdialog');assert.match(await dialog.innerText(),/无法撤销/);await dialog.getByRole('button',{name:'取消',exact:true}).click();assert.ok(await page.evaluate(()=>!!localStorage.getItem('poker-planner-local-v2')));
   await page.getByRole('button',{name:'清除本机记录',exact:true}).click();await page.evaluate(()=>{window.originalRemove=Storage.prototype.removeItem;Storage.prototype.removeItem=function(key){if(key==='events-pro-settings-v1')throw new DOMException('blocked','SecurityError');return window.originalRemove.call(this,key);};});
   await dialog.getByRole('button',{name:'清除全部本机记录',exact:true}).click();await dialog.getByRole('alert').waitFor();assert.match(await dialog.innerText(),/原记录已恢复/);assert.ok(await page.evaluate(()=>!!localStorage.getItem('poker-planner-local-v2')));
   await page.evaluate(()=>{Storage.prototype.removeItem=window.originalRemove;});await dialog.getByRole('button',{name:'取消',exact:true}).click();await page.getByRole('button',{name:'清除本机记录',exact:true}).click();await dialog.getByRole('button',{name:'清除全部本机记录',exact:true}).click();await page.waitForFunction(()=>localStorage.getItem('events-pro-settings-v1')===null&&document.querySelector('.profile-identity h2')?.textContent==='扑克玩家');
   assert.equal(await page.evaluate(()=>localStorage.getItem('poker-planner-local-v2')),null);assert.equal(await page.evaluate(()=>localStorage.getItem('unrelated-test-record')),'keep');
   checks.push(`${name}: clear cancellation, failed multi-key removal rollback, successful selective reset`);
   await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'隐私政策',exact:true}).click();await page.screenshot({path:`${output}/${name}-privacy.png`});
   assert.deepEqual(errors,[]);assert.deepEqual(external,[]);checks.push(`${name}: no automatic external requests or page errors`);
  }finally{await browser.close();}
 }
}finally{await server.close();await writeFile(`${output}/results.json`,JSON.stringify({checks},null,2));}
checks.forEach(check=>console.log('PASS',check));
