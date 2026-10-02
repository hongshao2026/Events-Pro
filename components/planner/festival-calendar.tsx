import {useEffect,useState} from 'react';
import {CalendarDays,ChevronDown} from 'lucide-react';
import {zhCN} from 'date-fns/locale';
import type {DateRange} from 'react-day-picker';
import {Calendar} from '@/components/ui/calendar';
import {Popover,PopoverTrigger,PopoverContent} from '@/components/ui/popover';
import {series,dateObject,dateValue} from '@/lib/catalog';
import {shortDate} from '@/lib/schedule';
export function FestivalCalendar({from,to,onChange,plannedDates}:{from:string;to:string;onChange:(from:string,to:string)=>void;plannedDates:string[]}){
 const [open,setOpen]=useState(false),[draft,setDraft]=useState<DateRange|undefined>(),[narrow,setNarrow]=useState(false);
 useEffect(()=>{const media=window.matchMedia('(max-width:680px)');const update=()=>setNarrow(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 const changeOpen=(value:boolean)=>{setOpen(value);if(value)setDraft(from?{from:dateObject(from),to:dateObject(to||from)}:undefined);};
 const label=from?(from===to?shortDate(from):`${shortDate(from)} — ${shortDate(to)}`):'选择日期';
 return <div className="date-filter"><button className={`all-dates ${!from?'active':''}`} aria-pressed={!from} onClick={()=>onChange('','')}><CalendarDays size={17}/>全部日期</button><Popover open={open} onOpenChange={changeOpen}><PopoverTrigger className={`calendar-trigger ${from?'active':''}`} aria-label={`选择赛事日期${from?'，'+label:''}`}><CalendarDays size={17}/>{label}<ChevronDown size={15}/></PopoverTrigger><PopoverContent align="start" sideOffset={8} collisionPadding={12} className="festival-calendar" aria-label="赛事日期日历"><div className="calendar-heading"><strong>选择开赛日期</strong><p>点击一天，或选择首尾日期后应用。</p></div><Calendar mode="range" locale={zhCN} numberOfMonths={narrow?1:2} defaultMonth={dateObject(from||series.start)} startMonth={dateObject(series.start)} endMonth={dateObject(series.end)} disabled={{before:dateObject(series.start),after:dateObject(series.end)}} showOutsideDays={false} selected={draft} onSelect={setDraft} autoFocus modifiers={{planned:plannedDates.map(dateObject)}} modifiersClassNames={{planned:'has-planned'}} labels={{labelNext:()=> '下个月',labelPrevious:()=> '上个月'}}/><div className="calendar-footer"><span>{draft?.from?`${shortDate(dateValue(draft.from))}${draft.to&&dateValue(draft.to)!==dateValue(draft.from)?' — '+shortDate(dateValue(draft.to)):''}`:'11/27 — 12/21'}<small>圆点表示已计划参加</small></span><button className="text-button" onClick={()=>setOpen(false)}>取消</button><button className="primary-button" disabled={!draft?.from} onClick={()=>{if(draft?.from){onChange(dateValue(draft.from),dateValue(draft.to||draft.from));setOpen(false);}}}>应用日期</button></div></PopoverContent></Popover><span className="date-boundary">11月27日 — 12月21日 <span>· 开赛日期 / PST</span></span></div>;
}
