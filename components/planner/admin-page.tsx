import {isNativeIOS} from '@/lib/file-export';
import {useRef,useState,type FormEvent} from 'react';
import {Tabs} from 'radix-ui';
import {ArrowLeft,ChevronRight,ExternalLink,EyeOff,Search,Settings2,X} from 'lucide-react';
import {toast} from 'sonner';
import {Sheet,SheetContent,SheetHeader,SheetTitle,SheetDescription,SheetClose} from '@/components/ui/sheet';
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from '@/components/ui/alert-dialog';
import {Checkbox} from '@/components/ui/checkbox';
import {eventNumber,events as originalEvents,type Event} from '@/lib/schedule';
import {getSeries,seriesList} from '@/lib/catalog';
import {currencyNames,money,type DisplayCurrency,type ExchangeRates} from '@/lib/money';
import {localToday,type EventOverride} from '@/lib/app-settings';
import {FilterSelect} from './controls';
import {useAppSettings,useUnsavedChanges} from './settings-context';

const rateCurrencies:DisplayCurrency[]=['USD','VND','HKD','KRW'];
const units:Record<DisplayCurrency,number>={CNY:1,USD:1,VND:1000,HKD:1,KRW:1000};
const rateDraft=(rates:ExchangeRates)=>Object.fromEntries(rateCurrencies.map(c=>[c,rates[c]===null?'':String(Number((rates[c]!*units[c]).toPrecision(12)))]));
function ExchangeRateEditor(){
 const {settings,settingsError,saveSettings}=useAppSettings();
 const [baseline,setBaseline]=useState(settings),[rates,setRates]=useState(()=>rateDraft(settings.fx.rates)),[source,setSource]=useState(settings.fx.source),[error,setError]=useState(''),[invalid,setInvalid]=useState('');
 const form=useRef<HTMLFormElement>(null),composingForm=useRef(false);
 const dirty=JSON.stringify(rates)!==JSON.stringify(rateDraft(baseline.fx.rates))||source!==baseline.fx.source;
 useUnsavedChanges(dirty);
 const reset=()=>{setRates(rateDraft(settings.fx.rates));setSource(settings.fx.source);setBaseline(settings);setError('');};
 const save=async(event:FormEvent)=>{
  event.preventDefault();if(composingForm.current)return;setError('');setInvalid('');const parsed:ExchangeRates={CNY:1,USD:null,VND:null,HKD:null,KRW:null};
  for(const currency of rateCurrencies){const raw=rates[currency].trim();const value=Number(raw)/units[currency];
   if(raw&&(!/^\d+(?:\.\d{1,8})?$/.test(raw)||!Number.isFinite(value)||value<1e-8||value>1e8)){setInvalid(currency);setError(`${currencyNames[currency]}汇率须为大于零的数字，最多 8 位小数。`);form.current?.querySelector<HTMLInputElement>(`[name="${currency}"]`)?.focus();return;}
   parsed[currency]=raw?value:null;
  }
  if(source.trim().length>120){setError('来源说明不能超过 120 个字。');return;}
  const label=source.trim()===baseline.fx.source&&JSON.stringify(parsed)!==JSON.stringify(baseline.fx.rates)?'手动设置':source.trim()||'手动设置';
  try{const next=await saveSettings(s=>{s.fx={rates:parsed,asOf:localToday(),source:label};},baseline.revision);setBaseline(next);setSource(label);toast.success('汇率已保存');}catch(e){setError((e as Error).message);}
 };
 return <section className="settings-section exchange-settings"><h2>汇率设置</h2><p className="settings-hint">以人民币为基准，各币种自动交叉换算。留空表示暂不提供该币种换算。</p><form noValidate ref={form} onCompositionStart={()=>{composingForm.current=true;}} onCompositionEnd={()=>{composingForm.current=false;}} onSubmit={save}><div className="rate-base"><span>人民币 · CNY</span><strong>1 = ¥1</strong></div>{rateCurrencies.map(currency=><div className="rate-field" key={currency}><label htmlFor={`rate-${currency}`}>{currencyNames[currency]}<small>{units[currency].toLocaleString()} {currency} =</small></label><div><input id={`rate-${currency}`} name={currency} aria-label={`${currencyNames[currency]}汇率`} aria-invalid={invalid===currency} aria-describedby={invalid===currency?"rate-format rate-error":"rate-format"} inputMode="decimal" value={rates[currency]} onChange={event=>setRates(current=>({...current,[currency]:event.target.value}))} autoComplete="off"/><span>CNY</span></div></div>)}<p id="rate-format" className="settings-hint">越南盾和韩元按 1,000 单位输入，其余按 1 单位输入。</p><label className="form-field" htmlFor="rate-source">来源或备注<input id="rate-source" value={source} maxLength={120} onChange={event=>setSource(event.target.value)}/></label>{error&&<p id="rate-error" className="form-error" role="alert">{error}</p>}<div className="form-actions"><button className="text-button" type="button" onClick={reset}>重新载入</button><button className="primary-button" disabled={!!settingsError||!dirty} type="submit">保存汇率</button></div></form><div className="source-caption"><span>当前记录：{settings.fx.source} · {settings.fx.asOf}</span><a href="https://www.boc.cn/sourcedb/whpj/" target="_blank" rel="noreferrer">初始参考来源：中国银行 <ExternalLink size={12}/></a></div></section>;
}

