import assert from 'node:assert/strict';
import {build} from 'vite';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const out='.sites-runtime/buyin-range-unit';
await build({configFile:false,logLevel:'error',build:{outDir:out,emptyOutDir:true,minify:false,lib:{entry:resolve('lib/buyin-range.ts'),formats:['es'],fileName:'buyin-range'}}});
const {buyinFilterCurrency,parseBuyinBound,parseBuyinRange,buyinInCurrency,matchesBuyinRange,legacyBuyinMaximum}=await import(pathToFileURL(resolve(out,'buyin-range.js')).href);
// Synthetic rates test conversion logic rather than any current exchange-rate quote.
const rates={CNY:1,USD:7,VND:0.00025,HKD:0.875,KRW:0.005};
const noRates={CNY:1,USD:null,VND:null,HKD:null,KRW:null};

for(const blank of ['',' ','\t'])assert.equal(parseBuyinBound(blank),null);
for(const [text,expected]of [['0',0],['0.00',0],['00100.50',100.5],['.5',0.5],['1200.',1200],[' 75.25 ',75.25]])assert.equal(parseBuyinBound(text),expected);
for(const invalid of ['-1','+1','1e3','NaN','Infinity','1,000','1.2.3','.','0x10','¥20','１２','9'.repeat(400)])assert.equal(parseBuyinBound(invalid),undefined,invalid);
assert.equal(parseBuyinRange('20','10','CNY').error,'最低报名费不能高于最高报名费。');
assert.ok(parseBuyinRange('no','100','CNY').error);
assert.equal(parseBuyinRange('1.004','1.003','CNY').error,'最低报名费不能高于最高报名费。','An inverted range stays invalid even if both values would display identically');
assert.deepEqual(parseBuyinRange('','100.50','CNY'),{min:null,max:100.5,active:true,error:null});
assert.deepEqual(parseBuyinRange('0','','CNY'),{min:0,max:null,active:true,error:null});
console.log('PASS open bounds, zero, decimal input, invalid numeric syntax and inverted ranges stay distinct');

for(const currency of ['CNY','USD','VND','HKD','KRW'])assert.equal(buyinFilterCurrency(currency,'KRW'),currency);
assert.equal(buyinFilterCurrency('original','KRW'),'KRW');
assert.equal(buyinFilterCurrency('original','USD'),'USD');
assert.equal(buyinInCurrency(300,'USD','CNY',rates),2100);
assert.equal(buyinInCurrency(420000,'KRW','CNY',rates),2100);
assert.equal(buyinInCurrency(8400000,'VND','CNY',rates),2100);
assert.equal(buyinInCurrency(2400,'HKD','CNY',rates),2100);
assert.equal(buyinInCurrency(300,'USD','USD',noRates),300,'Same-currency bounds do not need exchange rates');
assert.equal(buyinInCurrency(300,'USD','KRW',rates),420000);
const range=parseBuyinRange('2000','2200','CNY');
for(const [amount,currency]of [[300,'USD'],[420000,'KRW'],[8400000,'VND']])assert.equal(matchesBuyinRange(amount,currency,range,'CNY',rates),true);
assert.equal(matchesBuyinRange(300,'KRW',range,'CNY',rates),false,'Equal nominal values in different currencies are not equivalent');
assert.equal(matchesBuyinRange(300,'USD',parseBuyinRange('400000','450000','KRW'),'KRW',rates),true,'Original preference still converts foreign buy-ins into the single series currency');
console.log('PASS profile currency, original-preference fallback and comparable amounts across mixed-currency entries');

assert.equal(buyinInCurrency(1.005,'USD','USD',rates),1.01);
assert.equal(buyinInCurrency(0.1+0.2,'CNY','CNY',rates),0.3);
assert.equal(matchesBuyinRange(1.005,'USD',parseBuyinRange('1.01','1.01','USD'),'USD',rates),true,'Use the amount the user actually sees at a decimal boundary');
assert.equal(matchesBuyinRange(1.005,'USD',parseBuyinRange('','1','USD'),'USD',rates),false);
assert.equal(buyinInCurrency(100.5,'KRW','KRW',rates),101);
assert.equal(buyinInCurrency(100.5,'VND','VND',rates),101);
assert.equal(matchesBuyinRange(100.5,'KRW',parseBuyinRange('101','101','KRW'),'KRW',rates),true);
assert.equal(matchesBuyinRange(100.49,'KRW',parseBuyinRange('101','101','KRW'),'KRW',rates),false);
assert.deepEqual(parseBuyinRange('1.005','2.005','HKD'),{min:1.01,max:2.01,active:true,error:null});
console.log('PASS inclusive endpoints match display precision rather than raw floating-point conversion residue');

const unrestricted=parseBuyinRange('','','CNY');
assert.equal(matchesBuyinRange(null,'KRW',unrestricted,'CNY',noRates),true);
assert.equal(matchesBuyinRange(300,'USD',unrestricted,'CNY',noRates),true);
assert.equal(matchesBuyinRange(null,'KRW',range,'CNY',rates),false);
assert.equal(matchesBuyinRange(300,'USD',range,'CNY',noRates),false);
assert.equal(matchesBuyinRange(0,'KRW',parseBuyinRange('0','0','KRW'),'KRW',noRates),true,'Known zero is a real price, distinct from unknown');
assert.equal(matchesBuyinRange(100,'USD',parseBuyinRange('bad','','USD'),'USD',rates),false);
for(const value of [null,NaN,Infinity,-1])assert.equal(buyinInCurrency(value,'USD','CNY',rates),null);
for(const rate of [null,0,-1,Infinity,NaN])assert.equal(buyinInCurrency(300,'USD','CNY',{...rates,USD:rate}),null);
console.log('PASS unknown fees and missing FX stay visible without a range and are explicitly non-comparable with active bounds');

assert.equal(legacyBuyinMaximum('all','USD','CNY',rates),null);
assert.equal(legacyBuyinMaximum('','USD','CNY',rates),null);
assert.deepEqual(legacyBuyinMaximum('300','USD','CNY',rates),{max:'2100',error:null});
assert.deepEqual(legacyBuyinMaximum('USD:300','KRW','CNY',rates),{max:'2100',error:null});
assert.deepEqual(legacyBuyinMaximum('KRW:420000','KRW','USD',rates),{max:'300',error:null});
assert.deepEqual(legacyBuyinMaximum('USD:300','KRW','USD',noRates),{max:'300',error:null});
assert.deepEqual(legacyBuyinMaximum('VND:1000000','VND','HKD',rates),{max:'285.71',error:null});
assert.ok(legacyBuyinMaximum('USD:300','USD','CNY',noRates).error,'A missing legacy conversion cannot silently become all prices');
for(const invalid of ['USD:','BTC:300','USD:-1','1e3','Infinity','KRW:300:400','9'.repeat(400)])assert.ok(legacyBuyinMaximum(invalid,'USD','CNY',rates).error,invalid);
console.log('PASS old native and currency-prefixed thresholds migrate to the selected unit with explicit failures');
