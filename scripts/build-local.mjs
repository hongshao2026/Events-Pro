import {build} from 'vite';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
// This artifact is always offline, even when a developer's .env enables web auth.
await build({root,configFile:resolve(root,'vite.config.ts'),define:{'import.meta.env.VITE_AUTH_ENABLED':JSON.stringify('false')}});
const dist=resolve(root,'local-dist');
let html=await readFile(resolve(dist,'index.html'),'utf8');
const script=html.match(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/);
const style=html.match(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/);
if(!script||!style)throw new Error('Expected a single JS and CSS bundle.');
const js=(await readFile(resolve(dist,script[1]),'utf8')).replace(/<\/script/gi,'<\\/script');
const css=(await readFile(resolve(dist,style[1]),'utf8')).replace(/<\/style/gi,'<\\/style');
html=html.replace(script[0],()=>`<script type="module">${js}</script>`).replace(style[0],()=>`<style>${css}</style>`);
// The delivered file cannot connect to remote APIs, load fonts or run workers.
html=html.replace('<meta charset="UTF-8">',`<meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">`);
const destination=resolve(root,'release');await mkdir(destination,{recursive:true});
// Existing Windows directories can retain CRLF templates while new worktrees use
// LF. Canonical output avoids a generated-file change with identical source.
await writeFile(resolve(destination,'WPT赛事自选表.html'),html.replace(/\r\n/g,'\n'),'utf8');
console.log(`Local standalone file: ${resolve(destination,'WPT赛事自选表.html')}`);
