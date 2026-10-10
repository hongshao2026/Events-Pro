import {useRef,useState} from 'react';
import {ChevronRight,FileText,HelpCircle,Mail,ShieldCheck,Trash2,X} from 'lucide-react';
import {Sheet,SheetContent,SheetHeader,SheetTitle,SheetDescription,SheetClose} from '@/components/ui/sheet';
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from '@/components/ui/alert-dialog';
import {legalPage,releaseContactReady,releaseInfo,type LegalLanguage,type LegalPage} from '@/lib/legal';
import {clearLocalPlannerData} from '@/lib/local-data';
import {useAppSettings} from './settings-context';

export function PrivacySupport(){
 const {navigateSafely}=useAppSettings();
 const [page,setPage]=useState<LegalPage|null>(null),[language,setLanguage]=useState<LegalLanguage>('zh-CN');
 const [confirmClear,setConfirmClear]=useState(false),[error,setError]=useState('');
 const trigger=useRef<HTMLButtonElement|null>(null);
 const content=page?legalPage(page,language):null;
 const open=(next:LegalPage,button:HTMLButtonElement)=>{trigger.current=button;setLanguage('zh-CN');setPage(next);};
 const clear=async()=>{
  setError('');
  try{await clearLocalPlannerData();window.location.reload();}
  catch(cause){setError(cause instanceof Error?cause.message:'未能清除本机记录，请重试。');}
 };
 return <section className="settings-section privacy-support"><h2>隐私与支持</h2>
  <div className="support-links">
   <button onClick={event=>open('privacy',event.currentTarget)}><ShieldCheck size={17}/><span>隐私政策</span><ChevronRight size={16}/></button>
   <button onClick={event=>open('support',event.currentTarget)}><HelpCircle size={17}/><span>帮助与支持</span><ChevronRight size={16}/></button>
   <button onClick={event=>open('terms',event.currentTarget)}><FileText size={17}/><span>使用说明</span><ChevronRight size={16}/></button>
   {releaseInfo.supportEmail&&<a href={`mailto:${releaseInfo.supportEmail}`}><Mail size={17}/><span>联系支持</span><ChevronRight size={16}/></a>}
  </div>
  <p className="settings-hint">版本 {releaseInfo.version} · 本机数据可通过上方备份功能导出。</p>
  <button className="clear-local-data" onClick={()=>navigateSafely(()=>{setError('');setConfirmClear(true);})}><Trash2 size={15}/>清除本机记录</button>
  <Sheet open={!!page} onOpenChange={value=>{if(!value)setPage(null);}}><SheetContent className="cart-sheet legal-sheet" showCloseButton={false} onCloseAutoFocus={event=>{event.preventDefault();trigger.current?.focus({preventScroll:true});}}>{content&&<>
   <SheetHeader className="cart-heading"><SheetTitle>{content.title}</SheetTitle><SheetDescription>{content.intro}</SheetDescription><SheetClose className="cart-close" aria-label="关闭隐私与支持"><X size={20}/></SheetClose></SheetHeader>
   <div className="legal-language" role="group" aria-label="说明语言"><button aria-pressed={language==='zh-CN'} onClick={()=>setLanguage('zh-CN')}>简体中文</button><button aria-pressed={language==='zh-Hant'} onClick={()=>setLanguage('zh-Hant')}>繁體中文</button></div>
   <div className="legal-scroll" lang={language}>
    {!releaseContactReady&&<p className="legal-draft-note" role="note">{language==='zh-Hant'?'測試版本：營運者及聯絡資訊尚未設定，本內容尚未完成發行準備。':'测试版本：运营者及联系信息尚未配置，本内容尚未完成发行准备。'}</p>}
    {content.sections.map(section=><section key={section.heading}><h3>{section.heading}</h3>{section.paragraphs.map(paragraph=><p key={paragraph}>{paragraph}</p>)}</section>)}
    {releaseInfo.supportEmail&&<a className="legal-contact" href={`mailto:${releaseInfo.supportEmail}`}>{releaseInfo.supportEmail}</a>}
   </div>
  </>}</SheetContent></Sheet>
  <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>清除这台设备的记录？</AlertDialogTitle><AlertDialogDescription>将移除全部参赛自选、用户名、显示货币、置顶赛事、汇率和赛事修改，并恢复默认设置。已导出、分享的文件及系统备份不会被删除。此操作无法撤销，请先导出需要保留的两份备份。</AlertDialogDescription></AlertDialogHeader>{error&&<p className="form-error" role="alert">{error}</p>}<AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction className="danger-action" onClick={event=>{event.preventDefault();clear();}}>清除全部本机记录</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
 </section>;
}
