import {convertedAmount,convertedMoney,money,type DisplayCurrency} from '@/lib/money';
import {useAppSettings} from './settings-context';

export function PriceAmount({value,currency}:{value:number|null;currency:DisplayCurrency}){
 const {settings,settingsError}=useAppSettings(),target=settings.profile.currency;
 const convert=value!==null&&target!=='original'&&target!==currency;
 const converted=settingsError||value===null?null:convertedAmount(value,currency,target,settings.fx.rates);
 return <span className="price-amount"><span>{money(value,currency)}</span>{convert&&<small className="converted-price">（{converted===null?'汇率未设置':`≈${convertedMoney(converted,target)}`}）</small>}</span>;
}
