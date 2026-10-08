import {useEffect,useRef,useState} from 'react';
import {Download,ImageDown,LoaderCircle,Share2,X} from 'lucide-react';
import {Sheet,SheetContent,SheetHeader,SheetTitle,SheetDescription,SheetClose} from '@/components/ui/sheet';
import {exportShortlistImage} from '@/lib/shortlist-image';
import type {PlannerState} from '@/lib/local-store';
import {useAppSettings} from './settings-context';
import {exportFile,isNativeIOS} from '@/lib/file-export';

type ExportPreview={url:string;blob:Blob;filename:string;width:number;height:number};

function downloadImage(image:ExportPreview){
 const link=document.createElement('a');
 link.href=image.url;link.download=image.filename;
 document.body.appendChild(link);
 try{link.click();}finally{link.remove();}
}

export function ShortlistExport({state,count,blocked}:{state:PlannerState;count:number;blocked:boolean}){
 const {catalog,settings,settingsError}=useAppSettings();
 const exportBlocked=blocked||!!settingsError;
 const native=isNativeIOS();
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[downloadError,setDownloadError]=useState('');
 const [preview,setPreview]=useState<ExportPreview|null>(null);
 const [sharing,setSharing]=useState(false);
 const buttonRef=useRef<HTMLButtonElement|null>(null),mounted=useRef(true),locked=useRef(false),urlRef=useRef<string|null>(null);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;if(urlRef.current)URL.revokeObjectURL(urlRef.current);};},[]);
 const close=()=>{setPreview(null);setDownloadError('');if(urlRef.current){URL.revokeObjectURL(urlRef.current);urlRef.current=null;}};
 const save=async(image:ExportPreview)=>{
  if(sharing)return;
  setDownloadError('');
  setSharing(true);
  try{if(native)await exportFile(image.blob,image.filename,'完整自选表格');else downloadImage(image);}
  catch{if(mounted.current)setDownloadError(native?'未能打开系统分享，请再次点击“分享或存储图片”。':'浏览器未能开始下载，请长按图片保存，或再次点击“保存图片”。');}
  finally{if(mounted.current)setSharing(false);}
 };
 const generate=async()=>{
  if(locked.current||exportBlocked||count===0)return;
  locked.current=true;setBusy(true);setError('');
  try{
   // Freeze this click's complete plan while the image is being generated.
   const snapshot=structuredClone(state);
   const options=structuredClone({entries:catalog.entries,eventMap:catalog.eventMap,settings,settingsError});
   await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
   const image=await exportShortlistImage(snapshot,options);
   if(!mounted.current)return;
   if(urlRef.current)URL.revokeObjectURL(urlRef.current);
   const url=URL.createObjectURL(image.blob);urlRef.current=url;
   const next={url,blob:image.blob,filename:image.filename,width:image.width,height:image.height};
   setPreview(next);if(!native)void save(next);
  }catch(cause){
   if(mounted.current)setError(cause instanceof Error?cause.message:'图片未能生成，请再次点击“导出图片”重试。');
  }finally{locked.current=false;if(mounted.current)setBusy(false);}
 };
 return <>
  <button ref={buttonRef} className="shortlist-export-button" disabled={exportBlocked||count===0||busy} aria-label="导出图片" aria-busy={busy} aria-describedby={error?'shortlist-export-error':'shortlist-export-description'} onClick={()=>void generate()}>{busy?<LoaderCircle size={15} className="shortlist-export-spinner" aria-hidden="true"/>:<ImageDown size={15} aria-hidden="true"/>}<span>{busy?'生成中…':'导出图片'}</span></button>
  <span id="shortlist-export-description" className="sr-only">{blocked?'请先恢复有效的本地记录。':settingsError?'请先在“我的”恢复有效的个人与管理设置。':count===0?'添加参加或关注的比赛后，可导出图片。':'将全部自选与完整表格导出为一张 PNG 图片，不受分类筛选影响。'}</span>
  {error&&<p id="shortlist-export-error" className="shortlist-export-error" role="alert">{error}</p>}
  <Sheet open={!!preview} onOpenChange={open=>{if(!open)close();}}><SheetContent className="cart-sheet shortlist-image-sheet" showCloseButton={false} onCloseAutoFocus={event=>{event.preventDefault();buttonRef.current?.focus({preventScroll:true});}}>{preview&&<>
   <SheetHeader className="cart-heading"><SheetTitle>自选表格图片</SheetTitle><SheetDescription>已生成完整表格，可保存后分享到微信或其他平台。</SheetDescription><SheetClose className="cart-close" aria-label="关闭图片预览"><X size={20}/></SheetClose></SheetHeader>
   <div className="shortlist-image-scroll"><img className="shortlist-export-image" src={preview.url} alt="完整自选表格" width={preview.width} height={preview.height}/></div>
   <div className="shortlist-image-actions"><p>{native?'通过系统菜单保存到“文件”，或分享给你选择的应用。':'手机可长按图片保存；若未开始下载，请点“保存图片”。'}</p>{downloadError&&<p role="alert" className="shortlist-export-error">{downloadError}</p>}<button className="primary-button" disabled={sharing} aria-busy={sharing} onClick={()=>void save(preview)}>{native?<Share2 size={16}/>:<Download size={16}/>}<span>{native?'分享或存储图片':'保存图片'}</span></button></div>
  </>}</SheetContent></Sheet>
 </>;
}
