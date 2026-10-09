import {build} from 'vite';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {projectRoot,readReleaseConfig,releaseIssues,requireReleaseConfig} from './release-config.mjs';
import {generateIOSNotices} from './ios-notices.mjs';

const config=await readReleaseConfig();
if(process.argv.includes('--release'))requireReleaseConfig(config);
else if(releaseIssues(config).length)console.log('开发构建：正式发行信息仍有待补项，见 npm run release:check。');
const result=await build({root:projectRoot,configFile:resolve(projectRoot,'vite.config.ts'),
 define:{'import.meta.env.VITE_AUTH_ENABLED':JSON.stringify('false'),'import.meta.env.VITE_CLOUD_ENABLED':JSON.stringify('false')},build:{outDir:'ios-dist'}});
await generateIOSNotices(result);
const path=resolve(projectRoot,'ios-dist/index.html');
let html=await readFile(path,'utf8');
const csp="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' data: blob:; object-src 'none'; frame-src 'none'; base-uri 'self'; form-action 'none'";
html=html.replace('<meta charset="UTF-8">',`<meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="${csp}">`);
await writeFile(path,html,'utf8');
console.log('iOS 离线资源已生成；签名与原生运行仍需 Mac/Xcode。');
