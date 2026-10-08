import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright';
import {projectRoot} from './release-config.mjs';

const target=resolve(projectRoot,'ios/App/App/Assets.xcassets/AppIcon.appiconset');
await mkdir(target,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
try{
 const page=await browser.newPage({viewport:{width:1024,height:1024},deviceScaleFactor:1});
 const svg=await readFile(resolve(projectRoot,'assets/app-icon.svg'),'utf8');
 await page.setContent(`<style>html,body{margin:0;width:1024px;height:1024px;overflow:hidden}svg{display:block;width:1024px;height:1024px}</style>${svg}`);
 await page.screenshot({path:resolve(target,'AppIcon-1024.png'),omitBackground:false});
}finally{await browser.close();}
console.log('已从项目黑桃图形生成 1024px 不透明 iOS 图标。');
