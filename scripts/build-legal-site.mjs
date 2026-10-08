import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {projectRoot,readReleaseConfig,requireReleaseConfig} from './release-config.mjs';

const config=await readReleaseConfig(),draft=process.argv.includes('--draft');
if(!draft)requireReleaseConfig(config);
const content=JSON.parse(await readFile(resolve(projectRoot,'lib/legal-content.json'),'utf8'));
const escape=text=>String(text).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const fill=text=>text.replace(/\{\{(\w+)\}\}/g,(_match,key)=>config[key]||'尚未配置／尚未設定');
const directory=resolve(projectRoot,'legal-site');await mkdir(directory,{recursive:true});
for(const [language,pages] of Object.entries(content)){
 const path=resolve(directory,language);await mkdir(path,{recursive:true});
 for(const [slug,page] of Object.entries(pages)){
  const body=page.sections.map(section=>`<section><h2>${escape(section.heading)}</h2>${section.paragraphs.map(text=>`<p>${escape(fill(text))}</p>`).join('')}</section>`).join('');
  const html=`<!doctype html><html lang="${language}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${draft?'<meta name="robots" content="noindex,nofollow">':''}<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${escape(page.title)} · ${escape(config.appName)}</title><style>body{margin:0;background:#f5f6f9;color:#222335;font:16px/1.85 -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang TC','Microsoft YaHei',sans-serif}main{max-width:680px;margin:auto;padding:28px 20px 60px;background:white;min-height:100vh;box-sizing:border-box}nav{display:flex;flex-wrap:wrap;gap:16px;border-bottom:1px solid #e3e3ec;padding-bottom:16px}a{color:#542887;min-height:44px;display:inline-flex;align-items:center}a:focus-visible{outline:3px solid #7953a6;outline-offset:3px}h1{font-size:27px;margin:24px 0 8px}h2{font-size:19px;margin:26px 0 10px}p{overflow-wrap:anywhere;margin:8px 0}.draft{padding:10px;background:#f0ecf6;color:#542887}</style></head><body><main><nav><a href="privacy.html">${escape(pages.privacy.title)}</a><a href="support.html">${escape(pages.support.title)}</a><a href="terms.html">${escape(pages.terms.title)}</a><a href="../${language==='zh-CN'?'zh-Hant':'zh-CN'}/${slug}.html">${language==='zh-CN'?'繁體中文':'简体中文'}</a></nav>${draft?'<p class="draft">开发预览／開發預覽：运营及联系资料未核定，请勿作为正式政策发布。</p>':''}<h1>${escape(page.title)}</h1><p>${escape(fill(page.intro))}</p>${body}${config.supportEmail?`<a href="mailto:${escape(config.supportEmail)}">${escape(config.supportEmail)}</a>`:''}</main></body></html>`;
  await writeFile(resolve(path,slug+'.html'),html,'utf8');
 }
}
await writeFile(resolve(directory,'index.html'),`<!doctype html><html lang="zh-Hant"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${draft?'<meta name="robots" content="noindex,nofollow">':''}<meta http-equiv="Content-Security-Policy" content="default-src 'none'; base-uri 'none'; form-action 'none'"><title>${escape(config.appName)} · 隱私與支援</title></head><body>${draft?'<p>开发预览／開發預覽：尚未核定發行資料。</p>':''}<nav><a href="zh-Hant/privacy.html">隱私權政策</a> · <a href="zh-Hant/support.html">協助與支援</a> · <a href="zh-Hant/terms.html">使用說明</a></nav></body></html>`,'utf8');
console.log(`已生成${draft?'开发预览':'正式'}静态政策与支持页面：${directory}。尚未托管。`);
