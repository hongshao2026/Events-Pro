import {useState,type MouseEvent} from 'react';
import {ArrowRight,CalendarDays,Globe2,MapPin} from 'lucide-react';
import {RadioGroup,RadioGroupItem} from '@/components/ui/radio-group';
import {filterSeries,regions,regionLabel,type RegionFilter,type Series} from '@/lib/series';

export function SeriesLogo({series,compact=false}:{series:Series;compact?:boolean}){
  const [failedSrc,setFailedSrc]=useState<string|null>(null);
  return <div className="series-logo">{series.logo&&series.logo.src!==failedSrc
    ?<img src={series.logo.src} alt={series.logo.alt} width={156} height={60} onError={()=>setFailedSrc(series.logo!.src)}/>
    :<span>{compact?series.mark:series.brand}</span>}</div>;
}
export function SeriesHome({catalog,region,onRegionChange,hrefForSeries,onOpen}:{
  catalog?:Series[];region:RegionFilter;onRegionChange:(value:RegionFilter)=>void;
  hrefForSeries:(id:string)=>string;onOpen:(id:string)=>void;
}){
  const filtered=filterSeries(region,catalog);
  const months=[...new Set(filtered.map(item=>item.start.slice(0,7)))];
  const open=(event:MouseEvent<HTMLAnchorElement>,id:string)=>{
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();onOpen(id);
  };
  return <section className="series-home" aria-label="赛事系列列表">
    <div className="region-filter">
      <RadioGroup value={region} onValueChange={value=>onRegionChange(value as RegionFilter)} orientation="horizontal" className="region-options" aria-label="赛事地区">
        {regions.map(item=><label key={item.id} className={`region-option ${item.id===region?'active':''}`}>
          <RadioGroupItem value={item.id} aria-label={item.label} className="sr-only"/><span>{item.label}</span>
        </label>)}
      </RadioGroup>
    </div>
    <div className="series-results"><span aria-live="polite">{regionLabel(region)} · <b>{filtered.length}</b> 个赛事系列</span><span>按开赛日期排序 <ArrowRight size={12}/></span></div>
    {months.map(month=><section className="series-month" key={month} aria-label={`${month.slice(0,4)}年${Number(month.slice(5))}月赛事`}>
      <h2>{month.slice(0,4)}<span>年</span> {Number(month.slice(5))}<span>月</span></h2>
      {filtered.filter(item=>item.start.startsWith(month)).map(item=><a key={item.id} className="festival-card" data-series-id={item.id} href={hrefForSeries(item.id)} onClick={event=>open(event,item.id)} aria-label={`查看 ${item.title} 完整赛程`}>
        <div className="festival-brand"><SeriesLogo series={item}/><span>{regionLabel(item.region)}</span></div>
        <div className="festival-card-body"><div className="festival-location"><MapPin size={14}/>{item.country} · {item.city}</div>
          <h3>{item.title}</h3><p className="festival-venue">{item.venue}</p>
          <p className="festival-dates"><CalendarDays size={16}/><time dateTime={item.start}>{item.start.replaceAll('-','.')}</time><span>—</span><time dateTime={item.end}>{item.end.slice(0,4)===item.start.slice(0,4)?item.end.slice(5).replace('-','.'):item.end.replaceAll('-','.')}</time></p>
          <p className="festival-counts">{item.eventCount} 项赛事 <span>·</span> {item.entryCount} 个起始场次</p>
        </div>
        <div className="festival-card-foot"><span>查看完整赛程</span><ArrowRight size={18}/></div>
      </a>)}
    </section>)}
    {!filtered.length&&<div className="empty-state series-empty"><Globe2 size={28}/><h3>{regionLabel(region)}暂无赛事</h3><p>当前尚未收录该地区的赛程。</p><button onClick={()=>onRegionChange('all')}>显示全部地区</button></div>}
  </section>;
}
