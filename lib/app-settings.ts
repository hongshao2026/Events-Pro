import {events,type Event} from './schedule';
import {buildEntries} from './catalog';
import {displayCurrencies,type CurrencyPreference,type ExchangeRates} from './money';

export const SETTINGS_KEY='events-pro-settings-v1';
export type EventOverride={title?:string;buyin?:number|null;guarantee?:number|null;adminNotes?:string;hidden?:boolean};
// Reserved contract for the future structure editor; this release does not modify blind schedules.
export type BlindLevel={level:number;smallBlind:number;bigBlind:number;ante:number;minutes:number;breakAfterMinutes?:number};
export type AppSettings={version:1;revision:number;profile:{username:string;currency:CurrencyPreference};fx:{rates:ExchangeRates;asOf:string;source:string};eventOverrides:Record<string,EventOverride>};
export type SettingsBackup={app:'events-pro-settings';schemaVersion:1;savedAt:string;settings:AppSettings};
export const defaultSettings=():AppSettings=>({version:1,revision:0,profile:{username:'',currency:'CNY'},fx:{rates:{CNY:1,USD:6.7351,VND:0.000258,HKD:0.8584,KRW:0.004958},asOf:'2026-10-08',source:'中国银行折算价'},eventOverrides:{}});
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&v.length<=max;
const amount=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=1e12;
const known=new Map(events.map(e=>[e.id,e]));
export function validateSettings(value:unknown):AppSettings{
 const fail=()=>{throw new Error('设置文件包含无效内容，原设置未更改。');};
 if(!object(value)||value.version!==1||!Number.isSafeInteger(value.revision)||(value.revision as number)<0||(value.revision as number)>=Number.MAX_SAFE_INTEGER-1)fail();
 const data=value as Record<string,unknown>,profile=data.profile,fx=data.fx,overrides=data.eventOverrides;
 if(!object(profile)||!text(profile.username,40)||!['original',...displayCurrencies].includes(String(profile.currency)))fail();
 if(!object(fx)||!object(fx.rates)||!text(fx.source,120)||!text(fx.asOf,10)||!/^\d{4}-\d{2}-\d{2}$/.test(fx.asOf as string)||!Number.isFinite(Date.parse(fx.asOf as string)))fail();
 const validProfile=profile as AppSettings['profile'],validFx=structuredClone(fx) as AppSettings['fx'];
 // The original four-currency v1 store remains valid. Never overwrite a user's custom rates.
 if(!Object.hasOwn(validFx.rates,'KRW')){const original=validFx.asOf==='2026-10-06'&&validFx.source==='中国银行折算价'&&validFx.rates.USD===6.7351&&validFx.rates.VND===0.000258&&validFx.rates.HKD===0.8584;validFx.rates.KRW=original?0.004958:null;if(original)validFx.asOf='2026-10-08';}
 if(new Date(validFx.asOf).toISOString().slice(0,10)!==validFx.asOf)fail();
 const rates=validFx.rates;
 for(const currency of displayCurrencies){const rate=rates[currency];if(rate!==null&&(typeof rate!=='number'||!Number.isFinite(rate)||rate<1e-8||rate>1e8))fail();}
 if(rates.CNY!==1||!object(overrides)||Object.keys(overrides).length>events.length)fail();
 const clean:Record<string,EventOverride>={};
 for(const [id,patch]of Object.entries(overrides as Record<string,unknown>)){
  const event=known.get(id);if(!event||!object(patch))fail();
  const p=patch as Record<string,unknown>;
  if(Object.keys(p).some(k=>!['title','buyin','guarantee','adminNotes','hidden'].includes(k)))fail();
  if(p.title!==undefined&&(!text(p.title,160)||!p.title.trim()))fail();
  if(p.buyin!==undefined&&p.buyin!==null&&!amount(p.buyin))fail();
  if(p.guarantee!==undefined&&(event!.kind==='satellite'||(p.guarantee!==null&&!amount(p.guarantee))))fail();
  if(p.adminNotes!==undefined&&!text(p.adminNotes,1000))fail();
  if(p.hidden!==undefined&&typeof p.hidden!=='boolean')fail();
  clean[id]={...p} as EventOverride;
 }
 return {version:1,revision:data.revision as number,profile:{username:validProfile.username.trim(),currency:validProfile.currency},fx:{rates:Object.fromEntries(displayCurrencies.map(c=>[c,rates[c]])) as ExchangeRates,source:validFx.source.trim(),asOf:validFx.asOf},eventOverrides:clean};
}
export function readSettings():AppSettings{
 try{const raw=localStorage.getItem(SETTINGS_KEY);return raw?validateSettings(JSON.parse(raw)):defaultSettings();}
 catch{throw new Error('无法读取个人与管理设置，原记录已保留。可在“我的”重新读取或恢复设置备份。');}
}
export function writeSettings(settings:AppSettings){
 const clean=validateSettings(settings);
 try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(clean));}
 catch{throw new Error('设置未能保存，原设置保持不变。请检查浏览器存储空间或权限。');}
}
export function parseSettingsBackup(raw:string):SettingsBackup{
 if(raw.length>500000)throw new Error('设置备份过大。');
 let value:unknown;try{value=JSON.parse(raw);}catch{throw new Error('无法识别这份设置备份。');}
 if(!object(value)||value.app!=='events-pro-settings'||value.schemaVersion!==1||typeof value.savedAt!=='string'||!Number.isFinite(Date.parse(value.savedAt)))throw new Error('请选择“导出设置备份”生成的文件。');
 return {app:'events-pro-settings',schemaVersion:1,savedAt:value.savedAt,settings:validateSettings(value.settings)};
}
export const makeSettingsBackup=(settings:AppSettings):SettingsBackup=>({app:'events-pro-settings',schemaVersion:1,savedAt:new Date().toISOString(),settings:validateSettings(settings)});
export function managedCatalog(overrides:AppSettings['eventOverrides']){
 const managed:Event[]=events.map(event=>{
  const patch=overrides[event.id];if(!patch)return event;
  return {...event,...patch,starts:event.starts.map(slot=>patch.buyin===undefined?slot:{...slot,buyin:patch.buyin})};
 });
 return {events:managed,entries:buildEntries(managed),eventMap:new Map(managed.map(event=>[event.id,event]))};
}
export function localToday(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
