import assert from 'node:assert/strict';
import {build} from 'vite';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const out='.sites-runtime/series-lifecycle-unit';
await build({configFile:false,logLevel:'error',build:{outDir:out,emptyOutDir:true,minify:false,lib:{entry:resolve('lib/series-lifecycle.ts'),formats:['es'],fileName:'series-lifecycle'}}});
const {getSeriesPhase}=await import(pathToFileURL(resolve(out,'series-lifecycle.js')).href);
const kpc={start:'2026-10-10',end:'2026-10-21',timeZone:'Asia/Seoul'};
const qpc={start:'2026-10-12',end:'2026-10-21',timeZone:'Asia/Ho_Chi_Minh'};
const wpt={start:'2026-11-27',end:'2026-12-21',timeZone:'America/Los_Angeles'};
const triton={start:'2026-11-05',end:'2026-11-15',timeZone:'Asia/Famagusta'};
const phase=(series,instant)=>getSeriesPhase(series,new Date(instant));

assert.equal(phase(kpc,'2026-10-09T14:59:59.999Z'),'upcoming');
assert.equal(phase(kpc,'2026-10-09T15:00:00.000Z'),'ongoing');
assert.equal(phase(kpc,'2026-10-21T14:59:59.999Z'),'ongoing');
assert.equal(phase(kpc,'2026-10-21T15:00:00.000Z'),'ended');
assert.equal(phase(wpt,'2026-11-27T07:59:59.999Z'),'upcoming');
assert.equal(phase(wpt,'2026-11-27T08:00:00.000Z'),'ongoing');
assert.equal(phase(wpt,'2026-12-22T07:59:59.999Z'),'ongoing');
assert.equal(phase(wpt,'2026-12-22T08:00:00.000Z'),'ended');
console.log('PASS start and end dates are inclusive through local midnight in Korea and Las Vegas');

assert.equal(phase(kpc,'2026-10-21T16:00:00Z'),'ended');
assert.equal(phase(qpc,'2026-10-21T16:00:00Z'),'ongoing');
assert.equal(phase(qpc,'2026-10-21T17:00:00Z'),'ended');
assert.equal(phase(triton,'2026-11-04T21:59:59.999Z'),'upcoming');
assert.equal(phase(triton,'2026-11-04T22:00:00.000Z'),'ongoing');
const summerVegas={start:'2026-07-01',end:'2026-07-01',timeZone:'America/Los_Angeles'};
assert.equal(phase(summerVegas,'2026-07-01T06:59:59.999Z'),'upcoming');
assert.equal(phase(summerVegas,'2026-07-01T07:00:00.000Z'),'ongoing');
assert.equal(phase(summerVegas,'2026-07-02T06:59:59.999Z'),'ongoing');
assert.equal(phase(summerVegas,'2026-07-02T07:00:00.000Z'),'ended');
console.log('PASS simultaneous festivals can have different local phases and daylight-saving offsets come from their IANA zones');

const originalZone=process.env.TZ;
try{
 for(const zone of ['UTC','Asia/Shanghai','America/Los_Angeles']){
  process.env.TZ=zone;
  assert.equal(phase(kpc,'2026-10-09T15:00:00Z'),'ongoing');
  assert.equal(phase(wpt,'2026-11-27T07:59:59Z'),'upcoming');
 }
}finally{if(originalZone===undefined)delete process.env.TZ;else process.env.TZ=originalZone;}
assert.throws(()=>getSeriesPhase(kpc,new Date('invalid')),RangeError);
console.log('PASS lifecycle results are independent of the host clock zone and invalid instants are never assigned a fabricated phase');
