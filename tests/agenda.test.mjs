import assert from 'node:assert/strict';
import {build} from 'vite';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
await build({configFile:false,logLevel:'error',build:{outDir:'.sites-runtime/agenda-unit',emptyOutDir:true,minify:false,lib:{entry:resolve('lib/agenda.ts'),formats:['es'],fileName:'planner-agenda'}}});
const {agendaActivities,agendaFromUrl}=await import(pathToFileURL(resolve('.sites-runtime/agenda-unit/planner-agenda.js')).href);
const state={selections:{},pending:{},revision:0,budgetMode:'flights'};
const id=slot=>`wpt-wynn-2026/W01/${slot}`;
const pass=name=>console.log('PASS',name);
const original=agendaActivities(state),supplement=agendaActivities(state,true);
assert.equal(original.length,125);assert.equal(original.filter(x=>x.kind==='start').length,102);assert.equal(supplement.length,136);assert.equal(new Set(supplement.map(x=>x.id)).size,136);pass('102 starts + 23 continuation activities; 11 opt-in satellites; unique identities');
state.selections[id('R0')]={status:'attend',version:1};state.selections[id('R3')]={status:'attend',version:1};
let activities=agendaActivities(state),next=activities.filter(x=>x.event.id==='W01'&&x.kind==='continuation');
assert.equal(next.length,1);assert.equal(next[0].status,'attend');assert.equal(next[0].buyin,0);assert.equal(next[0].date,'2026-11-30');assert.equal(activities.find(x=>x.id===id('R4')).status,'undecided');pass('multiple attending flights yield one conditional continuation and no extra buy-in');
state.selections[id('R0')].status='skip';state.selections[id('R3')].status='watch';
assert.equal(agendaActivities(state).find(x=>x.event.id==='W01'&&x.kind==='continuation').status,'watch');pass('watch follows to continuation after attendance is removed');
state.selections[id('R3')].status='skip';
assert.equal(agendaActivities(state).find(x=>x.event.id==='W01'&&x.kind==='continuation').status,'undecided');
for(const slot of ['R4','R6','R7','R8'])state.selections[id(slot)]={status:'skip',version:1};
assert.equal(agendaActivities(state).find(x=>x.event.id==='W01'&&x.kind==='continuation').status,'skip');pass('continuation excluded only when every starting flight is excluded');
state.pending.W01={status:'attend',version:1};
assert.equal(agendaActivities(state).find(x=>x.event.id==='W01'&&x.kind==='continuation').status,'attend');pass('legacy unassigned attendance remains represented in the agenda');
globalThis.window={location:{hash:'#view=schedule&day=2026-12-21&agendaStatuses=attend,watch&continuations=no'}};
assert.deepEqual(agendaFromUrl(),{seriesId:'wpt-wynn-2026',region:'all',view:'schedule',day:'2026-12-21',statuses:['attend','watch'],continuations:false,month:'2026-12'});
window.location.hash='#view=invalid&day=2026-12-22&agendaStatuses=invalid&month=2030-01';
assert.deepEqual(agendaFromUrl(),{seriesId:'wpt-wynn-2026',region:'all',view:'home',day:'',statuses:['attend','watch'],continuations:true,month:'2026-11'});pass('route restores valid day and month; rejects out-of-festival dates and invalid categories');
const triton='triton-one-cyprus-2026',tritonId=slot=>`${triton}/T12/T12-${slot}`;
state.selections[tritonId('D1A')]={status:'attend',version:1};
state.selections[tritonId('D1B')]={status:'attend',version:1};
const cyprus=agendaActivities(state,false,triton),main=cyprus.filter(item=>item.event.id==='T12'&&item.kind==='continuation');
assert.equal(cyprus.length,38);assert.equal(cyprus.filter(item=>item.kind==='start').length,29);
assert.equal(agendaActivities(state,true,triton).length,38);assert.equal(main.length,3);
assert.ok(main.every(item=>item.status==='attend'&&item.buyin===0&&item.id.startsWith(triton+'/')));
assert.deepEqual(main.map(item=>[item.date,item.hour,item.slot.levels]),[['2026-11-13',12,'60'],['2026-11-14',12,'60'],['2026-11-15',12,'60']]);
assert.ok(agendaActivities(state).every(item=>item.entry.seriesId==='wpt-wynn-2026'));
pass('Triton agenda has 29 starts and nine continuations; multiple main flights yield three conditional days; WPT stays isolated');
window.location.hash=`#series=${triton}&view=schedule&day=2026-11-05&month=2026-12`;
assert.equal(agendaFromUrl().day,'2026-11-05');assert.equal(agendaFromUrl().month,'2026-11');
window.location.hash=`#series=${triton}&day=2026-11-27`;assert.equal(agendaFromUrl().day,'');
window.location.hash='#series=unknown&day=2026-11-27';assert.equal(agendaFromUrl().seriesId,'unknown');
pass('Triton links use their own date boundaries and reject WPT dates; unknown series retains its identity for the recovery page');

for(const hash of ['', '#view=schedule', '#agendaStatuses=undecided,attend,watch,skip', '#agendaStatuses=skip,undecided']){
 window.location.hash=hash;assert.deepEqual(agendaFromUrl().statuses,['attend','watch']);
}
for(const [raw,expected] of [['skip,watch',['watch']],['attend',['attend']],['none',[]],['',[]]]){
 window.location.hash='#agendaStatuses='+raw;assert.deepEqual(agendaFromUrl().statuses,expected);
}
pass('calendar defaults and legacy links allow only attend/watch; individual and explicit empty filters survive');

window.location.hash='';assert.equal(agendaFromUrl().view,'home');
window.location.hash='#view=discover&series=triton-one-cyprus-2026&region=europe';assert.equal(agendaFromUrl().region,'europe');assert.equal(agendaFromUrl().seriesId,triton);
window.location.hash='#series=not-found&region=invalid';assert.equal(agendaFromUrl().view,'discover');assert.equal(agendaFromUrl().seriesId,'not-found');assert.equal(agendaFromUrl().region,'all');
window.location.hash='#q=W01&date=2026-11-27';assert.equal(agendaFromUrl().view,'discover');
window.location.hash='#view=home&q=W01';assert.equal(agendaFromUrl().view,'home');
pass('homepage and region routes coexist with legacy detailed-schedule links and unknown-series recovery');

window.location.hash='#view=shortlist&series=triton-one-cyprus-2026&region=europe&day=2026-11-05';
assert.equal(agendaFromUrl().view,'shortlist');assert.equal(agendaFromUrl().seriesId,triton);assert.equal(agendaFromUrl().region,'europe');assert.equal(agendaFromUrl().day,'2026-11-05');
window.location.hash='#view=shortlist&series=not-found';assert.equal(agendaFromUrl().view,'shortlist');assert.equal(agendaFromUrl().seriesId,'not-found');
pass('standalone shortlist links restore without discarding the saved calendar or series route');
