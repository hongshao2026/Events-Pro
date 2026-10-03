export type Series={id:string;title:string;shortTitle:string;mark:string;venue:string;city:string;start:string;end:string;timeZone:string;timeLabel:string;currency:'USD';sourceLabel:string;sourceUpdated?:string;sourceUrl?:string};
export const seriesList:Series[]=[
 {id:'wpt-wynn-2026',title:'WPT World Championship 2026',shortTitle:'WPT · Wynn 2026',mark:'WPT',venue:'Wynn Las Vegas',city:'拉斯维加斯',start:'2026-11-27',end:'2026-12-21',timeZone:'America/Los_Angeles',timeLabel:'PST',currency:'USD',sourceLabel:'官方赛程',sourceUrl:'https://cdn.wynnresorts.com/image/upload/v1757097329/visitwynn_pdfs_files/Poker/WPT/WPT_World_Championship_Schedule.pdf'},
 {id:'triton-one-cyprus-2026',title:'Triton ONE North Cyprus 2026',shortTitle:'Triton ONE · 北塞浦路斯 2026',mark:'ONE',venue:'Merit Royal Diamond',city:'北塞浦路斯',start:'2026-11-05',end:'2026-11-15',timeZone:'Asia/Famagusta',timeLabel:'EET',currency:'USD',sourceLabel:'下载原始赛程 PDF',sourceUpdated:'2026-10-02 22:09'},
];
// Keep the original default and identifiers so saved WPT links and backups still work.
export const series=seriesList[0];
export const getSeries=(id?:string|null)=>seriesList.find(item=>item.id===id)||series;
