import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'vite';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const data=JSON.parse(readFileSync('lib/jeju-poker-festival-2026.json','utf8'));
const snapshot=JSON.parse(readFileSync('sources/jeju-poker-festival-2026.snapshot.json','utf8'));
const event=n=>data.find(e=>e.officialNumber===n),amount=s=>s?Number(s.replace('USD ','').replaceAll(',','')):null;
const slots=data.flatMap(e=>[...e.starts,...e.continuations].map(s=>({event:e,slot:s})));
assert.equal(createHash('sha256').update(readFileSync('sources/jeju-poker-festival-2026.pdf')).digest('hex'),snapshot.sha256);
assert.equal(data.length,140);assert.equal(data.flatMap(e=>e.starts).length,160);assert.equal(data.flatMap(e=>e.continuations).length,18);assert.equal(slots.length,178);
assert.deepEqual(data.filter(e=>e.officialNumber).map(e=>e.officialNumber),Array.from({length:123},(_,i)=>i+1));assert.equal(data.filter(e=>e.kind==='satellite').length,17);assert.equal(new Set(slots.map(x=>x.slot.id)).size,178);
for(const row of snapshot.rows){
 const {event:e,slot:s}=slots.find(x=>x.slot.sourceRow===row.row);assert.equal(s.name,row.name.replaceAll('**',''));assert.equal(s.buyin,amount(row.buyin));assert.equal(s.chips,amount(row.stack));assert.equal(s.levels,row.duration.replace(' MINUTES',''));
 const midnight=row.time==='24:00',date=new Date(row.date+'T00:00:00Z');if(midnight)date.setUTCDate(date.getUTCDate()+1);
 assert.equal(s.date,date.toISOString().slice(0,10));assert.equal(s.hour,midnight?0:Number(row.time.slice(0,2))+Number(row.time.slice(3))/60);
 if(row.buyin)assert.equal(e.currency,row.buyin.startsWith('USD')?'USD':'KRW');
 if(row.registration)assert.equal(s.registrationLevel,Number(row.registration.match(/LEVEL (\d+)/)[1]));assert.equal(s.registrationCloses,undefined);
 assert.equal(e.continuations.includes(s),/\bDAY [2-9]\b|\bFINAL (TABLE|DAY)\b/.test(row.name));
}
// Independent anchor checks transcribed from the supplied PDF, including multi-day fields.
assert.deepEqual([3,25,41,60,68,76,101,104].map(n=>[n,event(n).starts.length,event(n).continuations.length]),[[3,5,2],[25,4,1],[41,4,2],[60,4,1],[68,2,1],[76,4,3],[101,2,1],[104,3,1]]);
assert.deepEqual([3,41,76].map(n=>event(n).guarantee),[880000000,1200000000,1800000000]);
assert.deepEqual(data.filter(e=>e.currency==='USD').map(e=>[e.officialNumber,e.buyin]),[[79,8000],[112,12000]]);
assert.equal(event(1).buyin,null);assert.equal(event(16).date,'2026-10-30');assert.equal(event(32).date,'2026-11-01');assert.equal(event(117).date,'2026-11-11');assert.equal(event(117).hour,0);
assert.equal(snapshot.rows.filter(r=>r.time==='24:00').length,13);assert.equal(event(104).buyin,4500000);assert.match(event(104).starts[0].notes,/2,000,000 KRW.*包含/);assert.match(event(106).starts[0].notes,/赏金列空白/);
assert.equal(event(40).levels,'15/10/5/2');assert.match(event(79).starts[0].registrationNote,/Day 2 第 14 级/);
console.log('PASS all 178 Jeju PDF rows reconcile: 140 events, 160 starts, 18 continuations, two USD events, 13 normalized midnights and exact bounty-inclusive totals');
const out='.sites-runtime/jeju-unit';
await build({configFile:false,logLevel:'error',build:{outDir:out,emptyOutDir:true,minify:false,lib:{entry:Object.fromEntries(['catalog','agenda','money','app-settings','local-store','schedule'].map(n=>[n,resolve(`lib/${n}.ts`)])),formats:['es'],fileName:(_f,n)=>n+'.js'}}});
const [{entries},{agendaActivities},{matchesMoneyFilter,moneyFilters,convertedAmount},{defaultSettings,validateSettings,managedCatalog},{emptyState,budget,makeBackup,parseBackup},{isNlh}]=await Promise.all(['catalog','agenda','money','app-settings','local-store','schedule'].map(n=>import(pathToFileURL(resolve(out,n+'.js')).href)));
const state=emptyState(),attend=id=>{state.selections[id]={status:'attend',version:1};};
const choose=n=>entries.find(e=>e.eventId==='JPF-'+n);
for(const n of [1,3,79])attend(choose(n).id);attend(entries.filter(e=>e.eventId==='JPF-3')[1].id);attend('wpt-wynn-2026/W01/R0');
assert.deepEqual(budget(state).totals,{KRW:2600000,USD:8600});assert.equal(budget(state).unknownCount,1);
assert.equal(agendaActivities(state,false,'jeju-poker-festival-2026').filter(a=>a.kind==='continuation'&&a.status==='attend').length,3);
state.budgetMode='events';assert.deepEqual(budget(state).totals,{KRW:1300000,USD:8600});assert.equal(budget(state).unknownCount,1);assert.deepEqual(parseBackup(JSON.stringify(makeBackup(state))).state,state);
assert.equal(matchesMoneyFilter(8000,'USD','KRW:1000000','lte','KRW'),false);assert.equal(matchesMoneyFilter(8000,'USD','USD:8000','lte','KRW'),true);assert.equal(matchesMoneyFilter(null,'KRW','KRW:1000000','lte','KRW'),false);
assert.ok(moneyFilters('KRW',['KRW','USD']).buyin.some(([v])=>v==='USD:8000'));assert.equal(isNlh(event(119)),false);
assert.equal(convertedAmount(1300000,'KRW','CNY',defaultSettings().fx.rates),6445.4);
const old=defaultSettings();delete old.fx.rates.KRW;old.fx.asOf='2026-10-06';const migrated=validateSettings(old);assert.equal(migrated.fx.rates.KRW,0.004958);assert.equal(migrated.fx.asOf,'2026-10-08');assert.equal(old.fx.rates.KRW,undefined);
old.fx.rates.USD=7;old.fx.source='My rates';const custom=validateSettings(old);assert.equal(custom.fx.rates.USD,7);assert.equal(custom.fx.rates.KRW,null);assert.equal(custom.fx.asOf,'2026-10-06');
const managed=managedCatalog({'JPF-1':{buyin:0}});assert.equal(budget(state,managed.entries,managed.eventMap).unknownCount,0);assert.equal(managedCatalog({'JPF-3':{buyin:null}}).entries.find(e=>e.eventId==='JPF-3').buyin,null);
console.log('PASS KRW/USD budgets, unknown-price accounting, currency-scoped filters, conditional continuations, legacy settings migration and deliberate zero/unknown admin overrides');

