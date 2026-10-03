import assert from 'node:assert/strict';
import {build} from 'vite';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
await build({configFile:false,logLevel:'error',build:{outDir:'.sites-runtime/series-unit',emptyOutDir:true,minify:false,lib:{entry:resolve('lib/series.ts'),formats:['es'],fileName:'planner-series'}}});
const {seriesList,seriesCatalog,filterSeries,regionLabel}=await import(pathToFileURL(resolve('.sites-runtime/series-unit/planner-series.js')).href);
assert.equal(seriesCatalog,seriesList);assert.equal(seriesCatalog.length,3);assert.deepEqual(filterSeries('all').map(x=>x.id),['qpc-circuit-2026','triton-one-cyprus-2026','wpt-wynn-2026']);assert.deepEqual(filterSeries('europe').map(x=>x.id),['triton-one-cyprus-2026']);assert.equal(seriesCatalog[0].countryCode,'US');assert.equal(seriesCatalog[0].region,'north-america');assert.match(seriesCatalog[0].logo.src,/^data:image\/png;base64,/);assert.deepEqual(filterSeries('apac').map(x=>x.id),['qpc-circuit-2026']);assert.equal(filterSeries('north-america').length,1);assert.equal(regionLabel('north-america'),'北美');console.log('PASS three real festivals share one catalog, sort chronologically, and retain WPT offline logo and regional metadata');
// Additional fixtures exercise future catalog ordering without publishing fictitious events.
const fixtures=[
 {...seriesCatalog[0],id:'later',region:'europe',start:'2027-01-01'},
 {...seriesCatalog[0],id:'same-b',region:'apac',start:'2026-10-01'},
 {...seriesCatalog[0],id:'same-a',region:'south-america',start:'2026-10-01'},
 {...seriesCatalog[0],id:'earlier',region:'apac',start:'2026-09-01'},
];
assert.deepEqual(filterSeries('all',fixtures).map(x=>x.id),['earlier','same-a','same-b','later']);assert.deepEqual(filterSeries('apac',fixtures).map(x=>x.id),['earlier','same-b']);assert.deepEqual(fixtures.map(x=>x.id),['later','same-b','same-a','earlier']);console.log('PASS global chronological order, deterministic ties, regional filtering and immutable catalog');
