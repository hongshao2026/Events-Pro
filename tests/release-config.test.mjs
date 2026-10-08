import assert from 'node:assert/strict';
import {readReleaseConfig,releaseIssues,requireReleaseConfig} from '../scripts/release-config.mjs';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';

const current=await readReleaseConfig();
assert.ok(releaseIssues({...current,operatorName:''}).length>0,'Unconfigured operator cannot pass the release gate');
const valid={...current,bundleId:'org.fixture.eventspro',operatorName:'测试运营者',operatorCountry:'测试地区',supportEmail:'support@fixture.test',websiteUrl:'https://fixture.test/',privacyUrl:'https://fixture.test/privacy',supportUrl:'https://fixture.test/support'};
assert.deepEqual(releaseIssues(valid),[]);requireReleaseConfig(valid);
for(const patch of [{bundleId:'com.example.eventspro'},{operatorName:'  '},{supportEmail:'broken'},{privacyUrl:'http://fixture.test/privacy'},{supportUrl:'https://name:secret@fixture.test/'},{version:'1.0'},{buildNumber:'0'}])assert.throws(()=>requireReleaseConfig({...valid,...patch}));
if(releaseIssues(current).length)assert.throws(()=>execFileSync(process.execPath,['scripts/build-legal-site.mjs'],{stdio:'pipe'}),'Missing operator info must prevent formal policy generation');
execFileSync(process.execPath,['scripts/build-legal-site.mjs','--draft'],{stdio:'pipe'});
for(const language of ['zh-CN','zh-Hant'])for(const page of ['privacy','support','terms']){
 const html=await readFile(`legal-site/${language}/${page}.html`,'utf8');assert.match(html,/noindex,nofollow/);assert.doesNotMatch(html,/<script|<form|<iframe|\{\{/);assert.match(html,/开发预览/);
}
const index=await readFile('legal-site/index.html','utf8');assert.match(index,/noindex,nofollow/);assert.match(index,/开发预览/);assert.doesNotMatch(index,/<script|<form|<iframe/);
console.log('PASS release prerequisites reject unconfigured identity, unsafe URLs and invalid versions; public policy draft is escaped, local and marked unready');
