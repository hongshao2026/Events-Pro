import {createContext,useContext,useMemo,useRef,useState,type ComponentProps} from 'react';
import {ChevronRight,CalendarDays,X,Star} from 'lucide-react';
import {zhCN} from 'date-fns/locale';
import {Calendar,CalendarDayButton} from '@/components/ui/calendar';
import {Checkbox} from '@/components/ui/checkbox';
import {Sheet,SheetContent,SheetHeader,SheetTitle,SheetDescription,SheetClose} from '@/components/ui/sheet';
import {EntryActions,StatusFilter} from './controls';
import {StatusBadge} from './status';
import {EntryDetails} from './entry-details';
import {agendaActivities,type AgendaRoute} from '@/lib/agenda';
import {dateObject,dateValue,series,type Entry} from '@/lib/catalog';
import {statuses,statusLabels,slotName,clock,shortDate,usd,guarantee,type Status} from '@/lib/schedule';
import type {PlannerState} from '@/lib/local-store';

type DaySummary={counts:Record<Status,number>;total:number};
const DayContext=createContext<Record<string,DaySummary>>({});
function ScheduleDayButton(props:ComponentProps<typeof CalendarDayButton>){
 const map=useContext(DayContext),day=map[dateValue(props.day.date)];
 const summary=day?statuses.filter(s=>day.counts[s]).map(s=>`${day.counts[s]}场${statusLabels[s]}`).join('，'):'';
 return <CalendarDayButton {...props} className={`${props.className||''} schedule-day-button`} aria-label={`${props['aria-label']||shortDate(dateValue(props.day.date))}${day?'，'+day.total+'场比赛，'+summary:''}`}><span className="calendar-day-number">{props.day.date.getDate()}</span><span className="calendar-status-dots" aria-hidden="true">{day&&statuses.filter(s=>day.counts[s]).map(s=><i data-status={s} key={s}/>)}</span><small className="calendar-day-count">{day?day.total+'场':''}</small></CalendarDayButton>;
}
export function MySchedule({state,route,onRouteChange,supplement,onSupplementChange,blocked,error,onChoose,onShowFlights}:{state:PlannerState;route:AgendaRoute;onRouteChange:(patch:Partial<AgendaRoute>)=>void;supplement:boolean;onSupplementChange:(v:boolean)=>void;blocked:boolean;error:string;onChoose:(entry:Entry,status:Status)=>boolean;onShowFlights:(id:string)=>void}){
 const [openId,setOpenId]=useState<string|null>(null);
 const returnFocus=useRef<HTMLButtonElement|null>(null),summaryRef=useRef<HTMLDivElement|null>(null);
 const selectDay=(day:Date|undefined)=>{onRouteChange({day:day?dateValue(day):''});requestAnimationFrame(()=>summaryRef.current?.scrollIntoView({block:'start'}));};
 const all=useMemo(()=>agendaActivities(state,supplement),[state,supplement]);
 const included=useMemo(()=>all.filter(item=>route.continuations||item.kind==='start'),[all,route.continuations]);
 const counts=useMemo(()=>Object.fromEntries(statuses.map(s=>[s,included.filter(item=>item.status===s).length])) as Record<Status,number>,[included]);
 const allowed=useMemo(()=>included.filter(item=>route.statuses.includes(item.status)),[included,route.statuses]);
 const summary=useMemo(()=>{const result:Record<string,DaySummary>={};for(const item of allowed){const day=result[item.date]||(result[item.date]={total:0,counts:{undecided:0,attend:0,watch:0,skip:0}});day.total++;day.counts[item.status]++;}return result;},[allowed]);
 const shown=allowed.filter(item=>!route.day||item.date===route.day);
 const dates=[...new Set(shown.map(item=>item.date))],detail=all.find(item=>item.id===openId);
 return <section className="my-schedule" aria-label="我的日程表">
  <div className="schedule-calendar-panel"><div className="schedule-calendar-top"><span><CalendarDays size={16}/>11.27 — 12.21 · PST</span><button className={!route.day?'active':''} aria-pressed={!route.day} onClick={()=>onRouteChange({day:''})}>全部日期</button></div><DayContext.Provider value={summary}><Calendar mode="single" required locale={zhCN} month={dateObject(route.month+'-01')} onMonthChange={d=>onRouteChange({month:dateValue(d).slice(0,7)})} selected={route.day?dateObject(route.day):undefined} onSelect={selectDay} startMonth={dateObject(series.start)} endMonth={dateObject(series.end)} disabled={{before:dateObject(series.start),after:dateObject(series.end)}} showOutsideDays={false} components={{DayButton:ScheduleDayButton}} labels={{labelNext:()=> '下个月',labelPrevious:()=> '上个月'}}/></DayContext.Provider><p className="calendar-help">日期下方的色点对应比赛分类，点击日期查看当天。</p></div>
  <StatusFilter value={route.statuses} onChange={value=>onRouteChange({statuses:value})} counts={counts}/>
  <div className="agenda-options"><button className="shortlist-only" onClick={()=>onRouteChange({statuses:['attend','watch']})}><Star size={13}/>只看参加与关注</button><label><Checkbox checked={route.continuations} onCheckedChange={v=>onRouteChange({continuations:v===true})} aria-label="显示晋级续赛"/>晋级续赛</label><label><Checkbox checked={supplement} onCheckedChange={v=>onSupplementChange(v===true)} aria-label="日程显示官方补充卫星"/>补充卫星</label></div>
  <div className="agenda-summary" aria-live="polite" ref={summaryRef} tabIndex={-1}><strong>{route.day?shortDate(route.day)+' 的比赛':'全部日程'}</strong><span>{dates.length} 天 · {shown.length} 场</span></div>
  <div className="agenda-list">{dates.map(date=><section className="agenda-date-section" key={date} aria-label={`${shortDate(date)} 的比赛`}><header className="agenda-date-heading"><h2>{shortDate(date)} <span>{dateObject(date).toLocaleDateString('zh-CN',{weekday:'long'})}</span></h2><span>{summary[date]?.counts.attend||0} 场参加</span></header><div className="agenda-day-list">{shown.filter(item=>item.date===date).map(item=><button key={item.id} className="agenda-row status-surface" data-status={item.status} data-activity-id={item.id} data-entry-id={item.kind==='start'?item.entry.id:undefined} onClick={e=>{returnFocus.current=e.currentTarget;setOpenId(item.id);}} aria-label={`${shortDate(item.date)} ${clock(item.hour)} ${item.event.title} ${slotName(item.slot)}，${statusLabels[item.status]}${item.kind==='continuation'?'，晋级后参加':''}`}><time>{clock(item.hour)}</time><span className="agenda-row-main"><strong>{item.event.title}</strong><span><b>{slotName(item.slot)}</b><small>{item.kind==='continuation'?'晋级后 · 无新增买入':usd(item.buyin)}</small></span></span><StatusBadge status={item.status}/><ChevronRight size={14}/></button>)}</div></section>)}</div>
  {!shown.length&&<div className="empty-state"><CalendarDays size={28}/><h3>{route.day?'当天没有符合分类的比赛':'没有符合分类的比赛'}</h3><p>{route.statuses.length?'试试显示全部分类或全部日期。':'请至少勾选一个分类。'}</p><button onClick={()=>onRouteChange({day:'',statuses:[...statuses]})}>显示全部日程</button></div>}
  <p className="agenda-note">晋级续赛以成功晋级为前提，颜色跟随对应赛事的起始组选择，不增加报名预算。</p>
  <Sheet open={!!detail} onOpenChange={open=>{if(!open)setOpenId(null);}}><SheetContent className="cart-sheet agenda-detail-sheet" showCloseButton={false} onCloseAutoFocus={e=>{e.preventDefault();if(returnFocus.current?.isConnected)returnFocus.current.focus({preventScroll:true});else summaryRef.current?.focus({preventScroll:true});}}>{detail&&<><SheetHeader className="cart-heading"><SheetTitle>{detail.event.title}</SheetTitle><SheetDescription>{shortDate(detail.date)} {clock(detail.hour)} · {slotName(detail.slot)} · PST</SheetDescription><SheetClose className="cart-close" aria-label="关闭比赛详情"><X size={20}/></SheetClose></SheetHeader><div className="agenda-detail-meta"><StatusBadge status={detail.status}/><strong>{detail.kind==='start'?usd(detail.buyin):'晋级续赛'}</strong><span>{detail.event.kind==='satellite'?'席位':'赛事保底'} {guarantee(detail.event)}</span></div><div className="cart-scroll"><EntryDetails entry={detail.entry} occurrence={detail.slot} continuation={detail.kind==='continuation'} scope="agenda" onShowFlights={onShowFlights}/>{detail.kind==='continuation'&&<p className="agenda-detail-note">此续赛的分类跟随已选起始组。可返回赛事页调整起始组。</p>}</div><div className="agenda-detail-actions">{error&&<p className="cart-error" role="alert">{error}</p>}{detail.kind==='start'?<EntryActions entry={detail.entry} value={detail.status} disabled={blocked} onChange={status=>onChoose(detail.entry,status)}/>:<button className="primary-button" onClick={()=>onShowFlights(detail.event.id)}>查看起始组选择</button>}</div></>}</SheetContent></Sheet>
 </section>;
}
