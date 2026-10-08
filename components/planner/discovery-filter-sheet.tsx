import {RotateCcw,X} from 'lucide-react';
import {Checkbox} from '@/components/ui/checkbox';
import {Sheet,SheetContent,SheetHeader,SheetTitle,SheetDescription,SheetClose,SheetFooter} from '@/components/ui/sheet';
import {eventGameOptions} from '@/lib/event-tags';
import type {Status} from '@/lib/schedule';
import {FilterSelect,StatusFilter} from './controls';

export type DiscoveryFilterValue={statuses:Status[];buyin:string;gtd:string;game:string;sort:string;supp:boolean};
type DiscoveryFilterSheetProps={
 value:DiscoveryFilterValue;
 counts:Record<Status,number>;
 amountFilters:{buyin:[string,string][];gtd:[string,string][]};
 mixedCurrency:boolean;
 supplementCount:number;
 resultCount:number;
 open:boolean;
 onOpenChange:(open:boolean)=>void;
 onChange:(patch:Partial<DiscoveryFilterValue>)=>void;
 onReset:()=>void;
 onReturnFocus:()=>void;
};

export function DiscoveryFilterSheet({value,counts,amountFilters,mixedCurrency,supplementCount,resultCount,open,onOpenChange,onChange,onReset,onReturnFocus}:DiscoveryFilterSheetProps){
 return <Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent className="cart-sheet discovery-filter-sheet" showCloseButton={false} onCloseAutoFocus={event=>{event.preventDefault();onReturnFocus();}}>
   <SheetHeader className="cart-heading discovery-filter-heading">
    <SheetTitle>赛程筛选</SheetTitle>
    <SheetDescription>调整即时生效，完成后返回赛程。</SheetDescription>
    <SheetClose className="cart-close" aria-label="关闭赛程筛选"><X size={20} aria-hidden="true"/></SheetClose>
   </SheetHeader>
   <div className="cart-scroll discovery-filter-scroll">
    <section className="discovery-filter-section">
     <h3>个人分类</h3>
     <StatusFilter compact value={value.statuses} onChange={statuses=>onChange({statuses})} counts={counts}/>
    </section>
    <section className="discovery-filter-section discovery-filter-fields">
     <h3>费用与玩法</h3>
     <div><label htmlFor="discovery-filter-buyin">报名费</label><FilterSelect id="discovery-filter-buyin" fitOptions={mixedCurrency} label="报名费筛选" value={value.buyin} onChange={buyin=>onChange({buyin})} options={amountFilters.buyin}/></div>
     <div><label htmlFor="discovery-filter-guarantee">保底</label><FilterSelect id="discovery-filter-guarantee" fitOptions={mixedCurrency} label="保底筛选" value={value.gtd} onChange={gtd=>onChange({gtd})} options={amountFilters.gtd}/></div>
     <div><label htmlFor="discovery-filter-game">赛事类型</label><FilterSelect id="discovery-filter-game" label="赛事类型" value={value.game} onChange={game=>onChange({game})} options={eventGameOptions}/></div>
    </section>
    <section className="discovery-filter-section discovery-filter-fields">
     <h3>显示方式</h3>
     <div><label htmlFor="discovery-filter-sort">排序</label><FilterSelect id="discovery-filter-sort" label="排序" value={value.sort} onChange={sort=>onChange({sort})} options={[["date","日期顺序"],["buyin",mixedCurrency?"按币种 · 报名费升序":"报名费从低到高"],["gtd",mixedCurrency?"按币种 · 保底降序":"保底从高到低"]]}/></div>
     {supplementCount>0&&<label className="supplement-toggle"><Checkbox aria-label="显示官方补充卫星" checked={value.supp} onCheckedChange={checked=>onChange({supp:checked===true})}/>官方补充卫星 <b>+{supplementCount}</b></label>}
    </section>
   </div>
   <SheetFooter className="discovery-filter-footer">
    <button type="button" className="text-button discovery-filter-reset" onClick={onReset}><RotateCcw size={15} aria-hidden="true"/>重置筛选</button>
    <button type="button" className="primary-button discovery-filter-done" aria-label={`完成筛选，显示 ${resultCount} 个场次`} onClick={()=>onOpenChange(false)}>显示 {resultCount} 个场次</button>
   </SheetFooter>
  </SheetContent>
 </Sheet>;
}
