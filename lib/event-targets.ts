import {events,slotName,type Event,type Slot} from './schedule';

export type EventTarget={label:string;slot?:Slot};
export type EventTargetInfo={kind:'satellite'|'continuation';targets:EventTarget[]};

const officialEvents=new Map(events.map(event=>[`${event.seriesId||''}/${event.id}`,event]));

/** Target relationships use published data; display-name edits do not create or remove a satellite target. */
export function eventTargets(event:Event,occurrence:Slot|undefined=event.starts[0]):EventTargetInfo|null{
 const source=officialEvents.get(`${event.seriesId||''}/${event.id}`)||event;
 if(source.kind==='satellite'){
  const target=source.title.match(/\b(?:satellite(?:\s+package)?|qualifier)\s+to\s+(.+)$/i)?.[1]
   .replace(/\s*[（(]WYS\b[^）)]*[）)]/gi,'').trim();
  // Keep flight/step qualifiers and package wording intact; neither dates nor a catalog match are inferred.
  return {kind:'satellite',targets:target?[{label:target}]:[]};
 }
 if(!occurrence)return null;
 const targets=event.continuations
  .filter(slot=>slot.date>occurrence.date||slot.date===occurrence.date&&slot.hour>occurrence.hour)
  .sort((a,b)=>a.date.localeCompare(b.date)||a.hour-b.hour)
  .map(slot=>({label:`${event.title} · ${slotName(slot)}`,slot}));
 return targets.length?{kind:'continuation',targets}:null;
}
