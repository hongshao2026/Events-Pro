import {Capacitor} from '@capacitor/core';

export const LOCAL_KEYS=['poker-planner-local-v2','wpt-2026-local-selections-v1','events-pro-settings-v1'] as const;
export const DEVICE_STORE_KEY='events-pro-device-store-v1';
export const LOCAL_DATA_EVENT='events-pro-local-data';
type Records=Partial<Record<(typeof LOCAL_KEYS)[number],string>>;
let nativeRecords:Records|undefined;
let writing:Promise<unknown>=Promise.resolve();
const native=()=>Capacitor.isNativePlatform()&&Capacitor.getPlatform()==='ios';
const changed=()=>{if(typeof window!=='undefined')window.dispatchEvent(new Event(LOCAL_DATA_EVENT));};

// Every read/modify/write transaction shares this queue, including cloud restore.
export function withLocalWrite<T>(operation:()=>T|Promise<T>):Promise<T>{
 const result=writing.then(operation);writing=result.catch(()=>{});return result;
}
function checkKey(key:string):asserts key is (typeof LOCAL_KEYS)[number]{
 if(!LOCAL_KEYS.includes(key as (typeof LOCAL_KEYS)[number]))throw new Error('未知的本机数据键。');
}
export async function initializeDeviceStorage():Promise<void>{
 if(!native())return;
 const {Preferences}=await import('@capacitor/preferences');
 await Preferences.configure({group:'EventsPro'});
 const {value}=await Preferences.get({key:DEVICE_STORE_KEY});
 if(value!==null){
  const data:unknown=JSON.parse(value);
  if(!data||typeof data!=='object'||!('version' in data)||data.version!==1||!('records' in data)||!data.records||typeof data.records!=='object'||Array.isArray(data.records))throw new Error('本机存储格式无法读取。原记录已保留。');
  const records=data.records as Record<string,unknown>;
  if(Object.entries(records).some(([key,text])=>!LOCAL_KEYS.includes(key as (typeof LOCAL_KEYS)[number])||typeof text!=='string'))throw new Error('本机存储包含无法识别的记录。原记录已保留。');
  nativeRecords={...records} as Records;
 }else{
  const records:Records={};
  for(const key of LOCAL_KEYS){const raw=localStorage.getItem(key);if(raw!==null)records[key]=raw;}
  // One atomic native snapshot avoids partial migration. Keep old raw WebView records.
  await Preferences.set({key:DEVICE_STORE_KEY,value:JSON.stringify({version:1,records})});
  nativeRecords=records;
 }
}
export function readLocalValue(key:string):string|null{
 checkKey(key);
 if(!native())return localStorage.getItem(key);
 if(!nativeRecords)throw new Error('本机存储尚未就绪，请重新打开应用。');
 return nativeRecords[key]??null;
}
export function writeLocalValues(values:Partial<Record<(typeof LOCAL_KEYS)[number],string|null>>):void|Promise<void>{
 for(const key of Object.keys(values))checkKey(key);
 if(native())return (async()=>{
  if(!nativeRecords)throw new Error('本机存储尚未就绪。');
  const next={...nativeRecords};
  for(const [key,value]of Object.entries(values)){checkKey(key);if(value===null)delete next[key];else next[key]=value;}
  const {Preferences}=await import('@capacitor/preferences');
  try{await Preferences.set({key:DEVICE_STORE_KEY,value:JSON.stringify({version:1,records:next})});}
  catch{throw new Error('未能保存到本机，原记录已保留。请检查可用空间后重试。');}
  nativeRecords=next;changed();
 })();
 const old=Object.keys(values).map(key=>[key,localStorage.getItem(key)] as const);
 try{
  for(const [key,value]of Object.entries(values)){if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}
 }catch{
  let restored=true;
  for(const [key,value]of old){try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}catch{restored=false;}}
  throw new Error(restored?'未能保存到本机，原记录已保留。':'本机写入未完成，部分记录可能已改变。请重新读取或恢复备份。');
 }
 changed();
}
export async function clearDeviceRecords():Promise<void>{
 await withLocalWrite(async()=>{
  // Include the old WebView copy so clearing cannot resurrect migrated records.
  const old=LOCAL_KEYS.map(key=>[key,readLocalValue(key),localStorage.getItem(key)] as const);
  try{
   for(const key of LOCAL_KEYS)localStorage.removeItem(key);
   await writeLocalValues(Object.fromEntries(LOCAL_KEYS.map(key=>[key,null])));
  }catch{
   let restored=true;
   for(const [key,,raw]of old){try{if(raw!==null)localStorage.setItem(key,raw);}catch{restored=false;}}
   throw new Error(restored?'未能清除本机记录，原记录已恢复。请检查存储权限后重试。':'清除未完成，部分记录可能已移除。请重新读取，或恢复备份。');
  }
 });
}
