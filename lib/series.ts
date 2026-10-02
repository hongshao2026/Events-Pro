import wptLogo from '../assets/wpt-logo.png?inline';

export const regions = [
  {id:'all',label:'全部地区'},
  {id:'apac',label:'亚太'},
  {id:'north-america',label:'北美'},
  {id:'south-america',label:'南美'},
  {id:'europe',label:'欧洲'},
] as const;
export type RegionFilter = typeof regions[number]['id'];
export type Region = Exclude<RegionFilter,'all'>;
export type Series = {
  id:string; title:string; brand:string; country:string; countryCode:string;
  region:Region; venue:string; city:string; start:string; end:string;
  timeZone:string; currency:string; eventCount:number; entryCount:number;
  logo?:{src:string;alt:string};
};

export const seriesCatalog:Series[] = [{
  id:'wpt-wynn-2026',title:'WPT World Championship 2026',brand:'WPT',
  country:'美国',countryCode:'US',region:'north-america',
  venue:'Wynn Las Vegas',city:'拉斯维加斯',start:'2026-11-27',end:'2026-12-21',
  timeZone:'America/Los_Angeles',currency:'USD',eventCount:75,entryCount:102,
  logo:{src:wptLogo,alt:'WPT · World Poker Tour'},
}];
export const regionLabel = (region:RegionFilter) => regions.find(item=>item.id===region)!.label;
export function filterSeries(region:RegionFilter,catalog:readonly Series[]=seriesCatalog){
  return catalog.filter(item=>region==='all'||item.region===region)
    .sort((a,b)=>a.start.localeCompare(b.start)||a.id.localeCompare(b.id));
}
