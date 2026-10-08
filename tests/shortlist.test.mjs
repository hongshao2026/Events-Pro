import assert from 'node:assert/strict';
import {build} from 'vite';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

await build({configFile:false,logLevel:'error',build:{outDir:'.sites-runtime/shortlist-unit',emptyOutDir:true,minify:false,lib:{entry:Object.fromEntries(['shortlist','local-store','app-settings','shortlist-image','money'].map(name=>[name,resolve(`lib/${name}.ts`)])),formats:['es'],fileName:(_format,name)=>`${name}.js`}}});
const {shortlistEntries,shortlistBudget}=await import(pathToFileURL(resolve('.sites-runtime/shortlist-unit/shortlist.js')).href);
const {emptyState,budget}=await import(pathToFileURL(resolve('.sites-runtime/shortlist-unit/local-store.js')).href);
const {defaultSettings,managedCatalog}=await import(pathToFileURL(resolve('.sites-runtime/shortlist-unit/app-settings.js')).href);
const {buildShortlistImageModel}=await import(pathToFileURL(resolve('.sites-runtime/shortlist-unit/shortlist-image.js')).href);
const {money,convertedAmount,convertedMoney}=await import(pathToFileURL(resolve('.sites-runtime/shortlist-unit/money.js')).href);
const pass=name=>console.log('PASS',name);
const first='wpt-wynn-2026/W01/R0',second='wpt-wynn-2026/W01/R3',watched='wpt-wynn-2026/W02/R1',excluded='wpt-wynn-2026/W03/R2';
const tritonFirst='triton-one-cyprus-2026/T12/T12-D1A',tritonSecond='triton-one-cyprus-2026/T12/T12-D1B';
const state=emptyState();
// Insert in reverse order: the table must follow the schedule, not save order.
for(const id of [second,first,tritonSecond,tritonFirst])state.selections[id]={status:'attend',version:1};
state.selections[watched]={status:'watch',version:1};state.selections[excluded]={status:'skip',version:1};state.pending.W05={status:'attend',version:1};
const original=structuredClone(state),selected=shortlistEntries(state);
assert.equal(selected.length,5);assert.equal(selected.some(entry=>entry.id===excluded),false);
assert.ok(selected.findIndex(entry=>entry.id===tritonFirst)<selected.findIndex(entry=>entry.id===tritonSecond));
assert.ok(selected.findIndex(entry=>entry.id===tritonSecond)<selected.findIndex(entry=>entry.id===first));
assert.ok(selected.findIndex(entry=>entry.id===first)<selected.findIndex(entry=>entry.id===second));
assert.deepEqual(state,original);pass('shortlist rows include attend/watch from both series and are ordered without mutating saved classifications');

let result=shortlistBudget(state);
assert.equal(result.entries[first],600);assert.equal(result.entries[second],600);assert.equal(result.entries[tritonFirst],8000);assert.equal(result.entries[tritonSecond],8000);assert.equal(result.entries[watched],0);assert.equal(result.pending.W05,800);
const total=values=>Object.values(values.entries).reduce((sum,value)=>sum+value,0)+Object.values(values.pending).reduce((sum,value)=>sum+value,0);
assert.equal(total(result),18000);assert.equal(total(result),budget(state).total);
pass('per-flight row amounts plus pending attendance reconcile exactly to the existing global budget');

state.budgetMode='events';result=shortlistBudget(state);
assert.equal(result.entries[first],600);assert.equal(result.entries[second],0);assert.equal(result.entries[tritonFirst],8000);assert.equal(result.entries[tritonSecond],0);assert.equal(result.entries[watched],0);assert.equal(result.pending.W05,800);
assert.equal(total(result),9400);assert.equal(total(result),budget(state).total);
state.selections[first]={status:'watch',version:2};result=shortlistBudget(state);
assert.equal(result.entries[first],0);assert.equal(result.entries[second],600);assert.equal(total(result),9400);assert.equal(total(result),budget(state).total);
pass('event mode assigns one attending row per event; changing the assigned row to watch moves the budget to the remaining attendance');

const empty=emptyState();assert.deepEqual(shortlistEntries(empty),[]);assert.equal(total(shortlistBudget(empty)),0);
const pendingOnly=emptyState();pendingOnly.pending.W05={status:'attend',version:1};assert.deepEqual(shortlistEntries(pendingOnly),[]);assert.equal(shortlistBudget(pendingOnly).pending.W05,800);assert.equal(total(shortlistBudget(pendingOnly)),budget(pendingOnly).total);
pass('empty and legacy pending-only plans never invent starting-flight rows');

