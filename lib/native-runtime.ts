import {toast} from 'sonner';
import {clearExportCache,exportFile,isNativeIOS} from './file-export';

export function initializeNativeRuntime():()=>void{
  if(!isNativeIOS())return ()=>{};
  document.documentElement.classList.add('native-ios');
  void clearExportCache();
  const links=async(event:MouseEvent)=>{
    const anchor=event.target instanceof Element?event.target.closest<HTMLAnchorElement>('a[href]'):null;
    if(!anchor||event.defaultPrevented||event.button!==0)return;
    const url=anchor.href;
    if(anchor.hasAttribute('download')&&(url.startsWith('data:')||url.startsWith('blob:'))){
      event.preventDefault();
      try{
        const response=await fetch(url);
        if(!response.ok)throw new Error('文件无法读取');
        await exportFile(await response.blob(),anchor.download||'赛事资料.pdf','赛事资料');
      }catch{toast.error('未能打开文件，请重试。');}
    }else if(/^https?:/.test(url)&&new URL(url).origin!==location.origin){
      event.preventDefault();
      try{const {Browser}=await import('@capacitor/browser');await Browser.open({url,presentationStyle:'fullscreen'});}
      catch{toast.error('未能打开网页，请检查网络后重试。');}
    }
  };
  const handler=(event:MouseEvent)=>{void links(event);};
  document.addEventListener('click',handler);
  return ()=>document.removeEventListener('click',handler);
}
