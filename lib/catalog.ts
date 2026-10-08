import {events,slotName,type Event,type Slot} from './schedule';
import {series,type Series} from './series';
import type {Currency} from './money';
export {series,seriesList,getSeries,type Series} from './series';
export type Entry={id:string;seriesId:string;eventId:string;event:Event;slot:Slot;flightLabel:string;date:string;hour:number;buyin:number|null;currency:Currency};
export const buildEntries=(source:Event[]):Entry[]=>source.flatMap(event=>event.starts.map(slot=>({id:`${event.seriesId||series.id}/${event.id}/${slot.id}`,seriesId:event.seriesId||series.id,eventId:event.id,event,slot,flightLabel:slotName(slot),date:slot.date,hour:slot.hour,buyin:slot.buyin??event.buyin??null,currency:event.currency||'USD'}))).sort((a,b)=>a.date.localeCompare(b.date)||a.hour-b.hour);
export const entries=buildEntries(events);
export const entryMap=new Map(entries.map(entry=>[entry.id,entry]));
export const eventMap=new Map(events.map(event=>[event.id,event]));
export const entryName=(entry:Entry)=>`${entry.event.title}${entry.event.starts.length>1?' · '+entry.flightLabel:''}`;
export function dateObject(value:string){const [y,m,d]=value.split('-').map(Number);return new Date(y,m-1,d,12);}
export const dateValue=(value:Date)=>`${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`;
export function validDate(value:string,festival:Series=series){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&value>=festival.start&&value<=festival.end&&dateValue(dateObject(value))===value;}
