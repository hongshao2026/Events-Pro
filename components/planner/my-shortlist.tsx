import {useMemo,useRef,useState} from 'react';
import {ArrowLeftRight,Table2,X} from 'lucide-react';
import {Sheet,SheetContent,SheetHeader,SheetTitle,SheetDescription,SheetClose} from '@/components/ui/sheet';
import {EntryActions,FilterSelect} from './controls';
import {StatusBadge} from './status';
import {EntryDetails} from './entry-details';
import {ShortlistExport} from './shortlist-export';
import {entryMap,entryName,eventMap,getSeries,type Entry} from '@/lib/catalog';
import {budget,type PlannerState} from '@/lib/local-store';
import {shortlistBudget,shortlistEntries} from '@/lib/shortlist';
import {clock,cny,guarantee,shortDate,usd,type Event,type Status} from '@/lib/schedule';

type ShortlistFilter='all'|'attend'|'watch';
type ShortlistRow={kind:'entry';entry:Entry;date:string;hour:number;id:string}|{kind:'pending';event:Event;date:string;hour:number;id:string};
type MyShortlistProps={
 state:PlannerState;
 blocked:boolean;
 error:string;
 onChoose:(entry:Entry,status:Status)=>boolean;
 onBudgetModeChange:(mode:PlannerState['budgetMode'])=>void;
 onShowFlights:(eventId:string)=>void;
 onRemovePending:(eventId:string)=>void;
 onDiscover:()=>void;
};

