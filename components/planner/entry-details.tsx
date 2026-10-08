import {shortDate,clock,slotName,eventNumber,type Slot} from '@/lib/schedule';
import {getSeries,type Entry} from '@/lib/catalog';
import {registrationDeadline} from '@/lib/registration';
import {PriceAmount} from './price-amount';

export function EntryDetails({entry,scope,occurrence,continuation=false,onShowFlights}:{entry:Entry;scope:string;occurrence?:Slot;continuation?:boolean;onShowFlights:(eventId:string)=>void}){
 const e=entry.event,slot=occurrence||entry.slot,series=getSeries(entry.seriesId),levels=continuation?slot.levels:slot.levels||e.levels;
 const deadline=registrationDeadline(slot,series.timeLabel),sourceUrl=slot.sourceUrl||e.sourceUrl;
 const notes=[...new Set([e.notes,slot.notes].filter(Boolean))].filter(note=>!deadline?.full.includes(note));
 const sharedGuarantee=e.starts.length>1&&Boolean(e.guarantee),addedPrize=e.title.includes('World Championship')&&e.kind==='regular';
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
  </section>
  <section className="detail-section detail-continuations">
   <h3>续赛安排</h3>
   {e.continuations.length?<>
    <p>以下场次以晋级为前提；晋级续赛不增加买入。</p>
    <dl>{e.continuations.map((s,index)=><div key={s.id||`${s.date}-${s.hour}-${index}`}><dt>{slotName(s)}</dt><dd>{shortDate(s.date)} {clock(s.hour)} · {series.timeLabel}</dd></div>)}</dl>
   </>:<p>原表未单独列出续赛日。</p>}
   {(e.starts.length>1||continuation)&&<button type="button" className="text-button related-flights" onClick={()=>onShowFlights(e.id)}>查看此赛事的 {e.starts.length} 个起始组 →</button>}
  </section>
  {(notes.length>0||e.adminNotes||sharedGuarantee||addedPrize)&&<section className="detail-section detail-notes">
   <h3>补充说明</h3>
   {e.adminNotes&&<p className="detail-note">管理备注：{e.adminNotes}</p>}
   {notes.map(note=><p className="detail-note" key={note}>{note}</p>)}
   {sharedGuarantee&&<p className="detail-note">各起始组共享整项赛事保底。</p>}
   {addedPrize&&<p className="detail-note">$1M Added 为额外加入的奖金，不是总奖池保底。</p>}
  </section>}
  {(e.sourcePage||sourceUrl)&&<section className="detail-section detail-source">
   <h3>资料来源</h3>
   {e.sourcePage&&<p>赛程 PDF 第 {e.sourcePage} 页 · {eventNumber(e)}{slot.sourceRow?` · 第 ${slot.sourceRow} 行`:''}</p>}
   {sourceUrl&&<a href={sourceUrl} target="_blank" rel="noreferrer" className="text-button">官网本场赛程 ↗</a>}
  </section>}
 </div>;
}
