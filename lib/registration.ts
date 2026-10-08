import {shortDate,type Slot} from './schedule';

export type RegistrationDeadline={
 full:string;
 compact:string;
 /** Published local time, without a UTC offset. Omitted for qualified, ambiguous or level-only deadlines. */
 exact?:{date:string;time:string;dateTime:string};
};

/** Keep source qualifications alongside a cutoff; a listed time is not always an open-registration offer. */
export function registrationDeadline(slot:Slot,timeLabel:string):RegistrationDeadline|null{
 const note=slot.registrationNote?.trim();
 const qualification=/(?:报名.{0,8}截止|截止.{0,8}报名|报名资格|重新报名|首次报名|延迟报名|开始前报名|开赛时截止)/i.test(slot.notes)?slot.notes.trim():'';
 const close=slot.registrationCloses?.trim();
 const parsed=close?.match(/^(\d{4}-\d{2}-\d{2})T((?:[01]\d|2[0-3]):[0-5]\d)$/);
 const calendarDate=parsed?new Date(`${parsed[1]}T00:00:00Z`):null;
 const exact=parsed&&calendarDate&&!Number.isNaN(calendarDate.getTime())&&calendarDate.toISOString().slice(0,10)===parsed[1]?parsed:null;
 const level=slot.registrationLevel?`第 ${slot.registrationLevel} 级`:'';
 const fullTime=exact?`${shortDate(exact[1])} ${exact[2]} · ${timeLabel}${level?` · ${level}`:''}`:close?`${close} · ${timeLabel}${level?` · ${level}`:''}`:'';
 const sourceNote=note||(!close&&level?`${level}（原表未列时刻）`:'');
 const parts=[...new Set([fullTime,sourceNote,qualification].filter(Boolean))];
 if(!parts.length)return null;
 const full=parts.join('；');
 if(qualification||close&&!exact)return {full,compact:'见详情'};
 if(exact){
  const time=`${exact[1]===slot.date?'':`${shortDate(exact[1])} `}${exact[2]} · ${timeLabel}`;
  return sourceNote?{full,compact:'见详情'}:{full,compact:time,exact:{date:exact[1],time:exact[2],dateTime:`${exact[1]}T${exact[2]}`}};
 }
 return {full,compact:full.length<=24?full:'见详情'};
}
