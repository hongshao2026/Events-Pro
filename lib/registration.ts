import {shortDate,type Slot} from './schedule';

export type RegistrationDeadline={
 full:string;
 compact:string;
 /** Published local time, without a UTC offset. Omitted for qualified, ambiguous or level-only deadlines. */
 exact?:{date:string;time:string;dateTime:string};
};

/** Keep source qualifications alongside a cutoff; a listed time is not always an open-registration offer. */
export function registrationDeadline(slot:Slot,timeLabel:string,eventNotes=''):RegistrationDeadline|null{
 const note=slot.registrationNote?.trim();
 const qualification=/(?:报名.{0,8}截止|截止.{0,8}报名|报名资格|重新报名|首次报名|延迟报名|开始前报名|开赛时截止)/i.test(slot.notes)?slot.notes.trim():'';
 const close=slot.registrationCloses?.trim();
 const parsed=close?.match(/^(\d{4}-\d{2}-\d{2})T((?:[01]\d|2[0-3]):[0-5]\d)$/);
 const calendarDate=parsed?new Date(`${parsed[1]}T00:00:00Z`):null;
 const exact=parsed&&calendarDate&&!Number.isNaN(calendarDate.getTime())&&calendarDate.toISOString().slice(0,10)===parsed[1]?parsed:null;
 const level=slot.registrationLevel?`第 ${slot.registrationLevel} 级`:'';
 const fullTime=exact?`${shortDate(exact[1])} ${exact[2]} · ${timeLabel}${level?` · ${level}`:''}`:close?`${close} · ${timeLabel}${level?` · ${level}`:''}`:'';
 const sourceNote=note||(!close&&level?`${level}（原表未列时刻）`:'');
 // Keep each rule sentence intact: splitting on semicolons could discard the other side of a source conflict.
 const comparable=(text:string)=>text.trim().replace(/[。；;]+$/,'');
 const ruleSentences=(eventNotes.match(/[^。]+。?/g)||[]).map(sentence=>sentence.trim()).filter(sentence=>
  /截止|停止报名|停报|报名资格|重进|重入|报名.{0,12}(?:最多|至多|仅限|限报|不超过|次数)|限(?:制)?报名/.test(sentence));
 const inherited:string[]=[];
 for(const sentence of ruleSentences){
  const text=comparable(sentence);
  if(![sourceNote,qualification,...inherited].some(existing=>existing&&comparable(existing).includes(text)))inherited.push(sentence);
 }
 const inheritedQualification=inherited.some(sentence=>/冲突|未标(?:明)?日期|(?:日期|时刻|时间)(?:不明|待定|未定)|(?:主办方|官方|请).{0,24}确认|(?:若|如果|达到|视).{0,24}(?:关闭|停报|停止报名)|提前(?:关闭|停报|停止报名)|可能/.test(sentence));
 const parts=[...new Set([fullTime,sourceNote,qualification,...inherited].filter(Boolean))];
 if(!parts.length)return null;
 const full=parts.join('；');
 if(qualification||inheritedQualification||close&&!exact)return {full,compact:'见详情'};
 if(exact){
  const time=`${exact[1]===slot.date?'':`${shortDate(exact[1])} `}${exact[2]} · ${timeLabel}`;
  return sourceNote?{full,compact:'见详情'}:{full,compact:time,exact:{date:exact[1],time:exact[2],dateTime:`${exact[1]}T${exact[2]}`}};
 }
 return {full,compact:full.length<=24?full:'见详情'};
}
