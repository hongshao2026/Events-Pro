import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {build} from 'vite';
import {chromium} from 'playwright';

const output=resolve('.sites-runtime/qa/shortlist-image');
await fs.mkdir(output,{recursive:true});
// Read the real catalog to exercise the entire supported plan, including supplements.
await build({configFile:false,logLevel:'error',build:{outDir:'.sites-runtime/shortlist-image-fixtures',emptyOutDir:true,minify:false,lib:{entry:{catalog:resolve('lib/catalog.ts'),store:resolve('lib/local-store.ts')},formats:['es'],fileName:(_format,name)=>`${name}.js`}}});
const {entries,entryMap,eventMap}=await import(pathToFileURL(resolve('.sites-runtime/shortlist-image-fixtures/catalog.js')).href);
const {emptyState,budget}=await import(pathToFileURL(resolve('.sites-runtime/shortlist-image-fixtures/store.js')).href);
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
const context=await browser.newContext({viewport:{width:390,height:900},offline:true,reducedMotion:'reduce',acceptDownloads:true});
const page=await context.newPage(),checks=[],errors=[],requests=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('request',request=>{if(/^https?:/.test(request.url()))requests.push(request.url());});
const pass=name=>{checks.push(name);console.log('PASS',name);};
const file=pathToFileURL(resolve('release/WPT赛事自选表.html')).href,key='poker-planner-local-v2';
const first='wpt-wynn-2026/W01/R0',second='wpt-wynn-2026/W01/R3',watch='wpt-wynn-2026/W02/R1',triton='triton-one-cyprus-2026/T01/T01-D1A';
const exportButton=()=>page.getByRole('button',{name:'导出图片',exact:true});
const sheet=()=>page.locator('.shortlist-image-sheet');
const preview=()=>sheet().getByRole('img',{name:'完整自选表格',exact:true});
const rows=()=>page.locator('.shortlist-table tr[data-entry-id]');
const filter=name=>page.getByRole('group',{name:'自选分类',exact:true}).getByRole('button',{name:new RegExp('^'+name)});
const normalize=text=>text.replace(/\s/g,'');
const dollar=value=>'$'+value.toLocaleString('en-US');
const saveState=async state=>{
 await page.evaluate(([key,state])=>{localStorage.clear();localStorage.setItem(key,JSON.stringify({app:'wpt-planner',schemaVersion:2,savedAt:'2026-10-08T00:00:00Z',state}));},[key,state]);
 await page.reload();await page.getByRole('heading',{name:'我的自选',exact:true}).waitFor();
};
const readState=()=>page.evaluate(key=>localStorage.getItem(key),key);
const closePreview=async()=>{
 await page.keyboard.press('Escape');await sheet().waitFor({state:'hidden'});
 await page.waitForFunction(()=>document.querySelector('button[aria-label="导出图片"]')===document.activeElement);
};
const capture=async name=>{
 await page.evaluate(()=>{window.imageTrace=[];window.imageEncodes=[];});
 const downloadPromise=page.waitForEvent('download');await exportButton().click();
 const download=await downloadPromise;
 assert.match(download.suggestedFilename(),/\.png$/i);
 const path=resolve(output,name+'.png');await download.saveAs(path);
 assert.equal(await download.failure(),null);
 await preview().waitFor();await preview().evaluate(image=>image.decode());
 const bytes=await fs.readFile(path);
 assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10],'Download is a real PNG, not a renamed data file');
 const size={width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)};
 assert.ok(size.width>390&&size.height>0,'The image includes the full table width');
 assert.deepEqual(await preview().evaluate(image=>({width:image.naturalWidth,height:image.naturalHeight})),size,'The saved PNG decodes to the preview dimensions');
 const drawing=await page.evaluate(()=>({text:window.imageTrace.map(line=>line.text).join(''),lines:window.imageTrace,encodes:window.imageEncodes}));
 assert.ok(drawing.lines.length>0);
 const final=drawing.encodes.at(-1);
 assert.deepEqual({width:final.width,height:final.height},size);
 for(const line of drawing.lines){
  assert.ok(line.left>=-1&&line.top>=-1&&line.right<=line.width+1&&line.bottom<=line.height+1,`Visible image text is not clipped: ${line.text}`);
 }
 return {path,size,...drawing};
};

