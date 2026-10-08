import {dateValue,eventMap,getSeries} from './catalog';
import {budget,type PlannerState} from './local-store';
import {clock,cny,guarantee,shortDate,usd} from './schedule';
import {shortlistBudget,shortlistEntries} from './shortlist';

export type ShortlistImageRow={
 id:string;title:string;detail:string;date:string;time:string;
 status:'attend'|'watch'|'pending';buyin:number;amount:number;budgetNote:string;
 guarantee:string;guaranteeNote:string;series:string;location:string;
};
export type ShortlistImageModel={
 rows:ShortlistImageRow[];total:number;attending:number;watching:number;pending:number;
 budgetModeLabel:string;
};
export type ShortlistImage={blob:Blob;filename:string;width:number;height:number};

// Build from the saved plan, never the table's visible rows, filter or scroll position.
export function buildShortlistImageModel(state:PlannerState):ShortlistImageModel{
 const selected=shortlistEntries(state),amounts=shortlistBudget(state);
 const rows=selected.map(entry=>{
  const series=getSeries(entry.seriesId),status=state.selections[entry.id].status==='attend'?'attend' as const:'watch' as const;
  const amount=amounts.entries[entry.id]||0;
  return {
   id:entry.id,sortDate:entry.date,sortHour:entry.hour,title:entry.event.title,
   detail:`${entry.flightLabel} · ${entry.event.officialNumber?'#'+entry.event.officialNumber:entry.eventId}${entry.event.supplement?' · 官方补充':''}`,
   date:`${entry.date.slice(0,4)}/${shortDate(entry.date)}`,time:`${clock(entry.hour)} · ${series.timeLabel}`,
   status,buyin:entry.buyin,amount,
   budgetNote:status==='watch'?'关注不计预算':state.budgetMode==='events'?(amount===0?'同赛事已计':'同赛事计一次'):'本起始组',
   guarantee:guarantee(entry.event),guaranteeNote:entry.event.kind==='satellite'?'席位保底':'整项赛事共享',
   series:series.shortTitle,location:`${series.city} · ${series.venue}`,
  };
 });
 const pending=Object.keys(state.pending).flatMap(id=>{
  const event=eventMap.get(id);if(!event)return [];
  const series=getSeries(event.seriesId),amount=amounts.pending[id]||0;
  return [{
   id:`pending/${event.id}`,sortDate:event.date,sortHour:event.hour,title:event.title,
   detail:`${event.officialNumber?'#'+event.officialNumber:event.id} · 起始组未指定`,
   date:'待安排起始组',time:'旧版参加计划',status:'pending' as const,buyin:event.buyin||0,amount,
   budgetNote:amount?'暂计一次':'同赛事已计',guarantee:guarantee(event),
   guaranteeNote:event.kind==='satellite'?'席位保底':'整项赛事共享',
   series:series.shortTitle,location:`${series.city} · ${series.venue}`,
  }];
 });
 const combined=[...rows,...pending].sort((a,b)=>a.sortDate.localeCompare(b.sortDate)||a.sortHour-b.sortHour||a.id.localeCompare(b.id));
 return {
  rows:combined,total:budget(state).total,attending:rows.filter(row=>row.status==='attend').length,
  watching:rows.filter(row=>row.status==='watch').length,pending:pending.length,
  budgetModeLabel:state.budgetMode==='events'?'同一赛事只算一次':'每个起始组各算一次',
 };
}

const PAGE_WIDTH=1440,MARGIN=40,TABLE_WIDTH=PAGE_WIDTH-MARGIN*2;
const MAX_DIMENSION=8192,MAX_PIXELS=12_000_000;
const COLUMN_WIDTHS=[350,162,130,100,165,150,303];
const HEADERS=['赛事','开赛时间','报名费','状态','计入预算','保底 / 席位','系列 / 地点'];
const TABLE_TOP=276,HEADER_HEIGHT=48,TOTAL_HEIGHT=54,FOOTER_HEIGHT=112;
const CELL_PADDING=14;

