import {convertedAmount,type Currency,type CurrencyPreference,type DisplayCurrency,type ExchangeRates} from './money';

export type BuyinRange={min:number|null;max:number|null;active:boolean;error:string|null};
export type LegacyBuyinMaximum={max:string;error:string|null};

export function buyinFilterCurrency(preference:CurrencyPreference,seriesCurrency:Currency):DisplayCurrency{
 return preference==='original'?seriesCurrency:preference;
}

/** Blank is an open bound; undefined is an invalid decimal, not an open bound. */
export function parseBuyinBound(text:string):number|null|undefined{
 const value=text.trim();
 if(!value)return null;
 if(!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value))return undefined;
 const amount=Number(value);
 return Number.isFinite(amount)&&amount>=0?amount:undefined;
}

// Intl uses the same decimal rounding as money()/convertedMoney(), including exact half boundaries.
const formatters=new Map<DisplayCurrency,Intl.NumberFormat>();
function displayPrecision(value:number,currency:DisplayCurrency):number{
 let formatter=formatters.get(currency);
 if(!formatter){
  const digits=currency==='KRW'||currency==='VND'?0:2;
  formatter=new Intl.NumberFormat('en-US',{useGrouping:false,minimumFractionDigits:digits,maximumFractionDigits:digits});
  formatters.set(currency,formatter);
 }
 return Number(formatter.format(value));
}

export function parseBuyinRange(minText:string,maxText:string,currency:DisplayCurrency):BuyinRange{
 const min=parseBuyinBound(minText),max=parseBuyinBound(maxText),active=Boolean(minText.trim()||maxText.trim());
 if(min===undefined||max===undefined)return {min:min??null,max:max??null,active,error:'最低和最高报名费须填写非负数字。'};
 if(min!==null&&max!==null&&min>max)return {min,max,active,error:'最低报名费不能高于最高报名费。'};
 return {min:min===null?null:displayPrecision(min,currency),max:max===null?null:displayPrecision(max,currency),active,error:null};
}

export function buyinInCurrency(value:number|null,from:DisplayCurrency,to:DisplayCurrency,rates:ExchangeRates):number|null{
 if(value===null||!Number.isFinite(value)||value<0)return null;
 const amount=from===to?value:convertedAmount(value,from,to,rates);
 return amount===null?null:displayPrecision(amount,to);
}

export function matchesBuyinRange(value:number|null,from:DisplayCurrency,range:BuyinRange,to:DisplayCurrency,rates:ExchangeRates):boolean{
 if(range.error)return false;
 if(!range.active)return true;
 const amount=buyinInCurrency(value,from,to,rates);
 return amount!==null&&(range.min===null||amount>=range.min)&&(range.max===null||amount<=range.max);
}

/** Migrate the old native-currency upper threshold into the current filter unit. */
export function legacyBuyinMaximum(value:string,defaultCurrency:Currency,to:DisplayCurrency,rates:ExchangeRates):LegacyBuyinMaximum|null{
 const text=value.trim();
 if(!text||text==='all')return null;
 const match=/^(?:(USD|VND|KRW):)?(\d+(?:\.\d+)?)$/.exec(text);
 if(!match)return {max:'',error:'旧链接中的报名费筛选无效，请重新设置区间。'};
 const amount=parseBuyinBound(match[2]);
 if(amount===undefined||amount===null)return {max:'',error:'旧链接中的报名费筛选无效，请重新设置区间。'};
 const maximum=buyinInCurrency(amount,(match[1]||defaultCurrency) as Currency,to,rates);
 if(maximum===null)return {max:'',error:'缺少汇率，无法换算旧链接的报名费上限。'};
 return {max:String(maximum),error:null};
}
