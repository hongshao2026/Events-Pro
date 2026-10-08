import {ChevronLeft} from 'lucide-react';
import {useRef} from 'react';
import {Sheet,SheetContent,SheetHeader,SheetTitle,SheetDescription,SheetClose} from '@/components/ui/sheet';
import {getSeries,type Entry} from '@/lib/catalog';
import {clock,eventNumber,guarantee,shortDate,type Status} from '@/lib/schedule';
import {registrationDeadline} from '@/lib/registration';
import {EntryActions} from './controls';
import {EntryDetails} from './entry-details';
import {PriceAmount} from './price-amount';

type EventDetailSheetProps={
 entry:Entry|null;
 status:Status;
 blocked:boolean;
 error:string;
 onClose:()=>void;
 onChoose:(status:Status)=>void;
 onShowFlights:(id:string)=>void;
 onReturnFocus:()=>void;
};

export function EventDetailSheet({entry,status,blocked,error,onClose,onChoose,onShowFlights,onReturnFocus}:EventDetailSheetProps){
 const skipReturnFocus=useRef(false);
 const series=entry?getSeries(entry.seriesId):null;
 const deadline=entry&&series?registrationDeadline(entry.slot,series.timeLabel):null;
 const showFlights=(id:string)=>{skipReturnFocus.current=true;onClose();onShowFlights(id);};
 return <Sheet open={entry!==null} onOpenChange={open=>{if(!open)onClose();}}>
  <SheetContent className="cart-sheet event-detail-sheet" showCloseButton={false} onCloseAutoFocus={event=>{event.preventDefault();if(skipReturnFocus.current)skipReturnFocus.current=false;else onReturnFocus();}}>
   {entry&&series&&<>
    <SheetHeader className="event-detail-heading">
     <div className="event-detail-title-row">
      <SheetClose className="event-detail-back" aria-label="返回赛程"><ChevronLeft size={23} aria-hidden="true"/></SheetClose>
      <SheetTitle>{eventNumber(entry.event)}: {entry.event.title} · {entry.flightLabel}</SheetTitle>
     </div>
     <SheetDescription>{series.shortTitle} · {series.city} · {series.venue}</SheetDescription>
    </SheetHeader>
    <div className="event-detail-scroll cart-scroll">
     <section className="event-detail-summary" aria-label="本场赛事概览">
      <dl>
       <div><dt>开赛</dt><dd><time dateTime={`${entry.date}T${clock(entry.hour)}`}>{shortDate(entry.date)} {clock(entry.hour)}</time> · {series.timeLabel}</dd></div>
       <div><dt>报名截止</dt><dd>{deadline?.compact||'原表未列'}</dd></div>
       <div><dt>报名费</dt><dd><PriceAmount value={entry.buyin} currency={entry.currency}/></dd></div>
      </dl>
      <div className="event-detail-prize"><span>{entry.event.kind==='satellite'?'席位保底':'整赛保底'}</span><strong>{guarantee(entry.event)}</strong></div>
     </section>
     <EntryDetails entry={entry} scope="discovery" onShowFlights={showFlights}/>
     {series.sourceUpdated&&<p className="event-detail-source-updated">资料更新：{series.sourceUpdated}</p>}
    </div>
    <div className="event-detail-actions agenda-detail-actions" data-status={status}>
     <div className="event-detail-action-heading"><strong>个人计划</strong><span>参加不等于实际报名</span></div>
     {error&&<p className="cart-error" role="alert">{error}</p>}
     <EntryActions entry={entry} value={status} disabled={blocked} onChange={onChoose}/>
    </div>
   </>}
  </SheetContent>
 </Sheet>;
}
