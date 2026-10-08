export type Currency='USD'|'VND'|'KRW';
export type DisplayCurrency=Currency|'CNY'|'HKD';
export type CurrencyPreference=DisplayCurrency|'original';
export const displayCurrencies:DisplayCurrency[]=['CNY','USD','VND','HKD','KRW'];
export const currencyNames:Record<DisplayCurrency,string>={CNY:'人民币',USD:'美元',VND:'越南盾',HKD:'港币',KRW:'韩元'};
export const currencies:Currency[]=['USD','VND','KRW'];
const symbols:Record<DisplayCurrency,string>={USD:'$',VND:'₫',CNY:'¥',HKD:'HK$',KRW:'₩'};
const fractionDigits=(currency:DisplayCurrency)=>currency==='VND'||currency==='KRW'?0:2;
export const money=(value:number|null,currency:DisplayCurrency='USD')=>value===null?'未公布':symbols[currency]+value.toLocaleString('en-US',{maximumFractionDigits:fractionDigits(currency)});
export type ExchangeRates=Record<DisplayCurrency,number|null>;
export function convertedAmount(value:number,from:DisplayCurrency,to:CurrencyPreference,rates:ExchangeRates):number|null{
 if(to==='original'||from===to)return null;
 const source=rates[from],target=rates[to];
 if(source===null||target===null||!Number.isFinite(source)||!Number.isFinite(target)||source<=0||target<=0)return null;
 const amount=value*source/target;
 return Number.isFinite(amount)?amount:null;
}
export const convertedMoney=(value:number,currency:DisplayCurrency)=>symbols[currency]+value.toLocaleString('en-US',{minimumFractionDigits:fractionDigits(currency),maximumFractionDigits:fractionDigits(currency)});

type MoneyFilters={buyin:[string,string][];gtd:[string,string][];quick:{buyin:string;gtd:string}};
function nativeMoneyFilters(currency:Currency):MoneyFilters{
 return currency==='KRW'?{
  buyin:[['all','全部报名费'],['100000','₩100,000 及以下'],['300000','₩300,000 及以下'],['500000','₩500,000 及以下'],['800000','₩800,000 及以下'],['1000000','₩1,000,000 及以下'],['1500000','₩1,500,000 及以下'],['2000000','₩2,000,000 及以下'],['2500000','₩2,500,000 及以下'],['3000000','₩3,000,000 及以下'],['4000000','₩4,000,000 及以下'],['5000000','₩5,000,000 及以下'],['8000000','₩8,000,000 及以下'],['10000000','₩10,000,000 及以下']],
  gtd:[['all','全部保底'],['50000000','₩50,000,000 及以上'],['100000000','₩100,000,000 及以上'],['300000000','₩300,000,000 及以上'],['880000000','₩880,000,000 及以上'],['1000000000','₩1,000,000,000 及以上'],['1200000000','₩1,200,000,000 及以上'],['1800000000','₩1,800,000,000 及以上'],['2000000000','₩2,000,000,000 及以上']],
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

// Mixed-currency series keep native thresholds explicit; no implicit FX conversion.
export function moneyFilters(currency:Currency,supportedCurrencies:Currency[]=[currency]):MoneyFilters{
 const supported=[...new Set([currency,...supportedCurrencies])];
 if(supported.length===1)return nativeMoneyFilters(currency);
 const options=(kind:'buyin'|'gtd'):[string,string][]=>[
  ['all',kind==='buyin'?'全部报名费':'全部保底'],
  ...supported.flatMap(native=>nativeMoneyFilters(native)[kind].filter(([value])=>value!=='all').map(([value,label]):[string,string]=>[`${native}:${value}`,`${label} · ${native}`])),
 ];
 const quick=nativeMoneyFilters(currency).quick;
 return {buyin:options('buyin'),gtd:options('gtd'),quick:{buyin:`${currency}:${quick.buyin}`,gtd:`${currency}:${quick.gtd}`}};
}

// Keep callers of the former JPF helper on the same option and validation contract.
export const seriesMoneyFilters=moneyFilters;

export function matchesMoneyFilter(amount:number|null,currency:Currency,value:string,comparison:'lte'|'gte',defaultCurrency:Currency):boolean{
 if(value==='all')return true;
 if(amount===null)return false;
 const match=/^(?:(USD|VND|KRW):)?(\d+(?:\.\d+)?)$/.exec(value);
 if(!match||(match[1]||defaultCurrency)!==currency)return false;
 const threshold=Number(match[2]);
 if(!Number.isFinite(amount)||!Number.isFinite(threshold))return false;
 return comparison==='lte'?amount<=threshold:amount>=threshold;
}
