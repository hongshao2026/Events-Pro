import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=process.cwd(),oldRoot=process.env.EVENTS_PRO_LEGACY_WORKTREE,output=resolve(root,'.sites-runtime/qa/storage-migration',String(Date.now()));assert.ok(oldRoot,'Set EVENTS_PRO_LEGACY_WORKTREE to the validated legacy worktree with its compiled app/tests');await mkdir(output,{recursive:true});
const run=(command,args,log)=>{try{const data=execFileSync(command,args,{cwd:root,encoding:'utf8',timeout:900000,maxBuffer:32*1024*1024});if(log)writeFileSync(resolve(output,log),data);return data.trim();}catch(error){if(log)writeFileSync(resolve(output,log),(error.stdout||'')+'\n'+(error.stderr||''));throw error;}};
const sim=(...args)=>run('xcrun',['simctl',...args]);
const appId='com.example.eventspro',report={sourceCommit:run('git',['rev-parse','HEAD']),oldSourceCommit:run('git',['-C',oldRoot,'rev-parse','HEAD']),checks:[],success:false,scope:'Fresh iPhone 16 Pro iOS 27: old WebView app UI plan -> changed-code native Preferences build. Settings are explicitly seeded fixture data, not owner records. No physical iPhone, signing or cloud service.'};let device;
try{
 const runtimes=JSON.parse(sim('list','runtimes','-j')).runtimes,runtime=runtimes.find(item=>item.isAvailable&&item.identifier==='com.apple.CoreSimulator.SimRuntime.iOS-27-0');assert.ok(runtime);
 device=sim('create','Events-Pro-Storage-Migration-QA','com.apple.CoreSimulator.SimDeviceType.iPhone-16-Pro',runtime.identifier);sim('boot',device);sim('bootstatus',device,'-b');
 const oldBundle=resolve(output,'OldWebViewUI.xcresult');
 // Disable parallel clones so simctl reads the exact device tested by XCTest.
 console.log('Creating the legacy plan on an isolated simulator');
 run('xcodebuild',['-project',oldRoot+'/ios/App/App.xcodeproj','-scheme','App','-configuration','Debug','-destination',`platform=iOS Simulator,id=${device}`,'-derivedDataPath',oldRoot+'/ios/DerivedData','-parallel-testing-enabled','NO','CODE_SIGNING_ALLOWED=NO','-resultBundlePath',oldBundle,'-only-testing:AppUITests/PlannerUITests/testPlannerSelectionAndImagePreview','test-without-building'],'old-ui.log');
 report.oldUI=JSON.parse(run('xcrun',['xcresulttool','get','test-results','summary','--path',oldBundle]));assert.equal(report.oldUI.failedTests,0);assert.equal(report.oldUI.passedTests,1);
 try{sim('terminate',device,appId);}catch{}
 const oldContainer=sim('get_app_container',device,appId,'data');const oldInstalled=sim('get_app_container',device,appId,'app');
 const oldHTML=await readFile(resolve(oldInstalled,'public/index.html'),'utf8');const oldAsset=oldHTML.match(/<script[^>]+src="([^"]+)"/)[1];const oldJS=await readFile(resolve(oldInstalled,'public',oldAsset.replace(/^\.\//,'')),'utf8');assert.equal(oldJS.includes('events-pro-device-store-v1'),false,'Old app must still use WebView storage');
 report.oldBuild=run('plutil',['-extract','CFBundleVersion','raw','-o','-',resolve(sim('get_app_container',device,appId,'app'),'Info.plist')]);
 // Modern WebKit uses localstorage.sqlite3 rather than a .localstorage suffix.
 // Inspect only this newly created QA container, never the owner's preview.
 const find=async folder=>{let out=[];for(const item of await readdir(folder,{withFileTypes:true})){const file=resolve(folder,item.name);if(item.isDirectory())out.push(...await find(file));else if(/\.(localstorage|sqlite3?|db)$/.test(item.name))out.push(file);}return out;};
 const databases=await find(resolve(oldContainer,'Library/WebKit'));assert.ok(databases.length);
 const seed=resolve(output,'seed.py');await writeFile(seed,`import sqlite3,json,sys\nfrom pathlib import Path\nfor path in sys.argv[1:]:\n db=sqlite3.connect(path)\n try: rows=db.execute('select key,value from ItemTable').fetchall()\n except sqlite3.Error: db.close(); continue\n def decode(value): return value.decode('utf-16-le') if isinstance(value,bytes) else value\n records={decode(k):decode(v) for k,v in rows}\n if 'poker-planner-local-v2' not in records: db.close();continue\n plan=json.loads(records['poker-planner-local-v2'])\n assert len([v for v in plan['state']['selections'].values() if v['status']=='attend'])==2\n settings={'version':1,'revision':9,'profile':{'username':'Migration QA','currency':'USD','pinnedSeriesId':None},'fx':{'rates':{'CNY':1,'USD':6.7351,'VND':0.000258,'HKD':0.8584,'KRW':0.004958},'asOf':'2026-10-08','source':'中国银行折算价'},'eventOverrides':{}}\n key='events-pro-settings-v1';raw=json.dumps(settings,ensure_ascii=False,separators=(',',':'))\n samplekey,samplevalue=rows[0]\n db.execute('insert or replace into ItemTable(key,value) values (?,?)',(key.encode('utf-16-le') if isinstance(samplekey,bytes) else key,raw.encode('utf-16-le') if isinstance(samplevalue,bytes) else raw));db.commit();db.close()\n Path(sys.argv[0]).with_name('old-records.json').write_text(json.dumps({'poker-planner-local-v2':records['poker-planner-local-v2'],'events-pro-settings-v1':raw},ensure_ascii=False))\n print('Seeded isolated settings fixture beside UI-created KPC plan');break\nelse:raise RuntimeError('No planner localStorage database found')\n`);
 run('python3',[seed,...databases],'seed.log');const raw=JSON.parse(await readFile(resolve(output,'old-records.json'),'utf8'));
 report.oldRawHash=createHash('sha256').update(JSON.stringify(raw)).digest('hex');report.checks.push('Old app build created two attend and one watch through real native UI; isolated USD/username settings fixture inserted into its WebView database');
 const newApp=resolve(root,'ios/DerivedData/Build/Products/Debug-iphonesimulator/App.app');report.newBuild=run('plutil',['-extract','CFBundleVersion','raw','-o','-',resolve(newApp,'Info.plist')]);
 const newHTML=await readFile(resolve(newApp,'public/index.html'),'utf8'),newAsset=newHTML.match(/<script[^>]+src="([^"]+)"/)[1];
 const newJS=await readFile(resolve(newApp,'public',newAsset.replace(/^\.\//,'')),'utf8');assert.equal(newJS.includes('events-pro-device-store-v1'),true,'Compiled new app must contain native storage');
 report.oldAssetSha256=createHash('sha256').update(oldJS).digest('hex');report.newAssetSha256=createHash('sha256').update(newJS).digest('hex');
 assert.ok(Number(report.newBuild)>Number(report.oldBuild),'Compile a higher native build before migration QA');
 console.log('Cover-installing the native storage build without uninstalling');
 sim('install',device,newApp);sim('launch',device,appId);
 await new Promise(resolve=>setTimeout(resolve,3000));
 const resultBundle=resolve(output,'NativeRetainedUI.xcresult');
 run('xcodebuild',['-project','ios/App/App.xcodeproj','-scheme','App','-configuration','Debug','-destination',`platform=iOS Simulator,id=${device}`,'-derivedDataPath','ios/DerivedData','-parallel-testing-enabled','NO','CODE_SIGNING_ALLOWED=NO','-resultBundlePath',resultBundle,'-only-testing:AppUITests/PlannerUITests/testRetainedPlanAfterInstall','test-without-building'],'retained-ui.log');
 report.retainedUI=JSON.parse(run('xcrun',['xcresulttool','get','test-results','summary','--path',resultBundle]));assert.equal(report.retainedUI.failedTests,0);assert.equal(report.retainedUI.passedTests,1);
 try{sim('terminate',device,appId);}catch{}
 // Preferences 8 groups prefix the key in UserDefaults.standard; they are not
 // separate suite files. Decode the real app plist without key-path splitting.
 const container=sim('get_app_container',device,appId,'data'),prefs=resolve(container,'Library/Preferences',appId+'.plist');
 const stored=run('python3',['-c','import plistlib,sys;print(plistlib.load(open(sys.argv[1],"rb"))["EventsPro.events-pro-device-store-v1"])',prefs]);
 const snapshot=JSON.parse(stored);assert.equal(snapshot.version,1);
 for(const [key,value]of Object.entries(raw))assert.equal(snapshot.records[key],value,'Migration must preserve raw old data byte-for-byte');
 report.migratedRawHash=createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.keys(raw).map(key=>[key,snapshot.records[key]])))).digest('hex');
 report.planCount=Object.values(JSON.parse(snapshot.records['poker-planner-local-v2']).state.selections).filter(choice=>choice.status==='attend'||choice.status==='watch').length;assert.equal(report.planCount,3);
 report.settings={username:JSON.parse(snapshot.records['events-pro-settings-v1']).profile.username,currency:JSON.parse(snapshot.records['events-pro-settings-v1']).profile.currency};
 report.checks.push('Changed-code cover install retained KPC shortlist, KRW budget and calendar through read-only real XCTest');
 report.checks.push('Actual UserDefaults EventsPro snapshot contains the exact old plan and settings strings, including USD preference and fixture username');report.success=true;
} catch(error){report.error=String(error);throw error;}finally{
 if(device){try{sim('shutdown',device);}catch{}try{sim('delete',device);}catch{}}
 await writeFile(resolve(output,'results.json'),JSON.stringify(report,null,2));console.log('Migration evidence: '+output);
}
