import type {Series} from './series';

export type SeriesPhase='ongoing'|'upcoming'|'ended';
const dateFormatters=new Map<string,Intl.DateTimeFormat>();

/** Series boundaries include both endpoint dates in the festival's own time zone. */
export function getSeriesPhase(series:Pick<Series,'start'|'end'|'timeZone'>,now:Date):SeriesPhase{
 let formatter=dateFormatters.get(series.timeZone);
 if(!formatter){
  formatter=new Intl.DateTimeFormat('en-CA',{timeZone:series.timeZone,calendar:'gregory',numberingSystem:'latn',year:'numeric',month:'2-digit',day:'2-digit'});
  dateFormatters.set(series.timeZone,formatter);
 }
 const parts=formatter.formatToParts(now);
 const date=['year','month','day'].map(type=>parts.find(part=>part.type===type)!.value).join('-');
 return date<series.start?'upcoming':date>series.end?'ended':'ongoing';
}
