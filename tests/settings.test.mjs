import assert from 'node:assert/strict';
import {build} from 'vite';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const out='.sites-runtime/settings-unit';
await build({configFile:false,logLevel:'error',build:{outDir:out,emptyOutDir:true,minify:false,lib:{entry:Object.fromEntries(['app-settings','money','local-store','agenda'].map(n=>[n,resolve(`lib/${n}.ts`)])),formats:['es'],fileName:(_f,n)=>n+'.js'}}});
const [{defaultSettings,validateSettings,managedCatalog,makeSettingsBackup,parseSettingsBackup,readSettings,writeSettings,SETTINGS_KEY},{convertedAmount,convertedMoney},{budget,emptyState},{agendaActivities,agendaFromUrl}]=await Promise.all(['app-settings','money','local-store','agenda'].map(n=>import(pathToFileURL(resolve(out,n+'.js')).href)));
const state=defaultSettings();
assert.equal(state.profile.pinnedSeriesId,null);
assert.equal(state.profile.currency,'CNY');assert.equal(convertedAmount(900000,'VND','CNY',state.fx.rates),232.2);
assert.equal(state.fx.rates.KRW,0.004958);assert.equal(state.fx.asOf,'2026-10-08');assert.equal(convertedAmount(1000000,'KRW','CNY',state.fx.rates),4958);
assert.equal(convertedMoney(convertedAmount(600,'USD','CNY',state.fx.rates),'CNY'),'¥4,041.06');
assert.equal(convertedAmount(900000,'VND','VND',state.fx.rates),null);assert.equal(convertedAmount(600,'USD','original',state.fx.rates),null);
assert.equal(convertedAmount(900000,'VND','HKD',{...state.fx.rates,HKD:null}),null);
assert.equal(convertedAmount(600,'USD','HKD',{CNY:1,USD:7,VND:0.00025,HKD:0.875}),4800);
console.log('PASS native/cross-currency amounts, same-currency suppression, no-rate handling and decimal formatting');
for(const mutation of [s=>s.fx.asOf='2026-02-30',s=>s.fx.rates.USD=0,s=>s.fx.rates.VND=-1,s=>s.fx.rates.HKD=Infinity,s=>s.fx.rates.CNY=7,s=>s.profile.currency='BTC',s=>s.profile.username='x'.repeat(41),s=>s.eventOverrides.missing={title:'bad'},s=>s.eventOverrides.QPC01={buyin:-5},s=>s.eventOverrides.QPC01={admin:true}]){const bad=structuredClone(state);mutation(bad);assert.throws(()=>validateSettings(bad));}
for(const rate of [undefined,0,-1,NaN,Infinity,'0.005',{},1e-9,1e9]){const bad=structuredClone(state);bad.fx.rates.KRW=rate;assert.throws(()=>validateSettings(bad),'Explicit invalid KRW rates must not be migrated as absent');}
const legacySettings={...structuredClone(state),revision:12,profile:{username:'原有用户',currency:'HKD'},eventOverrides:{QPC01:{buyin:5000000}}};delete legacySettings.fx.rates.KRW;legacySettings.fx.asOf='2026-10-06';
const legacyBefore=structuredClone(legacySettings),migratedSettings=validateSettings(legacySettings);
assert.deepEqual(migratedSettings,{...legacySettings,profile:{...legacySettings.profile,pinnedSeriesId:null},fx:{...legacySettings.fx,asOf:'2026-10-08',rates:{...legacySettings.fx.rates,KRW:0.004958}}});assert.deepEqual(legacySettings,legacyBefore);
assert.deepEqual(parseSettingsBackup(JSON.stringify({app:'events-pro-settings',schemaVersion:1,savedAt:'2026-10-06T00:00:00Z',settings:legacySettings})).settings,migratedSettings);
for(const change of [s=>s.fx.rates.USD=7,s=>s.fx.rates.VND=0.0003,s=>s.fx.rates.HKD=0.9,s=>s.fx.source='个人汇率',s=>s.fx.asOf='2026-10-07']){
 const custom=structuredClone(legacySettings);change(custom);const before=structuredClone(custom);
 const migrated=validateSettings(custom);assert.deepEqual(migrated,{...custom,profile:{...custom.profile,pinnedSeriesId:null},fx:{...custom.fx,rates:{...custom.fx.rates,KRW:null}}});assert.deepEqual(custom,before);
 assert.deepEqual(parseSettingsBackup(JSON.stringify({app:'events-pro-settings',schemaVersion:1,savedAt:'2026-10-08T00:00:00Z',settings:custom})).settings,migrated);
}
for(const rate of [null,0.005]){
 const explicit=structuredClone(legacySettings);explicit.fx.rates.KRW=rate;
 const normalized={...explicit,profile:{...explicit.profile,pinnedSeriesId:null}};
 assert.deepEqual(validateSettings(explicit),normalized);assert.deepEqual(parseSettingsBackup(JSON.stringify(makeSettingsBackup(explicit))).settings,normalized);
 if(rate===null)assert.equal(convertedAmount(1000000,'KRW','CNY',explicit.fx.rates),null);
}
for(const currency of ['CNY','USD','VND','HKD']){const bad=structuredClone(legacySettings);delete bad.fx.rates[currency];assert.throws(()=>validateSettings(bad),'Only newly introduced KRW may be absent');}
const krwSettings=structuredClone(state);krwSettings.profile.currency='KRW';krwSettings.fx.rates.KRW=0.005;
assert.deepEqual(parseSettingsBackup(JSON.stringify(makeSettingsBackup(krwSettings))).settings,krwSettings);
console.log('PASS sourced KRW default, exact legacy-default migration, custom/null rate preservation, immutable v1 backups and invalid-rate rejection');
for(const pinnedSeriesId of ['wpt-wynn-2026','triton-one-cyprus-2026','qpc-circuit-2026','kpc-jeju-2026','jeju-poker-festival-2026']){
 const pinned=structuredClone(state);pinned.profile={...pinned.profile,username:'保留用户',currency:'HKD',pinnedSeriesId};pinned.revision=17;pinned.eventOverrides={QPC01:{buyin:5000000}};
 assert.deepEqual(validateSettings(pinned),pinned);
 assert.deepEqual(parseSettingsBackup(JSON.stringify(makeSettingsBackup(pinned))).settings,pinned,'Pinning belongs to the existing settings backup');
}
for(const malformed of [undefined,1,true,{},[],['kpc-jeju-2026'],'',' ','KPC-JEJU-2026','kpc/jeju','-kpc','kpc--jeju','x'.repeat(121)]){
 const bad=structuredClone(state);bad.profile.pinnedSeriesId=malformed;assert.throws(()=>validateSettings(bad));
}
const unrecognized=structuredClone(state);unrecognized.profile={...unrecognized.profile,username:'原有玩家',currency:'USD',pinnedSeriesId:'removed-festival-2027'};unrecognized.revision=18;
const unrecognizedBefore=structuredClone(unrecognized),withoutPin={...unrecognized,profile:{...unrecognized.profile,pinnedSeriesId:null}};
assert.deepEqual(validateSettings(unrecognized),withoutPin);assert.deepEqual(unrecognized,unrecognizedBefore);
assert.deepEqual(parseSettingsBackup(JSON.stringify(makeSettingsBackup(unrecognized))).settings,withoutPin);
console.log('PASS one known festival pin round-trips in v1 settings, missing legacy pins default null and obsolete IDs safely unpin without losing preferences');
const catalog=managedCatalog({QPC01:{title:'Managed BLASTOFF',buyin:5000000,guarantee:8000000000,hidden:true,adminNotes:'Local note'}}),event=catalog.eventMap.get('QPC01');
assert.equal(event.title,'Managed BLASTOFF');assert.equal(event.hidden,true);assert.ok(event.starts.every(s=>s.buyin===5000000));assert.equal(event.guarantee,8000000000);
const planned=emptyState(),entry=catalog.entries.find(e=>e.eventId==='QPC01');planned.selections[entry.id]={status:'attend',version:1};planned.selections['wpt-wynn-2026/W01/R0']={status:'attend',version:1};
assert.deepEqual(budget(planned,catalog.entries,catalog.eventMap).totals,{VND:5000000,USD:600});
const selected=agendaActivities(planned,false,'qpc-circuit-2026',catalog.entries).filter(a=>a.status==='attend');assert.equal(selected.length,2);assert.equal(selected[1].kind,'continuation');assert.equal(selected[1].buyin,0);
assert.equal(managedCatalog({}).eventMap.get('QPC01').buyin,4500000);
const unknownPrice=managedCatalog({QPC01:{buyin:null}});assert.equal(unknownPrice.eventMap.get('QPC01').buyin,null);assert.ok(unknownPrice.entries.filter(e=>e.eventId==='QPC01').every(e=>e.buyin===null));
const unknownSettings=structuredClone(state);unknownSettings.eventOverrides={QPC01:{buyin:null}};assert.deepEqual(parseSettingsBackup(JSON.stringify(makeSettingsBackup(unknownSettings))).settings,unknownSettings);
assert.ok(managedCatalog({QPC01:{buyin:0}}).entries.filter(e=>e.eventId==='QPC01').every(e=>e.buyin===0));
console.log('PASS validation rejects invalid money/config; overrides retain IDs, existing hidden selections and free continuations without mutating official data');
let disk;globalThis.localStorage={getItem:()=>disk??null,setItem:(key,value)=>{assert.equal(key,SETTINGS_KEY);disk=value;}};
assert.deepEqual(readSettings(),state);state.profile.username='测试玩家';state.eventOverrides={QPC01:{buyin:5000000}};writeSettings(state);assert.deepEqual(readSettings(),state);
assert.deepEqual(parseSettingsBackup(JSON.stringify(makeSettingsBackup(state))).settings,state);
const pinnedDisk=structuredClone(state);pinnedDisk.profile.pinnedSeriesId='kpc-jeju-2026';writeSettings(pinnedDisk);assert.deepEqual(readSettings(),pinnedDisk);
const switchedPin=structuredClone(pinnedDisk);switchedPin.profile.pinnedSeriesId='qpc-circuit-2026';writeSettings(switchedPin);assert.deepEqual(readSettings(),switchedPin);
const unpinned=structuredClone(switchedPin);unpinned.profile.pinnedSeriesId=null;writeSettings(unpinned);assert.deepEqual(readSettings(),unpinned);
disk=JSON.stringify(unrecognized);const unknownDisk=disk;assert.deepEqual(readSettings(),withoutPin);assert.equal(disk,unknownDisk,'A retired pin is normalized only in memory during read');
const malformedPin=structuredClone(state);malformedPin.profile.pinnedSeriesId=42;assert.throws(()=>writeSettings(malformedPin));assert.equal(disk,unknownDisk);
disk=JSON.stringify(legacySettings);const legacyDisk=disk;assert.deepEqual(readSettings(),migratedSettings);assert.equal(disk,legacyDisk);
const invalidKrw=structuredClone(state);invalidKrw.fx.rates.KRW='bad';assert.throws(()=>writeSettings(invalidKrw));assert.equal(disk,legacyDisk);
disk='{bad';assert.throws(()=>readSettings());assert.equal(disk,'{bad');
localStorage.setItem=()=>{throw new DOMException('Full','QuotaExceededError');};assert.throws(()=>writeSettings(state),/未能保存/);assert.equal(disk,'{bad');
for(const view of ['profile','admin']){globalThis.window={location:{hash:`#view=${view}&series=qpc-circuit-2026`}};assert.equal(agendaFromUrl().view,view);}
console.log('PASS settings persist independently, round-trip validated backups, preserve corrupt/failed writes and restore new routes');
