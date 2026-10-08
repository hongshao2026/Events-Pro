import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {build} from 'vite';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const out='.sites-runtime/event-tags-unit';
await build({configFile:false,logLevel:'error',build:{outDir:out,emptyOutDir:true,minify:false,lib:{entry:resolve('lib/event-tags.ts'),formats:['es'],fileName:'event-tags'}}});
const {eventTags,matchesEventGame,eventGameOptions}=await import(pathToFileURL(resolve(out,'event-tags.js')).href);
const sources=['schedule','triton-cyprus-2026','qpc-circuit-2026','kpc-jeju-2026','jeju-poker-festival-2026'];
const catalogs=await Promise.all(sources.map(async name=>JSON.parse(await fs.readFile(`lib/${name}.json`,'utf8')))),all=catalogs.flat();
const event=id=>{const found=all.find(event=>event.id===id);assert.ok(found,id);return found;};
const expectTag=(id,tag,label)=>{
 const fixture=event(id);assert.deepEqual(eventTags(fixture),[{id:tag,label}],`${id}: ${fixture.title}`);assert.equal(matchesEventGame(fixture,tag),true);
 for(const other of ['nlh','satellite','omaha','mixed-games','draw','stud','other-games'].filter(value=>value!==tag))assert.equal(matchesEventGame(fixture,other),false,`${id} must not enter ${other}`);
};

for(const id of ['W01','W11','T01','QPC01','KPC01','JPF-3'])expectTag(id,'nlh','德州扑克');
for(const id of ['S21','T05',catalogs[2].find(event=>event.kind==='satellite').id,'KPCMS01','JPF-MS1'])expectTag(id,'satellite','卫星赛');
console.log('PASS real NLH and satellite events across all five series receive distinct source-backed categories');

for(const id of ['W03','W06','W35','T13','T21','KPC15','KPC28','KPC30','JPF-5','JPF-21','JPF-36','JPF-68'])expectTag(id,'omaha','奥马哈');
for(const id of ['W02','W04','W07','KPC02','KPC63','JPF-2','JPF-26','JPF-33','JPF-110'])expectTag(id,'mixed-games','混合游戏');
expectTag('JPF-13','draw','抽牌');expectTag('JPF-55','stud','Stud');expectTag('KPC49','other-games','其他玩法');
console.log('PASS pure PLO/Omaha/Big O stay separate from NLH/PLO, Omaha/Stud, Drawmaha and multi-game events; draw, Stud and unknown variants are not mislabeled');

for(const id of ['W03','KPC63','JPF-21','T05']){
 const original=event(id),renamed={...original,title:'用户自定义 NLH / PLO 标签名称'};
 assert.deepEqual(eventTags(renamed),eventTags(original),'Display-title edits do not change official gameplay');
 for(const [filter]of eventGameOptions)assert.equal(matchesEventGame(renamed,filter),matchesEventGame(original,filter));
}
assert.deepEqual(catalogs.map(events=>events.filter(event=>matchesEventGame(event,'mixed')).flatMap(event=>event.starts).length),[30,3,0,36,56]);
for(const catalog of catalogs){assert.ok(catalog.every(event=>matchesEventGame(event,'all')));assert.ok(catalog.every(event=>!matchesEventGame(event,'missing-game')));}
assert.deepEqual(eventGameOptions.map(([value])=>value),['all','nlh','satellite','omaha','mixed-games']);
console.log('PASS managed titles retain accurate official tags; discovery exposes only the four requested categories plus all');
