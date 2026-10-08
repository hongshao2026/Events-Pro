import {currencies,type Currency} from '@/lib/money';
import {PriceAmount} from './price-amount';

export function BudgetAmounts({totals,unknownCount=0}:{unknownCount?:number;totals:Partial<Record<Currency,number>>}){
 const active=currencies.filter(currency=>totals[currency]!==undefined);
 return <><span>计划参加预算</span>{(active.length?active:unknownCount?[]:['USD'] as Currency[]).map(currency=><strong key={currency} data-currency={currency}><PriceAmount value={totals[currency]||0} currency={currency}/></strong>)}{unknownCount>0&&<p className="budget-currency-note">另有 {unknownCount} 个买入报名费未公布，未计入预算。</p>}</>;
}
