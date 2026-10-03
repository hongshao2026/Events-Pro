import {currencies,money,type Currency} from '@/lib/money';
import {cny} from '@/lib/schedule';

export function BudgetAmounts({totals}:{totals:Partial<Record<Currency,number>>}){
 const active=currencies.filter(currency=>totals[currency]!==undefined);
 return <><span>计划参加预算</span>{(active.length?active:['USD'] as Currency[]).map(currency=><strong key={currency} data-currency={currency}>{money(totals[currency]||0,currency)} {currency==='USD'&&<small>{cny(totals.USD||0)}</small>}</strong>)}{totals.VND!==undefined&&<p className="budget-currency-note">按币种分别合计，越南盾未换汇。人民币估算仅对应美元部分。</p>}</>;
}