export function MyShortlist({state,blocked,error,onChoose,onBudgetModeChange,onShowFlights,onRemovePending,onDiscover}:MyShortlistProps){
 const [filter,setFilter]=useState<ShortlistFilter>('all'),[openId,setOpenId]=useState<string|null>(null);
 const returnFocus=useRef<HTMLButtonElement|null>(null),summaryRef=useRef<HTMLDivElement|null>(null);
 const selected=useMemo(()=>shortlistEntries(state),[state]),amounts=useMemo(()=>shortlistBudget(state),[state]);
 const cost=budget(state),attending=selected.filter(entry=>state.selections[entry.id].status==='attend').length,watching=selected.length-attending;
 const pending=Object.keys(state.pending).flatMap(id=>{const event=eventMap.get(id);return event?[event]:[];});
 const count=selected.length+pending.length;
 const rows:ShortlistRow[]=[
  ...selected.filter(entry=>filter==='all'||state.selections[entry.id].status===filter).map(entry=>({kind:'entry' as const,entry,date:entry.date,hour:entry.hour,id:entry.id})),
  ...(filter==='watch'?[]:pending.map(event=>({kind:'pending' as const,event,date:event.date,hour:event.hour,id:event.id}))),
 ].sort((a,b)=>a.date.localeCompare(b.date)||a.hour-b.hour||a.id.localeCompare(b.id));
 const detail=openId?entryMap.get(openId):undefined,detailStatus=detail?state.selections[detail.id]?.status||'undecided':'undecided';
 const detailSeries=detail?getSeries(detail.seriesId):undefined;
 const choose=(entry:Entry,status:Status)=>{
  if(onChoose(entry,status)&&(status!=='attend'&&status!=='watch'||filter!=='all'&&status!==filter))setOpenId(null);
 };
 const showFlights=(eventId:string)=>{setOpenId(null);onShowFlights(eventId);};
 const removePending=(eventId:string,button:HTMLButtonElement)=>{
  onRemovePending(eventId);
  requestAnimationFrame(()=>{if(!button.isConnected)summaryRef.current?.focus({preventScroll:true});});
 };
 return <section className="my-shortlist" aria-label="我的自选表格">
  <div className="cart-budget shortlist-budget"><div><div className="shortlist-budget-top"><span>计划参加预算</span><ShortlistExport state={state} count={count} blocked={blocked}/></div><strong>{usd(cost.total)} <small>{cny(cost.total)}</small></strong><p>{cost.flightCount} 个起始组 · {cost.eventCount} 项赛事{cost.pendingCount?` · ${cost.pendingCount} 项待安排`:''}，关注不计入预算</p></div><FilterSelect label="预算计算方式" value={state.budgetMode} disabled={blocked} onChange={value=>onBudgetModeChange(value as PlannerState['budgetMode'])} options={[["flights","每个起始组各算一次"],["events","同一赛事只算一次"]]}/></div>
  <div className="shortlist-tabs" role="group" aria-label="自选分类">{(['all','attend','watch'] as const).map(tab=><button key={tab} className={filter===tab?'active':''} aria-pressed={filter===tab} onClick={()=>setFilter(tab)}>{tab==='all'?'全部自选':tab==='attend'?'计划参加':'正在关注'} <span>{tab==='all'?count:tab==='attend'?attending+pending.length:watching}</span></button>)}</div>
  <div className="shortlist-summary" aria-live="polite" ref={summaryRef} tabIndex={-1}><strong>{rows.length} 条自选</strong><span>按开赛时间排列 · 各赛事当地时间</span></div>
  {rows.length>0?<>
   <p className="shortlist-scroll-hint" id="shortlist-scroll-hint"><ArrowLeftRight size={14} aria-hidden="true"/>左右滑动查看完整表格 · 点赛事查看详情</p>
   <div className="shortlist-table-scroll" tabIndex={0} role="region" aria-label="自选赛事表格" aria-describedby="shortlist-scroll-hint">
    <table className="shortlist-table"><caption className="sr-only">我的自选：{rows.length} 条。预算汇总全部参加场次，关注不计预算，保底与席位不累加。</caption><colgroup><col className="shortlist-col-name"/><col className="shortlist-col-date"/><col className="shortlist-col-buyin"/><col className="shortlist-col-status"/><col className="shortlist-col-budget"/><col className="shortlist-col-guarantee"/><col className="shortlist-col-series"/></colgroup><thead><tr><th scope="col">赛事</th><th scope="col">开赛时间</th><th scope="col">报名费</th><th scope="col">状态</th><th scope="col">计入预算</th><th scope="col">保底 / 席位</th><th scope="col">系列 / 地点</th></tr></thead><tbody>{rows.map(row=>{
     if(row.kind==='pending'){
      const event=row.event,series=getSeries(event.seriesId);
      return <tr key={'pending/'+event.id} className="shortlist-pending" data-event-id={event.id} data-status="attend"><th scope="row"><strong className="shortlist-pending-name">{event.title}</strong><span className="shortlist-entry-meta">{event.officialNumber?'#'+event.officialNumber:event.id}</span><div className="shortlist-pending-actions"><button className="text-button" onClick={()=>showFlights(event.id)}>选择起始组 →</button><button className="text-button" disabled={blocked} onClick={eventClick=>removePending(event.id,eventClick.currentTarget)}>移出自选</button></div></th><td><strong>待安排起始组</strong><span className="shortlist-cell-note">旧版参加计划</span></td><td className="shortlist-money">{usd(event.buyin||0)}</td><td><StatusBadge status="attend"/></td><td className="shortlist-money" data-column="budget"><strong>{usd(amounts.pending[event.id]||0)}</strong><span className="shortlist-cell-note">{amounts.pending[event.id]?'暂计一次':'同赛事已计'}</span></td><td>{guarantee(event)}<span className="shortlist-cell-note">{event.kind==='satellite'?'席位保底':'整项赛事共享'}</span></td><td><strong>{series.shortTitle}</strong><span className="shortlist-cell-note">{series.city} · {series.venue}</span></td></tr>;
     }
     const entry=row.entry,status=state.selections[entry.id].status,series=getSeries(entry.seriesId),amount=amounts.entries[entry.id]||0;
     return <tr key={entry.id} data-entry-id={entry.id} data-status={status}><th scope="row"><button className="shortlist-entry-button" aria-label={`查看 ${entryName(entry)} 详情`} onClick={event=>{returnFocus.current=event.currentTarget;setOpenId(entry.id);}}><strong className="shortlist-entry-name">{entry.event.title}</strong><span className="shortlist-entry-meta"><b className="flight-tag">{entry.flightLabel}</b><span>{entry.event.officialNumber?'#'+entry.event.officialNumber:entry.eventId}</span></span></button>{entry.event.supplement&&<span className="shortlist-cell-note">官方补充</span>}</th><td><time dateTime={`${entry.date}T${clock(entry.hour)}`}><strong>{shortDate(entry.date)}</strong><span className="shortlist-cell-note">{clock(entry.hour)} · {series.timeLabel}</span><span className="shortlist-cell-note">{entry.date.slice(0,4)}</span></time></td><td className="shortlist-money">{usd(entry.buyin)}</td><td><StatusBadge status={status}/></td><td className="shortlist-money" data-column="budget"><strong>{usd(amount)}</strong>{status==='watch'?<span className="shortlist-cell-note">关注不计预算</span>:state.budgetMode==='events'&&amount===0?<span className="shortlist-cell-note">同赛事已计</span>:<span className="shortlist-cell-note">{state.budgetMode==='events'?'同赛事计一次':'本起始组'}</span>}</td><td>{guarantee(entry.event)}<span className="shortlist-cell-note">{entry.event.kind==='satellite'?'席位保底':'整项赛事共享'}</span></td><td><strong>{series.shortTitle}</strong><span className="shortlist-cell-note">{series.city} · {series.venue}</span></td></tr>;
    })}</tbody></table>
   </div>
   <p className="shortlist-table-note">预算汇总全部参加场次，不受上方分类筛选影响。保底与席位不累加。{cost.pendingCount>0?'待安排记录保留原参加计划，选定一个起始组“参加”后自动完成安排。':''}</p>
  </>:<div className="empty-state shortlist-empty"><Table2 size={30}/><h3>{count?'这个分类还没有场次':'自选表还是空的'}</h3><p>在赛程里标记“参加”或“关注”，<br/>就能在这里查看计划和预算。</p>{count?<button className="primary-button" onClick={()=>setFilter('all')}>显示全部自选</button>:<button className="primary-button" onClick={onDiscover}>去挑比赛</button>}</div>}
  <div className="shortlist-foot"><span>每个起始组独立保存 · 参加不等于实际报名</span></div>
  <Sheet open={!!detail} onOpenChange={open=>{if(!open)setOpenId(null);}}><SheetContent className="cart-sheet shortlist-detail-sheet" showCloseButton={false} onCloseAutoFocus={event=>{event.preventDefault();if(returnFocus.current?.isConnected)returnFocus.current.focus({preventScroll:true});else summaryRef.current?.focus({preventScroll:true});}}>{detail&&<><SheetHeader className="cart-heading"><SheetTitle>{detail.event.title}</SheetTitle><SheetDescription>{shortDate(detail.date)} {clock(detail.hour)} · {detail.flightLabel} · {detailSeries?.timeLabel}</SheetDescription><SheetClose className="cart-close" aria-label="关闭比赛详情"><X size={20}/></SheetClose></SheetHeader><div className="agenda-detail-meta"><StatusBadge status={detailStatus}/><strong>{usd(detail.buyin)}</strong><span>{detail.event.kind==='satellite'?'席位':'赛事保底'} {guarantee(detail.event)}</span></div><div className="cart-scroll"><EntryDetails entry={detail} scope="shortlist" onShowFlights={showFlights}/></div><div className="agenda-detail-actions shortlist-detail-actions">{error&&<p className="cart-error" role="alert">{error}</p>}<EntryActions entry={detail} value={detailStatus} disabled={blocked} onChange={status=>choose(detail,status)}/></div></>}</SheetContent></Sheet>
 </section>;
}
