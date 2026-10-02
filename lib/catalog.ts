import {events,slotName,type Event,type Slot} from './schedule';

export type Series={id:string;title:string;venue:string;city:string;start:string;end:string;timeZone:string;currency:string};
export const series:Series={id:'wpt-wynn-2026',title:'WPT World Championship 2026',venue:'Wynn Las Vegas',city:'拉斯维加斯',start:'2026-11-27',end:'2026-12-21',timeZone:'America/Los_Angeles',currency:'USD'};
export type Entry={id:string;seriesId:string;eventId:string;event:Event;slot:Slot;flightLabel:string;date:string;hour:number;buyin:number};
export const entries:Entry[]=events.flatMap(event=>event.starts.map(slot=>({id:`${series.id}/${event.id}/${slot.id}`,seriesId:series.id,eventId:event.id,event,slot,flightLabel:slotName(slot),date:slot.date,hour:slot.hour,buyin:slot.buyin??event.buyin??0}))).sort((a,b)=>a.date.localeCompare(b.date)||a.hour-b.hour);
export const entryMap=new Map(entries.map(entry=>[entry.id,entry]));
export const eventMap=new Map(events.map(event=>[event.id,event]));
export const entryName=(entry:Entry)=>`${entry.event.title}${entry.event.starts.length>1?' · '+entry.flightLabel:''}`;
export function dateObject(value:string){const [y,m,d]=value.split('-').map(Number);return new Date(y,m-1,d,12);}
export const dateValue=(value:Date)=>`${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`;
export function validDate(value:string){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&value>=series.start&&value<=series.end&&dateValue(dateObject(value))===value;}
