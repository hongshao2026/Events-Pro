"use client";
import {useCallback,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {ArrowLeft,CalendarDays,Compass,Download,ExternalLink,HardDrive,MapPin,Search,SlidersHorizontal,Table2,Spade,Upload,X,RotateCcw,UserRound} from 'lucide-react';
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from '@/components/ui/alert-dialog';
import {Toaster} from '@/components/ui/sonner';
import {toast} from 'sonner';
import {FilterSelect,longLabels} from '@/components/planner/controls';
import {DiscoveryFilterPopover} from '@/components/planner/discovery-filter-popover';
import {PopoverTrigger} from '@/components/ui/popover';
import {MySchedule} from '@/components/planner/my-schedule';
import {MyShortlist} from '@/components/planner/my-shortlist';
import {SeriesHome,SeriesLogo} from '@/components/planner/series-home';
import {seriesCatalog} from '@/lib/series';
import {moneyFilters,matchesMoneyFilter} from '@/lib/money';
import {SettingsProvider,useAppSettings} from '@/components/planner/settings-context';
import {ProfilePage,type AccountInfo} from '@/components/planner/profile-page';
import {AdminPage} from '@/components/planner/admin-page';
import {EventCard} from '@/components/planner/event-card';
import {EventDetailSheet} from '@/components/planner/event-detail-sheet';
import {agendaFromUrl,type AgendaRoute} from '@/lib/agenda';
import {FestivalCalendar} from '@/components/planner/festival-calendar';
import {statuses,type Status} from '@/lib/schedule';
import {eventGameOptions,matchesEventGame,type EventTagId} from '@/lib/event-tags';
import {seriesList,getSeries,entryName,validDate,type Entry} from '@/lib/catalog';
import {STORAGE_KEY,LEGACY_KEY,readState,writeState,emptyState,downloadBackup,parseBackup,budget,type Backup,type PlannerState} from '@/lib/local-store';

type Filters={q:string;statuses:Status[];from:string;to:string;buyin:string;gtd:string;game:string;sort:string;supp:boolean;page:number};
const defaults:Filters={q:'',statuses:[...statuses],from:'',to:'',buyin:'all',gtd:'all',game:'all',sort:'date',supp:false,page:1};
const size=15;
function fromUrl():Filters{
 const p=new URLSearchParams(window.location.hash.slice(1));const f={...defaults},festival=getSeries(p.get('series'));
 f.q=p.get('q')||'';f.supp=p.get('supp')==='yes';f.page=Math.max(1,Math.floor(Number(p.get('page'))||1));
 const status=p.get('statuses')??p.get('status');if(status&&status!=='all')f.statuses=status==='none'?[]:statuses.filter(s=>status.split(',').includes(s));
 for(const [key,options]of Object.entries({buyin:moneyFilters(festival.currency,festival.currencies).buyin.map(([value])=>value),gtd:moneyFilters(festival.currency,festival.currencies).gtd.map(([value])=>value),game:eventGameOptions.map(([value])=>value),sort:['date','buyin','gtd']})){
  const value=p.get(key);if(value&&options.includes(value))f[key as 'buyin'|'gtd'|'game'|'sort']=value;
 }
 const from=p.get('from')||p.get('date')||'',to=p.get('to')||from;
 if(validDate(from,festival)&&validDate(to,festival)){f.from=from<to?from:to;f.to=from<to?to:from;}return f;
}
function plannerHash(filters:Filters,route:AgendaRoute){
 const p=new URLSearchParams();p.set('view',route.view);
 if(route.view==='discover'||route.seriesId!==seriesList[0].id)p.set('series',route.seriesId);
 if(route.region!=='all')p.set('region',route.region);
 if(filters.q)p.set('q',filters.q);if(filters.statuses.length!==4)p.set('statuses',filters.statuses.join(',')||'none');
 if(filters.from){p.set('from',filters.from);p.set('to',filters.to);}
 for(const key of ['buyin','gtd','game','sort']as const)if(filters[key]!==defaults[key])p.set(key,filters[key]);
 if(filters.supp)p.set('supp','yes');if(filters.page!==1)p.set('page',String(filters.page));
 if(route.day)p.set('day',route.day);if(route.statuses.join(',')!=='attend,watch')p.set('agendaStatuses',route.statuses.join(',')||'none');
 if(!route.continuations)p.set('continuations','no');if(route.month!==getSeries(route.seriesId).start.slice(0,7))p.set('month',route.month);
 return '#'+p;
}
function initialData(){try{return {data:readState(),error:''};}catch(e){return {data:emptyState(),error:e instanceof Error?e.message:'无法读取本地记录'};}}

type PlannerProps={account?:ReactNode;accountInfo?:AccountInfo};
export default function Planner(props:PlannerProps={}){return <SettingsProvider><PlannerContent {...props}/></SettingsProvider>;}
function PlannerContent({account,accountInfo}:PlannerProps){
 const {settings,settingsError,reloadSettings,catalog,navigateSafely}=useAppSettings();
 const {entries,eventMap}=catalog;
 const [route,setRoute]=useState<AgendaRoute>(agendaFromUrl);
 const series=getSeries(route.seriesId),amountFilters=moneyFilters(series.currency,series.currencies);
 const seriesEntries=useMemo(()=>entries.filter(entry=>entry.seriesId===route.seriesId),[route.seriesId,entries]);
 const supplementCount=seriesEntries.filter(entry=>entry.event.supplement).length;
 const scrolls=useRef({home:0,discover:0,schedule:0,shortlist:0,profile:0,admin:0});
 const selectedSeries=seriesCatalog.find(item=>item.id===route.seriesId);
 const [filters,setFilters]=useState<Filters>(fromUrl),[draft,setDraft]=useState(()=>fromUrl().q);
 const [snapshot,setSnapshot]=useState(initialData),[saveError,setSaveError]=useState('');
 const [openEntryId,setOpenEntryId]=useState<string|null>(null);
 const [filterOpen,setFilterOpen]=useState(false);
 const detailTriggerRef=useRef<HTMLElement|null>(null),resultsRef=useRef<HTMLSpanElement>(null);
 const openEntry=route.view==='discover'?entries.find(entry=>entry.id===openEntryId&&!entry.event.hidden)??null:null;
 const openDetail=(entry:Entry,trigger:HTMLButtonElement)=>{detailTriggerRef.current=trigger;setOpenEntryId(entry.id);};
 const returnFromDetail=()=>{const target=detailTriggerRef.current?.isConnected?detailTriggerRef.current:resultsRef.current;target?.focus({preventScroll:true});};
 const [pendingBackup,setPendingBackup]=useState<Backup|null>(null),[importError,setImportError]=useState('');
 const stateRef=useRef(snapshot.data),searchRef=useRef<HTMLInputElement>(null),importRef=useRef<HTMLInputElement>(null),importButtonRef=useRef<HTMLButtonElement>(null),composing=useRef(false);
 const state=snapshot.data,blocked=!!snapshot.error;
 const setState=useCallback((data:PlannerState)=>{stateRef.current=data;setSnapshot({data,error:''});},[]);
 const reload=useCallback(()=>{try{setState(readState());setSaveError('');}catch(e){setSnapshot(s=>({...s,error:e instanceof Error?e.message:'无法读取本地记录'}));}},[setState]);
 useEffect(()=>{
  const refresh=()=>{if(document.visibilityState==='visible')reload();};const storage=(e:StorageEvent)=>{if(e.key===STORAGE_KEY||e.key===LEGACY_KEY||e.key===null)reload();};
  document.addEventListener('visibilitychange',refresh);window.addEventListener('storage',storage);
  return()=>{document.removeEventListener('visibilitychange',refresh);window.removeEventListener('storage',storage);};
 },[reload]);
 const commit=useCallback((mutate:(next:PlannerState)=>void)=>{
  try{const latest=readState();if(latest.revision!==stateRef.current.revision){setState(latest);throw new Error('另一窗口已更新自选，已读取最新记录，请重新操作。');}
   const next=structuredClone(latest);mutate(next);next.revision++;writeState(next);setState(next);setSaveError('');return true;
  }catch(e){const message=e instanceof Error?e.message:'保存失败，原选择已保留。';setSaveError(message);toast.error(message);return false;}
 },[setState]);
 const choose=useCallback((entry:Entry,status:Status)=>{
  const ok=commit(next=>{next.selections[entry.id]={status,version:(next.selections[entry.id]?.version||0)+1};if(status==='attend')delete next.pending[entry.eventId];});
  if(ok&&(status==='attend'||status==='watch'))toast.success(`${status==='attend'?'已加入计划参加':'已加入关注'} · ${entryName(entry)}`,{id:'selection-feedback'});return ok;
 },[commit]);
 const update=useCallback((patch:Partial<Filters>)=>setFilters(f=>({...f,...patch,page:patch.page??1})),[]);
 const nextRoute=(view:AgendaRoute['view'],seriesId:string):AgendaRoute=>({...route,view,seriesId,...(seriesId!==route.seriesId?{day:'',month:getSeries(seriesId).start.slice(0,7)}:{})});
 const hrefFor=(view:AgendaRoute['view'],seriesId=route.seriesId)=>plannerHash(seriesId===route.seriesId?filters:defaults,nextRoute(view,seriesId));
 const navigate=(view:AgendaRoute['view'],seriesId=route.seriesId)=>navigateSafely(()=>{
  if(route.view===view&&route.seriesId===seriesId)return;
  scrolls.current[route.view]=window.scrollY;
  const changed=seriesId!==route.seriesId,next=nextRoute(view,seriesId);
  window.history.pushState(null,'',plannerHash(changed?defaults:{...filters,page},next));
  setOpenEntryId(null);
  setFilterOpen(false);
  if(changed){setFilters(defaults);setDraft('');scrolls.current.discover=0;scrolls.current.schedule=0;}
  setRoute(next);
  requestAnimationFrame(()=>{window.scrollTo(0,scrolls.current[view]);document.querySelector<HTMLHeadingElement>('main h1')?.focus({preventScroll:true});});
 });
 useEffect(()=>{document.title=route.view==='profile'?'我的 · Events Pro':route.view==='admin'?'管理后台 · Events Pro':route.view==='home'?'赛事 · Events Pro':route.view==='shortlist'?'我的自选 · 赛事自选':route.view==='schedule'?'我的日程表 · 赛事自选':selectedSeries?`${selectedSeries.title} · 完整赛程`:'赛事未找到 · Events Pro';},[route.view,selectedSeries]);
 const reset=()=>{setFilters(defaults);setDraft('');searchRef.current?.focus();};
 const universe=useMemo(()=>seriesEntries.filter(e=>!e.event.hidden&&(filters.supp||!e.event.supplement)),[seriesEntries,filters.supp]);
 const counts=useMemo(()=>Object.fromEntries(statuses.map(s=>[s,universe.filter(e=>(state.selections[e.id]?.status||'undecided')===s).length])) as Record<Status,number>,[universe,state.selections]);
 const filtered=useMemo(()=>universe.filter(e=>{
  const status=state.selections[e.id]?.status||'undecided',q=filters.q.trim().toLowerCase();
  if(!filters.statuses.includes(status))return false;
  if(q&&!`${e.eventId} ${e.event.officialNumber?'#'+e.event.officialNumber:''} ${entryName(e)} ${e.event.group} ${e.buyin} ${e.event.notes}`.toLowerCase().includes(q))return false;
  if(filters.from&&(e.date<filters.from||e.date>filters.to))return false;
  if(!matchesMoneyFilter(e.buyin,e.currency,filters.buyin,'lte',series.currency))return false;
  if(filters.gtd!=='all'&&(e.event.kind==='satellite'||!matchesMoneyFilter(e.event.guarantee,e.currency,filters.gtd,'gte',series.currency)))return false;
  if(!matchesEventGame(e.event,filters.game))return false;
  return true;
 }).sort((a,b)=>filters.sort==='buyin'?a.currency.localeCompare(b.currency)||(a.buyin??Infinity)-(b.buyin??Infinity):filters.sort==='gtd'?a.currency.localeCompare(b.currency)||(b.event.guarantee||0)-(a.event.guarantee||0):a.date.localeCompare(b.date)||a.hour-b.hour),[universe,state.selections,filters,series.currency]);
 const pages=Math.max(1,Math.ceil(filtered.length/size)),page=Math.min(filters.page,pages),shown=filtered.slice((page-1)*size,page*size);
 useEffect(()=>{
  const currentHash=plannerHash({...filters,page},route);
  const pop=()=>{
   if(window.location.hash===currentHash)return;
   const nextFilters=fromUrl(),nextRoute=agendaFromUrl();let deferred=false;
   const applied=navigateSafely(()=>{if(deferred){window.history.back();return;}setOpenEntryId(null);setFilterOpen(false);setFilters(nextFilters);setDraft(nextFilters.q);setRoute(nextRoute);const scroll=window.history.state?.eventTagScroll;if(nextRoute.view==='discover'&&typeof scroll==='number')requestAnimationFrame(()=>{window.scrollTo(0,scroll);resultsRef.current?.focus({preventScroll:true});});});
   if(!applied){deferred=true;window.history.pushState(null,'',currentHash);}
  };
  window.addEventListener('popstate',pop);window.addEventListener('hashchange',pop);
  return()=>{window.removeEventListener('popstate',pop);window.removeEventListener('hashchange',pop);};
 },[filters,page,route,navigateSafely]);
 useEffect(()=>{window.history.replaceState(window.history.state,'',plannerHash({...filters,page},route));},[filters,page,route]);
 const cost=budget(state,entries,eventMap),attending=entries.filter(e=>state.selections[e.id]?.status==='attend'),watching=entries.filter(e=>state.selections[e.id]?.status==='watch');
 const shortlistCount=attending.length+watching.length+cost.pendingCount;
 const switchSeries=(id:string)=>navigate(route.view,id);
 const lookAtEvent=(eventId:string)=>{const next=getSeries(eventMap.get(eventId)?.seriesId);scrolls.current.discover=0;navigate('discover',next.id);setFilters({...defaults,q:eventId,supp:true});setDraft(eventId);requestAnimationFrame(()=>searchRef.current?.focus());};
 const filterByTag=(tag:EventTagId)=>{
  window.history.replaceState({...window.history.state,eventTagScroll:window.scrollY},'',plannerHash({...filters,page},route));
  const next={...defaults,game:tag,supp:true};
  window.history.pushState({eventTagScroll:0},'',plannerHash(next,route));
  setOpenEntryId(null);setFilters(next);setDraft('');
  requestAnimationFrame(()=>{resultsRef.current?.scrollIntoView({block:'start'});resultsRef.current?.focus({preventScroll:true});window.history.replaceState({...window.history.state,eventTagScroll:window.scrollY},'',window.location.hash);});
 };
 const importFile=async(file:File)=>{setImportError('');try{if(file.size>500000)throw new Error('文件过大，请选择本工具导出的 JSON 备份。');setPendingBackup(parseBackup(await file.text()));}catch(e){const message=e instanceof Error?e.message:'无法读取备份，当前自选未更改。';setImportError(message);toast.error(message);}};
 const restore=()=>{if(!pendingBackup)return;try{let revision=stateRef.current.revision;try{revision=Math.max(revision,readState().revision);}catch{/* Valid backup can recover a corrupt local record. */}const next=structuredClone(pendingBackup.state);next.revision=revision+1;writeState(next);setState(next);setSaveError('');setImportError('');setPendingBackup(null);toast.success('备份已恢复到本机。');}catch(e){const message=e instanceof Error?e.message:'恢复失败，原记录已保留。';setSaveError(message);toast.error(message);}};
 useEffect(()=>{
  type ToolContext={registerTool:(tool:{name:string;title:string;description:string;inputSchema:object;annotations:object;execute:(input:unknown)=>unknown},options:{signal:AbortSignal})=>void|Promise<void>};
  const ctx=(document as Document&{modelContext?:ToolContext}).modelContext;if(!ctx?.registerTool)return;const controller=new AbortController();
  const tools=[{name:'read_poker_entries',title:'读取赛事场次和自选',description:'每个起始组为独立场次，读取分类和预算。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({entries:entries.map(e=>({id:e.id,title:entryName(e),date:e.date,buyin:e.buyin,currency:e.currency,status:stateRef.current.selections[e.id]?.status||'undecided'})),pending:stateRef.current.pending,budget:budget(stateRef.current,entries,eventMap)})},
  {name:'set_poker_entry_classification',title:'设置单个起始组分类',description:'仅保存个人自选，不向赌场报名。',inputSchema:{type:'object',properties:{id:{type:'string'},status:{type:'string',enum:statuses}},required:['id','status'],additionalProperties:false},annotations:{readOnlyHint:false},execute:(input:unknown)=>{const x=input as {id?:string;status?:Status},entry=entries.find(e=>e.id===x?.id);if(!entry||!statuses.includes(x.status!)||blocked)throw new Error('场次、分类或本地记录无效');if(!choose(entry,x.status!))throw new Error('分类未保存');return stateRef.current.selections[entry.id];}}];
  for(const tool of tools){try{void Promise.resolve(ctx.registerTool(tool,{signal:controller.signal})).catch(()=>{});}catch{/* Optional browser capability. */}}return()=>controller.abort();
 },[choose,blocked,entries,eventMap]);
 const error=snapshot.error||saveError||importError;
 const localTools=<div className="backup-actions"><button disabled={blocked} onClick={()=>downloadBackup(stateRef.current)}><Download size={14}/>导出备份</button><button ref={importButtonRef} onClick={()=>importRef.current?.click()}><Upload size={14}/>恢复备份</button></div>;
 const seriesView=route.view==='discover'||route.view==='schedule';
 const activeFilterLabels=[
  filters.statuses.length!==statuses.length?(filters.statuses.length?filters.statuses.map(status=>longLabels[status]).join('、'):'未选分类'):'',
  filters.buyin!=='all'?amountFilters.buyin.find(([value])=>value===filters.buyin)?.[1]:'',
  filters.gtd!=='all'?amountFilters.gtd.find(([value])=>value===filters.gtd)?.[1]:'',
  filters.game!=='all'?eventGameOptions.find(([value])=>value===filters.game)?.[1]:'',
  filters.sort!=='date'?(filters.sort==='buyin'?'报名费升序':'保底降序'):'',
  filters.supp&&supplementCount>0?'含官方补充':'',
 ].filter(Boolean);
 const homeCatalog=seriesCatalog.map(item=>{const visible=entries.filter(entry=>entry.seriesId===item.id&&!entry.event.supplement&&!entry.event.hidden);return {...item,eventCount:new Set(visible.map(entry=>entry.eventId)).size,entryCount:visible.length};});
 return <div className="app-shell">
  <header className="app-bar"><button className="brand" aria-label="返回赛事首页" onClick={()=>navigate('home')}><span className="brand-mark"><Spade size={19} fill="currentColor"/></span><span>赛事自选<small>EVENTS PRO</small></span></button>{account??<span className="app-local"><HardDrive size={13}/>本地版</span>}</header>
  <main className={`workspace${route.view==='discover'?' discovery-workspace':''}`}>{(route.view!=='discover'||!selectedSeries)&&<header className="page-heading"><div><div className="eyebrow">DISCOVER. SHORTLIST. PLAY.</div><h1 tabIndex={-1}>{route.view==='profile'?'我的':route.view==='admin'?'管理后台':route.view==='home'?'赛事':route.view==='shortlist'?'我的自选':!selectedSeries?'赛事未找到':'我的日程表'}</h1>{route.view==='home'&&<p>按地区发现赛事，安排你的下一站。</p>}</div></header>}
   {(route.view==='shortlist'||route.view==='schedule')&&<div className="plan-view-switch" role="group" aria-label="参赛计划视图"><button aria-pressed={route.view==='shortlist'} onClick={()=>navigate('shortlist')}><Table2 size={16}/>表格</button><button aria-pressed={route.view==='schedule'} onClick={()=>navigate('schedule')}><CalendarDays size={16}/>日历</button></div>}
   {route.view==='schedule'&&<div className="series-picker"><span>赛事系列</span><FilterSelect label="赛事系列" value={route.seriesId} onChange={switchSeries} options={seriesList.map(item=>[item.id,item.shortTitle])}/></div>}
   {route.view==='discover'&&selectedSeries&&<header className="series-header discovery-series-header"><button type="button" className="discovery-back" aria-label="返回赛事列表" title="返回赛事列表" onClick={()=>navigate('home')}><ArrowLeft size={19} aria-hidden="true"/></button><SeriesLogo compact key={series.id} series={series}/><div className="discovery-series-info"><h1 tabIndex={-1} aria-label={`${series.title} · 完整赛程`} title={series.title}>{series.title}</h1><p className="discovery-series-location" title={`${series.country} · ${series.city} · ${series.venue}`}><MapPin size={11} aria-hidden="true"/><span>{series.country} · {series.city} · {series.venue}</span></p><p className="discovery-series-dates">{series.start.replaceAll('-','.')} — {series.end.slice(5).replace('-','.')} · {series.timeLabel}</p></div></header>}
   {settingsError&&<div className="error-banner" role="alert"><span>{settingsError}</span><button onClick={reloadSettings}>重新读取设置</button></div>}
   {error&&<div className="error-banner" role="alert"><span>{error}</span><button onClick={()=>{setImportError('');reload();}}>重新读取</button></div>}
   {cost.pendingCount>0&&route.view!=='shortlist'&&<div className="migration-note"><CalendarDays size={18}/><span>已保留旧版 {cost.pendingCount} 项“参加”记录，尚未确定起始组。</span><button className="text-button" onClick={()=>navigate('shortlist')}>去安排 →</button></div>}
   {route.view==='profile'?<ProfilePage key={settings.profile.username} accountInfo={accountInfo} account={account} selectionsBackup={localTools} onManage={()=>navigate('admin')}/>:route.view==='admin'?<AdminPage initialSeriesId={series.id} onBack={()=>navigate('profile')}/>:route.view==='home'?<SeriesHome catalog={homeCatalog} region={route.region} onRegionChange={region=>setRoute(r=>({...r,region}))} hrefForSeries={id=>hrefFor('discover',id)} onOpen={id=>navigate('discover',id)}/>:route.view==='shortlist'?<MyShortlist state={state} blocked={blocked} error={error} onChoose={choose} onBudgetModeChange={mode=>{commit(next=>{next.budgetMode=mode;});}} onShowFlights={lookAtEvent} onRemovePending={id=>{commit(next=>{delete next.pending[id];});}} onDiscover={()=>navigate('home')}/>:!selectedSeries?<div className="empty-state"><Compass size={28}/><h3>没有找到这项赛事</h3><p>该赛事尚未收录，或链接已失效。</p><button onClick={()=>navigate('home')}>返回赛事首页</button></div>:route.view==='schedule'?<MySchedule key={series.id} state={state} route={route} onRouteChange={patch=>setRoute(r=>({...r,...patch}))} supplement={filters.supp} onSupplementChange={v=>update({supp:v})} blocked={blocked} error={error} onChoose={choose} onShowFlights={lookAtEvent}/>:<section className="schedule-panel" aria-label="赛事自选表">
    <div className="discovery-filter-bar" role="region" aria-label="赛程筛选">
     <div className="search"><Search size={17}/><input ref={searchRef} aria-label="搜索赛事" placeholder="搜索赛事、编号或起始组" value={draft} onCompositionStart={()=>{composing.current=true;}} onCompositionEnd={e=>{composing.current=false;update({q:e.currentTarget.value});}} onChange={e=>{setDraft(e.target.value);if(!composing.current)update({q:e.target.value});}}/>{draft&&<button aria-label="清空搜索" onClick={()=>{setDraft('');update({q:''});searchRef.current?.focus();}}><X size={16}/></button>}</div>
     <DiscoveryFilterPopover value={filters} counts={counts} amountFilters={amountFilters} mixedCurrency={(series.currencies?.length??0)>1} supplementCount={supplementCount} resultCount={filtered.length} open={filterOpen} onOpenChange={setFilterOpen} onChange={update} onReset={()=>{setFilters(defaults);setDraft('');}}><div className="discovery-quick-controls">
      <FestivalCalendar singleTrigger compact key={series.id} series={series} from={filters.from} to={filters.to} onChange={(from,to)=>update({from,to})} plannedDates={attending.filter(entry=>entry.seriesId===series.id).map(e=>e.date)}/>
      <PopoverTrigger asChild><button type="button" className={`discovery-filter-trigger${activeFilterLabels.length||filterOpen?' active':''}`} aria-label="赛程筛选" aria-describedby={activeFilterLabels.length?'discovery-active-summary':undefined}><SlidersHorizontal size={15} aria-hidden="true"/>筛选{activeFilterLabels.length>0&&<b>{activeFilterLabels.length}</b>}</button></PopoverTrigger>
      <div className="results-bar"><span ref={resultsRef} tabIndex={-1} aria-live="polite"><span className="sr-only">找到 </span><b>{filtered.length}</b> 个场次 <small className="sr-only">· {new Set(filtered.map(e=>e.eventId)).size} 项赛事</small></span></div>
     </div></DiscoveryFilterPopover>
     {activeFilterLabels.length>0&&<div className="discovery-active-filters"><span id="discovery-active-summary" title={activeFilterLabels.join(' · ')}>{activeFilterLabels.join(' · ')}</span><button className="clear-filters" aria-label="重置筛选" title="重置筛选" onClick={reset}><RotateCcw size={14}/></button></div>}
    </div><div className="mobile-events">{shown.map(entry=><EventCard key={entry.id} entry={entry} status={state.selections[entry.id]?.status||'undecided'} blocked={blocked} onOpen={trigger=>openDetail(entry,trigger)} onChoose={status=>{const trigger=document.activeElement;if(choose(entry,status))requestAnimationFrame(()=>{if(trigger&&!trigger.isConnected)resultsRef.current?.focus({preventScroll:true});});}}/>)}</div>
    {!shown.length&&<div className="empty-state"><Search size={26}/><h3>没有符合条件的场次</h3><p>{filters.statuses.length?'调整日期、分类或报名费，再找一场想打的。':'当前没有勾选任何分类，请选择至少一种。'}</p><button onClick={reset}>查看全部赛事</button></div>}
    <div className="pagination"><span>{filtered.length?`${(page-1)*size+1}–${Math.min(page*size,filtered.length)}`:'0'} / {filtered.length} 场次</span><div><button disabled={page===1} onClick={()=>update({page:page-1})}>上一页</button><span>{page} / {pages}</span><button disabled={page===pages} onClick={()=>update({page:page+1})}>下一页</button></div></div>
   </section>}{(route.view==='home'||route.view==='shortlist'||seriesView)&&<footer className="page-foot"><span>{route.view==='home'?'赛程按赛事当地时间显示。':'保底为整项赛事共享；续赛日见详情。移动文件、换浏览器或清理数据前，请导出备份。'}</span>{seriesView&&selectedSeries&&<><a href={series.sourcePdf?.src||series.sourceUrl} download={series.sourcePdf?.filename} target={series.sourcePdf?undefined:'_blank'} rel="noreferrer">{series.sourceLabel} <ExternalLink size={12}/></a>{series.sourceUpdated&&<span>赛程版本：{series.sourceUpdated}</span>}</>}</footer>}
  </main><input ref={importRef} type="file" accept=".json,application/json" aria-label="选择备份文件" className="sr-only" tabIndex={-1} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void importFile(file);}}/><nav className="bottom-nav" aria-label="应用导航"><button className={(route.view==='home'||route.view==='discover')?'active':''} aria-current={(route.view==='home'||route.view==='discover')?'page':undefined} onClick={()=>navigate('home')}><Compass size={21}/><span>赛事</span></button><button className={route.view==='schedule'?'active':''} aria-current={route.view==='schedule'?'page':undefined} onClick={()=>navigate('schedule')}><CalendarDays size={21}/><span>我的日程</span></button><button className={route.view==='shortlist'?'active':''} aria-current={route.view==='shortlist'?'page':undefined} onClick={()=>navigate('shortlist')}><span className="nav-shortlist-icon"><Table2 size={21}/>{shortlistCount>0&&<b>{shortlistCount}</b>}</span><span>我的自选</span></button><button className={(route.view==='profile'||route.view==='admin')?'active':''} aria-current={(route.view==='profile'||route.view==='admin')?'page':undefined} onClick={()=>navigate('profile')}><UserRound size={21}/><span>我的</span></button></nav>
  <AlertDialog open={!!pendingBackup} onOpenChange={open=>{if(!open)setPendingBackup(null);}}><AlertDialogContent onCloseAutoFocus={e=>{e.preventDefault();importButtonRef.current?.focus();}}><AlertDialogHeader><AlertDialogTitle>恢复这份自选备份？</AlertDialogTitle><AlertDialogDescription>备份时间：{pendingBackup?new Date(pendingBackup.savedAt).toLocaleString('zh-CN'):''}。含 {pendingBackup?Object.values(pendingBackup.state.selections).filter(s=>s.status==='attend').length:0} 个参加起始组、{pendingBackup?Object.values(pendingBackup.state.selections).filter(s=>s.status==='watch').length:0} 个关注起始组、{pendingBackup?Object.keys(pendingBackup.state.pending).length:0} 项待安排赛事。恢复将替换当前全部分类和预算设置；未列入备份的场次恢复为待定。建议先导出当前备份。</AlertDialogDescription></AlertDialogHeader>{saveError&&<p className="restore-error" role="alert">{saveError}</p>}<AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={e=>{e.preventDefault();restore();}}>确认恢复</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog><Toaster position="bottom-center" offset={{bottom:90}} mobileOffset={{bottom:90,left:16,right:16}} richColors theme="light"/>
  <EventDetailSheet entry={openEntry} status={openEntry?state.selections[openEntry.id]?.status||'undecided':'undecided'} blocked={blocked} error={error} onClose={()=>setOpenEntryId(null)} onChoose={status=>{if(openEntry)choose(openEntry,status);}} onShowFlights={lookAtEvent} onFilterTag={filterByTag} onReturnFocus={returnFromDetail}/>
 </div>;
}
