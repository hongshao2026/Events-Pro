import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync('lib/triton-cyprus-2026.json','utf8'));
// Independently transcribed from PDF schedule pp. 3–5; amounts cross-checked on pp. 6–27.
const expected=[
 [1,3000,'05/12/1A,05/18/1B,06/12/1C,06/18/1D','07/12/Final'],
 [2,2000,'06/21/1',''],[3,5000,'07/14/1A,08/12/1B','09/14/Final'],
 [5,1500,'07/19/1',''],[6,3000,'08/12/1',''],[7,4000,'08/13/1',''],[8,1500,'08/19/1',''],
 [9,10000,'09/16/1','10/12/Final'],[10,1500,'09/21/1',''],[11,2000,'09/22/1',''],
 [12,8000,'10/12/1A,11/12/1B,12/12/1C','13/12/2,14/12/3,15/12/Final'],
 [13,6000,'10/14/1','11/12/Final'],[15,1500,'10/19/1',''],[16,2000,'10/22/1',''],
 [17,3000,'11/14/1',''],[18,3000,'11/15/1','12/11/Final'],[19,1500,'11/22/1',''],
 [20,5000,'12/13/1',''],[21,2000,'12/22/1',''],[22,15000,'13/15/1A,14/12/1B','15/12/Final'],
 [23,2100,'13/22/1',''],[25,5000,'14/22/1',''],
];
const summarize=slots=>slots.map(s=>`${s.date.slice(-2)}/${s.hour}/${s.name.endsWith('Final')?'Final':s.name.split('Day ').at(-1)}`).join(',');
assert.deepEqual(data.map(e=>[e.officialNumber,e.buyin,summarize(e.starts),summarize(e.continuations)]),expected);
const all=data.flatMap(e=>[...e.starts,...e.continuations]);
assert.equal(new Set(all.map(s=>s.id)).size,38);
assert.ok(data.every(e=>e.guarantee===null&&!e.supplement&&e.sourcePage>=6&&e.sourcePage<=27));
assert.deepEqual(data.filter(e=>e.restricted).map(e=>e.officialNumber),[6,11]);
assert.equal(data.filter(e=>e.kind==='satellite').length,6);
assert.ok(data.flatMap(e=>e.starts).every(s=>s.buyin>0&&s.registrationCloses>`${s.date}T${String(s.hour).padStart(2,'0')}:00`));
const event=n=>data.find(e=>e.officialNumber===n);
assert.deepEqual(event(1).starts.map(s=>s.levels),['40','30','40','20']);
assert.equal(event(9).continuations[0].levels,'40');
assert.equal(event(16).starts[0].registrationCloses,'2026-11-11T01:00');
assert.match(event(16).notes,/00:30/);assert.match(event(10).notes,/冲突/);
assert.match(event(21).notes,/1,352.*500.*111.*37/);
console.log('PASS all 38 Triton occurrences, buy-ins, source pages, restrictions, cross-midnight registration and source conflicts match the supplied PDF');
