import {statuses,type Status} from './schedule';
import {entries,entryMap,eventMap} from './catalog';
import type {Currency} from './money';

export const LEGACY_KEY='wpt-2026-local-selections-v1';
export const STORAGE_KEY='poker-planner-local-v2';
export type Choice={status:Status;version:number};
export type PlannerState={selections:Record<string,Choice>;pending:Record<string,Choice>;revision:number;budgetMode:'flights'|'events'};
export type Backup={app:'wpt-planner';schemaVersion:2;savedAt:string;state:PlannerState};
export const emptyState=():PlannerState=>({selections:{},pending:{},revision:0,budgetMode:'flights'});
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const version=(v:unknown):v is number=>Number.isSafeInteger(v)&&(v as number)>=0&&(v as number)<Number.MAX_SAFE_INTEGER-1;
const choice=(v:unknown):v is Choice=>object(v)&&statuses.includes(v.status as Status)&&version(v.version);
const invalid=()=>new Error('备份包含无效场次或分类，当前自选未更改。');

export function parseBackup(text:string):Backup {
 if(text.length>500000)throw new Error('备份文件过大，请选择本工具导出的 JSON 文件。');
 let data:unknown;try{data=JSON.parse(text);}catch{throw new Error('文件格式无法识别，请选择本工具导出的 JSON 备份。');}
 if(!object(data)||data.app!=='wpt-planner'||typeof data.savedAt!=='string'||!Number.isFinite(Date.parse(data.savedAt)))throw invalid();
 const state=emptyState();
 if(data.schemaVersion===1){
  if(!object(data.selections))throw invalid();
  for(const [eventId,v]of Object.entries(data.selections)){
   const event=eventMap.get(eventId);
   if(!event||!object(v))throw invalid();const flight=v.flight;
   if(!choice(v)||typeof flight!=='string'||(flight!==''&&!event.starts.some(slot=>slot.id===flight)))throw invalid();
   const matches=entries.filter(entry=>entry.eventId===eventId),selected=matches.find(entry=>entry.slot.id===flight);
   if(selected){state.selections[selected.id]={status:v.status,version:v.version};}
   else if(matches.length===1){state.selections[matches[0].id]={status:v.status,version:v.version};}
   else if(v.status==='attend'){state.pending[eventId]={status:'attend',version:v.version};}
   else for(const entry of matches){state.selections[entry.id]={status:v.status,version:v.version};}
  }
 }else if(data.schemaVersion===2){
  if(!object(data.state)||!object(data.state.selections)||!object(data.state.pending)||!version(data.state.revision)||!['flights','events'].includes(data.state.budgetMode as string))throw invalid();
  state.revision=data.state.revision;state.budgetMode=data.state.budgetMode as PlannerState['budgetMode'];
  for(const [id,v]of Object.entries(data.state.selections)){if(!entryMap.has(id)||!choice(v))throw invalid();state.selections[id]={status:v.status,version:v.version};}
  for(const [id,v]of Object.entries(data.state.pending)){if(!eventMap.has(id)||!choice(v)||v.status!=='attend'||entries.some(entry=>entry.eventId===id&&state.selections[entry.id]?.status==='attend'))throw invalid();state.pending[id]={status:v.status,version:v.version};}
 }else throw new Error('备份版本无法识别，当前自选未更改。');
 return {app:'wpt-planner',schemaVersion:2,savedAt:data.savedAt,state};
}
export const makeBackup=(state:PlannerState):Backup=>({app:'wpt-planner',schemaVersion:2,savedAt:new Date().toISOString(),state});
export function readState():PlannerState {
 let raw:string|null,legacy:string|null;
 try{raw=localStorage.getItem(STORAGE_KEY);legacy=raw?null:localStorage.getItem(LEGACY_KEY);}catch{throw new Error('浏览器不允许读取本地数据，请允许此文件保存数据后重试。');}
 if(!raw&&!legacy)return emptyState();
 try{return parseBackup(raw||legacy!).state;}catch{throw new Error('本地记录无法读取。原记录已保留，可通过“恢复备份”导入有效文件。');}
}
export function writeState(state:PlannerState):void {
 const text=JSON.stringify(makeBackup(state));
 try{localStorage.setItem(STORAGE_KEY,text);}catch{throw new Error('未能保存到本机，原选择未更改。请检查浏览器存储权限或可用空间。');}
}
export function downloadBackup(state:PlannerState):void {
 const backup=makeBackup(state),url=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=`赛事自选备份-${backup.savedAt.replace(/[:.]/g,'-')}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function budget(state:PlannerState,source=entries,sourceEvents=eventMap){
 const selected=source.filter(entry=>state.selections[entry.id]?.status==='attend');
 const grouped=new Map<string,{buyin:number;currency:Currency}>();
 for(const entry of selected)if(!grouped.has(entry.eventId)||grouped.get(entry.eventId)!.buyin<entry.buyin)grouped.set(entry.eventId,{buyin:entry.buyin,currency:entry.currency});
 const totals:Partial<Record<Currency,number>>={};
 const add=(value:number,currency:Currency)=>{totals[currency]=(totals[currency]||0)+value;};
 for(const item of state.budgetMode==='flights'?selected:grouped.values())add(item.buyin,item.currency);
 for(const id of Object.keys(state.pending))if(!grouped.has(id)){const event=sourceEvents.get(id);if(event)add(event.buyin||0,event.currency||'USD');}
 // Preserve the old USD-only numeric field for callers; totals is the full budget.
 return {total:totals.USD||0,totalCurrency:'USD' as const,totals,flightCount:selected.length,eventCount:new Set([...grouped.keys(),...Object.keys(state.pending)]).size,pendingCount:Object.keys(state.pending).length};
}
