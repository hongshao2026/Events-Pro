import {events,isNlh,type Event} from './schedule';

export type EventTagId='nlh'|'satellite'|'omaha'|'mixed-games'|'draw'|'stud'|'other-games';
export type EventTag={id:EventTagId;label:string};

const labels:Record<EventTagId,string>={
 nlh:'德州扑克',satellite:'卫星赛',omaha:'奥马哈','mixed-games':'混合游戏',draw:'抽牌',stud:'Stud','other-games':'其他玩法',
};

export const eventGameOptions:[string,string][]=[
 ['all','全部类型'],['nlh','德州扑克正赛'],['satellite','卫星赛'],['omaha','奥马哈'],
 ['mixed-games','混合游戏'],['draw','抽牌'],['stud','Stud'],['other-games','其他玩法'],['mixed','PLO / 混合游戏'],
];

// Display-title edits are not changes to the official game. Standalone/new source events use their own data.
const officialEvents=new Map(events.map(event=>[`${event.seriesId||''}/${event.id}`,event]));
function sourceEvent(event:Event){return officialEvents.get(`${event.seriesId||''}/${event.id}`)||event;}

function gameTag(event:Event):EventTagId{
 if(event.kind==='satellite')return 'satellite';
 const title=event.title.toUpperCase();
 const omaha=/\b(?:PLO|OMAHA|COURCHEVEL)\b|\bBIG[\s-]+O\b/.test(title);
 const mixed=/\bMIX(?:ED)?\b|\bDRAWMAHA\b|\bSVITEN\b|\bHORSE\b|\bT\.?O\.?R\.?S\.?E\b|\b\d+\s+GAMES?\b|\bPOKER PLAYERS CHAMPIONSHIP\b/.test(title);
 const omahaWithOtherGame=omaha&&/\b(?:NLH|STUD\d*|RAZZ|DRAW)\b|\bHOLD['’]?EM\b/.test(title);
 if(mixed||omahaWithOtherGame)return 'mixed-games';
 if(omaha||event.group==='奥马哈')return 'omaha';
 if(/\bDEALER['’]?S\s+CHOICE\b/.test(title))return 'mixed-games';
 if(/\b(?:STUD\d*|RAZZ)\b/.test(title))return 'stud';
 if(/\b(?:SINGLE|DOUBLE|TRIPLE)\s+DRAW\b/.test(title))return 'draw';
 if(isNlh(event))return 'nlh';
 return 'other-games';
}

export function eventTags(event:Event):EventTag[]{
 const id=gameTag(sourceEvent(event));
 return [{id,label:labels[id]}];
}

export function matchesEventGame(event:Event,filter:string):boolean{
 if(filter==='all')return true;
 const source=sourceEvent(event);
 // Keep legacy URLs as the original broad non-NLH regular-event filter.
 if(filter==='mixed')return source.kind==='regular'&&!isNlh(source);
 return gameTag(source)===filter;
}
