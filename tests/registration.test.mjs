import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {build} from 'vite';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const out='.sites-runtime/registration-unit';
await build({configFile:false,logLevel:'error',build:{outDir:out,emptyOutDir:true,minify:false,lib:{entry:resolve('lib/registration.ts'),formats:['es'],fileName:'registration'}}});
const {registrationDeadline}=await import(pathToFileURL(resolve(out,'registration.js')).href);
const [kpc,qpc,triton,jeju,wpt]=await Promise.all(['kpc-jeju-2026','qpc-circuit-2026','triton-cyprus-2026','jeju-poker-festival-2026','schedule'].map(async name=>JSON.parse(await fs.readFile(`lib/${name}.json`,'utf8'))));
const event=(data,id)=>{const found=data.find(value=>value.id===id);assert.ok(found,id);return found;};
const opening=event(kpc,'KPC01');
const sameDay=registrationDeadline(opening.starts[0],'KST');
assert.equal(sameDay.compact,'15:25 · KST');assert.equal(sameDay.full,'10/10 15:25 · KST · 第 8 级');
assert.deepEqual(sameDay.exact,{date:'2026-10-10',time:'15:25',dateTime:'2026-10-10T15:25'});
const overnight=registrationDeadline(event(qpc,'QPC47').starts[2],'ICT');
assert.equal(overnight.compact,'10/21 00:40 · ICT');assert.match(overnight.full,/10\/21 00:40.*第 11 级/);
assert.deepEqual(overnight.exact,{date:'2026-10-21',time:'00:40',dateTime:'2026-10-21T00:40'});
const tritonOvernight=registrationDeadline(event(triton,'T21').starts[0],'EET');
assert.equal(tritonOvernight.compact,'11/13 00:30 · EET');
assert.deepEqual(tritonOvernight.exact,{date:'2026-11-13',time:'00:30',dateTime:'2026-11-13T00:30'});
console.log('PASS published registration deadlines retain local timezone, next-day dates and exact source levels');

const ambiguous=registrationDeadline(event(qpc,'QPC31').starts[0],'ICT');
assert.equal(ambiguous.compact,'见详情');assert.match(ambiguous.full,/Level 14 · 12:00，未标日期/);assert.match(ambiguous.full,/Final 页.*13:05/);assert.doesNotMatch(ambiguous.full,/10\/17 12:00/);
assert.equal(ambiguous.exact,undefined);
const inherited=registrationDeadline(event(kpc,'KPC02').continuations[0],'KST');
assert.equal(inherited.compact,'见详情');assert.match(inherited.full,/10\/10 16:40/);assert.match(inherited.full,/不代表本续赛可重新报名/);
assert.equal(inherited.exact,undefined);
const lateEntry=registrationDeadline(event(kpc,'KPC18').continuations[0],'KST');
assert.equal(lateEntry.compact,'见详情');assert.match(lateEntry.full,/官网列明续赛日仍开放延迟报名/);assert.match(lateEntry.full,/实际报名请向主办方确认/);
assert.equal(lateEntry.exact,undefined);
const conditional=registrationDeadline({...opening.starts[0],registrationNote:'达到人数上限后可能提前停止报名'},'KST');
assert.equal(conditional.exact,undefined);assert.equal(conditional.compact,'见详情');assert.match(conditional.full,/15:25.*达到人数上限后可能提前停止报名/);
console.log('PASS ambiguous dates and continuation-registration qualifications cannot become an unqualified time');

const levelOnly=registrationDeadline(event(jeju,'JPF-3').starts[0],'KST');
assert.equal(levelOnly.full,'第 9 级（原表未列时刻）');assert.equal(levelOnly.compact,levelOnly.full);assert.doesNotMatch(levelOnly.full,/\d{2}:\d{2}/);
assert.equal(levelOnly.exact,undefined);
assert.equal(registrationDeadline(event(wpt,'W01').starts[0],'PST'),null);
assert.equal(registrationDeadline(opening.continuations[0],'KST'),null);
console.log('PASS source-only levels remain source-only, missing deadlines stay unknown and final days do not inherit a flight cutoff');

for(const registrationCloses of ['2026-02-29T15:25','2026-13-01T15:25','2026-10-10T24:00','2026-10-10T15:60','2026-10-10 15:25','15:25']){
 const result=registrationDeadline({...opening.starts[0],registrationCloses},'KST');
 assert.equal(result.exact,undefined,registrationCloses);assert.equal(result.compact,'见详情');assert.ok(result.full.includes(registrationCloses),'Unusable source text stays available in details');
}
const leapDay=registrationDeadline({...opening.starts[0],date:'2028-02-29',registrationCloses:'2028-02-29T00:00'},'KST');
assert.deepEqual(leapDay.exact,{date:'2028-02-29',time:'00:00',dateTime:'2028-02-29T00:00'});
console.log('PASS structured cutoffs require a real local calendar date and valid minutes, without inferring or normalizing a deadline');

const t10=event(triton,'T10'),t16=event(triton,'T16');
for(const [fixture,first,alternative]of [[t10,'11/10 01:10','12:10 PM'],[t16,'11/11 01:00','00:30']]){
 const result=registrationDeadline(fixture.starts[0],'EET',fixture.notes);
 assert.equal(result.exact,undefined);assert.equal(result.compact,'见详情');
 assert.ok(result.full.includes(first));assert.ok(result.full.includes(alternative));
 assert.match(result.full,/原件存在冲突，请向主办方确认/);
 assert.doesNotMatch(result.full,/每 6 个报名名额/,'Ticket-award mechanics do not become a registration deadline');
}
const t10WithRules=registrationDeadline(t10.starts[0],'EET',t10.notes);
assert.match(t10WithRules.full,/报名期内最多 2 次重进；第 8 级结束停止报名/);
assert.deepEqual(registrationDeadline(opening.starts[0],'KST',opening.notes),sameDay,'Generic currency and location notes do not qualify an otherwise exact cutoff');
const t21=event(triton,'T21');
const t21Rules=registrationDeadline(t21.starts[0],'EET',t21.notes);
assert.doesNotMatch(t21Rules.full,/费用明细|\$1,352|行政费|服务费/);assert.match(t21Rules.full,/第 9 级结束停止报名/);
assert.deepEqual(t21Rules.exact,tritonOvernight.exact);assert.equal(t21Rules.compact,tritonOvernight.compact);
const t05=event(triton,'T05'),t05Rules=registrationDeadline(t05.starts[0],'EET',t05.notes);
assert.match(t05Rules.full,/最多 2 次重进；第 8 级结束停止报名/);
assert.deepEqual(t05Rules.exact,registrationDeadline(t05.starts[0],'EET').exact,'Normal re-entry and level rules do not invalidate a published clock');
assert.equal(t05Rules.compact,registrationDeadline(t05.starts[0],'EET').compact);
assert.equal(registrationDeadline(event(triton,'T12').continuations.at(-1),'EET'),null,'Continuation callers keep the two-argument contract and never inherit event-level starting rules');
const repeated=registrationDeadline({...opening.starts[0],notes:'报名截止待主办方确认。'},'KST','报名截止待主办方确认。报名截止待主办方确认。');
assert.equal(repeated.full.match(/报名截止待主办方确认/g).length,1);
const repeatedParent=registrationDeadline(opening.starts[0],'KST','报名期内最多 2 次重进。报名期内最多 2 次重进。');
assert.equal(repeatedParent.full.match(/报名期内最多 2 次重进/g).length,1);
console.log('PASS event-level cutoff conflicts and entry limits survive without unrelated notes, duplication or continuation inheritance');
