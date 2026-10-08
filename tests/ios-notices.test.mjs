import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'vite';
import {generateIOSNotices} from '../scripts/ios-notices.mjs';

const before=await readFile('ios-dist/third-party-notices.json','utf8');
const notices=JSON.parse(before),body=await readFile('ios-dist/THIRD-PARTY-NOTICES.txt','utf8');
const plist=await readFile('ios/App/App/Settings.bundle/Acknowledgements.plist','utf8');
const encode=text=>text.replace(/[<>&"']/g,char=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[char]));
assert.equal(new Set(notices.entries.map(entry=>`${entry.name}@${entry.version}`)).size,notices.entries.length);
for(const name of ['react','react-dom','lucide-react','@capacitor/ios','IONFilesystemLib','Cordova compatibility source','shadcn styles'])assert.ok(notices.entries.some(entry=>entry.name===name));
assert.equal(notices.entries.some(entry=>entry.name.startsWith('@supabase/')),false,'Disabled auth must not claim its SDK ships in this native bundle');
for(const entry of notices.entries)for(const file of entry.files){
 const source=await readFile(file.path,'utf8');assert.equal(file.text,source,'License text must be copied without omissions');assert.equal(file.sha256,createHash('sha256').update(source).digest('hex'));
 assert.ok(body.includes(source),`${entry.name} missing from distributed text`);assert.ok(plist.includes(encode(source)),`${entry.name} missing from native Settings acknowledgement`);
}
assert.match(body,/2013-present Cole Bemis/);assert.match(body,/Apache Software Foundation/);
const result=await build({define:{'import.meta.env.VITE_AUTH_ENABLED':'"false"'},logLevel:'silent',build:{write:false}});
await generateIOSNotices(result);assert.equal(await readFile('ios-dist/third-party-notices.json','utf8'),before,'The same bundle must produce identical notices');
assert.equal(await readFile('ios/App/App/public/THIRD-PARTY-NOTICES.txt','utf8'),body,'cap sync must preserve the complete notices in native resources');

const fixture=resolve('.sites-runtime/qa/notices/node_modules/notice-fixture');await mkdir(fixture,{recursive:true});
const input={output:[{type:'chunk',modules:{[resolve(fixture,'index.js')]:{}}}]};
await writeFile(resolve(fixture,'package.json'),JSON.stringify({name:'notice-fixture',version:'1.0.0',license:'Unreviewed-License'}));
await assert.rejects(generateIOSNotices(input),/Review license/);
await writeFile(resolve(fixture,'package.json'),JSON.stringify({name:'notice-fixture',version:'1.0.0',license:'MIT'}));
await assert.rejects(generateIOSNotices(input),/Missing license notice/);
await writeFile(resolve(fixture,'package.json'),JSON.stringify({name:'react-remove-scroll-bar',version:'99.0.0',license:'MIT'}));
await assert.rejects(generateIOSNotices(input),/does not cover/);
await assert.rejects(generateIOSNotices({output:[{type:'chunk',modules:{}}]}),/actual iOS bundle/);
assert.equal(await readFile('ios-dist/third-party-notices.json','utf8'),before,'Failed license review must preserve the last complete generated notices');
console.log(`PASS ${notices.entries.length} versioned notices retain exact text, copyright and native distribution; deterministic build and missing/unreviewed-license rejection`);
