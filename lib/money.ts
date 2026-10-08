export type Currency='USD'|'VND'|'KRW';
export type DisplayCurrency=Currency|'CNY'|'HKD';
export type CurrencyPreference=DisplayCurrency|'original';
export const displayCurrencies:DisplayCurrency[]=['CNY','USD','VND','HKD','KRW'];
export const currencyNames:Record<DisplayCurrency,string>={CNY:'人民币',USD:'美元',VND:'越南盾',HKD:'港币',KRW:'韩元'};
export const currencies:Currency[]=['USD','VND','KRW'];
const symbols:Record<DisplayCurrency,string>={USD:'$',VND:'₫',CNY:'¥',HKD:'HK$',KRW:'₩'};
const integerCurrency=(currency:DisplayCurrency)=>currency==='VND'||currency==='KRW';
export const money=(value:number|null,currency:DisplayCurrency='USD')=>value===null?'未公布':symbols[currency]+value.toLocaleString('en-US',{maximumFractionDigits:integerCurrency(currency)?0:2});
export type ExchangeRates=Record<DisplayCurrency,number|null>;
export function convertedAmount(value:number,from:DisplayCurrency,to:CurrencyPreference,rates:ExchangeRates):number|null{
 if(to==='original'||from===to)return null;
 const source=rates[from],target=rates[to];
 if(source===null||target===null||!Number.isFinite(source)||!Number.isFinite(target)||source<=0||target<=0)return null;
 const amount=value*source/target;
 return Number.isFinite(amount)?amount:null;
}
export const convertedMoney=(value:number,currency:DisplayCurrency)=>symbols[currency]+value.toLocaleString('en-US',{minimumFractionDigits:integerCurrency(currency)?0:2,maximumFractionDigits:integerCurrency(currency)?0:2});

// Thresholds are in the selected series' native currency; no implicit FX conversion.
export function moneyFilters(currency:Currency):{buyin:[string,string][];gtd:[string,string][];quick:{buyin:string;gtd:string}}{
 return currency==='KRW'?{
  buyin:[['all','全部报名费'],['300000','₩30万及以下'],['500000','₩50万及以下'],['1000000','₩100万及以下'],['1500000','₩150万及以下'],['2500000','₩250万及以下'],['4000000','₩400万及以下'],['8000000','₩800万及以下']],
  gtd:[['all','全部保底'],['880000000','₩8.8亿及以上'],['1200000000','₩12亿及以上'],['1800000000','₩18亿及以上']],
  quick:{buyin:'1000000',gtd:'880000000'},
 }:currency==='VND'?{
  buyin:[['all','全部报名费'],['2500000','250万₫及以下'],['4500000','450万₫及以下'],['6600000','660万₫及以下'],['11000000','1,100万₫及以下'],['22000000','2,200万₫及以下'],['55000000','5,500万₫及以下']],
  gtd:[['all','全部保底'],['200000000','2亿₫及以上'],['500000000','5亿₫及以上'],['1000000000','10亿₫及以上'],['6000000000','60亿₫及以上'],['10000000000','100亿₫及以上']],
  quick:{buyin:'4500000',gtd:'1000000000'},
 }:{
  buyin:[['all','全部报名费'],['300','$300 及以下'],['600','$600 及以下'],['1100','$1,100 及以下'],['1999','低于 $2,000'],['3000','$3,000 及以下'],['5000','$5,000 及以下'],['8000','$8,000 及以下'],['15000','$15,000 及以下']],
  gtd:[['all','全部保底'],['100000','$100K 及以上'],['250000','$250K 及以上'],['1000000','$1M 及以上']],
  quick:{buyin:'1999',gtd:'250000'},
 };
}
export function seriesMoneyFilters(currency:Currency,others:Currency[]=[currency]){
 if(others.length<2)return moneyFilters(currency);
 const options=(kind:'buyin'|'gtd'):[string,string][]=>[["all",kind==='buyin'?'全部报名费':'全部保底'],...others.flatMap(c=>moneyFilters(c)[kind].filter(([v])=>v!=='all').map(([v,label])=>[`${c}:${v}`,label] as [string,string]))];
 return {buyin:options('buyin'),gtd:options('gtd')};
}
export function matchesMoneyFilter(filter:string,value:number|null,currency:Currency,fallback:Currency,kind:'buyin'|'gtd'){
 if(filter==='all')return true;if(value===null)return false;
 const parts=filter.split(':'),unit=parts.length===2?parts[0]:fallback,limit=Number(parts.at(-1));
 return currency===unit&&(kind==='buyin'?value<=limit:value>=limit);
}
