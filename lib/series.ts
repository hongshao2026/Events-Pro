import wptLogo from '../assets/wpt-logo.png?inline';
import tritonOneLogo from '../assets/triton-one-logo.png?inline';
import quadsLogo from '../assets/quads-logo.svg?inline';
import kpcLogo from '../assets/kpc-logo.png?inline';
import type {Currency} from './money';

export const regions = [
  {id:'all',label:'全部地区'}, {id:'apac',label:'亚太'},
  {id:'north-america',label:'北美'}, {id:'south-america',label:'南美'},
  {id:'europe',label:'欧洲'},
] as const;
export type RegionFilter = typeof regions[number]['id'];
export type Region = Exclude<RegionFilter,'all'>;
export type Series = {
  id:string; title:string; shortTitle:string; mark:string; brand:string;
  country:string; countryCode?:string; region:Region; venue:string; city:string;
  start:string; end:string; timeZone:string; timeLabel:string; currency:Currency; currencies?:Currency[];
  eventCount:number; entryCount:number; logo?:{src:string;alt:string};
  sourceLabel:string; sourceUpdated?:string; sourceUrl?:string;
};
export const seriesList:Series[] = [
  {
    id:'wpt-wynn-2026',title:'WPT World Championship 2026',shortTitle:'WPT · Wynn 2026',mark:'WPT',brand:'WPT',
    country:'美国',countryCode:'US',region:'north-america',venue:'Wynn Las Vegas',city:'拉斯维加斯',
    start:'2026-11-27',end:'2026-12-21',timeZone:'America/Los_Angeles',timeLabel:'PST',currency:'USD',
    eventCount:75,entryCount:102,logo:{src:wptLogo,alt:'WPT · World Poker Tour'},sourceLabel:'官方赛程',
    sourceUrl:'https://cdn.wynnresorts.com/image/upload/v1757097329/visitwynn_pdfs_files/Poker/WPT/WPT_World_Championship_Schedule.pdf',
  },
  {
    id:'triton-one-cyprus-2026',title:'Triton ONE North Cyprus 2026',shortTitle:'Triton ONE · 北塞浦路斯 2026',mark:'ONE',brand:'Triton ONE',
    country:'塞浦路斯',region:'europe',venue:'Merit Royal Diamond',city:'北塞浦路斯',
    start:'2026-11-05',end:'2026-11-15',timeZone:'Asia/Famagusta',timeLabel:'EET',currency:'USD',
    eventCount:22,entryCount:29,logo:{src:tritonOneLogo,alt:'Triton ONE'},sourceLabel:'下载原始赛程 PDF',sourceUpdated:'2026-10-02 22:09',
  },
  {
    id:'qpc-circuit-2026',title:'QPC Circuit 2026',shortTitle:'QPC Circuit · 河内 2026',mark:'QPC',brand:'QPC',
    country:'越南',countryCode:'VN',region:'apac',venue:'Quads Hanoi Poker Club',city:'河内',
    start:'2026-10-12',end:'2026-10-21',timeZone:'Asia/Ho_Chi_Minh',timeLabel:'ICT',currency:'VND',
    eventCount:77,entryCount:91,logo:{src:quadsLogo,alt:'Quads · Hanoi Poker Club'},sourceLabel:'官方赛程',sourceUpdated:'2026-10-03（读取官网）',
    sourceUrl:'https://quadspoker.vn/series/qpc-circuit-2026',
  },
  {
    id:'kpc-jeju-2026',title:'KPC Poker Series Jeju 2026',shortTitle:'KPC · 济州岛 2026',mark:'KPC',brand:'KPC',
    country:'韩国',countryCode:'KR',region:'apac',venue:'LES A Casino',city:'济州岛',
    start:'2026-10-10',end:'2026-10-21',timeZone:'Asia/Seoul',timeLabel:'KST',currency:'KRW',currencies:['KRW','USD'],
    eventCount:73,entryCount:86,logo:{src:kpcLogo,alt:'KPC Poker'},sourceLabel:'官方赛程',sourceUpdated:'2026-10-08（读取官网）',
    sourceUrl:'https://www.kpcpoker.com/seriesTournament.jhtml?leagueId=d3f5de57-34a5-4b16-bfe6-7b44251595f7&lang=en',
  },
];
// Compatibility exports point to the same catalog; never maintain two lists.
export const seriesCatalog = seriesList;
export const series = seriesList[0];
export const getSeries = (id?:string|null) => seriesList.find(item=>item.id===id)||series;
export const regionLabel = (region:RegionFilter) => regions.find(item=>item.id===region)!.label;
export function filterSeries(region:RegionFilter,catalog:readonly Series[]=seriesList){
  return catalog.filter(item=>region==='all'||item.region===region)
    .sort((a,b)=>a.start.localeCompare(b.start)||a.id.localeCompare(b.id));
}
