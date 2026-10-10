import {useEffect,useRef,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from '@/components/ui/alert-dialog';
import {captureLocalBackup,currentAccountToken,localFingerprint,loadCloudBackup,restoreCloudBackup,uploadCloudBackup,type CloudPayload,type CloudRecord} from '@/lib/cloud-backup';

type Pending={action:'upload'|'restore';payload:CloudPayload;fingerprint:string;revision:number}|{action:'delete'};
export function CloudBackupControl({client,userId,onDeleted}:{client:SupabaseClient;userId:string;onDeleted:()=>void}){
 const [cloud,setCloud]=useState<CloudRecord|null>(null),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[pending,setPending]=useState<Pending|null>(null);
 const abort=useRef(new AbortController()),running=useRef(false);
 useEffect(()=>{const controller=abort.current;return()=>controller.abort();},[]);
 const run=async(operation:()=>Promise<void>)=>{
  if(running.current||abort.current.signal.aborted)return;running.current=true;setBusy(true);setError('');setMessage('');
  try{await operation();}catch(cause){if(!abort.current.signal.aborted)setError(cause instanceof Error?cause.message:'云端操作未完成，请重试。');}
  finally{running.current=false;if(!abort.current.signal.aborted)setBusy(false);}
 };
 const load=()=>run(async()=>{setLoaded(false);setCloud(null);const value=await loadCloudBackup(client,userId,abort.current.signal);if(abort.current.signal.aborted)return;setCloud(value);setLoaded(true);setMessage(value?'已读取云端备份，本机记录未更改。':'这个账号还没有云端备份。');});
 const prepare=(action:'upload'|'restore')=>{
  setError('');setMessage('');
  try{
   if(action==='restore'){if(!cloud)return;setPending({action,payload:cloud.payload,fingerprint:localFingerprint(),revision:cloud.revision});}
   else{const local=captureLocalBackup();setPending({action,payload:local.payload,fingerprint:local.fingerprint,revision:cloud?.revision??0});}
  }catch(cause){setError((cause as Error).message);}
 };
 const confirm=()=>run(async()=>{
  if(!pending)return;
  if(pending.action==='delete'){
   const token=await currentAccountToken(client,userId);
   const {data,error:failure}=await client.functions.invoke('delete-account',{body:{confirm:true},headers:{Authorization:`Bearer ${token}`},signal:abort.current.signal});
   if(failure||data?.deleted!==true)throw new Error('账号删除未能确认。请检查网络和服务配置后重试，本机记录保留。');
   if(abort.current.signal.aborted)return;
   await currentAccountToken(client,userId);
   await client.auth.signOut({scope:'local'});onDeleted();return;
  }
  if(localFingerprint()!==pending.fingerprint)throw new Error('本机记录已变化，请取消后重新选择操作。');
  if(pending.action==='upload'){
   const value=await uploadCloudBackup(client,userId,pending.payload,pending.revision,abort.current.signal);
   if(abort.current.signal.aborted)return;setCloud(value);setLoaded(true);setMessage('当前计划和设置已备份到这个账号。后续修改仍需再次备份。');
  }else{
   if(abort.current.signal.aborted)return;
   await restoreCloudBackup(pending.payload,pending.fingerprint);setMessage('云端计划和设置已恢复到本机。');
  }
  setPending(null);
 });
 const counts=pending&&pending.action!=='delete'?Object.values(pending.payload.selections.state.selections):[];
 return <section className="settings-section cloud-backup" aria-label="云端备份"><h3>云端备份</h3>
  <p className="settings-hint">手动备份参赛自选、预算方式、用户名、币种、置顶赛事、汇率和赛事修改。登录不会自动上传；本机记录仍可离线使用。同一设备共用本机计划，上传前请核对当前账号。</p>
  {loaded&&cloud&&<p className="settings-hint">云端版本 {cloud.revision} · {new Date(cloud.updated_at).toLocaleString('zh-CN')}</p>}
  <div className="cloud-actions"><button className="text-button" disabled={busy} onClick={()=>void load()}>查看云端备份</button><button className="text-button" disabled={busy||!loaded} onClick={()=>prepare('upload')}>备份到当前账号</button><button className="text-button" disabled={busy||!cloud} onClick={()=>prepare('restore')}>恢复云端备份</button></div>
  <p role="status" aria-live="polite">{busy?'正在处理…':message}</p>{error&&!pending&&<p className="form-error" role="alert">{error}</p>}
  <button className="text-button danger-action" disabled={busy} onClick={()=>{setError('');setPending({action:'delete'});}}>删除账号</button>
  <AlertDialog open={!!pending} onOpenChange={open=>{if(!open&&!running.current){setPending(null);setError('');}}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{pending?.action==='delete'?'删除这个账号？':pending?.action==='upload'?'备份到当前账号？':'恢复云端备份到本机？'}</AlertDialogTitle><AlertDialogDescription>{pending?.action==='delete'?'将永久删除当前账号及其云端备份，本机计划、已导出的文件和其他设备的本机副本仍保留。此操作无法撤销。':`${counts.filter(choice=>choice.status==='attend').length} 个参加起始组、${counts.filter(choice=>choice.status==='watch').length} 个关注起始组。包含个人与管理设置。${pending?.action==='upload'?'将替换这个账号现有的云端备份。':'将替换这台设备的全部自选和设置；未列出的场次恢复为待定。建议先导出两份本机备份。'}`}</AlertDialogDescription></AlertDialogHeader>{error&&<p className="form-error" role="alert">{error}</p>}<AlertDialogFooter><AlertDialogCancel disabled={busy}>取消</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={event=>{event.preventDefault();void confirm();}}>{pending?.action==='delete'?'确认删除账号':pending?.action==='upload'?'确认云端备份':'确认云端恢复'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
 </section>;
}
