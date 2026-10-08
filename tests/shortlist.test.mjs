import assert from 'node:assert/strict';
import {build} from 'vite';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

await build({configFile:false,logLevel:'error',build:{outDir:'.sites-runtime/shortlist-unit',emptyOutDir:true,minify:false,lib:{entry:{shortlist:resolve('lib/shortlist.ts'),store:resolve('lib/local-store.ts')},formats:['es'],fileName:(_format,name)=>`${name}.js`}}});
const {shortlistEntries,shortlistBudget}=await import(pathToFileURL(resolve('.sites-runtime/shortlist-unit/shortlist.js')).href);
const {emptyState,budget}=await import(pathToFileURL(resolve('.sites-runtime/shortlist-unit/store.js')).href);
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
