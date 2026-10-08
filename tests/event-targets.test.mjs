import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {build} from 'vite';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const out='.sites-runtime/event-targets-unit';
await build({configFile:false,logLevel:'error',build:{outDir:out,emptyOutDir:true,minify:false,lib:{entry:resolve('lib/event-targets.ts'),formats:['es'],fileName:'event-targets'}}});
const {eventTargets}=await import(pathToFileURL(resolve(out,'event-targets.js')).href);
const all=(await Promise.all(['schedule','triton-cyprus-2026','qpc-circuit-2026','kpc-jeju-2026','jeju-poker-festival-2026'].map(async file=>JSON.parse(await fs.readFile(`lib/${file}.json`,'utf8'))))).flat();
const event=id=>{const found=all.find(item=>item.id===id);assert.ok(found,id);return found;};

assert.equal(eventTargets(event('KPC20')),null);
assert.equal(eventTargets(event('W12')),null);
const opening=event('KPC01'),final=opening.continuations[0],openingTargets=eventTargets(opening);
assert.equal(openingTargets.kind,'continuation');
assert.deepEqual(openingTargets.targets,[{label:'KPC BANKROLL BUILDER · Final Day',slot:final}]);
assert.equal(eventTargets(opening,final),null,'A final has no target pointing back to itself');
const main=event('T12');
assert.deepEqual(eventTargets(main).targets.map(target=>target.slot.id),['T12-D2','T12-D3','T12-FINAL']);
assert.deepEqual(eventTargets(main,main.continuations[1]).targets.map(target=>target.slot.id),['T12-FINAL']);
assert.equal(eventTargets(main,main.continuations[2]),null);
const wpt=event('W27');
assert.deepEqual(eventTargets(wpt,wpt.continuations[2]).targets.map(target=>target.slot.name),['WPT World Championship Day 5','WPT World Championship Final Table'],'Stage progression does not rely on optional slot IDs');
console.log('PASS ordinary events omit targets and advancing stages expose only strictly later published continuations');

for(const [id,label]of [
 ['T05','Triton One Main Event'],['T23','Triton One High Roller'],
 [all.find(item=>item.kind==='satellite'&&item.seriesId==='qpc-circuit-2026').id,'QPC C - BLASTOFF'],
 ['KPCMS01','ME DAY1B'],['KPCMS03','KPC ME DAY 1E'],['KPCS02',"KING'S 15K ME - STEP 1"],
 ['JPF-MS6','BABY DRAGON CLASSIC'],['JPF-MS12','RED DRAGON+ CHAMPIONSHIP'],
 ['S39','Prime and World Championship'],['S84','$10,400 World Championship 1C/Day 2'],
]){
 assert.deepEqual(eventTargets(event(id)),{kind:'satellite',targets:[{label}]},id);
}
for(const id of ['S21','S25','S33'])assert.deepEqual(eventTargets(event(id)),{kind:'satellite',targets:[]},'Ticket value alone does not identify a target event');
console.log('PASS source satellite names retain flights, steps and multi-event packages without guessed dates or links');

const satellite=event('KPCMS01');
assert.deepEqual(eventTargets({...satellite,title:'本机自定义名称'}),eventTargets(satellite),'Renaming a satellite cannot erase its published target');
assert.deepEqual(eventTargets({...event('S21'),title:'Satellite To An Invented Main Event'}),{kind:'satellite',targets:[]},'Renaming a ticket award cannot create a target');
assert.equal(eventTargets({...opening,title:'我的赛事名'}).targets[0].label,'我的赛事名 · Final Day');
const unchanged=JSON.stringify(main);
eventTargets(main,main.continuations[0]);
assert.equal(JSON.stringify(main),unchanged,'Reading targets does not mutate the schedule');
const sameDay={...opening,id:'target-test',seriesId:'test',starts:[],continuations:[{...final,date:'2026-10-10',hour:16,name:'Test Final',stageLabel:'Final'},{...final,date:'2026-10-10',hour:12,name:'Test Day 2',stageLabel:'Day 2'}]};
assert.deepEqual(eventTargets(sameDay,{...final,date:'2026-10-10',hour:12}).targets.map(target=>target.slot.hour),[16]);
console.log('PASS source target relationships survive local renames, same-day stages remain ordered and schedule data stays unchanged');
