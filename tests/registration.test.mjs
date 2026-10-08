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
const overnight=registrationDeadline(event(qpc,'QPC47').starts[2],'ICT');
assert.equal(overnight.compact,'10/21 00:40 · ICT');assert.match(overnight.full,/10\/21 00:40.*第 11 级/);
assert.equal(registrationDeadline(event(triton,'T21').starts[0],'EET').compact,'11/13 00:30 · EET');
console.log('PASS published registration deadlines retain local timezone, next-day dates and exact source levels');

const ambiguous=registrationDeadline(event(qpc,'QPC31').starts[0],'ICT');
assert.equal(ambiguous.compact,'见详情');assert.match(ambiguous.full,/Level 14 · 12:00，未标日期/);assert.match(ambiguous.full,/Final 页.*13:05/);assert.doesNotMatch(ambiguous.full,/10\/17 12:00/);
const inherited=registrationDeadline(event(kpc,'KPC02').continuations[0],'KST');
assert.equal(inherited.compact,'见详情');assert.match(inherited.full,/10\/10 16:40/);assert.match(inherited.full,/不代表本续赛可重新报名/);
const lateEntry=registrationDeadline(event(kpc,'KPC18').continuations[0],'KST');
assert.equal(lateEntry.compact,'见详情');assert.match(lateEntry.full,/官网列明续赛日仍开放延迟报名/);assert.match(lateEntry.full,/实际报名请向主办方确认/);
console.log('PASS ambiguous dates and continuation-registration qualifications cannot become an unqualified time');

const levelOnly=registrationDeadline(event(jeju,'JPF-3').starts[0],'KST');
assert.equal(levelOnly.full,'第 9 级（原表未列时刻）');assert.equal(levelOnly.compact,levelOnly.full);assert.doesNotMatch(levelOnly.full,/\d{2}:\d{2}/);
assert.equal(registrationDeadline(event(wpt,'W01').starts[0],'PST'),null);
assert.equal(registrationDeadline(opening.continuations[0],'KST'),null);
console.log('PASS source-only levels remain source-only, missing deadlines stay unknown and final days do not inherit a flight cutoff');
