import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {access,copyFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {setTimeout} from 'node:timers/promises';
import {projectRoot,readReleaseConfig} from './release-config.mjs';

// Run against a fresh simulator only. This checks native startup, not device QA.
function run(command,args,timeout=60000){
 const result=spawnSync(command,args,{cwd:projectRoot,encoding:'utf8',timeout,maxBuffer:16*1024*1024});
 if(result.error)throw result.error;
 if(result.status!==0)throw new Error(`${command} ${args.join(' ')} failed (${result.status}):\n${result.stdout}\n${result.stderr}`);
 return result.stdout.trim();
}
const sim=(...args)=>run('xcrun',['simctl',...args],300000);
const app=resolve(projectRoot,'ios/DerivedData/Build/Products/Debug-iphonesimulator/App.app');
const output=resolve(projectRoot,'.sites-runtime/qa/ios-simulator');
await mkdir(output,{recursive:true});
const config=await readReleaseConfig();
await access(app);
const plist=key=>run('plutil',['-extract',key,'raw','-o','-',resolve(app,'Info.plist')]);
assert.equal(plist('CFBundleIdentifier'),config.bundleId);
assert.equal(plist('CFBundleShortVersionString'),config.version);
assert.equal(plist('CFBundleVersion'),config.buildNumber);
for(const file of ['public/index.html','PrivacyInfo.xcprivacy','Settings.bundle/Root.plist','Settings.bundle/Acknowledgements.plist'])await access(resolve(app,file));
const runtimes=JSON.parse(sim('list','runtimes','--json')).runtimes;
const runtime=runtimes.filter(item=>item.isAvailable&&item.identifier.includes('.iOS-'))
 .sort((a,b)=>b.version.localeCompare(a.version,'en',{numeric:true}))[0];
assert.ok(runtime,'An available iOS simulator runtime is required');
const types=JSON.parse(sim('list','devicetypes','--json')).devicetypes;
const type=types.find(item=>item.identifier==='com.apple.CoreSimulator.SimDeviceType.iPhone-16-Pro');
assert.ok(type,'Install the iPhone 16 Pro simulator device type');
const report={sourceCommit:run('git',['rev-parse','HEAD']),environment:process.env.GITHUB_ACTIONS==='true'?'GitHub Actions':'local Mac',xcode:run('xcodebuild',['-version']),
 bundleId:config.bundleId,version:config.version,buildNumber:config.buildNumber,
 sdk:plist('DTSDKName'),device:type.name,runtime:runtime.name,checkedAt:new Date().toISOString(),
 checks:[],note:'Real remote/local iOS Simulator startup only. Screenshots require visual review; not physical-device, signing, TestFlight or complete functional acceptance.'};
let device;
try{
 device=sim('create',`Events Pro QA ${Date.now()}`,type.identifier,runtime.identifier);
 sim('boot',device);sim('bootstatus',device,'-b');
 sim('status_bar',device,'override','--time','9:41','--dataNetwork','wifi','--wifiMode','active','--wifiBars','3','--batteryState','charged','--batteryLevel','100');
 sim('install',device,app);report.checks.push('Compiled native app and expected bundled resources installed on a fresh iPhone simulator');
 report.launch=sim('launch','--terminate-running-process',device,config.bundleId);
 await setTimeout(10000);
 const processes=sim('spawn',device,'launchctl','list');
 const appProcess=processes.split('\n').find(line=>line.includes(config.bundleId));
 report.nativePID=Number(appProcess?.trim().split(/\s+/)[0]);
 assert.ok(Number.isInteger(report.nativePID)&&report.nativePID>0,'The installed app must retain a live process after startup');
 report.checks.push('Native app launched and retains a live process after startup');
 sim('io',device,'screenshot',resolve(output,'01-events.png'));
 await copyFile(resolve(projectRoot,'ios/App/App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved'),resolve(output,'Package.resolved'));
 report.checks.push('Real simulator screenshot and actual Swift Package.resolved captured');
 report.success=true;
 console.log('PASS real iOS Simulator installation, startup and evidence capture; visual and device acceptance still required');
}catch(error){
 report.success=false;report.error=error.message;
 if(device){try{sim('io',device,'screenshot',resolve(output,'failure.png'));}catch{/* Preserve the original failure. */}}
 throw error;
}
finally{
 await writeFile(resolve(output,'results.json'),JSON.stringify(report,null,2)+'\n');
 if(device){for(const command of ['shutdown','delete'])spawnSync('xcrun',['simctl',command,device],{encoding:'utf8',timeout:30000});}
}
