import raw from './schedule.json';
export type Status = 'undecided' | 'attend' | 'watch' | 'skip';
export type Slot = {id?:string;date:string;hour:number;name:string;buyin:number|null;guarantee:number|null;count:number|null;unit:string;group:string;notes:string;chips:number|null;levels:string;supplement:boolean};
export type Event = Slot & {id:string;title:string;starts:Slot[];continuations:Slot[];restricted:string;priority:boolean;kind:'regular'|'satellite'};
export type Selection = {status:Status;flight:string;version:number};
export type Selections = Record<string,Selection>;
export const events = raw as Event[];
export const statusLabels:Record<Status,string> = {undecided:'待定',attend:'参加',watch:'关注',skip:'不考虑'};
export const statuses:Status[] = ['undecided','attend','watch','skip'];
export const sourceUrl='https://cdn.wynnresorts.com/image/upload/v1757097329/visitwynn_pdfs_files/Poker/WPT/WPT_World_Championship_Schedule.pdf';
export const usd=(v:number)=>'$'+v.toLocaleString('en-US');
export const cny=(v:number)=>'¥'+Math.round(v*6.7).toLocaleString('zh-CN');
export const shortDate=(s:string)=>s.slice(5).replace('-','/');
export const clock=(hour:number)=>String(hour).padStart(2,'0')+':00';
export function slotName(s:Slot){return s.name.match(/Day\s+\d[A-F]?(?:\s+Turbo)?|Final Table/i)?.[0]||'首轮';}
export function guarantee(e:Event){if(e.kind==='satellite')return e.count?`${e.count} ${e.unit==='席位'?'席':e.unit||'席'}`:'未列保底';return e.guarantee?usd(e.guarantee):'未列保底';}
export const emptySelection:Selection={status:'undecided',flight:'',version:0};
export function isNlh(e:Event){return e.kind==='regular'&&(/NLH|No Limit Hold|WPT|Super Gold|Seniors High Roller/i.test(e.title));}
