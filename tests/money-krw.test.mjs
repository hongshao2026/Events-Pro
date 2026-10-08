import assert from 'node:assert/strict';
import {build} from 'vite';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const out='.sites-runtime/money-krw-unit';
await build({configFile:false,logLevel:'error',build:{outDir:out,emptyOutDir:true,minify:false,lib:{entry:Object.fromEntries(['money','local-store'].map(name=>[name,resolve(`lib/${name}.ts`)])),formats:['es'],fileName:(_format,name)=>name+'.js'}}});
const [{money,convertedAmount,convertedMoney,moneyFilters,matchesMoneyFilter,currencies,displayCurrencies},{budget,emptyState}]=await Promise.all(['money','local-store'].map(name=>import(pathToFileURL(resolve(out,name+'.js')).href)));

assert.ok(currencies.includes('KRW'));assert.ok(displayCurrencies.includes('KRW'));
assert.equal(money(1800000,'KRW'),'₩1,800,000');assert.equal(convertedMoney(1234567.89,'KRW'),'₩1,234,568');
assert.equal(money(300,'USD'),'$300');assert.equal(money(4500000,'VND'),'₫4,500,000');
// Deliberately synthetic test rates, not a current market reference.
const rates={CNY:1,USD:7,VND:0.00025,HKD:0.875,KRW:0.005};
assert.equal(convertedAmount(1000000,'KRW','CNY',rates),5000);
assert.equal(convertedAmount(300,'USD','KRW',rates),420000);
assert.equal(convertedAmount(1000000,'KRW','KRW',rates),null);
assert.equal(convertedAmount(1000000,'KRW','original',rates),null);
assert.equal(convertedAmount(1000000,'KRW','CNY',{...rates,KRW:null}),null);
assert.equal(convertedAmount(300,'USD','KRW',{...rates,KRW:null}),null);
console.log('PASS KRW native precision, cross conversion and missing-rate suppression in both directions');

const mixed=moneyFilters('KRW',['KRW','USD']);
assert.equal(mixed.buyin.filter(([value])=>value==='all').length,1);
assert.ok(mixed.buyin.some(([value,label])=>value==='KRW:500000'&&label.includes('KRW')));
assert.ok(mixed.buyin.some(([value,label])=>value==='USD:300'&&label.includes('USD')));
assert.ok(mixed.gtd.some(([value])=>value==='KRW:100000000'));
assert.ok(mixed.gtd.some(([value])=>value==='USD:100000'));
assert.equal(new Set(mixed.buyin.map(([value])=>value)).size,mixed.buyin.length);
assert.deepEqual(moneyFilters('KRW',['KRW','USD','KRW']),mixed);
assert.ok(moneyFilters('USD').buyin.some(([value])=>value==='300'));
assert.ok(moneyFilters('VND').buyin.some(([value])=>value==='4500000'));
assert.ok(moneyFilters('KRW').buyin.some(([value])=>value==='500000'));
assert.ok(matchesMoneyFilter(500000,'KRW','KRW:500000','lte','KRW'));
assert.equal(matchesMoneyFilter(500001,'KRW','KRW:500000','lte','KRW'),false);
assert.equal(matchesMoneyFilter(300,'USD','KRW:500000','lte','KRW'),false);
assert.ok(matchesMoneyFilter(300,'USD','USD:300','lte','KRW'));
assert.equal(matchesMoneyFilter(300,'KRW','USD:300','lte','KRW'),false);
assert.ok(matchesMoneyFilter(100000000,'KRW','KRW:100000000','gte','KRW'));
assert.equal(matchesMoneyFilter(99999999,'KRW','KRW:100000000','gte','KRW'),false);
assert.equal(matchesMoneyFilter(100000000,'USD','KRW:100000000','gte','KRW'),false);
assert.ok(matchesMoneyFilter(300,'USD','300','lte','USD'));
assert.ok(matchesMoneyFilter(4500000,'VND','4500000','lte','VND'));
assert.equal(matchesMoneyFilter(300,'USD','500000','lte','KRW'),false);
for(const currency of currencies)assert.ok(matchesMoneyFilter(0,currency,'all','lte','KRW'));
for(const value of ['','KRW:','KRW:-1','USD:NaN','USD:Infinity','BTC:300','300:USD','KRW:300:400'])assert.equal(matchesMoneyFilter(0,'KRW',value,'lte','KRW'),false);
console.log('PASS native currency filter isolation, inclusive boundaries, explicit mixed options and legacy numeric filter values');

const entries=[
 {id:'krw-a',eventId:'krw-main',buyin:1000000,currency:'KRW'},
 {id:'krw-b',eventId:'krw-main',buyin:1500000,currency:'KRW'},
 {id:'usd-a',eventId:'usd-side',buyin:300,currency:'USD'},
 {id:'vnd-a',eventId:'vnd-side',buyin:4500000,currency:'VND'},
 {id:'krw-watch',eventId:'krw-watched',buyin:5000000,currency:'KRW'},
];
const events=new Map([['krw-pending',{buyin:800000,currency:'KRW'}]]);
const state=emptyState();
for(const entry of entries)state.selections[entry.id]={status:entry.id==='krw-watch'?'watch':'attend',version:1};
state.pending['krw-pending']={status:'attend',version:1};
const flights=budget(state,entries,events);
assert.deepEqual(flights.totals,{KRW:3300000,USD:300,VND:4500000});
assert.equal(flights.total,300);assert.equal(flights.totalCurrency,'USD');
assert.equal(flights.flightCount,4);assert.equal(flights.eventCount,4);assert.equal(flights.pendingCount,1);
state.budgetMode='events';
assert.deepEqual(budget(state,entries,events).totals,{KRW:2300000,USD:300,VND:4500000});
assert.deepEqual(budget(emptyState(),entries,events).totals,{});
console.log('PASS independent USD/VND/KRW budget totals, per-event maximum buy-in, watch exclusion and one pending buy-in');
