import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
export const projectRoot=fileURLToPath(new URL('../',import.meta.url));
export async function readReleaseConfig(){return JSON.parse(await readFile(new URL('../app-release.config.json',import.meta.url),'utf8'));}
export function releaseIssues(config){
 const issues=[];
 for(const key of ['appName','operatorName','operatorCountry','supportEmail','websiteUrl','privacyUrl','supportUrl']){
  if(typeof config[key]!=='string'||!config[key].trim())issues.push(`${key} 尚未填写`);
 }
 if(!/^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+){2,}$/.test(config.bundleId||'')||/^com\.example\./.test(config.bundleId||''))issues.push('bundleId 需要替换为你控制的唯一正式标识');
 if(!/^\d+\.\d+\.\d+$/.test(config.version||''))issues.push('version 必须为三段版本号');
 if(!/^[1-9]\d*$/.test(config.buildNumber||''))issues.push('buildNumber 必须为正整数');
 if(config.supportEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.supportEmail))issues.push('supportEmail 格式无效');
 for(const key of ['websiteUrl','privacyUrl','supportUrl']){
  if(!config[key])continue;
  try{const url=new URL(config[key]);if(url.protocol!=='https:'||url.username||url.password||['localhost','127.0.0.1'].includes(url.hostname))throw new Error();}
  catch{issues.push(`${key} 必须是正式 HTTPS 地址`);}
 }
 return issues;
}
export function requireReleaseConfig(config){
 const issues=releaseIssues(config);
 if(issues.length)throw new Error('正式发行信息不完整：\n'+issues.map(issue=>`- ${issue}`).join('\n'));
}
