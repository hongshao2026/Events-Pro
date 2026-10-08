import {Check,Star,Minus,X} from 'lucide-react';
import {Select as ChoiceRoot,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {RadioGroup,RadioGroupItem} from '@/components/ui/radio-group';
import {Checkbox} from '@/components/ui/checkbox';
import {statuses,shortlistStatuses,statusLabels,type Status} from '@/lib/schedule';
import {entryName,type Entry} from '@/lib/catalog';
export const longLabels:Record<Status,string>={undecided:'待定',attend:'计划参加',watch:'正在关注',skip:'不考虑'};
const icons={undecided:Minus,attend:Check,watch:Star,skip:X};
export function FilterSelect({label,value,onChange,options,disabled=false,id,fitOptions=false}:{id?:string;label:string;value:string;onChange:(v:string)=>void;options:[string,string][];disabled?:boolean;fitOptions?:boolean}){
 return <ChoiceRoot value={value} onValueChange={onChange} disabled={disabled}><SelectTrigger id={id} className="filter-select" aria-label={label}><SelectValue/></SelectTrigger><SelectContent position="popper" align="start" className={`filter-popup${fitOptions?' fit-options':''}`}>{options.map(([v,t])=><SelectItem key={v} value={v}>{t}</SelectItem>)}</SelectContent></ChoiceRoot>;
}
export function EntryActions({entry,value,disabled,onChange}:{entry:Entry;value:Status;disabled:boolean;onChange:(s:Status)=>void}){
 return <RadioGroup className="classification" value={value} onValueChange={v=>onChange(v as Status)} disabled={disabled} aria-label={`${entryName(entry)} 的分类`}>{statuses.map(s=>{const Icon=icons[s];return <label key={s} data-status={s} className={`class-option ${s} ${value===s?'selected':''}`}><RadioGroupItem value={s} className="sr-only" aria-label={statusLabels[s]}/><Icon size={14}/><span>{statusLabels[s]}</span></label>;})}</RadioGroup>;
}
export function StatusFilter({value,onChange,counts,variant='discovery',compact=false}:{value:Status[];onChange:(v:Status[])=>void;counts:Record<Status,number>;variant?:'discovery'|'shortlist';compact?:boolean}){
 const options=variant==='shortlist'?shortlistStatuses:statuses,allLabel=variant==='shortlist'?'参加与关注':'全部赛事';
 const selected=options.filter(s=>value.includes(s)),allSelected=selected.length===options.length;
 const toggle=(s:Status,checked:boolean)=>onChange(options.filter(x=>x===s?checked:value.includes(x)));
 return <div className="status-filter" role="group" aria-label="分类多选筛选"><div className="status-filter-heading">{!compact&&<span className="filter-label">显示分类 <small>可多选</small></span>}<label className={`status-all ${allSelected?'active':''}`}><Checkbox aria-label={allLabel} checked={allSelected?true:selected.length?'indeterminate':false} onCheckedChange={v=>onChange(v===true?[...options]:[])}/><span>{allLabel}</span></label></div><div className="status-options">{options.map(s=><label key={s} data-status={s} className={`status-pill ${s} ${value.includes(s)?'active':''}`}><Checkbox aria-label={`筛选${longLabels[s]}`} checked={value.includes(s)} onCheckedChange={v=>toggle(s,v===true)}/><span>{statusLabels[s]}</span><b>{counts[s]}</b></label>)}</div>{variant==='discovery'&&<button className={`hide-skipped ${!value.includes('skip')?'active':''}`} aria-pressed={!value.includes('skip')} onClick={()=>toggle('skip',!value.includes('skip'))}><X size={14}/>{!value.includes('skip')?'已隐藏不考虑':'隐藏不考虑'}</button>}</div>;
}