function EventEditor({event,onClose}:{event:Event;onClose:()=>void}){
 const {settings,settingsError,saveSettings,navigateSafely}=useAppSettings(),base=originalEvents.find(e=>e.id===event.id)!;
 const [baseline]=useState(settings.revision),[title,setTitle]=useState(event.title),[buyin,setBuyin]=useState(event.buyin===null?'':String(event.buyin)),[guarantee,setGuarantee]=useState(event.guarantee===null?'':String(event.guarantee)),[notes,setNotes]=useState(event.adminNotes||''),[hidden,setHidden]=useState(!!event.hidden),[error,setError]=useState(''),[confirmReset,setConfirmReset]=useState(false),[invalid,setInvalid]=useState('');
 const [initial]=useState({title:event.title,buyin:event.buyin===null?'':String(event.buyin),guarantee:event.guarantee===null?'':String(event.guarantee),notes:event.adminNotes||'',hidden:!!event.hidden});
 const dirty=JSON.stringify({title,buyin,guarantee,notes,hidden})!==JSON.stringify(initial);
 useUnsavedChanges(dirty);
 const form=useRef<HTMLFormElement>(null),composingForm=useRef(false),festival=getSeries(event.seriesId),currency=event.currency||festival.currency;
 const save=async(submit:FormEvent)=>{
  submit.preventDefault();if(composingForm.current)return;setError('');setInvalid('');
  if(!title.trim()||title.trim().length>160){setInvalid('title');setError('赛事名称须为 1–160 个字。');form.current?.querySelector<HTMLInputElement>('[name="title"]')?.focus();return;}
  for(const [field,value,label]of [['buyin',buyin,'报名费'],['guarantee',guarantee,'保底']]){
   if(value===''||(field==='guarantee'&&event.kind==='satellite'))continue;
   if(!/^\d+$/.test(value)||!Number.isSafeInteger(Number(value))||Number(value)>1e12){setInvalid(field);setError(`${label}须为非负整数，不能超过一万亿。`);form.current?.querySelector<HTMLInputElement>(`[name="${field}"]`)?.focus();return;}
  }
  const patch:EventOverride={};
  if(title.trim()!==base.title)patch.title=title.trim();
  const price=buyin===''?null:Number(buyin);if(price!==base.buyin)patch.buyin=price;
  if(event.kind!=='satellite'){const value=guarantee===''?null:Number(guarantee);if(value!==base.guarantee)patch.guarantee=value;}
  if(notes.trim())patch.adminNotes=notes.trim();if(hidden)patch.hidden=true;
  try{await saveSettings(s=>{if(Object.keys(patch).length)s.eventOverrides[event.id]=patch;else delete s.eventOverrides[event.id];},baseline);toast.success('赛事修改已保存');onClose();}catch(e){setError((e as Error).message);}
 };
 return <><Sheet open onOpenChange={open=>{if(!open)navigateSafely(onClose);}}><SheetContent className="cart-sheet event-editor-sheet" showCloseButton={false}><SheetHeader className="cart-heading"><SheetTitle>编辑赛事</SheetTitle><SheetDescription>{festival.shortTitle} · {eventNumber(event)}</SheetDescription><SheetClose className="cart-close" aria-label="关闭赛事编辑"><X size={20}/></SheetClose></SheetHeader><div className="cart-scroll"><form id="event-editor" ref={form} noValidate onCompositionStart={()=>{composingForm.current=true;}} onCompositionEnd={()=>{composingForm.current=false;}} onSubmit={save}><label className="form-field">赛事名称<input name="title" aria-invalid={invalid==="title"} aria-describedby={invalid==="title"?"event-error":undefined} aria-label="赛事名称" value={title} maxLength={160} onChange={e=>setTitle(e.target.value)}/></label><label className="form-field">统一报名费 · {currency}<input name="buyin" aria-invalid={invalid==="buyin"} aria-describedby={invalid==="buyin"?"event-error":undefined} aria-label="赛事报名费" inputMode="numeric" value={buyin} onChange={e=>setBuyin(e.target.value)}/><small>修改后应用于此赛事的 {event.starts.length} 个起始组；晋级续赛不计买入。留空表示未公布。</small></label>{event.kind!=='satellite'&&<label className="form-field">赛事保底 · {currency}<input name="guarantee" aria-invalid={invalid==="guarantee"} aria-describedby={invalid==="guarantee"?"event-error":undefined} aria-label="赛事保底金额" inputMode="numeric" value={guarantee} placeholder="未列保底" onChange={e=>setGuarantee(e.target.value)}/><small>保底属于整项赛事，留空表示未列保底。</small></label>}<label className="form-field">管理备注<textarea className="resize-none" aria-label="管理备注" value={notes} maxLength={1000} rows={3} onChange={e=>setNotes(e.target.value)}/></label><label className="management-toggle"><Checkbox checked={!hidden} onCheckedChange={checked=>setHidden(checked!==true)} aria-label="在赛事发现中显示"/>在赛事发现中显示</label>{hidden&&<p className="settings-hint">已有自选和日程继续保留。</p>}{error&&<p id="event-error" className="form-error" role="alert">{error}</p>}</form>{!isNativeIOS()&&<section className="structure-placeholder" aria-label="盲注结构框架"><h3>盲注结构 <span>后续开放</span></h3><div><span>级别</span><span>小盲 / 大盲</span><span>前注</span><span>时长</span></div><p>预留逐级盲注、升盲时长与休息安排。</p></section>}<button className="text-button" disabled={!settings.eventOverrides[event.id]||!!settingsError} onClick={()=>setConfirmReset(true)}>恢复官方数据</button></div><div className="editor-footer"><button type="button" className="text-button" onClick={()=>navigateSafely(onClose)}>取消</button><button type="submit" form="event-editor" className="primary-button" disabled={!!settingsError||!dirty}>保存赛事</button></div></SheetContent></Sheet>
 <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>恢复这项赛事的官方数据？</AlertDialogTitle><AlertDialogDescription>清除名称、金额、备注和显示状态的本机修改。原有参赛选择保留。</AlertDialogDescription></AlertDialogHeader>{error&&<p className="form-error" role="alert">{error}</p>}<AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={async e=>{e.preventDefault();try{await saveSettings(s=>{delete s.eventOverrides[event.id];},baseline);setConfirmReset(false);toast.success('已恢复官方数据');onClose();}catch(failure){setError((failure as Error).message);}}}>恢复官方数据</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></>;
}

