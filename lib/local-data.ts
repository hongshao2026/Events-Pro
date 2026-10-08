import {STORAGE_KEY,LEGACY_KEY} from './local-store';
import {SETTINGS_KEY} from './app-settings';

export function clearLocalPlannerData():void{
  const keys=[STORAGE_KEY,LEGACY_KEY,SETTINGS_KEY];
  let previous:(string|null)[];
  try{previous=keys.map(key=>localStorage.getItem(key));}
  catch{throw new Error('无法读取本机记录，请检查存储权限后重试。');}
  try{keys.forEach(key=>localStorage.removeItem(key));}
  catch{
    let restored=true;
    keys.forEach((key,index)=>{try{if(previous[index]!==null)localStorage.setItem(key,previous[index]!);}catch{restored=false;}});
    throw new Error(restored?'未能清除本机记录，原记录已恢复。请检查存储权限后重试。':'清除未完成，部分记录可能已移除。请重新读取，或恢复备份。');
  }
}
