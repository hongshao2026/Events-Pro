import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {webkit} from 'playwright';
import {releaseServer} from './release-test-server.mjs';

const server=await releaseServer(),browser=await webkit.launch({headless:true});
const output='.sites-runtime/qa/native';await mkdir(output,{recursive:true});const checks=[],errors=[],external=[];
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 await context.addInitScript(()=>{
  window.nativeCalls=[];window.nativeMode='success';
  window.webkit={messageHandlers:{bridge:{postMessage(){}}}};
  window.Capacitor={PluginHeaders:[{name:'Preferences',methods:['configure','get','set'].map(name=>({name,rtype:'promise'}))},{name:'Filesystem',methods:['writeFile','deleteFile','rmdir'].map(name=>({name,rtype:'promise'}))},{name:'Share',methods:[{name:'share',rtype:'promise'}]},{name:'Browser',methods:[{name:'open',rtype:'promise'}]}],nativePromise:async(plugin,method,options)=>{
   window.nativeCalls.push({plugin,method,options});
   if(plugin==='Preferences'){if(method==='get')return {value:localStorage.getItem('test-native-pref:'+options.key)};if(method==='set')localStorage.setItem('test-native-pref:'+options.key,options.value);return {};}
   if(plugin==='Filesystem'&&method==='writeFile'){if(window.nativeMode==='write-error')throw new Error('No space');return {uri:'file:///cache/'+options.path};}
   if(plugin==='Share'){
    if(window.nativeMode==='cancel')throw {message:'Share canceled'};
    if(window.nativeMode==='share-error')throw new Error('Error sharing item');
    if(window.nativeMode==='slow')await new Promise(resolve=>{window.finishShare=resolve;});
    return {activityType:'fixture'};
   }
   return {};
  }};
  localStorage.setItem('poker-planner-local-v2',JSON.stringify({app:'wpt-planner',schemaVersion:2,savedAt:'2026-10-08T00:00:00Z',state:{revision:1,budgetMode:'flights',selections:{'wpt-wynn-2026/W01/R0':{status:'attend',version:1},'wpt-wynn-2026/W02/R1':{status:'watch',version:1}},pending:{}}}));
 });
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith(server.url))external.push(request.url());});
 await page.goto(server.url+'/#view=shortlist');await page.locator('.shortlist-table tr[data-entry-id]').first().waitFor();
 assert.ok(await page.locator('html').evaluate(element=>element.classList.contains('native-ios')));
 await page.getByRole('button',{name:'导出图片',exact:true}).click();const sheet=page.locator('.shortlist-image-sheet');await sheet.waitFor();
 assert.equal(await page.evaluate(()=>window.nativeCalls.filter(call=>call.plugin==='Share').length),0,'Generating an image must not share without a tap');
 const share=sheet.getByRole('button',{name:'分享或存储图片',exact:true});await share.click();await page.waitForFunction(()=>window.nativeCalls.some(call=>call.method==='deleteFile'));
 const calls=await page.evaluate(()=>window.nativeCalls),write=calls.find(call=>call.method==='writeFile'),delivery=calls.find(call=>call.plugin==='Share');
 assert.equal(write.options.directory,'CACHE');assert.match(write.options.path,/exports\/.+\.png$/);assert.deepEqual(Buffer.from(write.options.data,'base64').subarray(0,8),Buffer.from([137,80,78,71,13,10,26,10]));assert.deepEqual(delivery.options.files,['file:///cache/'+write.options.path]);
 assert.ok(calls.findIndex(call=>call.method==='rmdir'&&call.options.path==='exports')<calls.findIndex(call=>call.method==='writeFile'));
 checks.push('WebKit mock bridge: locally encoded full-plan PNG, explicit native share and cache cleanup');
 for(const mode of ['cancel','share-error','write-error']){
  await page.evaluate(mode=>{window.nativeMode=mode;window.nativeCalls=[];},mode);await share.click();await page.waitForFunction(()=>!document.querySelector('.shortlist-image-actions button')?.disabled);
  assert.ok(await sheet.isVisible());assert.equal(await sheet.getByRole('alert').count(),mode==='cancel'?0:1);
  if(mode==='write-error')assert.equal(await page.evaluate(()=>window.nativeCalls.some(call=>call.plugin==='Share')),false);
  else assert.ok(await page.evaluate(()=>window.nativeCalls.some(call=>call.method==='deleteFile')));
 }
 await page.evaluate(()=>{window.nativeMode='slow';window.nativeCalls=[];});await share.click();await page.waitForFunction(()=>!!window.finishShare);assert.ok(await share.isDisabled());await share.evaluate(button=>{button.click();button.click();});assert.equal(await page.evaluate(()=>window.nativeCalls.filter(call=>call.plugin==='Share').length),1);await page.evaluate(()=>window.finishShare());await page.waitForFunction(()=>!document.querySelector('.shortlist-image-actions button')?.disabled);assert.equal(await sheet.getByRole('alert').count(),0);
 checks.push('WebKit mock bridge: cancellation retains preview, file/share failures retry, busy action prevents duplicate delivery');
 await page.getByRole('button',{name:'关闭图片预览',exact:true}).click();await page.locator('.bottom-nav').getByRole('button',{name:'我的',exact:true}).click();
 assert.equal(await page.locator('.vip-badge').count(),0);assert.match(await page.locator('.profile-identity').innerText(),/本机个人计划/);assert.equal(await page.getByText('VIP 权益尚未开放。',{exact:true}).count(),0);
 await page.screenshot({path:`${output}/ios-profile-webkit.png`});await page.getByRole('button',{name:'隐私政策',exact:true}).click();await page.locator('.legal-sheet').waitFor();await page.screenshot({path:`${output}/ios-privacy-webkit.png`});await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement?.textContent==='隐私政策');
 for(const label of ['导出备份','导出设置备份']){
  await page.evaluate(()=>{window.nativeMode='success';window.nativeCalls=[];});await page.getByRole('button',{name:label,exact:true}).click();await page.waitForFunction(()=>window.nativeCalls.some(call=>call.method==='deleteFile'));
  const written=await page.evaluate(()=>window.nativeCalls.find(call=>call.method==='writeFile').options);const data=JSON.parse(Buffer.from(written.data,'base64').toString('utf8'));
  assert.equal(data.schemaVersion,label==='导出备份'?2:1);if(label==='导出备份')assert.equal(data.state.selections['wpt-wynn-2026/W01/R0'].status,'attend');
 }
 checks.push('WebKit mock bridge: both existing backup formats export through the native file menu');
 await page.locator('.management-link').click();await page.getByRole('tab',{name:'赛事管理',exact:true}).click();await page.locator('.admin-event-row').first().click();await page.getByRole('dialog',{name:'编辑赛事',exact:true}).waitFor();assert.equal(await page.locator('.structure-placeholder').count(),0);await page.getByRole('button',{name:'关闭赛事编辑',exact:true}).click();
 checks.push('WebKit mock bridge: local profile and editor omit unopened VIP and blind-structure placeholders');
 await page.goto(server.url+'/#view=discover&series=wpt-wynn-2026');await page.getByRole('link',{name:/官方赛程/}).click();await page.waitForFunction(()=>window.nativeCalls.some(call=>call.plugin==='Browser'));const opened=await page.evaluate(()=>window.nativeCalls.find(call=>call.plugin==='Browser').options.url);assert.match(opened,/^https:\/\/cdn\.wynnresorts\.com\//);
 await page.goto(server.url+'/#view=discover&series=triton-one-cyprus-2026');await page.locator('.mobile-event').first().waitFor();await page.evaluate(()=>{window.nativeCalls=[];});await page.locator('.page-foot a[download]').click();await page.waitForFunction(()=>window.nativeCalls.some(call=>call.plugin==='Share'));const pdf=await page.evaluate(()=>window.nativeCalls.find(call=>call.method==='writeFile').options);assert.equal(Buffer.from(pdf.data,'base64').subarray(0,4).toString(),'%PDF');
 checks.push('WebKit mock bridge: external source opens native browser and bundled PDF uses local file sharing');
 await page.screenshot({path:`${output}/ios-style-webkit.png`});assert.deepEqual(errors,[]);assert.deepEqual(external,[]);checks.push('WebKit mock bridge: bundled app makes no automatic external network requests');
}finally{await browser.close();await server.close();await writeFile(`${output}/results.json`,JSON.stringify({checks,errors,external,note:'Mocked native bridge in desktop WebKit, not iOS Simulator or a real device.'},null,2));}
checks.forEach(check=>console.log('PASS',check));