// Observe genuine paint calls while still delegating to the native Canvas API.
// This checks row inclusion and clipping without relying on OCR or renderer models.
await context.addInitScript(()=>{
 window.imageTrace=[];window.imageEncodes=[];window.imageEncodeMode='normal';window.releaseImageEncode=null;
 const fillText=CanvasRenderingContext2D.prototype.fillText,toBlob=HTMLCanvasElement.prototype.toBlob;
 CanvasRenderingContext2D.prototype.fillText=function(text,x,y,...rest){
  const metrics=this.measureText(text),matrix=this.getTransform();
  const topLeft=new DOMPoint(x-metrics.actualBoundingBoxLeft,y-metrics.actualBoundingBoxAscent).matrixTransform(matrix);
  const bottomRight=new DOMPoint(x+metrics.actualBoundingBoxRight,y+metrics.actualBoundingBoxDescent).matrixTransform(matrix);
  window.imageTrace.push({text:String(text),left:topLeft.x,top:topLeft.y,right:bottomRight.x,bottom:bottomRight.y,width:this.canvas.width,height:this.canvas.height});
  return fillText.call(this,text,x,y,...rest);
 };
 HTMLCanvasElement.prototype.toBlob=function(callback,...args){
  window.imageEncodes.push({width:this.width,height:this.height});
  if(window.imageEncodeMode==='fail'){queueMicrotask(()=>callback(null));return;}
  if(window.imageEncodeMode==='hold'){
   window.releaseImageEncode=()=>{window.imageEncodeMode='normal';window.releaseImageEncode=null;toBlob.call(this,callback,...args);};return;
  }
  return toBlob.call(this,callback,...args);
 };
});

