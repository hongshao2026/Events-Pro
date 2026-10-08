import {entries,series,getSeries,validDate,type Entry} from './catalog';
import {shortlistStatuses,type Status,type Slot,type Event} from './schedule';
import type {PlannerState} from './local-store';
import {regions,type RegionFilter} from './series';
export type AgendaRoute={seriesId:string;view:'home'|'discover'|'schedule'|'shortlist'|'profile'|'admin';region:RegionFilter;day:string;statuses:Status[];continuations:boolean;month:string};
export function agendaFromUrl():AgendaRoute{
 const p=new URLSearchParams(window.location.hash.slice(1)),day=p.get('day')||'',raw=p.get('agendaStatuses');
 const festival=getSeries(p.get('series')),month=p.get('month')||'',start=festival.start.slice(0,7),end=festival.end.slice(0,7);
 const selected=shortlistStatuses.filter(s=>raw?.split(',').includes(s));
 const requestedView=p.get('view'),region=regions.find(item=>item.id===p.get('region'))?.id||'all';
 const legacyDiscovery=['q','statuses','status','from','to','date','buyin','gtd','game','sort','supp','page'].some(key=>p.has(key));
 const view=requestedView==='shortlist'||requestedView==='profile'||requestedView==='admin'||requestedView==='schedule'?requestedView:requestedView==='discover'||(!requestedView&&(p.has('series')||legacyDiscovery))?'discover':'home';
 return {seriesId:p.get('series')||festival.id,view,region,day:validDate(day,festival)?day:'',statuses:raw==='none'||raw===''?[]:selected.length?selected:[...shortlistStatuses],continuations:p.get('continuations')!=='no',month:/^\d{4}-(0[1-9]|1[0-2])$/.test(month)&&month>=start&&month<=end?month:validDate(day,festival)?day.slice(0,7):start};
}
export type AgendaActivity={id:string;date:string;hour:number;status:Status;kind:'start'|'continuation';event:Event;slot:Slot;entry:Entry;buyin:number|null};
export function agendaActivities(state:PlannerState,supplement=false,seriesId=series.id,catalog=entries):AgendaActivity[]{
 const source=catalog.filter(e=>e.seriesId===seriesId&&(supplement||!e.event.supplement));
 const result:AgendaActivity[]=source.map(entry=>({id:entry.id,date:entry.date,hour:entry.hour,status:state.selections[entry.id]?.status||'undecided',kind:'start',event:entry.event,slot:entry.slot,entry,buyin:entry.buyin}));
 const seen=new Set<string>();
 for(const entry of source){
  if(seen.has(entry.eventId))continue;seen.add(entry.eventId);
  const flights=source.filter(e=>e.eventId===entry.eventId);
  const planned=flights.find(e=>state.selections[e.id]?.status==='attend'),watched=flights.find(e=>state.selections[e.id]?.status==='watch');
  const status:Status=planned||state.pending[entry.eventId]?'attend':watched?'watch':flights.every(e=>state.selections[e.id]?.status==='skip')?'skip':'undecided';
  entry.event.continuations.forEach((slot,index)=>result.push({id:`${entry.seriesId}/${entry.eventId}/continuation/${index}`,date:slot.date,hour:slot.hour,status,kind:'continuation',event:entry.event,slot,entry:planned||watched||entry,buyin:0}));
 }
 return result.sort((a,b)=>a.date.localeCompare(b.date)||a.hour-b.hour||a.id.localeCompare(b.id));
}
