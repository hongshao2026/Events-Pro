import {withLocalWrite,LOCAL_DATA_EVENT} from '@/lib/device-storage';
import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {defaultSettings,managedCatalog,readSettings,SETTINGS_KEY,validateSettings,writeSettings,type AppSettings} from '@/lib/app-settings';
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from '@/components/ui/alert-dialog';

function initial(){try{return {data:readSettings(),error:''};}catch(error){return {data:defaultSettings(),error:(error as Error).message};}}
function useSettingsState(){
 const [snapshot,setSnapshot]=useState(initial),latestRef=useRef(snapshot.data),dirtyRef=useRef(false);
 const [pendingNavigation,setPendingNavigation]=useState<{run:()=>void}|null>(null);
 const accept=useCallback((data:AppSettings)=>{latestRef.current=data;setSnapshot({data,error:''});},[]);
 const reload=useCallback(()=>{try{accept(readSettings());}catch(error){setSnapshot(value=>({...value,error:(error as Error).message}));}},[accept]);
 useEffect(()=>{
  const storage=(event:StorageEvent)=>{if(event.key===SETTINGS_KEY||event.key===null)reload();};
  const visible=()=>{if(document.visibilityState==='visible')reload();};
  window.addEventListener('storage',storage);window.addEventListener(LOCAL_DATA_EVENT,reload);document.addEventListener('visibilitychange',visible);
  return()=>{window.removeEventListener('storage',storage);window.removeEventListener(LOCAL_DATA_EVENT,reload);document.removeEventListener('visibilitychange',visible);};
 },[reload]);
 const save=useCallback((mutate:(next:AppSettings)=>void,expectedRevision?:number)=>withLocalWrite(async()=>{
  const latest=readSettings();
  if(latest.revision!==(expectedRevision??latestRef.current.revision)){accept(latest);throw new Error('另一窗口已更新设置。请重新打开编辑页后再保存，当前草稿未写入。');}
  const next=structuredClone(latest);mutate(next);next.revision++;const checked=validateSettings(next);await writeSettings(checked);accept(checked);return checked;
 }),[accept]);
 const restore=useCallback((data:AppSettings)=>withLocalWrite(async()=>{
  const next=validateSettings(data);let revision=latestRef.current.revision;
  try{revision=Math.max(revision,readSettings().revision);}catch{/* A validated backup can recover an unreadable record. */}
  next.revision=revision+1;await writeSettings(next);accept(next);
 }),[accept]);
 const catalog=useMemo(()=>managedCatalog(snapshot.data.eventOverrides),[snapshot.data.eventOverrides]);
 const setDirty=useCallback((value:boolean)=>{dirtyRef.current=value;},[]);
 const navigateSafely=useCallback((run:()=>void)=>{if(dirtyRef.current){setPendingNavigation({run});return false;}run();return true;},[]);
 return {settings:snapshot.data,settingsError:snapshot.error,saveSettings:save,restoreSettings:restore,reloadSettings:reload,catalog,setDirty,navigateSafely,pendingNavigation,setPendingNavigation};
}
const SettingsContext=createContext<ReturnType<typeof useSettingsState>|null>(null);
export function SettingsProvider({children}:{children:ReactNode}){const settings=useSettingsState();return <SettingsContext.Provider value={settings}>{children}<AlertDialog open={!!settings.pendingNavigation} onOpenChange={open=>{if(!open)settings.setPendingNavigation(null);}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>放弃未保存的修改？</AlertDialogTitle><AlertDialogDescription>当前草稿尚未保存，离开后将保留之前的设置。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>继续编辑</AlertDialogCancel><AlertDialogAction onClick={()=>{settings.setDirty(false);settings.pendingNavigation?.run();settings.setPendingNavigation(null);}}>放弃修改</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></SettingsContext.Provider>;}
export function useAppSettings(){const settings=useContext(SettingsContext);if(!settings)throw new Error('SettingsProvider is missing');return settings;}
export function useUnsavedChanges(dirty:boolean){const {setDirty}=useAppSettings();useEffect(()=>{setDirty(dirty);const unload=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};if(dirty)window.addEventListener('beforeunload',unload);return()=>{setDirty(false);window.removeEventListener('beforeunload',unload);};},[dirty,setDirty]);}
