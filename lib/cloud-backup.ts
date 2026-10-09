import type {SupabaseClient} from '@supabase/supabase-js';
import {makeBackup,parseBackup,readState,STORAGE_KEY,type Backup} from './local-store';
import {makeSettingsBackup,parseSettingsBackup,readSettings,validateSettings,SETTINGS_KEY,type SettingsBackup} from './app-settings';
import {LOCAL_KEYS,readLocalValue,withLocalWrite,writeLocalValues} from './device-storage';

export type CloudPayload={version:1;selections:Backup;settings:SettingsBackup};
export type CloudRecord={user_id:string;revision:number;updated_at:string;payload:CloudPayload};
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
export function parseCloudPayload(value:unknown):CloudPayload{
 const raw=JSON.stringify(value);
 if(!raw||new TextEncoder().encode(raw).length>1000000||!object(value)||value.version!==1)throw new Error('云端备份格式无法识别，本机记录未更改。');
 return {version:1,selections:parseBackup(JSON.stringify(value.selections)),settings:parseSettingsBackup(JSON.stringify(value.settings))};
}
export const localFingerprint=()=>JSON.stringify(LOCAL_KEYS.map(key=>readLocalValue(key)));
export function captureLocalBackup():{payload:CloudPayload;fingerprint:string}{
 return {payload:parseCloudPayload({version:1,selections:makeBackup(readState()),settings:makeSettingsBackup(readSettings())}),fingerprint:localFingerprint()};
}
export function parseCloudRecord(raw:unknown,userId:string):CloudRecord{
 if(!object(raw)||raw.user_id!==userId||!Number.isSafeInteger(raw.revision)||(raw.revision as number)<1||typeof raw.updated_at!=='string'||!Number.isFinite(Date.parse(raw.updated_at)))throw new Error('云端备份无法核对，本机记录未更改。');
 return {user_id:userId,revision:raw.revision as number,updated_at:raw.updated_at,payload:parseCloudPayload(raw.payload)};
}
const cloudError=(error:{code?:string}|null)=>new Error(error?.code==='40001'?'另一台设备已更新云端备份。请重新查看后再决定覆盖，本机记录未更改。':'云端操作未完成。请检查网络、登录状态和服务配置后重试。');
export async function currentAccountToken(client:SupabaseClient,userId:string){
 const {data,error}=await client.auth.getSession();
 if(error||data.session?.user.id!==userId)throw new Error('账号已变更，请重新打开云端备份。');
 return data.session.access_token;
}
export async function loadCloudBackup(client:SupabaseClient,userId:string,signal:AbortSignal):Promise<CloudRecord|null>{
 const token=await currentAccountToken(client,userId);
 const {data,error}=await client.from('events_pro_backups').select('user_id,revision,updated_at,payload').eq('user_id',userId).setHeader('Authorization',`Bearer ${token}`).abortSignal(signal).maybeSingle();
 if(error)throw cloudError(error);return data?parseCloudRecord(data,userId):null;
}
export async function uploadCloudBackup(client:SupabaseClient,userId:string,payload:CloudPayload,revision:number,signal:AbortSignal):Promise<CloudRecord>{
 const token=await currentAccountToken(client,userId);
 const {data,error}=await client.rpc('save_events_pro_backup',{expected_revision:revision,backup_payload:parseCloudPayload(payload)}).setHeader('Authorization',`Bearer ${token}`).abortSignal(signal);
 if(error)throw cloudError(error);return parseCloudRecord(data,userId);
}
export async function restoreCloudBackup(payload:CloudPayload,fingerprint:string):Promise<void>{
 const checked=parseCloudPayload(payload);
 await withLocalWrite(async()=>{
  if(localFingerprint()!==fingerprint)throw new Error('本机记录已变化，请重新查看备份后再恢复。');
  const state=structuredClone(checked.selections.state),settings=structuredClone(checked.settings.settings);
  let stateRevision=0,settingsRevision=0;
  try{stateRevision=readState().revision;}catch{/* Confirmed valid cloud backup can recover an unreadable local record. */}
  try{settingsRevision=readSettings().revision;}catch{/* Preserve raw data until the complete validated replacement commits. */}
  state.revision=Math.max(state.revision,stateRevision)+1;
  settings.revision=Math.max(settings.revision,settingsRevision)+1;
  // Both formats commit together. No partial settings/plan restore is accepted.
  await writeLocalValues({[STORAGE_KEY]:JSON.stringify(parseBackup(JSON.stringify(makeBackup(state)))),[SETTINGS_KEY]:JSON.stringify(validateSettings(settings))});
 });
}