// Bound both dimensions and the total allocation. A long plan scales as a whole;
// no rows are cropped, omitted or split into separate files.
export function shortlistImageDimensions(logicalHeight:number,preferredScale=2){
 if(!Number.isFinite(logicalHeight)||logicalHeight<=0||!Number.isFinite(preferredScale)||preferredScale<=0)throw new Error('图片尺寸无效，请重新导出。');
 const scale=Math.min(preferredScale,MAX_DIMENSION/PAGE_WIDTH,MAX_DIMENSION/logicalHeight,Math.sqrt(MAX_PIXELS/(PAGE_WIDTH*logicalHeight)));
 return {width:Math.max(1,Math.floor(PAGE_WIDTH*scale)),height:Math.max(1,Math.floor(logicalHeight*scale)),scale};
}

type Theme={surface:string;ink:string;muted:string;line:string;primary:string;tint:string;attend:string;watch:string;body:string;display:string;data:string};
function imageTheme():Theme{
 const styles=getComputedStyle(document.documentElement);
 const token=(name:string,fallback:string)=>styles.getPropertyValue(name).trim()||fallback;
 return {
  surface:token('--card','#ffffff'),ink:token('--foreground','#222335'),muted:token('--muted-foreground','#686979'),
  line:token('--border','#e3e3ec'),primary:token('--primary','#542887'),tint:token('--secondary','#f0ecf6'),
  attend:token('--attend','#176843'),watch:token('--watch','#8b6012'),
  body:token('--font-body','"Segoe UI", "Microsoft YaHei", sans-serif'),
  display:token('--font-display','"Bahnschrift", "Segoe UI", "Microsoft YaHei", sans-serif'),
  data:token('--font-data','"Consolas", monospace'),
 };
}
type TextStyle={font:string;color:string;lineHeight:number};
type Block={text:string;style:TextStyle;gap?:number};
type LaidBlock=Block&{lines:string[]};
type Cell={blocks:LaidBlock[];height:number;align:'left'|'right'};
type LaidRow={cells:Cell[];height:number};
type Layout={rows:LaidRow[];height:number};

// Preserve words where possible, and break overlong words/Chinese text by Unicode
// code point. Every character remains in the image, including long event names.
function wrapText(ctx:CanvasRenderingContext2D,text:string,width:number,font:string):string[]{
 ctx.font=font;
 const output:string[]=[];
 for(const paragraph of text.split(/\r?\n/u)){
  let line='';
  const tokens=paragraph.match(/[^\s\u2e80-\u9fff]+|[\u2e80-\u9fff]|\s+/gu)||[''];
  for(const token of tokens){
   if(ctx.measureText(line+token).width<=width){line+=token;continue;}
   if(line.trim()){output.push(line.trimEnd());line='';}
   const word=token.trimStart();
   if(ctx.measureText(word).width<=width){line=word;continue;}
   for(const character of Array.from(word)){
    if(line&&ctx.measureText(line+character).width>width){output.push(line);line='';}
    line+=character;
   }
  }
  output.push(line.trimEnd());
 }
 return output;
}

function makeLayout(ctx:CanvasRenderingContext2D,model:ShortlistImageModel,theme:Theme):Layout{
 const body:TextStyle={font:`500 19px ${theme.body}`,color:theme.ink,lineHeight:25};
 const title:TextStyle={font:`600 20px ${theme.body}`,color:theme.ink,lineHeight:26};
 const note:TextStyle={font:`400 16px ${theme.body}`,color:theme.muted,lineHeight:22};
 const money:TextStyle={font:`500 19px ${theme.data}`,color:theme.ink,lineHeight:25};
 const b=(text:string,style=body,gap=0):Block=>({text,style,gap});
 const rows=model.rows.map(row=>{
  const statusText=row.status==='watch'?'关注':row.status==='pending'?'待安排':'参加';
  const statusStyle={...body,font:`600 19px ${theme.body}`,color:row.status==='watch'?theme.watch:theme.attend};
  const blocks:Block[][]=[
   [b(row.title,title),b(row.detail,note,5)],
   [b(row.date),b(row.time,note,5)],
   [b(usd(row.buyin),money)],
   [b(statusText,statusStyle)],
   [b(usd(row.amount),{...money,color:row.status==='watch'?theme.muted:theme.ink}),b(row.budgetNote,note,5)],
   [b(row.guarantee),b(row.guaranteeNote,note,5)],
   [b(row.series),b(row.location,note,5)],
  ];
  const cells=blocks.map((content,index):Cell=>{
   const laid=content.map(block=>({...block,lines:wrapText(ctx,block.text,COLUMN_WIDTHS[index]-CELL_PADDING*2,block.style.font)}));
   return {blocks:laid,height:laid.reduce((sum,block)=>sum+(block.gap||0)+block.lines.length*block.style.lineHeight,0),align:index===2||index===4?'right':'left'};
  });
  return {cells,height:Math.max(84,...cells.map(cell=>cell.height+CELL_PADDING*2))};
 });
 return {rows,height:TABLE_TOP+HEADER_HEIGHT+rows.reduce((sum,row)=>sum+row.height,0)+TOTAL_HEIGHT+FOOTER_HEIGHT};
}

