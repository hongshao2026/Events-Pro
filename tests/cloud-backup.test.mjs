import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'vite';
import {PGlite} from '@electric-sql/pglite';
import {handleDeleteAccount} from '../supabase/functions/delete-account/handler.js';

await build({configFile:false,logLevel:'silent',build:{outDir:'.sites-runtime/unit/cloud',emptyOutDir:true,minify:false,lib:{entry:resolve('lib/cloud-backup.ts'),formats:['es'],fileName:'cloud'}}});
const cloud=await import(pathToFileURL(resolve('.sites-runtime/unit/cloud/cloud.js')).href);
const files=new Map();globalThis.localStorage={getItem:key=>files.get(key)??null,setItem:(key,value)=>files.set(key,value),removeItem:key=>files.delete(key)};
const local=cloud.captureLocalBackup();assert.deepEqual(Object.keys(local.payload).sort(),['selections','settings','version']);
files.set('events-pro-auth-session','PRIVATE_TOKEN');assert.equal(JSON.stringify(cloud.captureLocalBackup().payload).includes('PRIVATE_TOKEN'),false);
const snapshot=structuredClone(local.payload);snapshot.selections.state.selections['wpt-wynn-2026/W01/R0']={status:'watch',version:1};snapshot.settings.settings.profile.username='备份测试';
await cloud.restoreCloudBackup(snapshot,cloud.localFingerprint());
assert.equal(cloud.captureLocalBackup().payload.selections.state.selections['wpt-wynn-2026/W01/R0'].status,'watch');
assert.equal(cloud.captureLocalBackup().payload.settings.settings.profile.username,'备份测试');
await assert.rejects(()=>cloud.restoreCloudBackup(local.payload,local.fingerprint),/本机记录已变化/);
const original=new Map(files),set=globalThis.localStorage.setItem;let failed=false;
globalThis.localStorage.setItem=(key,value)=>{if(key==='events-pro-settings-v1'&&!failed){failed=true;throw new Error('quota');}return set(key,value);};
await assert.rejects(()=>cloud.restoreCloudBackup(local.payload,cloud.localFingerprint()),/原记录已保留/);assert.deepEqual(files,original);globalThis.localStorage.setItem=set;
files.set('poker-planner-local-v2','{bad');files.set('events-pro-settings-v1','{bad');
await cloud.restoreCloudBackup(snapshot,cloud.localFingerprint());assert.equal(cloud.captureLocalBackup().payload.settings.settings.profile.username,'备份测试');
assert.throws(()=>cloud.parseCloudPayload({version:2}));assert.throws(()=>cloud.parseCloudRecord({user_id:'other'},'owner'));
await assert.rejects(()=>cloud.currentAccountToken({auth:{getSession:async()=>({data:{session:{user:{id:'other'},access_token:'other-token'}},error:null})}},'owner'),/账号已变更/);
assert.equal(await cloud.currentAccountToken({auth:{getSession:async()=>({data:{session:{user:{id:'owner'},access_token:'owner-token'}},error:null})}},'owner'),'owner-token');
console.log('PASS cloud payload excludes auth, validates both formats, detects stale local edits and rolls back both keys');

// Actual PostgreSQL in WASM; auth.uid() is a local JWT-context substitute, not real GoTrue.
const db=new PGlite();
try{
 await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema public,auth to anon,authenticated;`);
 await db.exec(await readFile('supabase/migrations/20261009152426_events_pro_cloud_backups.sql','utf8'));
 const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
 await db.query('insert into auth.users values ($1),($2)',[owner,other]);
 const as=async(role,id='')=>{await db.exec('reset role;');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec(`set role ${role};`);};
 const save=revision=>db.query('select public.save_events_pro_backup($1,$2) as backup',[revision,JSON.stringify(snapshot)]);
 await as('anon');await assert.rejects(()=>db.query('select * from public.events_pro_backups'),error=>error.code==='42501');await assert.rejects(()=>save(0),error=>error.code==='42501');
 await as('authenticated',owner);const first=(await save(0)).rows[0].backup;assert.equal(first.user_id,owner);assert.equal(first.revision,1);
 await assert.rejects(()=>save(0),error=>error.code==='40001');const next=(await save(1)).rows[0].backup;assert.equal(next.revision,2);await assert.rejects(()=>save(1),error=>error.code==='40001');
 await as('authenticated',other);assert.equal((await db.query('select * from public.events_pro_backups')).rows.length,0);
 assert.equal((await db.query('update public.events_pro_backups set revision=3 where user_id=$1 returning user_id',[owner])).rows.length,0);
 assert.equal((await db.query('delete from public.events_pro_backups where user_id=$1 returning user_id',[owner])).rows.length,0);
 await assert.rejects(()=>db.query('insert into public.events_pro_backups(user_id,revision,payload) values ($1,1,$2)',[owner,JSON.stringify(snapshot)]),error=>error.code==='42501');
 await save(0);await assert.rejects(()=>db.query('update public.events_pro_backups set user_id=$1',[owner]),error=>error.code==='42501');
 await assert.rejects(()=>db.query("update public.events_pro_backups set payload='{}'"),error=>error.code==='23514');
 await as('authenticated','');await assert.rejects(()=>save(0),error=>error.code==='42501');
 await db.exec('reset role');await db.query('delete from auth.users where id=$1',[owner]);await as('authenticated',owner);
 assert.equal((await db.query('select * from public.events_pro_backups')).rows.length,0);await assert.rejects(()=>save(0),error=>error.code==='23503');
 console.log('PASS actual PostgreSQL: anonymous denied, per-account RLS, spoofed ownership denied, CAS conflict, malformed payload denied, deletion cascade and stale-token reinsertion denied');
}finally{await db.close();}

const calls=[];const dependencies={origins:['https://preview.invalid'],authenticate:async token=>token==='valid'?'owner':null,revoke:async token=>{calls.push(['revoke',token]);},remove:async id=>{calls.push(['delete',id]);}};
const request=(body={confirm:true},token='valid',origin='https://preview.invalid')=>new Request('https://functions.invalid/delete-account',{method:'POST',headers:{Authorization:'Bearer '+token,Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
assert.equal((await handleDeleteAccount(request({},'valid'),dependencies)).status,400);
assert.equal((await handleDeleteAccount(request({confirm:true,user_id:'other'}),dependencies)).status,400);
assert.equal((await handleDeleteAccount(request({confirm:true},'invalid'),dependencies)).status,401);
assert.equal((await handleDeleteAccount(request({confirm:true},'valid','https://evil.invalid'),dependencies)).status,403);assert.deepEqual(calls,[]);
assert.equal((await handleDeleteAccount(request(),{...dependencies,revoke:async()=>{throw new Error('network');}})).status,503);assert.deepEqual(calls,[]);
assert.equal((await handleDeleteAccount(request(),dependencies)).status,200);assert.deepEqual(calls,[['revoke','valid'],['delete','owner']]);
console.log('PASS account deletion handler: origin, JWT verification, explicit confirmation, server-only identity, revocation before deletion and truthful failure');