// The integrated catalog includes currencies and unpublished fees absent from the
// original shortlist implementation. Keep allocations faithful to budget().
const settings=defaultSettings();settings.profile.currency='HKD';
settings.fx.rates={CNY:1,USD:7,VND:0.00025,HKD:0.875,KRW:0.005};
settings.eventOverrides={QPC01:{title:'Managed hidden QPC',buyin:5000000,guarantee:8000000000,hidden:true},'JPF-1':{buyin:null}};
const catalog=managedCatalog(settings.eventOverrides),mixed=emptyState();
const qpc=catalog.entries.find(entry=>entry.eventId==='QPC01');
const jeju=catalog.entries.filter(entry=>entry.eventId==='JPF-3').slice(0,2);
const unknown=catalog.entries.find(entry=>entry.eventId==='JPF-1');
const jejuUsd=catalog.entries.find(entry=>entry.eventId==='JPF-79');
for(const entry of [qpc,...jeju,unknown,jejuUsd,catalog.entries.find(entry=>entry.id===first)])mixed.selections[entry.id]={status:'attend',version:1};
mixed.selections[watched]={status:'watch',version:1};
for(const mode of ['flights','events']){
 mixed.budgetMode=mode;
 const allocation=shortlistBudget(mixed,catalog.entries,catalog.eventMap),actual=budget(mixed,catalog.entries,catalog.eventMap),sums={};
 for(const entry of shortlistEntries(mixed,catalog.entries)){
  const value=allocation.entries[entry.id];
  if(value!==null&&value!==0)sums[entry.currency]=(sums[entry.currency]||0)+value;
 }
 assert.deepEqual(sums,actual.totals);assert.equal(actual.unknownCount,1);assert.equal(allocation.entries[unknown.id],null);assert.equal(allocation.entries[watched],0);
 assert.deepEqual(actual.totals,{USD:8600,VND:5000000,KRW:mode==='flights'?2600000:1300000});
 const model=buildShortlistImageModel(mixed,{...catalog,settings});
 assert.deepEqual(model.totals,actual.totals);assert.equal(model.unknownCount,1);
 assert.equal(model.rows.find(row=>row.id===qpc.id).title,'Managed hidden QPC');
 assert.equal(model.rows.find(row=>row.id===qpc.id).currency,'VND');
 assert.equal(model.rows.find(row=>row.id===unknown.id).buyin,null);assert.equal(model.rows.find(row=>row.id===unknown.id).amount,null);
 assert.match(model.rows.find(row=>row.id===unknown.id).buyinLabel,/未公布/);assert.doesNotMatch(model.rows.find(row=>row.id===unknown.id).amountLabel,/₩0/);
 for(const [currency,value]of Object.entries(actual.totals)){
  const converted=convertedMoney(convertedAmount(value,currency,'HKD',settings.fx.rates),'HKD');
  assert.ok(model.budgetLines.some(line=>line.includes(money(value,currency))&&line.includes(converted)));
 }
 assert.match(model.rows.find(row=>row.id===qpc.id).buyinLabel,/₫5,000,000.*HK\$1,428.57/s);
 assert.ok(model.timeLabels.includes('ICT')&&model.timeLabels.includes('KST')&&model.timeLabels.includes('PST'));
}
pass('mixed-currency row allocations and PNG model reconcile by native currency, retain unknown fees and apply hidden managed events plus personal FX settings');

const originalSettings=structuredClone(settings);originalSettings.profile.currency='original';
const originalModel=buildShortlistImageModel(mixed,{...catalog,settings:originalSettings});
assert.ok(originalModel.budgetLines.every(line=>!line.includes('≈')));
assert.ok(originalModel.rows.every(row=>!row.buyinLabel.includes('≈')));
const missingSettings=structuredClone(settings);missingSettings.fx.rates.HKD=null;
const missingModel=buildShortlistImageModel(mixed,{...catalog,settings:missingSettings});
assert.ok(missingModel.budgetLines.some(line=>line.includes('汇率未设置')));assert.ok(missingModel.rows.some(row=>row.buyinLabel.includes('汇率未设置')));
assert.ok(missingModel.budgetLines.every(line=>!line.includes('HK$0')));
pass('PNG amount labels honor original-only preference and report missing exchange rates without false zero conversions');

// A legitimate free event must not be described as an already-counted duplicate.
const freeCatalog=managedCatalog({'JPF-1':{buyin:0}}),free=emptyState();
free.budgetMode='events';free.selections[unknown.id]={status:'attend',version:1};
const freeModel=buildShortlistImageModel(free,{...freeCatalog,settings:originalSettings});
assert.equal(freeModel.unknownCount,0);assert.equal(freeModel.rows[0].amount,0);assert.equal(freeModel.rows[0].budgetNote,'同赛事计一次');
const pendingUnknown=emptyState();pendingUnknown.pending['JPF-1']={status:'attend',version:1};
assert.equal(shortlistBudget(pendingUnknown,catalog.entries,catalog.eventMap).pending['JPF-1'],null);
const pendingModel=buildShortlistImageModel(pendingUnknown,{...catalog,settings});
assert.equal(pendingModel.rows.length,1);assert.equal(pendingModel.rows[0].status,'pending');assert.equal(pendingModel.rows[0].amount,null);assert.equal(pendingModel.unknownCount,1);
pass('actual zero-price owners and unpublished legacy pending fees stay distinct from duplicate rows');
