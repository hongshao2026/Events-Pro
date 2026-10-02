import {entries,series,validDate,type Entry} from './catalog';
import {statuses,type Status,type Slot,type Event} from './schedule';
import type {PlannerState} from './local-store';
import {regions,type RegionFilter} from './series';
export type AgendaRoute={view:'home'|'discover'|'schedule';region:RegionFilter;seriesId:string;day:string;statuses:Status[];continuations:boolean;month:string};
export function agendaFromUrl():AgendaRoute{
 const p=new URLSearchParams(window.location.hash.slice(1)),day=p.get('day')||'',raw=p.get('agendaStatuses');
 const view=p.get('view'),region=regions.find(item=>item.id===p.get('region'))?.id||'all';
 return {view:view==='schedule'?'schedule':view==='discover'||(!view&&p.has('series'))?'discover':'home',region,seriesId:p.get('series')||series.id,day:validDate(day)?day:'',statuses:raw===null?[...statuses]:statuses.filter(s=>raw.split(',').includes(s)),continuations:p.get('continuations')!=='no',month:['2026-11','2026-12'].includes(p.get('month')||'')?p.get('month')!:validDate(day)?day.slice(0,7):'2026-11'};
}
export type AgendaActivity={id:string;date:string;hour:number;status:Status;kind:'start'|'continuation';event:Event;slot:Slot;entry:Entry;buyin:number};
export function agendaActivities(state:PlannerState,supplement=false):AgendaActivity[]{
 const source=entries.filter(e=>supplement||!e.event.supplement);
 const result:AgendaActivity[]=source.map(entry=>({id:entry.id,date:entry.date,hour:entry.hour,status:state.selections[entry.id]?.status||'undecided',kind:'start',event:entry.event,slot:entry.slot,entry,buyin:entry.buyin}));
 const seen=new Set<string>();
 for(const entry of source){
  if(seen.has(entry.eventId))continue;seen.add(entry.eventId);
  const flights=source.filter(e=>e.eventId===entry.eventId);
  const planned=flights.find(e=>state.selections[e.id]?.status==='attend'),watched=flights.find(e=>state.selections[e.id]?.status==='watch');
  const status:Status=planned||state.pending[entry.eventId]?'attend':watched?'watch':flights.every(e=>state.selections[e.id]?.status==='skip')?'skip':'undecided';
  entry.event.continuations.forEach((slot,index)=>result.push({id:`${series.id}/${entry.eventId}/continuation/${index}`,date:slot.date,hour:slot.hour,status,kind:'continuation',event:entry.event,slot,entry:planned||watched||entry,buyin:0}));
 }
 return result.sort((a,b)=>a.date.localeCompare(b.date)||a.hour-b.hour||a.id.localeCompare(b.id));
}
