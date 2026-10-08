import {readFile,access,mkdir,writeFile} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';
import {projectRoot,readReleaseConfig,releaseIssues} from './release-config.mjs';

const config=await readReleaseConfig(),issues=releaseIssues(config);
const readiness=JSON.parse(await readFile(resolve(projectRoot,'docs/app-store/readiness.json'),'utf8'));
const names={nativeDeviceQA:'iOS 真机验收',contentRights:'赛事素材使用权核对',publicPolicyAndSupport:'公开隐私政策与支持网页',storeScreenshots:'正式商店截图'};
for(const [key,label] of Object.entries(names)){
 const item=readiness[key];
 if(item?.status!=='verified'||!item.evidence){issues.push(`${label} 尚未验收并记录证据`);continue;}
 const path=resolve(projectRoot,item.evidence),within=relative(projectRoot,path);
 if(isAbsolute(within)||within.startsWith('..')){issues.push(`${label} 证据路径必须位于项目内`);continue;}
 try{await access(path);}catch{issues.push(`${label} 证据文件不存在`);}
}
if(process.argv.includes('--online')&&releaseIssues(config).length===0){
 for(const key of ['privacyUrl','supportUrl']){
  try{
   const response=await fetch(config[key],{signal:AbortSignal.timeout(10000)});
   if(!response.ok)throw new Error(`HTTP ${response.status}`);
   const text=await response.text();
   if(!text.includes(config.operatorName)||!text.includes(config.supportEmail))throw new Error('网页缺少运营者或联系信息');
  }catch(error){issues.push(`${key} 在线核对失败：${error.message}`);}
 }
}
await mkdir(resolve(projectRoot,'.sites-runtime/qa/release'),{recursive:true});
const report={checkedAt:new Date().toISOString(),readyForPreparation:issues.length===0,issues,note:'Even a passing check does not prove legal compliance, Apple approval, valid signing or a successful upload.'};
await writeFile(resolve(projectRoot,'.sites-runtime/qa/release/readiness.json'),JSON.stringify(report,null,2));
if(issues.length){console.error('尚未满足正式发行准备条件：\n'+issues.map(issue=>`- ${issue}`).join('\n'));process.exitCode=1;}
else console.log('PASS 正式发行资料与验收记录齐备。仍需在 Mac 签名、上传并由 Apple 审核。');
