import {shortDate,clock,slotName,type Slot} from '@/lib/schedule';
import {getSeries,type Entry} from '@/lib/catalog';
import {registrationDeadline} from '@/lib/registration';
import {eventTargets} from '@/lib/event-targets';
import {PriceAmount} from './price-amount';

export function EntryDetails({entry,scope,occurrence,continuation=false,onShowFlights}:{entry:Entry;scope:string;occurrence?:Slot;continuation?:boolean;onShowFlights:(eventId:string)=>void}){
 const e=entry.event,slot=occurrence||entry.slot,series=getSeries(entry.seriesId),levels=continuation?slot.levels:slot.levels||e.levels;
 const deadline=registrationDeadline(slot,series.timeLabel,continuation?'':e.notes),targetPlan=eventTargets(e,slot);
 return <div className="detail" id={`detail-${entry.slot.id}-${scope}`}>
  <section className="detail-section">
   <h3>报名信息</h3>
   <dl>
    <div><dt>开赛时间</dt><dd>{shortDate(slot.date)} {clock(slot.hour)} · {series.timeLabel}</dd></div>
    <div><dt>报名费</dt><dd>{continuation?'晋级续赛，不新增买入':<PriceAmount value={entry.buyin} currency={entry.currency}/>}</dd></div>
    <div className="detail-deadline"><dt>报名截止</dt><dd>{deadline?.full||'原表未列'}</dd></div>
    {e.restricted&&<div><dt>资格条件</dt><dd className="restriction">{e.restricted}</dd></div>}
   </dl>
  </section>
  <section className="detail-section">
   <h3>比赛结构</h3>
   <dl>
    <div><dt>玩法</dt><dd>{slot.group||e.group||'原表未列'}</dd></div>
    <div><dt>比赛阶段</dt><dd>{continuation?'晋级续赛':'本场次'} · {slotName(slot)}</dd></div>
    <div><dt>起始筹码</dt><dd>{continuation?'沿用晋级筹码':(slot.chips??e.chips)?.toLocaleString('zh-CN')||'原表未列'}</dd></div>
    <div><dt>级别时长</dt><dd>{levels?`${levels} 分钟`:'原表未列'}</dd></div>
   </dl>
   {(e.starts.length>1||continuation)&&<button type="button" className="text-button related-flights" onClick={()=>onShowFlights(e.id)}>查看此赛事的 {e.starts.length} 个起始组 →</button>}
  </section>
  {targetPlan&&<section className="detail-section detail-targets">
   <h3>目标赛事</h3>
   {targetPlan.targets.length?<>
    {targetPlan.kind==='continuation'&&<p>晋级后参加，不新增买入。</p>}
    <dl>{targetPlan.targets.map((target,index)=><div key={target.slot?.id||`${target.label}-${index}`}><dt>{targetPlan.kind==='continuation'?'晋级场次':'参赛目标'}</dt><dd>{target.label}{target.slot&&<span className="target-event-time">{shortDate(target.slot.date)} {clock(target.slot.hour)} · {series.timeLabel}</span>}</dd></div>)}</dl>
   </>:<p>目标赛事未公布。</p>}
  </section>}
 </div>;
}
