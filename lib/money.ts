export type Currency='USD'|'VND';
export const currencies:Currency[]=['USD','VND'];
export const money=(value:number,currency:Currency='USD')=>(currency==='VND'?'₫':'$')+value.toLocaleString('en-US');

// Thresholds are in the selected series' native currency; no implicit FX conversion.
export function moneyFilters(currency:Currency):{buyin:[string,string][];gtd:[string,string][];quick:{buyin:string;gtd:string}}{
 return currency==='VND'?{
  buyin:[['all','全部报名费'],['2500000','250万₫及以下'],['4500000','450万₫及以下'],['6600000','660万₫及以下'],['11000000','1,100万₫及以下'],['22000000','2,200万₫及以下'],['55000000','5,500万₫及以下']],
  gtd:[['all','全部保底'],['200000000','2亿₫及以上'],['500000000','5亿₫及以上'],['1000000000','10亿₫及以上'],['6000000000','60亿₫及以上'],['10000000000','100亿₫及以上']],
  quick:{buyin:'4500000',gtd:'1000000000'},
 }:{
  buyin:[['all','全部报名费'],['300','$300 及以下'],['600','$600 及以下'],['1100','$1,100 及以下'],['1999','低于 $2,000'],['3000','$3,000 及以下'],['5000','$5,000 及以下'],['8000','$8,000 及以下'],['15000','$15,000 及以下']],
  gtd:[['all','全部保底'],['100000','$100K 及以上'],['250000','$250K 及以上'],['1000000','$1M 及以上']],
  quick:{buyin:'1999',gtd:'250000'},
 };
}
