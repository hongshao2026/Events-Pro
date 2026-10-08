import {RotateCcw,X} from 'lucide-react';
import {useEffect,useRef,useState,type ReactElement} from 'react';
import {Checkbox} from '@/components/ui/checkbox';
import {Popover,PopoverAnchor,PopoverContent} from '@/components/ui/popover';
import {eventGameOptions} from '@/lib/event-tags';
import {currencyNames,type DisplayCurrency} from '@/lib/money';
import {parseBuyinRange} from '@/lib/buyin-range';
import type {Status} from '@/lib/schedule';
import {FilterSelect,StatusFilter} from './controls';

export type DiscoveryFilterValue={statuses:Status[];buyinMin:string;buyinMax:string;game:string;supp:boolean};
type DiscoveryFilterPopoverProps={
 children:ReactElement;
 value:DiscoveryFilterValue;
 counts:Record<Status,number>;
 currency:DisplayCurrency;
 originalCurrency:boolean;
 rangeNotice:string;
 unavailableBuyins:number;
 resetVersion:number;
 supplementCount:number;
 resultCount:number;
 open:boolean;
 onOpenChange:(open:boolean)=>void;
 onChange:(patch:Partial<DiscoveryFilterValue>)=>void;
 onRangeChange:(min:string,max:string)=>void;
 onReset:()=>void;
};

export function DiscoveryFilterPopover({children,value,counts,currency,originalCurrency,rangeNotice,unavailableBuyins,resetVersion,supplementCount,resultCount,open,onOpenChange,onChange,onRangeChange,onReset}:DiscoveryFilterPopoverProps){
 const [rangeDraft,setRangeDraft]=useState(()=>({min:value.buyinMin,max:value.buyinMax,sourceMin:value.buyinMin,sourceMax:value.buyinMax,currency,version:resetVersion}));
 const composing=useRef(false);
 const current=rangeDraft.version===resetVersion&&rangeDraft.currency===currency&&rangeDraft.sourceMin===value.buyinMin&&rangeDraft.sourceMax===value.buyinMax?rangeDraft:{min:value.buyinMin,max:value.buyinMax};
 const rangeError=parseBuyinRange(current.min,current.max,currency).error;
 const changeRange=(field:'min'|'max',text:string)=>{
  const next={min:current.min,max:current.max,[field]:text},parsed=parseBuyinRange(next.min,next.max,currency);
  const valid=!parsed.error&&!composing.current;
  const min=valid?(parsed.min===null?'':String(parsed.min)):value.buyinMin,max=valid?(parsed.max===null?'':String(parsed.max)):value.buyinMax;
  setRangeDraft({...next,sourceMin:min,sourceMax:max,currency,version:resetVersion});
  if(valid)onRangeChange(min,max);
 };
 const reset=()=>{setRangeDraft({min:'',max:'',sourceMin:'',sourceMax:'',currency,version:resetVersion});onReset();};
 useEffect(()=>{
  if(!open)return;
  const openedX=window.scrollX,openedY=window.scrollY;
  // A scroll queued before the trigger was clicked must not dismiss the new popover.
  const close=()=>{if(window.scrollX!==openedX||window.scrollY!==openedY)onOpenChange(false);};
  window.addEventListener('scroll',close,{passive:true});
  return()=>window.removeEventListener('scroll',close);
 },[open,onOpenChange]);
 return <Popover modal={false} open={open} onOpenChange={onOpenChange}>
  <PopoverAnchor asChild>{children}</PopoverAnchor>
  <PopoverContent className="discovery-filter-popover" aria-label="赛程筛选" side="bottom" align="start" sideOffset={8} collisionPadding={{top:12,right:12,bottom:80,left:12}}>
   <div className="discovery-filter-topbar">
    <h2>筛选条件</h2>
    <button type="button" className="text-button discovery-filter-close" aria-label="收起赛程筛选" onClick={()=>onOpenChange(false)}><span>收起</span><X size={15} aria-hidden="true"/></button>
   </div>
   <div className="discovery-filter-scroll">
    <section className="discovery-filter-section">
     <h3>个人分类</h3>
     <StatusFilter compact value={value.statuses} onChange={statuses=>onChange({statuses})} counts={counts}/>
    </section>
    <section className="discovery-filter-section discovery-filter-fields">
     <h3>费用与玩法</h3>
     <fieldset className="buyin-range"><legend>报名费 <span>{currencyNames[currency]} · {currency}</span></legend><div className="buyin-range-inputs">{(['min','max'] as const).map((field,index)=><span key={field} className="buyin-range-part">{index>0&&<span className="buyin-range-separator" aria-hidden="true">—</span>}<span className="buyin-range-input"><input aria-label={field==='min'?'最低报名费':'最高报名费'} inputMode="decimal" autoComplete="off" maxLength={18} placeholder={field==='min'?'最低':'最高'} value={current[field]} aria-invalid={!!rangeError} aria-describedby={`buyin-range-hint${rangeError?' buyin-range-error':''}`} onCompositionStart={()=>{composing.current=true;}} onCompositionEnd={event=>{composing.current=false;changeRange(field,event.currentTarget.value);}} onChange={event=>changeRange(field,event.target.value)}/>{current[field]&&<button type="button" aria-label={field==='min'?'清空最低报名费':'清空最高报名费'} onClick={event=>{changeRange(field,'');event.currentTarget.parentElement?.querySelector('input')?.focus();}}><X size={12} aria-hidden="true"/></button>}</span></span>)}</div><p id="buyin-range-hint" className="filter-hint">留空不限{originalCurrency?'；当前按赛事主币种筛选':''}</p>{rangeError&&<p id="buyin-range-error" className="filter-error" role="alert">{rangeError}</p>}{rangeNotice&&<p className="filter-hint" role="status">{rangeNotice}</p>}{unavailableBuyins>0&&<p className="filter-hint" role="status">{unavailableBuyins} 个场次因报名费未公布或缺少汇率，未纳入区间结果。</p>}</fieldset>
     <div><label htmlFor="discovery-filter-game">赛事类型</label><FilterSelect id="discovery-filter-game" label="赛事类型" value={value.game} onChange={game=>onChange({game})} options={eventGameOptions}/></div>
    </section>
    {supplementCount>0&&<section className="discovery-filter-section discovery-filter-fields"><label className="supplement-toggle"><Checkbox aria-label="显示官方补充卫星" checked={value.supp} onCheckedChange={checked=>onChange({supp:checked===true})}/>官方补充卫星 <b>+{supplementCount}</b></label></section>}
   </div>
   <div className="discovery-filter-footer">
    <button type="button" className="text-button discovery-filter-reset" onClick={reset}><RotateCcw size={15} aria-hidden="true"/>重置筛选</button>
    <button type="button" className="primary-button discovery-filter-done" disabled={!!rangeError} aria-label={`完成筛选，显示 ${resultCount} 个场次`} onClick={()=>onOpenChange(false)}>显示 {resultCount} 个场次</button>
   </div>
  </PopoverContent>
 </Popover>;
}
