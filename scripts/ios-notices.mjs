import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {projectRoot,readReleaseConfig} from './release-config.mjs';

const read=path=>readFile(resolve(projectRoot,path),'utf8');
const digest=text=>createHash('sha256').update(text).digest('hex');
const escape=text=>String(text).replace(/[<>&"']/g,char=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[char]));
const permitted=new Set(['MIT','ISC','Apache-2.0','0BSD']);
function plist(value){
 if(Array.isArray(value))return `<array>${value.map(plist).join('')}</array>`;
 if(value&&typeof value==='object')return `<dict>${Object.entries(value).map(([key,item])=>`<key>${escape(key)}</key>${plist(item)}`).join('')}</dict>`;
 return `<string>${escape(value)}</string>`;
}
const document=value=>`<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">${plist(value)}</plist>\n`;

export async function generateIOSNotices(buildResult){
 const release=await readReleaseConfig(),policy=JSON.parse(await read('vendor/ios-notices/config.json'));
 const roots=new Set();
 for(const result of Array.isArray(buildResult)?buildResult:[buildResult])for(const chunk of result.output){
  if(chunk.type!=='chunk')continue;
  for(const id of Object.keys(chunk.modules)){
   const match=id.replace(/^\0/,'').replaceAll('\\','/').match(/^(.*\/node_modules\/((?:@[^/]+\/)?[^/]+))(?:\/|$)/);
   if(match)roots.add(match[1]);
  }
 }
 if(!roots.size)throw new Error('Cannot derive license coverage from the actual iOS bundle.');
 // The CSS imports and native core also ship, although absent from JS chunk metadata.
 for(const name of ['tailwindcss','tw-animate-css','@capacitor/ios'])roots.add(resolve(projectRoot,'node_modules',name));
 const entries=[];
 for(const directory of roots){
  const pkg=JSON.parse(await readFile(resolve(directory,'package.json'),'utf8'));
  if(!permitted.has(pkg.license))throw new Error(`Review license ${pkg.license} for ${pkg.name}@${pkg.version} before distributing it.`);
  const override=policy.packageOverrides[pkg.name];
  if(override&&override.version!==pkg.version)throw new Error(`The license override for ${pkg.name} does not cover ${pkg.version}.`);
  const paths=override?.files?.map(path=>resolve(projectRoot,path))||(await readdir(directory)).filter(file=>/^(licen[sc]e|copying|notice)(?:[.-]|$)/i.test(file)).sort().map(file=>resolve(directory,file));
  if(!paths.length)throw new Error(`Missing license notice for ${pkg.name}@${pkg.version}.`);
  const files=await Promise.all(paths.map(async path=>{const text=await readFile(path,'utf8');if(text.trim().length<100)throw new Error(`Empty or incomplete license: ${path}`);return {path:relative(projectRoot,path).replaceAll('\\','/'),text,sha256:digest(text)};}));
  entries.push({name:pkg.name,version:pkg.version,license:pkg.license,source:override?.source||pkg.repository?.url||pkg.repository||'',reviewNote:override?.note||'',files});
 }
 const extra=async(name,version,license,paths,source,reviewNote='')=>{
  const files=await Promise.all(paths.map(async path=>{const text=await read(path);return {path,text,sha256:digest(text)};}));
  entries.push({name,version,license,source,reviewNote,files});
 };
 await extra('IONFilesystemLib',policy.nativeFilesystem.version,'MIT',policy.nativeFilesystem.files,policy.nativeFilesystem.source);
 const nativeCore=entries.find(entry=>entry.name==='@capacitor/ios');
 await extra('Cordova compatibility source',nativeCore.version,'Apache-2.0',policy.cordova.files,policy.cordova.source,policy.cordova.note);
 await extra('shadcn styles','4.13.0','MIT',['vendor/shadcn-tailwind-4.13.0.LICENSE.md'],'vendor/shadcn-tailwind-4.13.0.css');
 entries.sort((a,b)=>a.name.localeCompare(b.name,'en')||a.version.localeCompare(b.version,'en'));
 const body=entries.map(entry=>`${entry.name} ${entry.version} (${entry.license})\n\n${entry.files.map(file=>file.text).join('\n\n')}`).join('\n\n'+ '='.repeat(72)+'\n\n');
 const directory=resolve(projectRoot,'ios/App/App/Settings.bundle');await mkdir(directory,{recursive:true});
 await mkdir(resolve(directory,'zh-Hant.lproj'),{recursive:true});
 await writeFile(resolve(directory,'Root.plist'),document({StringsTable:'Root',PreferenceSpecifiers:[
  {Type:'PSGroupSpecifier',Title:release.appName},
  {Type:'PSTitleValueSpecifier',Title:'版本',Key:'events_pro_release_version',DefaultValue:`${release.version} (${release.buildNumber})`},
  {Type:'PSChildPaneSpecifier',Title:'开源许可',File:'Acknowledgements'},
 ]}));
 await writeFile(resolve(directory,'zh-Hant.lproj/Root.strings'),'"版本" = "版本";\n"开源许可" = "開源授權";\n');
 await writeFile(resolve(directory,'Acknowledgements.plist'),document({PreferenceSpecifiers:entries.map(entry=>({Type:'PSGroupSpecifier',Title:`${entry.name} ${entry.version}`,FooterText:entry.files.map(file=>file.text).join('\n\n')}))}));
 const output=resolve(projectRoot,'ios-dist');
 await writeFile(resolve(output,'THIRD-PARTY-NOTICES.txt'),body);
 await writeFile(resolve(output,'third-party-notices.json'),JSON.stringify({schemaVersion:1,entries},null,2));
 console.log(`iOS third-party notices: ${entries.length} versioned entries, copied verbatim from installed or documented upstream licenses.`);
 return entries;
}
