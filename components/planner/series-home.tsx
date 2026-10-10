import {useEffect,useLayoutEffect,useRef,useState,type MouseEvent} from 'react';
import {ArrowRight,CalendarDays,ChevronDown,Globe2,MapPin,Pin,PinOff} from 'lucide-react';
import {toast} from 'sonner';
import {RadioGroup,RadioGroupItem} from '@/components/ui/radio-group';
import {filterSeries,regions,regionLabel,type RegionFilter,type Series} from '@/lib/series';
import {getSeriesPhase,type SeriesPhase} from '@/lib/series-lifecycle';
import {useAppSettings} from './settings-context';

const phaseLabels:Record<SeriesPhase,string>={ongoing:'正在进行',upcoming:'即将到来',ended:'已结束'};

function useFestivalClock(){
  const [now,setNow]=useState(()=>new Date());
  useEffect(()=>{
    const refresh=()=>setNow(new Date());
    const visible=()=>{if(document.visibilityState==='visible')refresh();};
    const timer=window.setInterval(refresh,30_000);
    window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',visible);
    return()=>{window.clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',visible);};
  },[]);
  return now;
}

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
  const {settings,settingsError,saveSettings}=useAppSettings();
  const now=useFestivalClock(),pinnedId=settings.profile.pinnedSeriesId;
  const all=filterSeries('all',catalog),pinned=all.find(item=>item.id===pinnedId);
  const regional=filterSeries(region,catalog),filtered=regional.filter(item=>item.id!==pinned?.id);
  const groups={ongoing:[] as Series[],upcoming:[] as Series[],ended:[] as Series[]};
  filtered.forEach(item=>groups[getSeriesPhase(item,now)].push(item));
  const [pinError,setPinError]=useState(''),[archiveOpen,setArchiveOpen]=useState(false),[focusVersion,setFocusVersion]=useState(0);
  const pinButtons=useRef(new Map<string,HTMLButtonElement>()),pendingFocus=useRef<string|null>(null),resultsRef=useRef<HTMLDivElement>(null);
  useLayoutEffect(()=>{
    const id=pendingFocus.current;if(!id)return;pendingFocus.current=null;
    const button=pinButtons.current.get(id);
    const target=button?.getClientRects().length&&!button.closest('details:not([open])')?button:resultsRef.current;
    target?.focus({preventScroll:true});
    if(id===pinnedId)target?.closest('.pinned-series')?.scrollIntoView({block:'start'});
    else target?.scrollIntoView({block:'nearest'});
  },[pinnedId,pinError,focusVersion]);
  const togglePin=async(item:Series)=>{
    const removing=pinnedId===item.id;
    setPinError('');pendingFocus.current=null;
    try{
      await saveSettings(next=>{next.profile.pinnedSeriesId=removing?null:item.id;});
      pendingFocus.current=item.id;setFocusVersion(value=>value+1);
      if(removing&&getSeriesPhase(item,now)==='ended')setArchiveOpen(true);
      toast.success(removing?'已取消置顶':`已置顶 ${item.shortTitle}`,{id:'series-pin-feedback'});
    }catch(error){
      const message=error instanceof Error?error.message:'未能保存设置。';
      const stale=message.startsWith('另一窗口已更新设置');
      pendingFocus.current=stale?item.id:null;if(stale)setFocusVersion(value=>value+1);
      const feedback=stale?'另一窗口已更新设置，已显示最新置顶。请重试。':`置顶未保存：${message} 请重试。`;
      setPinError(feedback);toast.error(feedback,{id:'series-pin-feedback'});
    }
  };
  const open=(event:MouseEvent<HTMLAnchorElement>,id:string)=>{
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();onOpen(id);
  };
  const renderCard=(item:Series)=><article className={`festival-item${item.id===pinnedId?' is-pinned':''}`} key={item.id}>
    <a className="festival-card" data-series-id={item.id} href={hrefForSeries(item.id)} onClick={event=>open(event,item.id)} aria-label={`查看 ${item.title} 完整赛程`}>
      <div className="festival-brand"><SeriesLogo series={item}/><span>{regionLabel(item.region)}</span></div>
      <div className="festival-card-body"><div className="festival-location"><MapPin size={14}/>{item.country} · {item.city}</div>
        <h3>{item.title}</h3><p className="festival-venue">{item.venue}</p>
        <p className="festival-dates"><CalendarDays size={16}/><time dateTime={item.start}>{item.start.replaceAll('-','.')}</time><span>—</span><time dateTime={item.end}>{item.end.slice(0,4)===item.start.slice(0,4)?item.end.slice(5).replace('-','.'):item.end.replaceAll('-','.')}</time></p>
        <p className="festival-counts">{item.eventCount} 项赛事 <span>·</span> {item.entryCount} 个起始场次</p>
      </div>
      <div className="festival-card-foot"><span>查看完整赛程</span><ArrowRight size={16}/></div>
    </a>
    <button type="button" className="festival-pin" aria-label={`${item.id===pinnedId?'取消置顶':'置顶'} ${item.title}`} aria-pressed={item.id===pinnedId} disabled={!!settingsError} onClick={()=>togglePin(item)} ref={node=>{if(node)pinButtons.current.set(item.id,node);else pinButtons.current.delete(item.id);}}>
      {item.id===pinnedId?<PinOff size={15}/>:<Pin size={15}/>}<span>{item.id===pinnedId?'已置顶':'置顶'}</span>
    </button>
  </article>;
  return <section className="series-home" aria-label="赛事系列列表">
    <div className="region-filter">
      <RadioGroup value={region} onValueChange={value=>onRegionChange(value as RegionFilter)} orientation="horizontal" className="region-options" aria-label="赛事地区">
        {regions.map(item=><label key={item.id} className={`region-option ${item.id===region?'active':''}`}>
          <RadioGroupItem value={item.id} aria-label={item.label} className="sr-only"/><span>{item.label}</span>
        </label>)}
      </RadioGroup>
    </div>
    {pinError&&<p className="form-error series-pin-error" role="alert">{pinError}</p>}
    {pinned&&<section className="series-group pinned-series" aria-label="置顶赛事">
      <div className="series-group-heading"><h2><Pin size={14}/>置顶赛事</h2><span className="series-phase" data-phase={getSeriesPhase(pinned,now)}>{phaseLabels[getSeriesPhase(pinned,now)]}</span></div>
      {renderCard(pinned)}
    </section>}
    <div className="series-results" ref={resultsRef} tabIndex={-1}><span aria-live="polite">{regionLabel(region)} · <b>{filtered.length}</b> 个赛事系列{pinned?'（不含置顶）':''}</span><span>按赛事当地日期</span></div>
    {(['ongoing','upcoming'] as const).map(phase=><section className="series-group" key={phase} aria-label={phaseLabels[phase]}>
      <div className="series-group-heading"><h2><span className={`series-phase-dot ${phase}`} aria-hidden="true"/>{phaseLabels[phase]}<span className="series-group-count">{groups[phase].length}</span></h2>
        {!groups[phase].length&&!!regional.length&&<span className="series-group-empty">{pinned&&regional.every(item=>item.id===pinned.id)?'本地区赛事已置顶':phase==='ongoing'?'暂无进行中的赛事':'暂无即将到来的赛事'}</span>}
      </div>
      {groups[phase].map(renderCard)}
    </section>)}
    {!!groups.ended.length&&<details className="series-archive" open={archiveOpen} onToggle={event=>setArchiveOpen(event.currentTarget.open)}>
      <summary>已结束<span className="series-group-count">{groups.ended.length}</span><ChevronDown size={16}/></summary>
      <div className="series-archive-list">{groups.ended.map(renderCard)}</div>
    </details>}
    {!regional.length&&<div className="empty-state series-empty"><Globe2 size={28}/><h3>{regionLabel(region)}暂无赛事</h3><p>当前尚未收录该地区的赛程。</p><button onClick={()=>onRegionChange('all')}>显示全部地区</button></div>}
  </section>;
}
