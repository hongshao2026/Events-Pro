import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {access,copyFile,mkdir,readFile,writeFile} from 'node:fs/promises';
import {relative,resolve} from 'node:path';
import {setTimeout} from 'node:timers/promises';
import {projectRoot,readReleaseConfig} from './release-config.mjs';

// Run against a fresh simulator only. Optional XCTest and a higher native build
// check are limited simulator QA, not physical-device or TestFlight acceptance.
function run(command,args,timeout=60000,log){
 const result=spawnSync(command,args,{cwd:projectRoot,encoding:'utf8',timeout,maxBuffer:16*1024*1024});
 if(log)writeFileSync(log,`${result.stdout||''}\n${result.stderr||''}`);
 if(result.error)throw result.error;
 if(result.status!==0)throw new Error(`${command} ${args.join(' ')} failed (${result.status}):\n${result.stdout?.slice(-12000)}\n${result.stderr}`);
 return result.stdout.trim();
}
const sim=(...args)=>run('xcrun',['simctl',...args],300000);
const model=process.env.EVENTS_PRO_SIMULATOR_MODEL||'iPhone-16-Pro';
const uiTests=process.env.EVENTS_PRO_UI_TESTS==='true';
const upgradeTests=process.env.EVENTS_PRO_UPGRADE_TESTS==='true';
assert.ok(!upgradeTests||uiTests,'Upgrade checks require the normal UI baseline');
const sizes={'iPhone-16-Pro':[1206,2622],'iPhone-16-Pro-Max':[1320,2868]};
assert.ok(sizes[model],'Choose a supported iPhone simulator model');
const app=resolve(projectRoot,'ios/DerivedData/Build/Products/Debug-iphonesimulator/App.app');
const output=resolve(projectRoot,'.sites-runtime/qa/ios-simulator',`${Date.now()}-${model}`);
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
const type=types.find(item=>item.identifier===`com.apple.CoreSimulator.SimDeviceType.${model}`);
assert.ok(type,`Install the ${model} simulator device type`);
const resultBundles=[];
const report={sourceCommit:run('git',['rev-parse','HEAD']),environment:process.env.GITHUB_ACTIONS==='true'?'GitHub Actions':'local Mac',xcode:run('xcodebuild',['-version']),
 bundleId:config.bundleId,version:config.version,buildNumber:config.buildNumber,
 sdk:plist('DTSDKName'),device:type.name,runtime:runtime.name,checkedAt:new Date().toISOString(),
 checks:[],note:uiTests
  ?'Real iOS Simulator startup and limited native UI flow. Read success/uiSummary and visually review screenshots; not physical-device, signing, upgrade, TestFlight or complete acceptance.'
  :'Real iOS Simulator startup only. Screenshots require visual review; not physical-device, signing, TestFlight or complete functional acceptance.'};
