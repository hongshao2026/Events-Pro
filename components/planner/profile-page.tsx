import {useRef,useState,type FormEvent,type ReactNode} from 'react';
import {ArrowRight,ChevronRight,Crown,Download,Settings2,Upload,UserRound} from 'lucide-react';
import {toast} from 'sonner';
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from '@/components/ui/alert-dialog';
import {currencyNames,displayCurrencies,type CurrencyPreference} from '@/lib/money';
import {makeSettingsBackup,parseSettingsBackup,type SettingsBackup} from '@/lib/app-settings';
import {FilterSelect} from './controls';
import {useAppSettings,useUnsavedChanges} from './settings-context';

export type AccountInfo={email?:string;displayName?:string;provider?:string;id?:string};
function ConfigurationBackup(){
 const {settings,settingsError,restoreSettings}=useAppSettings();
 const [pending,setPending]=useState<SettingsBackup|null>(null),[error,setError]=useState('');
 const input=useRef<HTMLInputElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const download=()=>{
  const value=makeSettingsBackup(settings),url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=`Events-Pro设置-${value.savedAt.slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 const upload=async(file:File)=>{setError('');try{if(file.size>500000)throw new Error('设置备份过大。');setPending(parseSettingsBackup(await file.text()));}catch(e){setError((e as Error).message);}};
 return <><div className="backup-row"><span>个人与管理设置</span><div><button className="text-button" disabled={!!settingsError} onClick={download}><Download size={15}/>导出设置备份</button><button className="text-button" ref={trigger} onClick={()=>input.current?.click()}><Upload size={15}/>恢复设置备份</button></div></div><input ref={input} type="file" accept=".json,application/json" className="sr-only" tabIndex={-1} aria-label="选择设置备份文件" onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file)void upload(file);}}/>{error&&!pending&&<p className="form-error" role="alert">{error}</p>}
  <AlertDialog open={!!pending} onOpenChange={open=>{if(!open){setPending(null);setError('');}}}><AlertDialogContent onCloseAutoFocus={event=>{event.preventDefault();trigger.current?.focus();}}><AlertDialogHeader><AlertDialogTitle>恢复个人与管理设置？</AlertDialogTitle><AlertDialogDescription>将替换用户名、显示货币、首页置顶赛事、汇率和 {Object.keys(pending?.settings.eventOverrides||{}).length} 项赛事修改。旧备份未含置顶时将清除当前置顶。参赛自选不受影响。备份日期：{pending?.savedAt.slice(0,10)}。</AlertDialogDescription></AlertDialogHeader>{error&&<p className="form-error" role="alert">{error}</p>}<AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={event=>{event.preventDefault();if(!pending)return;try{restoreSettings(pending.settings);setPending(null);setError('');toast.success('设置已恢复');}catch(e){setError((e as Error).message);}}}>确认恢复设置</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></>;
}
export function ProfilePage({accountInfo,account,selectionsBackup,onManage}:{accountInfo?:AccountInfo;account?:ReactNode;selectionsBackup:ReactNode;onManage:()=>void}){
 const {settings,settingsError,saveSettings}=useAppSettings();
 const [username,setUsername]=useState(settings.profile.username),[nameError,setNameError]=useState(''),[currencyError,setCurrencyError]=useState('');
 const nameRef=useRef<HTMLInputElement>(null),composing=useRef(false);
 useUnsavedChanges(username.trim()!==settings.profile.username);
 const name=settings.profile.username||accountInfo?.displayName||'扑克玩家';
 const saveName=(event:FormEvent)=>{event.preventDefault();if(composing.current)return;setNameError('');if(!username.trim()||username.trim().length>40){setNameError('请输入 1–40 个字的用户名。');nameRef.current?.focus();return;}
  try{saveSettings(next=>{next.profile.username=username.trim();});toast.success('用户名已保存');}catch(error){setNameError((error as Error).message);}
 };
 const changeCurrency=(currency:string)=>{setCurrencyError('');try{saveSettings(next=>{next.profile.currency=currency as CurrencyPreference;});toast.success('显示货币已更新');}catch(error){setCurrencyError((error as Error).message);}};
 return <div className="profile-page"><section className="profile-identity"><span className="profile-avatar" aria-hidden="true"><UserRound size={30}/></span><div><h2>{name}</h2><p>{accountInfo?.email||'本机账户'}</p></div><span className="vip-badge"><Crown size={14}/>VIP 0</span></section>
  <section className="settings-section"><h2>账户信息</h2><form noValidate onCompositionStart={()=>{composing.current=true;}} onCompositionEnd={()=>{composing.current=false;}} onSubmit={saveName} className="profile-name-form"><label htmlFor="profile-username">用户名</label><div className="inline-edit"><input id="profile-username" ref={nameRef} value={username} placeholder={accountInfo?.displayName||'设置用户名'} maxLength={40} autoComplete="nickname" aria-invalid={!!nameError} aria-describedby={nameError?'username-error':undefined} onChange={event=>setUsername(event.target.value)}/><button className="primary-button" type="submit" disabled={!!settingsError||username.trim()===settings.profile.username}>保存</button></div>{nameError&&<p id="username-error" className="form-error" role="alert">{nameError}</p>}</form>
   <dl className="settings-facts"><div><dt>账户状态</dt><dd>{accountInfo?.email?'已登录':'未登录'}{accountInfo?.provider==='google'?' · Google':accountInfo?.email?' · 邮箱':''}</dd></div><div><dt>VIP 等级</dt><dd>VIP 0 · 普通用户</dd></div></dl><p className="settings-hint">VIP 权益尚未开放。</p>{account&&<div className="profile-account-action">{account}</div>}
  </section>
  <section className="settings-section"><h2>显示设置</h2><div className="setting-control"><label htmlFor="preferred-currency">显示货币</label><FilterSelect id="preferred-currency" label="显示货币" value={settings.profile.currency} disabled={!!settingsError} onChange={changeCurrency} options={[["original","仅显示原币"],...displayCurrencies.map(c=>[c,`${currencyNames[c]} · ${c}`] as [string,string])]}/></div><p className="settings-hint">报名费保留原币，括号内显示参考换算；同币种不重复显示。</p>{currencyError&&<p className="form-error" role="alert">{currencyError}</p>}<div className="rate-caption"><span>汇率日期 {settings.fx.asOf}</span><button className="text-button" onClick={onManage}>查看汇率<ArrowRight size={13}/></button></div></section>
  <section className="settings-section profile-backups"><h2>数据与备份</h2><div className="backup-row"><span>参赛自选</span>{selectionsBackup}</div><ConfigurationBackup/></section>
  <button className="management-link" onClick={onManage}><Settings2 size={20}/><span><strong>管理后台</strong><small>汇率设置 · 赛事管理</small></span><ChevronRight size={18}/></button>
 </div>;
}
