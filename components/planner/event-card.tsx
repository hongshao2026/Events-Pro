import {ChevronDown,Clock3} from 'lucide-react';
import {getSeries,type Entry} from '@/lib/catalog';
import {clock,eventNumber,guarantee,isNlh,shortDate,type Status} from '@/lib/schedule';
import {registrationDeadline} from '@/lib/registration';
import {EntryActions} from './controls';
import {EntryDetails} from './entry-details';
import {PriceAmount} from './price-amount';

type EventCardProps={
 entry:Entry;
 status:Status;
 blocked:boolean;
 expanded:boolean;
 onToggle:()=>void;
 onChoose:(status:Status)=>void;
 onShowFlights:(eventId:string)=>void;
};

export function EventCard({entry,status,blocked,expanded,onToggle,onChoose,onShowFlights}:EventCardProps){
 const event=entry.event,series=getSeries(entry.seriesId),deadline=registrationDeadline(entry.slot,series.timeLabel);
 const highlights=[
  event.kind==='satellite'?'卫星赛':!isNlh(event)?event.group:'',
  event.restricted?'资格限制':'',
  event.supplement?'官方补充':'',
 ].filter(Boolean);
 return <article data-entry-id={entry.id} data-status={status} className={`mobile-event status-surface row-${status}`}>
  <div className="mobile-event-top">
   <time dateTime={`${entry.date}T${clock(entry.hour)}`}>{shortDate(entry.date)} · {clock(entry.hour)}</time>
   <span className="flight-tag">{entry.flightLabel}</span>
   <span className="event-number">{eventNumber(event)}</span>
  </div>
  <button className="event-title" aria-expanded={expanded} aria-controls={`detail-${entry.slot.id}-mobile`} onClick={onToggle}>
   <span>{event.title}</span><ChevronDown size={16} aria-hidden="true"/>
  </button>
  {highlights.length>0&&<div className="mobile-event-meta">{highlights.map(label=><span key={label} className={label==='资格限制'?'event-restriction':undefined}>{label}</span>)}</div>}
  <div className="mobile-money">
   <span className="event-buyin"><span className="money-label">报名</span><b><PriceAmount value={entry.buyin} currency={entry.currency}/></b></span>
   <span className="event-guarantee"><span className="money-label">{event.kind==='satellite'?'席位':'整赛保底'}</span><b>{guarantee(event)}</b></span>
  </div>
  {deadline&&<p className="registration-summary"><Clock3 size={12} aria-hidden="true"/><span>报名截止 <span>{deadline.compact}</span></span></p>}
  <EntryActions entry={entry} value={status} disabled={blocked} onChange={onChoose}/>
  {expanded&&<EntryDetails entry={entry} scope="mobile" onShowFlights={onShowFlights}/>}
 </article>;
}
