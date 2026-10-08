import {Capacitor} from '@capacitor/core';

export type FileDelivery='download-started'|'share-finished'|'share-cancelled';
export const isNativeIOS=()=>Capacitor.isNativePlatform()&&Capacitor.getPlatform()==='ios';
let cacheCleanup:Promise<void>|null=null;

function asBase64(blob:Blob):Promise<string>{
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error('无法读取导出文件，请重试。'));
    reader.onload=()=>{
      const value=typeof reader.result==='string'?reader.result:'';
      const comma=value.indexOf(',');
      if(comma<0)reject(new Error('导出文件格式无效，请重试。'));
      else resolve(value.slice(comma+1));
    };
    reader.readAsDataURL(blob);
  });
}

export function downloadFile(blob:Blob,filename:string):void{
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=filename;document.body.appendChild(link);
  try{link.click();}finally{link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
}

// User-triggered only. File data never passes through a server or platform SDK.
export async function exportFile(blob:Blob,filename:string,title='赛事自选'):Promise<FileDelivery>{
  if(!isNativeIOS()){downloadFile(blob,filename);return 'download-started';}
  await clearExportCache();
  const [{Filesystem,Directory},{Share}]=await Promise.all([import('@capacitor/filesystem'),import('@capacitor/share')]);
  const safeName=[...filename].map(char=>char.charCodeAt(0)<32?'-':char).join('').replace(/[\\/:*?"<>|]/g,'-');
  if(!safeName||safeName==='.'||safeName==='..')throw new Error('文件名无效，请重试。');
  const path=`exports/${crypto.randomUUID()}/${safeName}`;
  let written=false;
  try{
    const result=await Filesystem.writeFile({path,data:await asBase64(blob),directory:Directory.Cache,recursive:true});
    written=true;
    try{await Share.share({title,files:[result.uri]});return 'share-finished';}
    catch(error){
      if(error&&typeof error==='object'&&'message' in error&&error.message==='Share canceled')return 'share-cancelled';
      throw error;
    }
  }finally{
    if(written){
      // iOS may terminate the process; leftover cache is also purged at startup.
      await Filesystem.deleteFile({path,directory:Directory.Cache}).catch(()=>{});
      await Filesystem.rmdir({path:path.slice(0,path.lastIndexOf('/')),directory:Directory.Cache}).catch(()=>{});
    }
  }
}

export function clearExportCache():Promise<void>{
  if(!isNativeIOS())return Promise.resolve();
  if(!cacheCleanup)cacheCleanup=(async()=>{
    const {Filesystem,Directory}=await import('@capacitor/filesystem');
    await Filesystem.rmdir({path:'exports',directory:Directory.Cache,recursive:true}).catch(()=>{});
  })();
  return cacheCleanup;
}