try{
 await page.goto(file+'#view=shortlist');await page.getByRole('heading',{name:'我的自选',exact:true}).waitFor();
 assert.equal(await exportButton().isDisabled(),true);assert.equal(await sheet().count(),0);
 pass('empty plans cannot export an empty image');

 const state=emptyState();state.revision=1;
 for(const id of [first,second])state.selections[id]={status:'attend',version:1};
 for(const id of [watch,triton])state.selections[id]={status:'watch',version:1};
 state.selections['wpt-wynn-2026/W03/R2']={status:'skip',version:1};
 state.pending.W05={status:'attend',version:1};
 await saveState(state);await rows().first().waitFor();
 await filter('正在关注').click();assert.equal(await rows().count(),2);
 const scroller=page.locator('.shortlist-table-scroll');await scroller.evaluate(element=>{element.scrollLeft=element.scrollWidth;});
 const scrollLeft=await scroller.evaluate(element=>element.scrollLeft),before=await readState(),url=page.url();
 const complete=await capture('complete-plan');
 for(const label of ['赛事','开赛时间','报名费','状态','计入预算','保底 / 席位','系列 / 地点','每个起始组各算一次','待安排起始组','旧版参加计划'])assert.ok(normalize(complete.text).includes(normalize(label)),`Image contains ${label}`);
 for(const id of [first,second,watch,triton])assert.ok(normalize(complete.text).includes(normalize(entryMap.get(id).event.title)),`Image contains selected event ${id}`);
 assert.ok(normalize(complete.text).includes(normalize(eventMap.get('W05').title)),'Filtered-out pending attendance is exported');
 assert.ok(complete.text.includes(dollar(2000)));assert.ok(complete.text.includes('13,400'));
 assert.ok(complete.text.includes('关注'));assert.ok(complete.text.includes('待安排'));
 assert.equal(complete.lines.filter(line=>line.text==='参加').length,2);
 assert.equal(complete.lines.filter(line=>line.text==='关注').length,2);
 assert.equal(complete.lines.filter(line=>line.text==='待安排').length,1);
 assert.equal(await readState(),before);assert.equal(page.url(),url);
 assert.match(await sheet().innerText(),/长按/);
 for(const width of [320,390]){
  await page.setViewportSize({width,height:900});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const bounds=await sheet().boundingBox();assert.ok(bounds.x>=-.5&&bounds.x+bounds.width<=width+.5);
  await page.screenshot({path:resolve(output,`preview-${width}.png`)});
 }
 const saveAgain=page.waitForEvent('download');await sheet().getByRole('button',{name:'保存图片',exact:true}).click();
 const repeated=await saveAgain;const repeatedPath=resolve(output,'saved-again.png');await repeated.saveAs(repeatedPath);
 assert.deepEqual(await fs.readFile(repeatedPath),await fs.readFile(complete.path),'Save reuses the complete generated PNG');
 await closePreview();assert.equal(await filter('正在关注').getAttribute('aria-pressed'),'true');
 assert.equal(await rows().count(),2);assert.equal(await scroller.evaluate(element=>element.scrollLeft),scrollLeft);assert.equal(page.url(),url);
 pass('one click downloads all seven columns, every category, both series and pending attendance while preserving filters, focus and scroll');

 await page.getByRole('combobox',{name:'预算计算方式',exact:true}).click();await page.getByRole('option',{name:'同一赛事只算一次',exact:true}).click();
 const grouped=await capture('event-budget');
 assert.ok(grouped.text.includes('同一赛事只算一次'));assert.ok(grouped.text.includes(dollar(1400)));assert.ok(grouped.text.includes('9,380'));
 await closePreview();pass('export uses the active event budget mode, counts duplicate flights once and preserves CNY conversion');

 await page.evaluate(()=>{window.imageEncodeMode='hold';window.imageEncodes=[];});
 const pendingDownload=page.waitForEvent('download');await exportButton().click();
 await page.waitForFunction(()=>typeof window.releaseImageEncode==='function');
 assert.equal(await exportButton().isDisabled(),true);assert.equal(await exportButton().getAttribute('aria-busy'),'true');
 await exportButton().evaluate(button=>{button.click();button.click();});
 assert.equal(await page.evaluate(()=>window.imageEncodes.length),1,'Busy export prevents duplicate encoding');
 await page.evaluate(()=>window.releaseImageEncode());await pendingDownload;await preview().waitFor();await preview().evaluate(image=>image.decode());await closePreview();
 assert.equal(await exportButton().isDisabled(),false);pass('pending PNG encoding shows a busy button and blocks duplicate exports');

 const beforeFailure=await readState();await page.evaluate(()=>{window.imageEncodeMode='fail';});await exportButton().click();
 await page.locator('.my-shortlist [role="alert"]').filter({hasText:/图片|导出|生成/}).waitFor();
 assert.equal(await exportButton().isDisabled(),false);assert.equal(await sheet().count(),0);assert.equal(await readState(),beforeFailure);
 await page.screenshot({path:resolve(output,'failed-export.png')});
 await page.evaluate(()=>{window.imageEncodeMode='normal';});await capture('retried-plan');await closePreview();
 assert.equal(await page.locator('.my-shortlist [role="alert"]').count(),0);
 pass('a null Canvas blob fails visibly without changing the plan and a retry recovers');

 await page.evaluate(key=>{localStorage.setItem(key,'invalid');window.dispatchEvent(new StorageEvent('storage',{key}));},key);
 await page.getByRole('button',{name:'重新读取',exact:true}).waitFor();
 assert.equal(await exportButton().isDisabled(),true);assert.equal(await rows().count(),2);
 await page.evaluate(([key,raw])=>{localStorage.setItem(key,raw);window.dispatchEvent(new StorageEvent('storage',{key}));},[key,beforeFailure]);
 await page.waitForFunction(()=>!document.querySelector('button[aria-label="导出图片"]')?.disabled);
 pass('unreadable storage disables export until the preserved plan is recovered');

 const pendingOnly=emptyState();pendingOnly.pending.W05={status:'attend',version:1};await saveState(pendingOnly);
 const pendingImage=await capture('pending-only');assert.ok(pendingImage.text.includes('待安排起始组'));assert.ok(pendingImage.text.includes('$800'));
 assert.equal(await rows().count(),0);await closePreview();pass('a legacy pending-only plan exports once without inventing any starting flight');

 const full=emptyState();full.revision=1;
 for(const [index,entry]of entries.entries())full.selections[entry.id]={status:index%3===0?'watch':'attend',version:1};
 await saveState(full);assert.equal(await rows().count(),entries.length);assert.equal(entries.length,142);
 const fullBefore=await readState(),large=await capture('full-catalog');
 assert.ok(large.size.height/large.size.width>complete.size.height/complete.size.width*5,'Image proportions grow with the full plan even when it scales to fit device limits');
 assert.ok(Math.max(large.size.width,large.size.height)<=8192);
 assert.ok(large.size.width*large.size.height<=12_000_000,'The complete plan stays within the mobile Canvas allocation budget');
 const content=normalize(large.text);
 assert.equal(large.lines.filter(line=>line.text==='参加'||line.text==='关注').length,entries.length,'Each selected starting flight has its own painted status row');
 assert.equal(large.lines.filter(line=>line.text==='关注').length,Object.values(full.selections).filter(choice=>choice.status==='watch').length);
 for(const entry of entries){
  assert.ok(content.includes(normalize(entry.event.title)),`Full image includes ${entry.id}`);
  assert.ok(content.includes(normalize(entry.flightLabel)),`Full image retains flight label for ${entry.id}`);
 }
 assert.ok(large.text.includes(dollar(budget(full).total)));
 const firstTitle=normalize(entries[0].event.title),lastTitle=normalize(entries.at(-1).event.title);
 assert.ok(content.indexOf(firstTitle)<content.lastIndexOf(lastTitle),'The first and last selected events retain schedule order');
 assert.equal(await readState(),fullBefore);
 await page.screenshot({path:resolve(output,'full-catalog-preview.png')});
 await closePreview();await page.locator('.bottom-nav').getByRole('button',{name:'我的日程',exact:true}).click();
 await page.getByRole('heading',{name:'我的日程表',exact:true}).waitFor();
 await page.locator('.bottom-nav').getByRole('button',{name:/我的自选/}).click();await rows().first().waitFor();
 assert.equal(await rows().count(),entries.length);assert.equal(await readState(),fullBefore);
 pass('all 142 catalog flights fit one decodable PNG with first and final rows in bounds; calendar navigation preserves the plan');
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);pass('PNG export, image preview, download and recovery work fully offline without browser errors');
}finally{
 await fs.writeFile(resolve(output,'results.json'),JSON.stringify({checks,errors,requests},null,2));await browser.close();
}
