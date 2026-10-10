import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const provider='https://cloud.events-pro.test';
const server=await createServer({server:{host:'127.0.0.1',port:0,hmr:false,watch:null},define:{'import.meta.env.VITE_AUTH_ENABLED':'"true"','import.meta.env.VITE_CLOUD_ENABLED':'"true"','import.meta.env.VITE_SUPABASE_URL':JSON.stringify(provider),'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY':'"sb_publishable_test_fixture"'}});
await server.listen();const base=`http://127.0.0.1:${server.httpServer.address().port}`,output='.sites-runtime/qa/cloud';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})}),checks=[],errors=[],requests=[];
const user={id:'11111111-1111-4111-8111-111111111111',aud:'authenticated',role:'authenticated',email:'backup@example.com',app_metadata:{provider:'email'},user_metadata:{},created_at:'2026-10-09T00:00:00Z'};
try{
 const context=await browser.newContext({viewport:{width:320,height:844},reducedMotion:'reduce'});
 await context.addInitScript(user=>{
  if(!localStorage.getItem('fixture-seeded')){
   localStorage.setItem('fixture-seeded','yes');
   localStorage.setItem('events-pro-auth-session',JSON.stringify({access_token:'fixture-access-token',refresh_token:'fixture-refresh-token',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user}));
   localStorage.setItem('poker-planner-local-v2',JSON.stringify({app:'wpt-planner',schemaVersion:2,savedAt:'2026-10-09T00:00:00Z',state:{revision:1,budgetMode:'flights',selections:{'wpt-wynn-2026/W01/R0':{status:'watch',version:1}},pending:{}}}));
  }
 },user);
 let cloud=null,deleteStatus=503;
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());if(url.origin===base)return route.continue();if(url.origin!==provider){errors.push('Unexpected external origin');return route.abort();}
  requests.push(url.pathname);
  const json=(status,data)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data),headers:{'access-control-allow-origin':base}});
  if(url.pathname==='/auth/v1/user')return json(200,user);
  if(url.pathname==='/auth/v1/logout')return route.fulfill({status:204});
  if(url.pathname.startsWith('/rest/')||url.pathname.startsWith('/functions/'))assert.equal(request.headers()['authorization'],'Bearer fixture-access-token');
  if(url.pathname==='/rest/v1/events_pro_backups'){assert.equal(url.searchParams.get('user_id'),'eq.'+user.id);return json(200,cloud?[cloud]:[]);}
  if(url.pathname==='/rest/v1/rpc/save_events_pro_backup'){
   const body=request.postDataJSON();assert.deepEqual(Object.keys(body).sort(),['backup_payload','expected_revision']);
   if(body.expected_revision!==(cloud?.revision??0))return json(409,{code:'40001',message:'PRIVATE_BACKEND_DETAILS'});
   cloud={user_id:user.id,revision:(cloud?.revision??0)+1,updated_at:new Date().toISOString(),payload:body.backup_payload};return json(200,cloud);
  }
  if(url.pathname==='/functions/v1/delete-account'){assert.deepEqual(request.postDataJSON(),{confirm:true});return json(deleteStatus,deleteStatus===200?{deleted:true}:{error:'deletion_not_confirmed'});}
  errors.push('Unexpected provider endpoint: '+url.pathname);return route.abort();
 });
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto(base+'/#view=profile');await page.getByRole('region',{name:'云端备份'}).waitFor();
 assert.equal(requests.filter(path=>path.startsWith('/rest/')).length,0);assert.ok(await page.getByRole('button',{name:'备份到当前账号',exact:true}).isDisabled());
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const view=()=>page.getByRole('button',{name:'查看云端备份',exact:true}).click();await view();await page.getByText('这个账号还没有云端备份。',{exact:true}).waitFor();
 await page.getByRole('button',{name:'备份到当前账号',exact:true}).click();await page.getByRole('button',{name:'取消',exact:true}).click();assert.equal(cloud,null);
 await page.getByRole('button',{name:'备份到当前账号',exact:true}).click();await page.getByRole('button',{name:'确认云端备份',exact:true}).click();await page.getByText('当前计划和设置已备份到这个账号。后续修改仍需再次备份。',{exact:true}).waitFor();assert.equal(cloud.revision,1);assert.equal(JSON.stringify(cloud.payload).includes('fixture-access-token'),false);
 checks.push('Mock service: no automatic cloud traffic, explicit view/confirm, cancel has no upload, 320px layout and auth tokens excluded');
 cloud.revision=2;await page.getByRole('button',{name:'备份到当前账号',exact:true}).click();await page.getByRole('button',{name:'确认云端备份',exact:true}).click();await page.getByRole('alert').filter({hasText:'另一台设备已更新'}).waitFor();assert.equal(await page.getByText('PRIVATE_BACKEND_DETAILS',{exact:false}).count(),0);assert.equal(cloud.revision,2);await page.getByRole('button',{name:'取消',exact:true}).click();await view();await page.getByText(/云端版本 2/).waitFor();
 const saved=await page.evaluate(()=>localStorage.getItem('poker-planner-local-v2'));
 await page.getByRole('button',{name:'恢复云端备份',exact:true}).click();await page.evaluate(()=>{const record=JSON.parse(localStorage.getItem('poker-planner-local-v2'));record.state.revision++;localStorage.setItem('poker-planner-local-v2',JSON.stringify(record));window.dispatchEvent(new StorageEvent('storage',{key:'poker-planner-local-v2'}));});await page.getByRole('button',{name:'确认云端恢复',exact:true}).click();await page.getByRole('alert').filter({hasText:'本机记录已变化'}).waitFor();assert.notEqual(await page.evaluate(()=>localStorage.getItem('poker-planner-local-v2')),saved);await page.getByRole('button',{name:'取消',exact:true}).click();
 await page.getByRole('button',{name:'恢复云端备份',exact:true}).click();await page.getByRole('button',{name:'确认云端恢复',exact:true}).click();await page.getByText('云端计划和设置已恢复到本机。',{exact:true}).waitFor();await page.screenshot({path:output+'/cloud-backup-320.png'});
 checks.push('Mock service: cloud version conflict cannot overwrite, stale local restore refused, successful restore updates both stores and reports success');
 await page.getByRole('button',{name:'删除账号',exact:true}).click();await page.getByRole('button',{name:'取消',exact:true}).click();assert.equal(requests.includes('/functions/v1/delete-account'),false);
 const retained=await page.evaluate(()=>localStorage.getItem('poker-planner-local-v2'));
 await page.getByRole('button',{name:'删除账号',exact:true}).click();await page.getByRole('button',{name:'确认删除账号',exact:true}).click();await page.getByRole('alert').filter({hasText:'账号删除未能确认'}).waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('poker-planner-local-v2')),retained);assert.ok(await page.evaluate(()=>!!localStorage.getItem('events-pro-auth-session')));
 deleteStatus=200;await page.getByRole('button',{name:'确认删除账号',exact:true}).click();await page.getByRole('button',{name:'登录',exact:true}).first().waitFor();assert.equal(await page.locator('.cloud-backup').count(),0);assert.equal(await page.evaluate(()=>localStorage.getItem('poker-planner-local-v2')),retained);assert.equal(await page.evaluate(()=>localStorage.getItem('events-pro-auth-session')),null);
 checks.push('Mock service: account deletion requires confirmation, failure remains truthful and retryable, successful deletion removes session/cloud controls while preserving local plan');
 assert.deepEqual(errors,[]);
}finally{await browser.close();await server.close();await writeFile(output+'/results.json',JSON.stringify({checks,errors,note:'Isolated flags and mocked auth/database/functions; no actual Supabase connection, email or account deletion.'},null,2));}
for(const check of checks)console.log('PASS',check);