function drawImage(ctx:CanvasRenderingContext2D,model:ShortlistImageModel,layout:Layout,theme:Theme,created:Date){
 const text=(value:string,x:number,y:number,font:string,color=theme.ink,align:CanvasTextAlign='left')=>{
  ctx.font=font;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='top';ctx.fillText(value,x,y);
 };
 const rule=(y:number)=>{ctx.fillStyle=theme.line;ctx.fillRect(MARGIN,y,TABLE_WIDTH,1);};
 ctx.fillStyle=theme.surface;ctx.fillRect(0,0,PAGE_WIDTH,layout.height);
 ctx.fillStyle=theme.primary;ctx.fillRect(MARGIN,0,TABLE_WIDTH,7);
 text('我的自选',MARGIN,35,`600 42px ${theme.body}`);
 text(`完整自选 · ${model.rows.length} 条`,PAGE_WIDTH-MARGIN,49,`500 19px ${theme.body}`,theme.primary,'right');
 text('参赛计划与预算',MARGIN,97,`400 19px ${theme.body}`,theme.muted);
 text(`导出于 ${dateValue(created)} ${String(created.getHours()).padStart(2,'0')}:${String(created.getMinutes()).padStart(2,'0')}`,PAGE_WIDTH-MARGIN,98,`400 16px ${theme.body}`,theme.muted,'right');
 rule(135);
 text('计划参加预算',MARGIN,154,`500 16px ${theme.body}`,theme.muted);
 text(usd(model.total),MARGIN,179,`600 42px ${theme.display}`,theme.primary);
 const dollarWidth=ctx.measureText(usd(model.total)).width;
 text(`${cny(model.total)} CNY`,MARGIN+dollarWidth+24,196,`500 21px ${theme.body}`,theme.muted);
 text(`参加 ${model.attending}  ·  关注 ${model.watching}  ·  待安排 ${model.pending}`,PAGE_WIDTH-MARGIN,159,`500 20px ${theme.body}`,theme.ink,'right');
 text(`预算方式：${model.budgetModeLabel}`,PAGE_WIDTH-MARGIN,196,`400 17px ${theme.body}`,theme.muted,'right');
 text('USD 美元 · 1 USD = 6.7 CNY',MARGIN,239,`400 16px ${theme.body}`,theme.muted);
 text('按开赛时间排列 · 各赛事当地时间',PAGE_WIDTH-MARGIN,239,`400 16px ${theme.body}`,theme.muted,'right');

 ctx.fillStyle=theme.tint;ctx.fillRect(MARGIN,TABLE_TOP,TABLE_WIDTH,HEADER_HEIGHT);
 let x=MARGIN;
 HEADERS.forEach((header,index)=>{
  const right=index===2||index===4;
  text(header,right?x+COLUMN_WIDTHS[index]-CELL_PADDING:x+CELL_PADDING,TABLE_TOP+14,`600 17px ${theme.body}`,theme.primary,right?'right':'left');
  x+=COLUMN_WIDTHS[index];
 });
 let y=TABLE_TOP+HEADER_HEIGHT;
 for(const row of layout.rows){
  x=MARGIN;
  row.cells.forEach((cell,index)=>{
   let blockY=y+CELL_PADDING;
   for(const block of cell.blocks){
    blockY+=block.gap||0;
    for(const line of block.lines){
     text(line,cell.align==='right'?x+COLUMN_WIDTHS[index]-CELL_PADDING:x+CELL_PADDING,blockY,block.style.font,block.style.color,cell.align);
     blockY+=block.style.lineHeight;
    }
   }
   x+=COLUMN_WIDTHS[index];
  });
  y+=row.height;rule(y);
 }
 ctx.fillStyle=theme.tint;ctx.fillRect(MARGIN,y,TABLE_WIDTH,TOTAL_HEIGHT);
 text(`${model.rows.length} 条自选 · 计入预算合计`,MARGIN+CELL_PADDING,y+16,`600 18px ${theme.body}`,theme.primary);
 const budgetRight=MARGIN+COLUMN_WIDTHS.slice(0,5).reduce((sum,width)=>sum+width,0)-CELL_PADDING;
 text(usd(model.total),budgetRight,y+15,`600 20px ${theme.data}`,theme.primary,'right');
 y+=TOTAL_HEIGHT;
 text('关注不计预算；保底与席位不累加。时间为赛事所在地当地时间，PST / EET 随系列标示。',MARGIN,y+24,`400 16px ${theme.body}`,theme.muted);
 text('个人参赛计划 · 标记参加不等于实际报名',MARGIN,y+55,`400 16px ${theme.body}`,theme.muted);
 text('我的自选 · 完整表格',PAGE_WIDTH-MARGIN,y+55,`500 16px ${theme.body}`,theme.primary,'right');
}

