import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {webkit} from 'playwright';
import {releaseServer} from './release-test-server.mjs';
const server=await releaseServer(),browser=await webkit.launch({headless:true});
const output='.sites-runtime/qa/device-storage';await mkdir(output,{recursive:true});const checks=[],errors=[];
try{
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await context.addInitScript(()=>{
  window.nativeCalls=[];window.preferenceMode=localStorage.getItem('test-mode')||'ok';
  window.webkit={messageHandlers:{bridge:{postMessage(){}}}};
  window.Capacitor={PluginHeaders:[{name:'Preferences',methods:['configure','get','set'].map(name=>({name,rtype:'promise'}))},{name:'Filesystem',methods:[{name:'rmdir',rtype:'promise'}]}],nativePromise:async(plugin,method,options)=>{
   window.nativeCalls.push({plugin,method,options});
   if(plugin!=='Preferences')return {};
   if(method==='get'){if(window.preferenceMode==='read-error')throw new Error('read denied');return {value:localStorage.getItem('test-native-pref:'+options.key)};}
   if(method==='set'){
    if(window.preferenceMode==='write-error')throw new Error('quota');
    if(window.preferenceMode==='slow')await new Promise(resolve=>{window.finishNativeWrite=resolve;});
    localStorage.setItem('test-native-pref:'+options.key,options.value);
   }
   return {};
  }};
  if(!localStorage.getItem('test-seeded')){
   localStorage.setItem('test-seeded','yes');localStorage.setItem('unrelated','keep');
   localStorage.setItem('wpt-2026-local-selections-v1',JSON.stringify({app:'wpt-planner',schemaVersion:1,savedAt:'2026-10-02T00:00:00Z',selections:{W01:{status:'watch',flight:'R0',version:1}}}));
  }
 });
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 await page.goto(server.url+'/#view=shortlist');await page.locator('.shortlist-table tr[data-entry-id]').waitFor();
 let disk=await page.evaluate(()=>JSON.parse(localStorage.getItem('test-native-pref:events-pro-device-store-v1')));
 assert.ok(disk.records['wpt-2026-local-selections-v1']);
 await page.evaluate(()=>{window.preferenceMode='slow';});
 const remove=page.getByRole('button',{name:/不关注 .*DAY 1A/i});await remove.click();await page.waitForFunction(()=>!!window.finishNativeWrite);
 assert.equal(await page.locator('.shortlist-table tr[data-entry-id]').count(),1,'UI must wait for native persistence');
 await page.evaluate(()=>{window.finishNativeWrite();window.preferenceMode='ok';});await page.getByText('自选表还是空的',{exact:false}).waitFor();
 await page.reload();await page.getByText('自选表还是空的',{exact:false}).waitFor();
 disk=await page.evaluate(()=>JSON.parse(localStorage.getItem('test-native-pref:events-pro-device-store-v1')));
 assert.equal(JSON.parse(disk.records['poker-planner-local-v2']).state.selections['wpt-wynn-2026/W01/R0'].status,'undecided');
 checks.push('Desktop WebKit bridge: raw v1 migration retained; delayed native write blocks success; reload reads native snapshot instead of old WebView copy');
 await page.locator('.bottom-nav').getByRole('button',{name:'我的',exact:true}).click();await page.getByLabel('用户名',{exact:true}).fill('原生测试');
 await page.evaluate(()=>{window.preferenceMode='write-error';});await page.getByRole('button',{name:'保存',exact:true}).click();await page.getByRole('alert').filter({hasText:'未能保存到本机'}).waitFor();
 disk=await page.evaluate(()=>JSON.parse(localStorage.getItem('test-native-pref:events-pro-device-store-v1')));assert.equal(disk.records['events-pro-settings-v1'],undefined);
 await page.evaluate(()=>{window.preferenceMode='ok';});await page.getByRole('button',{name:'保存',exact:true}).click();await page.locator('.profile-identity h2').filter({hasText:'原生测试'}).waitFor();
 await page.reload();await page.locator('.profile-identity h2').filter({hasText:'原生测试'}).waitFor();
 checks.push('Desktop WebKit bridge: failed native settings write preserves snapshot and allows retry; successful settings survive reload');
 await page.getByRole('button',{name:'清除本机记录',exact:true}).click();await page.getByRole('button',{name:'清除全部本机记录',exact:true}).click();await page.locator('.profile-identity h2').filter({hasText:'扑克玩家'}).waitFor();
 assert.equal(await page.evaluate(()=>localStorage.getItem('wpt-2026-local-selections-v1')),null);assert.equal(await page.evaluate(()=>localStorage.getItem('unrelated')),'keep');
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('test-native-pref:events-pro-device-store-v1')).records),{});
 checks.push('Desktop WebKit bridge: explicit clear removes native and old WebView known records, preserves unrelated data and cannot remigrate cleared choices');
 await page.evaluate(()=>{localStorage.setItem('test-mode','read-error');});await page.reload();await page.getByRole('button',{name:'重新读取本机存储',exact:true}).waitFor();assert.equal(await page.locator('.bottom-nav').count(),0);
 await page.evaluate(()=>{localStorage.setItem('test-mode','ok');localStorage.setItem('test-native-pref:events-pro-device-store-v1','{broken');});await page.getByRole('button',{name:'重新读取本机存储',exact:true}).click();await page.getByRole('button',{name:'重新读取本机存储',exact:true}).waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('test-native-pref:events-pro-device-store-v1')),'{broken');
 checks.push('Desktop WebKit bridge: read failure or invalid native snapshot shows recovery and never mounts/writes a blank plan');
 assert.deepEqual(errors,[]);await page.screenshot({path:output+'/storage-recovery.png'});
}finally{await browser.close();await server.close();await writeFile(output+'/results.json',JSON.stringify({checks,errors,note:'Desktop WebKit with mocked Preferences, not a real iOS device.'},null,2));}
for(const check of checks)console.log('PASS',check);
