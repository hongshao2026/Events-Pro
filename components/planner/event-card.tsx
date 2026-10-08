import {Check,ChevronRight,Clock3,Star} from 'lucide-react';
import {getSeries,type Entry} from '@/lib/catalog';
import {clock,eventNumber,guarantee,shortDate,type Status} from '@/lib/schedule';
import {registrationDeadline} from '@/lib/registration';
import {PriceAmount} from './price-amount';

type EventCardProps={
 entry:Entry;
 status:Status;
 blocked:boolean;
 onOpen:(trigger:HTMLButtonElement)=>void;
 onChoose:(status:Status)=>void;
};

export function EventCard({entry,status,blocked,onOpen,onChoose}:EventCardProps){
 const event=entry.event,series=getSeries(entry.seriesId),deadline=registrationDeadline(entry.slot,series.timeLabel);
 const highlights=[event.restricted?'资格限制':'',event.supplement?'官方补充':''].filter(Boolean);
 const hasGuarantee=event.kind==='satellite'?Boolean(event.count):Boolean(event.guarantee);
 const guaranteeLabel=guarantee(event,'无保底');
 return <article data-entry-id={entry.id} data-status={status} className={`mobile-event row-${status}`}>
  <button type="button" className="event-row-open" aria-haspopup="dialog" aria-label={`查看 ${eventNumber(event)} ${event.title} · ${entry.flightLabel} 详情`} onClick={event=>onOpen(event.currentTarget)}>
   <time className="event-time-block" dateTime={`${entry.date}T${clock(entry.hour)}`}>
    <span className="event-date">{shortDate(entry.date)}</span>
    <strong>{clock(entry.hour)}</strong>
    <span className="event-time-zone">{series.timeLabel}</span>
   </time>
   <span className="event-row-content">
    <span className="event-title-banner" title={`${eventNumber(event)} ${event.title} · ${entry.flightLabel}`}><span className="event-title"><span className="event-number">{eventNumber(event)}</span> {event.title}</span><span className="event-flight">· {entry.flightLabel}</span><ChevronRight size={15} aria-hidden="true"/></span>
    {highlights.length>0&&<span className="mobile-event-meta">{highlights.map(label=><span key={label} className={label==='资格限制'?'event-restriction':undefined}>{label}</span>)}</span>}
    <span className="mobile-money">
     <span className="event-buyin"><span className="money-label">报名费</span><b><PriceAmount value={entry.buyin} currency={entry.currency}/></b></span>
     {deadline&&<span className="registration-summary"><Clock3 size={12} aria-hidden="true"/><span>报名截止 <span>{deadline.compact}</span></span></span>}
     <span className="event-guarantee" data-empty={!hasGuarantee} data-long={guaranteeLabel.length>15}>{hasGuarantee&&<span className="money-label">{event.kind==='satellite'?'席位保底':'整赛保底'}</span>}<b>{guaranteeLabel}</b></span>
    </span>
   </span>
  </button>
  {status==='attend'?<span className="event-planned"><Check size={15} aria-hidden="true"/>计划参加</span>:<button type="button" className="quick-watch" disabled={blocked} aria-pressed={status==='watch'} aria-label={`${status==='watch'?'取消关注':'关注'} ${event.title} · ${entry.flightLabel}`} onClick={()=>onChoose(status==='watch'?'undecided':'watch')}><Star size={16} fill={status==='watch'?'currentColor':'none'} aria-hidden="true"/><span>{status==='watch'?'已关注':status==='skip'?'改为关注':'关注'}</span></button>}
 </article>;
}