async function waitForFonts(){
 if(!document.fonts)return;
 await new Promise<void>(resolve=>{
  const timer=setTimeout(resolve,1500);
  document.fonts.ready.then(()=>{clearTimeout(timer);resolve();},()=>{clearTimeout(timer);resolve();});
 });
}

function canvasBlob(canvas:HTMLCanvasElement):Promise<Blob>{
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error('图片生成超时')),15000);
  try{
   canvas.toBlob(blob=>{
    clearTimeout(timer);
    if(blob&&blob.size>0)resolve(blob);else reject(new Error('图片生成失败'));
   },'image/png');
  }catch(error){clearTimeout(timer);reject(error);}
 });
}

export async function exportShortlistImage(state:PlannerState):Promise<ShortlistImage>{
 const model=buildShortlistImageModel(state);
 if(!model.rows.length)throw new Error('自选表还是空的，请先添加参加或关注的比赛。');
 if(typeof document==='undefined')throw new Error('当前环境无法生成图片，请在浏览器中打开后重试。');
 await waitForFonts();
 const theme=imageTheme(),created=new Date(),measurement=document.createElement('canvas');
 measurement.width=measurement.height=1;
 let layout:Layout;
 try{
  const ctx=measurement.getContext('2d');
  if(!ctx)throw new Error('当前浏览器不支持图片导出，请换用系统浏览器打开。');
  layout=makeLayout(ctx,model,theme);
 }finally{measurement.width=measurement.height=0;}
 const maximum=shortlistImageDimensions(layout.height).scale;
 // Smaller retries recover from mobile allocation/encoder limits while retaining
 // the entire layout. Release each canvas immediately after encoding or failure.
 for(const reduction of [1,.75,.5]){
  const {width,height}=shortlistImageDimensions(layout.height,maximum*reduction);
  const canvas=document.createElement('canvas');
  try{
   canvas.width=width;canvas.height=height;
   const ctx=canvas.getContext('2d');
   if(!ctx)throw new Error('无法创建图片画布');
   ctx.scale(width/PAGE_WIDTH,height/layout.height);
   drawImage(ctx,model,layout,theme,created);
   const blob=await canvasBlob(canvas);
   return {blob,filename:`我的自选-${dateValue(created)}.png`,width,height};
  }catch{
   // Yield so the browser can reclaim the previous allocation before retrying.
  }finally{canvas.width=canvas.height=0;}
  await new Promise<void>(resolve=>setTimeout(resolve,0));
 }
 throw new Error('图片生成失败，请关闭其他页面释放内存后重试，或使用系统浏览器导出。');
}