let device;
try{
 device=sim('create',`Events Pro QA ${Date.now()}`,type.identifier,runtime.identifier);
 const buildArgs=['-project','ios/App/App.xcodeproj','-scheme','App','-configuration','Debug',
  '-destination',`platform=iOS Simulator,id=${device}`,'-derivedDataPath','ios/DerivedData',
  '-parallel-testing-enabled','NO','CODE_SIGNING_ALLOWED=NO'];
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
 const screenshot=resolve(output,'01-events.jpg');
 sim('io',device,'screenshot','--type=jpeg',screenshot);
 const pixels=run('sips',['-g','pixelWidth','-g','pixelHeight','-g','hasAlpha',screenshot]);
 report.screenshot={file:'01-events.jpg',format:'JPEG',width:Number(pixels.match(/pixelWidth:\s+(\d+)/)?.[1]),
  height:Number(pixels.match(/pixelHeight:\s+(\d+)/)?.[1]),hasAlpha:pixels.match(/hasAlpha:\s+(\w+)/)?.[1],
  sha256:createHash('sha256').update(await readFile(screenshot)).digest('hex')};
 assert.equal(report.screenshot.width,sizes[model][0]);assert.equal(report.screenshot.height,sizes[model][1]);
 assert.equal(report.screenshot.hasAlpha,'no','Store screenshot evidence must not contain an alpha channel');
 await copyFile(resolve(projectRoot,'ios/App/App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved'),resolve(output,'Package.resolved'));
 report.checks.push('Real simulator PNG and opaque JPEG captured with actual Swift Package.resolved');
 if(uiTests){
  const resultBundle=resolve(output,'PlannerUI.xcresult');
  resultBundles.push({path:resultBundle,summary:'uiSummary',attachments:'attachments'});
  run('xcodebuild',[...buildArgs,'-resultBundlePath',resultBundle,
   '-only-testing:AppUITests/PlannerUITests/testPlannerSelectionAndImagePreview','test'],600000,resolve(output,'xcodebuild-test.log'));
  report.uiSummary=JSON.parse(run('xcrun',['xcresulttool','get','test-results','summary','--path',resultBundle]));
  assert.ok(report.uiSummary.passedTests>=1,'The result bundle must contain executed passing UI tests');
  assert.equal(report.uiSummary.failedTests,0);
  report.checks.push('Real native XCTest: KPC attend/watch, KRW budget, conditional calendar, image preview and same-installation relaunch persistence');
  report.uiTests=true;
 }
 if(upgradeTests){
  const previous=Number(config.buildNumber);
  assert.ok(Number.isSafeInteger(previous)&&previous>0&&previous<Number.MAX_SAFE_INTEGER);
  const next=String(previous+1);
  const container=sim('get_app_container',device,config.bundleId,'data');
  report.upgrade={fromBuild:config.buildNumber,toBuild:next,version:config.version,bundleId:config.bundleId,
   scope:'Same source and bundled assets; only native CFBundleVersion incremented via Xcode build setting. Not settings-backup, changed-code migration, physical-device or TestFlight upgrade QA.'};
  // Recompile the actual app without editing the public release configuration.
  // This is a development packaging probe, not an uploadable release candidate.
  run('xcodebuild',[...buildArgs,`CURRENT_PROJECT_VERSION=${next}`,'build'],600000,resolve(output,'xcodebuild-upgrade.log'));
  assert.equal(plist('CFBundleIdentifier'),config.bundleId);
  assert.equal(plist('CFBundleShortVersionString'),config.version);
  assert.equal(plist('CFBundleVersion'),next);
  sim('install',device,app);
  // iOS may relocate the data container during an update (Apple TN2285).
  // Verify retained records through the read-only UI test, not path equality.
  const updatedContainer=sim('get_app_container',device,config.bundleId,'data');
  const installed=sim('get_app_container',device,config.bundleId,'app');
  assert.equal(run('plutil',['-extract','CFBundleVersion','raw','-o','-',resolve(installed,'Info.plist')]),next);
  report.upgrade.coverInstalled=true;
  report.upgrade.dataContainerPathChanged=updatedContainer!==container;
  report.upgrade.installedNativeBuild=next;
  const resultBundle=resolve(output,'PlannerUpgrade.xcresult');
  resultBundles.push({path:resultBundle,summary:'upgradeSummary',attachments:'upgrade-attachments'});
  run('xcodebuild',[...buildArgs,'-resultBundlePath',resultBundle,
   '-only-testing:AppUITests/PlannerUITests/testRetainedPlanAfterInstall','test-without-building'],600000,resolve(output,'xcodebuild-upgrade-test.log'));
  report.upgradeSummary=JSON.parse(run('xcrun',['xcresulttool','get','test-results','summary','--path',resultBundle]));
  assert.equal(report.upgradeSummary.passedTests,1);
  assert.equal(report.upgradeSummary.failedTests,0);
  report.upgrade.dataContainerPathChangedDuringTest=sim('get_app_container',device,config.bundleId,'data')!==updatedContainer;
  const testedApp=sim('get_app_container',device,config.bundleId,'app');
  assert.equal(run('plutil',['-extract','CFBundleVersion','raw','-o','-',resolve(testedApp,'Info.plist')]),next,'XCTest must verify the higher installed native build');
  report.upgrade.retainedPlanVerified=true;
  report.upgrade.success=true;
  report.note='Real iOS Simulator startup, limited UI flow, and same-source higher native-build cover-install retention. Read both summaries and review screenshots; not full upgrade migration, settings/backup restore, signing, physical-device or TestFlight acceptance.';
  report.checks.push('Same-ID higher native build cover-installed without uninstalling; existing KPC plan, KRW budget and conditional calendar retained through real XCTest');
 }
 report.success=true;
 console.log('PASS real iOS Simulator installation, startup and evidence capture; visual and device acceptance still required');
}catch(error){
 report.success=false;report.error=error.message;
 if(device){try{sim('io',device,'screenshot',resolve(output,'failure.png'));}catch{/* Preserve the original failure. */}}
 throw error;
}
finally{
 for(const bundle of resultBundles){
  try{
   await access(bundle.path);
   report[bundle.summary]??=JSON.parse(run('xcrun',['xcresulttool','get','test-results','summary','--path',bundle.path]));
   run('xcrun',['xcresulttool','export','attachments','--path',bundle.path,'--output-path',resolve(output,bundle.attachments)]);
  }catch(error){(report.evidenceErrors??=[]).push({bundle:bundle.summary,error:error.message});}
 }
 report.completedAt=new Date().toISOString();
 await writeFile(resolve(output,'results.json'),JSON.stringify(report,null,2)+'\n');
 console.log(`Native evidence: ${relative(projectRoot,output)}`);
 if(device){for(const command of ['shutdown','delete'])spawnSync('xcrun',['simctl',command,device],{encoding:'utf8',timeout:30000});}
}