const combined=emptyState();
for(const eventId of ['KPC08','JPF-3'])for(const entry of entries.filter(item=>item.eventId===eventId).slice(0,2))combined.selections[entry.id]={status:'attend',version:1};
for(const eventId of ['KPC03','JPF-79','JPF-1','W01']){const entry=entries.find(item=>item.eventId===eventId);combined.selections[entry.id]={status:'attend',version:1};}
assert.deepEqual(budget(combined).totals,{KRW:5200000,USD:13600});assert.equal(budget(combined).unknownCount,1);
for(const [seriesId,eventId]of [['kpc-jeju-2026','KPC08'],['jeju-poker-festival-2026','JPF-3']]){
 const continuations=agendaActivities(combined,false,seriesId).filter(activity=>activity.event.id===eventId&&activity.kind==='continuation'&&activity.status==='attend');
 assert.equal(continuations.length,2);assert.ok(continuations.every(activity=>activity.buyin===0&&activity.entry.seriesId===seriesId));
}
combined.budgetMode='events';assert.deepEqual(budget(combined).totals,{KRW:2600000,USD:13600});assert.equal(budget(combined).unknownCount,1);assert.deepEqual(parseBackup(JSON.stringify(makeBackup(combined))).state,combined);
console.log('PASS KPC and JPF combine same-currency budgets, retain independent continuation groups and round-trip both festivals in a v2 backup');
