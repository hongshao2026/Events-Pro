import assert from 'node:assert/strict';
import {build} from 'vite';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const out='.sites-runtime/settings-unit';
await build({configFile:false,logLevel:'error',build:{outDir:out,emptyOutDir:true,minify:false,lib:{entry:Object.fromEntries(['app-settings','money','local-store','agenda'].map(n=>[n,resolve(`lib/${n}.ts`)])),formats:['es'],fileName:(_f,n)=>n+'.js'}}});
const [{defaultSettings,validateSettings,managedCatalog,makeSettingsBackup,parseSettingsBackup,readSettings,writeSettings,SETTINGS_KEY},{convertedAmount,convertedMoney},{budget,emptyState},{agendaActivities,agendaFromUrl}]=await Promise.all(['app-settings','money','local-store','agenda'].map(n=>import(pathToFileURL(resolve(out,n+'.js')).href)));
const state=defaultSettings();
assert.equal(state.profile.currency,'CNY');assert.equal(convertedAmount(900000,'VND','CNY',state.fx.rates),232.2);
assert.equal(convertedMoney(convertedAmount(600,'USD','CNY',state.fx.rates),'CNY'),'¥4,041.06');
assert.equal(convertedAmount(900000,'VND','VND',state.fx.rates),null);assert.equal(convertedAmount(600,'USD','original',state.fx.rates),null);
assert.equal(convertedAmount(900000,'VND','HKD',{...state.fx.rates,HKD:null}),null);
assert.equal(convertedAmount(600,'USD','HKD',{CNY:1,USD:7,VND:0.00025,HKD:0.875}),4800);
console.log('PASS native/cross-currency amounts, same-currency suppression, no-rate handling and decimal formatting');
for(const mutation of [s=>s.fx.asOf='2026-02-30',s=>s.fx.rates.USD=0,s=>s.fx.rates.VND=-1,s=>s.fx.rates.HKD=Infinity,s=>s.fx.rates.CNY=7,s=>s.profile.currency='BTC',s=>s.profile.username='x'.repeat(41),s=>s.eventOverrides.missing={title:'bad'},s=>s.eventOverrides.QPC01={buyin:-5},s=>s.eventOverrides.QPC01={admin:true}]){const bad=structuredClone(state);mutation(bad);assert.throws(()=>validateSettings(bad));}
const catalog=managedCatalog({QPC01:{title:'Managed BLASTOFF',buyin:5000000,guarantee:8000000000,hidden:true,adminNotes:'Local note'}}),event=catalog.eventMap.get('QPC01');
assert.equal(event.title,'Managed BLASTOFF');assert.equal(event.hidden,true);assert.ok(event.starts.every(s=>s.buyin===5000000));assert.equal(event.guarantee,8000000000);
const planned=emptyState(),entry=catalog.entries.find(e=>e.eventId==='QPC01');planned.selections[entry.id]={status:'attend',version:1};planned.selections['wpt-wynn-2026/W01/R0']={status:'attend',version:1};
assert.deepEqual(budget(planned,catalog.entries,catalog.eventMap).totals,{VND:5000000,USD:600});
const selected=agendaActivities(planned,false,'qpc-circuit-2026',catalog.entries).filter(a=>a.status==='attend');assert.equal(selected.length,2);assert.equal(selected[1].kind,'continuation');assert.equal(selected[1].buyin,0);
assert.equal(managedCatalog({}).eventMap.get('QPC01').buyin,4500000);
console.log('PASS validation rejects invalid money/config; overrides retain IDs, existing hidden selections and free continuations without mutating official data');
let disk;globalThis.localStorage={getItem:()=>disk??null,setItem:(key,value)=>{assert.equal(key,SETTINGS_KEY);disk=value;}};
assert.deepEqual(readSettings(),state);state.profile.username='测试玩家';state.eventOverrides={QPC01:{buyin:5000000}};writeSettings(state);assert.deepEqual(readSettings(),state);
assert.deepEqual(parseSettingsBackup(JSON.stringify(makeSettingsBackup(state))).settings,state);
disk='{bad';assert.throws(()=>readSettings());assert.equal(disk,'{bad');
localStorage.setItem=()=>{throw new DOMException('Full','QuotaExceededError');};assert.throws(()=>writeSettings(state),/未能保存/);assert.equal(disk,'{bad');
for(const view of ['profile','admin']){globalThis.window={location:{hash:`#view=${view}&series=qpc-circuit-2026`}};assert.equal(agendaFromUrl().view,view);}
console.log('PASS settings persist independently, round-trip validated backups, preserve corrupt/failed writes and restore new routes');
