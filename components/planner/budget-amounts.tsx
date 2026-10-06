import {currencies,type Currency} from '@/lib/money';
import {PriceAmount} from './price-amount';

export function BudgetAmounts({totals}:{totals:Partial<Record<Currency,number>>}){
 const active=currencies.filter(currency=>totals[currency]!==undefined);
 return <><span>计划参加预算</span>{(active.length?active:['USD'] as Currency[]).map(currency=><strong key={currency} data-currency={currency}><PriceAmount value={totals[currency]||0} currency={currency}/></strong>)}</>;
}
