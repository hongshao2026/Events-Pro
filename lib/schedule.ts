import raw from './schedule.json';
import triton from './triton-cyprus-2026.json';
import qpc from './qpc-circuit-2026.json';
import kpc from './kpc-jeju-2026.json';
import jeju from './jeju-poker-festival-2026.json';
import {money,type Currency} from './money';
export type Status = 'undecided' | 'attend' | 'watch' | 'skip';
export type Slot = {id?:string;date:string;hour:number;name:string;buyin:number|null;guarantee:number|null;count:number|null;unit:string;group:string;notes:string;chips:number|null;levels:string;supplement:boolean;registrationCloses?:string;registrationLevel?:number;registrationNote?:string;sourceRow?:number;sourceUrl?:string;stageLabel?:string};
export type Event = Slot & {id:string;title:string;starts:Slot[];continuations:Slot[];restricted:string;priority:boolean;kind:'regular'|'satellite';seriesId?:string;currency?:Currency;officialNumber?:number;displayNumber?:string;sourcePage?:number;adminNotes?:string;hidden?:boolean};
export type Selection = {status:Status;flight:string;version:number};
export type Selections = Record<string,Selection>;
export const events = [...raw,...triton,...qpc,...kpc,...jeju] as Event[];
export const statusLabels:Record<Status,string> = {undecided:'待定',attend:'参加',watch:'关注',skip:'不考虑'};
export const statuses:Status[] = ['undecided','attend','watch','skip'];
export const shortlistStatuses:Status[] = ['attend','watch'];
export const sourceUrl='https://cdn.wynnresorts.com/image/upload/v1757097329/visitwynn_pdfs_files/Poker/WPT/WPT_World_Championship_Schedule.pdf';
export const usd=(v:number)=>money(v,'USD');
export const cny=(v:number)=>'¥'+Math.round(v*6.7).toLocaleString('zh-CN');
export const shortDate=(s:string)=>s.slice(5).replace('-','/');
export const clock=(hour:number)=>{const minutes=Math.round(hour*60);return String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');};
export function slotName(s:Slot){return s.stageLabel||s.name.replace(/[（(]TURBO[）)]/gi,' Turbo').match(/Day\s+\d(?:\/?[A-F])?(?:\s+Turbo)?|Final(?: Table)?/i)?.[0].replace(/(\d)\//,'$1')||'首轮';}
export function guarantee(e:Event){if(e.kind==='satellite')return e.count?`${e.count} ${e.unit==='席位'?'席':e.unit||'席'}`:'未列保底';return e.guarantee?money(e.guarantee,e.currency):'未列保底';}
export function eventNumber(e:Event){return e.officialNumber?'#'+e.officialNumber:e.displayNumber||e.id;}
export const emptySelection:Selection={status:'undecided',flight:'',version:0};
export function isNlh(e:Event){return e.kind==='regular'&&!['混合/限注','奥马哈','混合游戏'].includes(e.group)&&(e.group==='德州扑克'||/NLH|No Limit Hold|WPT|Super Gold|Seniors High Roller/i.test(e.title));}
