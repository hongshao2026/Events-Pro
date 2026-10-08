import assert from 'node:assert/strict';
import {build} from 'vite';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
await build({configFile:false,logLevel:'error',build:{outDir:'.sites-runtime/series-unit',emptyOutDir:true,minify:false,lib:{entry:resolve('lib/series.ts'),formats:['es'],fileName:'planner-series'}}});
const {seriesList,seriesCatalog,filterSeries,regionLabel}=await import(pathToFileURL(resolve('.sites-runtime/series-unit/planner-series.js')).href);
assert.equal(seriesCatalog,seriesList);assert.equal(seriesCatalog.length,5);assert.deepEqual(filterSeries('all').map(x=>x.id),['kpc-jeju-2026','qpc-circuit-2026','jeju-poker-festival-2026','triton-one-cyprus-2026','wpt-wynn-2026']);assert.deepEqual(filterSeries('europe').map(x=>x.id),['triton-one-cyprus-2026']);assert.equal(seriesCatalog[0].countryCode,'US');assert.equal(seriesCatalog[0].region,'north-america');assert.match(seriesCatalog[0].logo.src,/^data:image\/png;base64,/);assert.deepEqual(filterSeries('apac').map(x=>x.id),['kpc-jeju-2026','qpc-circuit-2026','jeju-poker-festival-2026']);assert.equal(filterSeries('north-america').length,1);assert.equal(regionLabel('north-america'),'北美');console.log('PASS five real festivals share one catalog, sort chronologically, and retain WPT offline logo and regional metadata');
const kpc=seriesCatalog.find(item=>item.id==='kpc-jeju-2026');
assert.equal(kpc.countryCode,'KR');assert.equal(kpc.city,'济州岛');assert.equal(kpc.venue,'LES A Casino');assert.equal(kpc.start,'2026-10-10');assert.equal(kpc.end,'2026-10-21');assert.equal(kpc.timeZone,'Asia/Seoul');assert.equal(kpc.timeLabel,'KST');assert.equal(kpc.currency,'KRW');assert.deepEqual(kpc.currencies,['KRW','USD']);console.log('PASS KPC catalog retains Korean venue, local schedule bounds, time zone and mixed native currencies');
const jpf=seriesCatalog.find(item=>item.id==='jeju-poker-festival-2026');assert.equal(jpf.start,'2026-10-28');assert.equal(jpf.end,'2026-11-11');assert.equal(jpf.timeZone,'Asia/Seoul');assert.deepEqual(jpf.currencies,['KRW','USD']);assert.notEqual(jpf.id,kpc.id);console.log('PASS the two Jeju festivals retain distinct dates and identities');
// Additional fixtures exercise future catalog ordering without publishing fictitious events.
const fixtures=[
 {...seriesCatalog[0],id:'later',region:'europe',start:'2027-01-01'},
 {...seriesCatalog[0],id:'same-b',region:'apac',start:'2026-10-01'},
 {...seriesCatalog[0],id:'same-a',region:'south-america',start:'2026-10-01'},
 {...seriesCatalog[0],id:'earlier',region:'apac',start:'2026-09-01'},
];
assert.deepEqual(filterSeries('all',fixtures).map(x=>x.id),['earlier','same-a','same-b','later']);assert.deepEqual(filterSeries('apac',fixtures).map(x=>x.id),['earlier','same-b']);assert.deepEqual(fixtures.map(x=>x.id),['later','same-b','same-a','earlier']);console.log('PASS global chronological order, deterministic ties, regional filtering and immutable catalog');
