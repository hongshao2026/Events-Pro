import {entries,eventMap,type Entry} from './catalog';
import type {PlannerState} from './local-store';

export const compareShortlistEntries=(a:Entry,b:Entry)=>a.date.localeCompare(b.date)||a.hour-b.hour||a.id.localeCompare(b.id);

export function shortlistEntries(state:PlannerState):Entry[]{
 return entries.filter(entry=>{
  const status=state.selections[entry.id]?.status;
  return status==='attend'||status==='watch';
 }).sort(compareShortlistEntries);
}

// Allocate the existing budget to individual rows without multiplying shared event costs.
// For event mode, the highest-buy-in attending flight owns the amount; equal prices
// go to the earliest local start, then its stable ID. Filtering never reallocates it.
export function shortlistBudget(state:PlannerState):{entries:Record<string,number>;pending:Record<string,number>}{
 const amounts:Record<string,number>={},pending:Record<string,number>={};
 const selected=shortlistEntries(state),owners=new Map<string,Entry>();
 for(const entry of selected){
  amounts[entry.id]=0;
  if(state.selections[entry.id].status!=='attend')continue;
  if(state.budgetMode==='flights')amounts[entry.id]=entry.buyin;
  const owner=owners.get(entry.eventId);
  if(!owner||entry.buyin>owner.buyin)owners.set(entry.eventId,entry);
 }
 if(state.budgetMode==='events')for(const owner of owners.values())amounts[owner.id]=owner.buyin;
 for(const eventId of Object.keys(state.pending))pending[eventId]=owners.has(eventId)?0:eventMap.get(eventId)?.buyin||0;
 return {entries:amounts,pending};
}