function TournamentManager({initialSeriesId}:{initialSeriesId:string}){
 const {catalog}=useAppSettings();
 const [seriesId,setSeriesId]=useState(initialSeriesId),[query,setQuery]=useState(''),[visibility,setVisibility]=useState('all'),[page,setPage]=useState(1),[selected,setSelected]=useState<Event|null>(null);
 const input=useRef<HTMLInputElement>(null),[searchDraft,setSearchDraft]=useState(''),composing=useRef(false);
 const filtered=catalog.events.filter(e=>(e.seriesId||seriesList[0].id)===seriesId&&`${eventNumber(e)} ${e.id} ${e.title}`.toLowerCase().includes(query.trim().toLowerCase())&&(visibility==='all'||(visibility==='hidden'?e.hidden:!e.hidden)));
 const totalPages=Math.max(1,Math.ceil(filtered.length/10)),current=Math.min(page,totalPages),shown=filtered.slice((current-1)*10,current*10);
 return <section className="settings-section tournament-manager"><h2>赛事管理</h2><div className="admin-filters"><FilterSelect label="管理赛事系列" value={seriesId} options={seriesList.map(s=>[s.id,s.shortTitle])} onChange={value=>{setSeriesId(value);setPage(1);}}/><div className="search"><Search size={17}/><input ref={input} value={searchDraft} aria-label="搜索管理赛事" placeholder="搜索赛事名称或编号" onCompositionStart={()=>{composing.current=true;}} onCompositionEnd={e=>{composing.current=false;setQuery(e.currentTarget.value);setPage(1);}} onChange={e=>{setSearchDraft(e.target.value);if(!composing.current){setQuery(e.target.value);setPage(1);}}}/>{searchDraft&&<button aria-label="清空管理赛事搜索" onClick={()=>{setSearchDraft('');setQuery('');setPage(1);input.current?.focus();}}><X size={15}/></button>}</div><FilterSelect label="赛事显示状态" value={visibility} onChange={value=>{setVisibility(value);setPage(1);}} options={[["all","全部赛事"],["visible","正在显示"],["hidden","已隐藏"]]}/></div><p className="admin-count" aria-live="polite">共 {filtered.length} 项赛事</p><div className="admin-event-list">{shown.map(event=><button key={event.id} className="admin-event-row" data-event-id={event.id} onClick={()=>setSelected(event)} aria-label={`编辑 ${event.title}`}><span><small>{eventNumber(event)} · {event.starts.length} 个起始组{event.hidden&&<> · <EyeOff size={12}/>已隐藏</>}</small><strong>{event.title}</strong><span>{money(event.buyin,event.currency)}</span></span><ChevronRight size={18}/></button>)}</div>{!shown.length&&<div className="empty-state"><Search size={24}/><h3>没有匹配的赛事</h3><button onClick={()=>{setSearchDraft('');setQuery('');setVisibility('all');setPage(1);}}>重置管理筛选</button></div>}<div className="pagination"><span>{current} / {totalPages}</span><div><button disabled={current===1} onClick={()=>setPage(current-1)}>上一页</button><button disabled={current===totalPages} onClick={()=>setPage(current+1)}>下一页</button></div></div>{selected&&<EventEditor key={selected.id} event={selected} onClose={()=>setSelected(null)}/>}</section>;
}
export function AdminPage({initialSeriesId,onBack}:{initialSeriesId:string;onBack:()=>void}){
 const {navigateSafely}=useAppSettings(),[tab,setTab]=useState('rates');
 return <div className="admin-page"><button className="text-button admin-back" onClick={onBack}><ArrowLeft size={16}/>返回我的</button><div className="admin-scope"><Settings2 size={17}/><span>本机管理：修改只影响{isNativeIOS()?'当前设备':'当前浏览器'}。</span></div><Tabs.Root value={tab} onValueChange={value=>navigateSafely(()=>setTab(value))}><Tabs.List className="admin-tabs" aria-label="后台管理分类"><Tabs.Trigger value="rates">汇率设置</Tabs.Trigger><Tabs.Trigger value="events">赛事管理</Tabs.Trigger></Tabs.List><Tabs.Content value="rates"><ExchangeRateEditor/></Tabs.Content><Tabs.Content value="events"><TournamentManager initialSeriesId={initialSeriesId}/></Tabs.Content></Tabs.Root></div>;
}
