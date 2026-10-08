import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {projectRoot,readReleaseConfig} from './release-config.mjs';

const config=await readReleaseConfig();
if(!/^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+){2,}$/.test(config.bundleId)||!/^\d+\.\d+\.\d+$/.test(config.version)||!/^\d+$/.test(config.buildNumber))throw new Error('iOS 标识或版本格式无效。');
const escape=text=>String(text).replace(/[<>&"']/g,char=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[char]));
const project=resolve(projectRoot,'ios/App/App.xcodeproj/project.pbxproj');
let pbx=await readFile(project,'utf8');
pbx=pbx.replace(/PRODUCT_BUNDLE_IDENTIFIER = [^;]+;/g,`PRODUCT_BUNDLE_IDENTIFIER = ${config.bundleId};`)
 .replace(/MARKETING_VERSION = [^;]+;/g,`MARKETING_VERSION = ${config.version};`)
 .replace(/CURRENT_PROJECT_VERSION = [^;]+;/g,`CURRENT_PROJECT_VERSION = ${config.buildNumber};`)
 .replace(/TARGETED_DEVICE_FAMILY = "1,2";/g,'TARGETED_DEVICE_FAMILY = 1;');
if(!pbx.includes('PrivacyInfo.xcprivacy in Resources')){
 pbx=pbx.replace('/* End PBXBuildFile section */','\t\tE10A00010000000000000001 /* PrivacyInfo.xcprivacy in Resources */ = {isa = PBXBuildFile; fileRef = E10A00010000000000000002 /* PrivacyInfo.xcprivacy */; };\n/* End PBXBuildFile section */');
 pbx=pbx.replace('/* End PBXFileReference section */','\t\tE10A00010000000000000002 /* PrivacyInfo.xcprivacy */ = {isa = PBXFileReference; lastKnownFileType = text.xml; path = PrivacyInfo.xcprivacy; sourceTree = "<group>"; };\n/* End PBXFileReference section */');
 pbx=pbx.replace('504EC3131FED79650016851F /* Info.plist */,','504EC3131FED79650016851F /* Info.plist */,\n\t\t\t\tE10A00010000000000000002 /* PrivacyInfo.xcprivacy */,');
 pbx=pbx.replace('504EC3121FED79650016851F /* LaunchScreen.storyboard in Resources */,','504EC3121FED79650016851F /* LaunchScreen.storyboard in Resources */,\n\t\t\t\tE10A00010000000000000001 /* PrivacyInfo.xcprivacy in Resources */,');
}
await writeFile(project,pbx,'utf8');
const path=resolve(projectRoot,'ios/App/App/Info.plist');
let info=(await readFile(path,'utf8')).replace(/\r\n/g,'\n');
info=info.replace(/(<key>CFBundleDisplayName<\/key>\s*<string>)[^<]*(<\/string>)/,(_match,start,end)=>start+escape(config.appName)+end);
info=info.replace(/(<key>CFBundleDevelopmentRegion<\/key>\s*<string>)[^<]*(<\/string>)/,'$1zh-Hans$2');
if(!info.includes('<key>CFBundleLocalizations</key>'))info=info.replace('</dict>\n</plist>','<key>CFBundleLocalizations</key><array><string>zh-Hans</string></array>\n</dict>\n</plist>');
if(!info.includes('<key>UIUserInterfaceStyle</key>'))info=info.replace('</dict>\n</plist>','<key>UIUserInterfaceStyle</key><string>Light</string>\n<key>ITSAppUsesNonExemptEncryption</key><false/>\n</dict>\n</plist>');
if(!info.includes('<key>NSPhotoLibraryAddUsageDescription</key>'))info=info.replace('</dict>\n</plist>','<key>NSPhotoLibraryAddUsageDescription</key><string>仅在你选择存储表格图片时，将生成的图片加入照片；不会读取已有照片。</string>\n</dict>\n</plist>');
await writeFile(path,info,'utf8');
console.log(`iPhone 工程已配置：${config.bundleId} ${config.version} (${config.buildNumber})，含隐私清单资源。`);
