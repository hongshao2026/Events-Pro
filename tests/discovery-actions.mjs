// Exercise the same row -> detail -> classification -> back flow available to a player.
export async function openDiscoveryDetails(page,row){
 await row.locator('.event-row-open').click();await page.locator('.event-detail-sheet').waitFor();
}
export async function closeDiscoveryDetails(page){
 await page.locator('.event-detail-sheet').getByRole('button',{name:'返回赛程',exact:true}).click();
 await page.locator('.event-detail-sheet').waitFor({state:'hidden'});
}
export async function chooseDiscoveryStatus(page,row,label){
 await openDiscoveryDetails(page,row);
 const radio=page.locator('.event-detail-sheet').getByRole('radio',{name:label,exact:true});
 await page.locator('.event-detail-actions .class-option').filter({hasText:new RegExp('^'+label+'$')}).click();
 await page.waitForFunction(name=>Array.from(document.querySelectorAll('.event-detail-actions [role="radio"]')).some(radio=>radio.getAttribute('aria-label')===name&&radio.getAttribute('aria-checked')==='true'),label);
 if(await radio.getAttribute('aria-checked')!=='true')throw new Error('Classification did not update in the visible event detail');
 await closeDiscoveryDetails(page);
}

const discoveryOptionNames=new Set(['赛事类型']);
const seriesIds={'WPT · Wynn 2026':'wpt-wynn-2026','Triton ONE · 北塞浦路斯 2026':'triton-one-cyprus-2026','QPC Circuit · 河内 2026':'qpc-circuit-2026','KPC · 济州岛 2026':'kpc-jeju-2026','JPF · 济州岛 2026':'jeju-poker-festival-2026'};

export async function openDiscoveryFilters(page){
 const popover=page.locator('.discovery-filter-popover');
 if(!await popover.isVisible()){await page.getByRole('button',{name:'赛程筛选',exact:true}).click();await popover.waitFor();}
 return popover;
}
export async function finishDiscoveryFilters(page){
 await page.locator('.discovery-filter-popover').getByRole('button',{name:/^完成筛选，显示 \d+ 个场次$/}).click();
 await page.locator('.discovery-filter-popover').waitFor({state:'hidden'});
 // Radix restores focus after removing the popover; wait before the next keyboard action.
 await page.waitForFunction(()=>document.querySelector('button[aria-label="赛程筛选"]')===document.activeElement);
}
export async function switchDiscoverySeries(page,label){
 const id=seriesIds[label];if(!id)throw new Error('Unknown series option: '+label);
 await page.getByRole('button',{name:'返回赛事列表',exact:true}).click();
 await page.locator('label.region-option').filter({hasText:/^全部地区$/}).click();
 const card=page.locator(`.festival-card[data-series-id="${id}"]`);
 const archive=page.locator('details:not([open])').filter({has:card});
 if(await archive.count())await archive.locator('summary').click();
 await card.click();
 await page.waitForFunction(series=>document.querySelector('.mobile-event')?.getAttribute('data-entry-id')?.startsWith(series+'/'),id);
}
export async function selectPlannerOption(page,label,value,{keepOpen=false}={}){
 if(label==='赛事系列'&&!await page.getByRole('combobox',{name:label,exact:true}).count())return switchDiscoverySeries(page,value);
 const discovery=discoveryOptionNames.has(label)&&new URLSearchParams(new URL(page.url()).hash.slice(1)).get('view')==='discover';
 if(discovery)await openDiscoveryFilters(page);
 await page.getByRole('combobox',{name:label,exact:true}).click();await page.getByRole('option',{name:value,exact:true}).click();
 if(discovery&&!keepOpen)await finishDiscoveryFilters(page);
}
export async function readDiscoveryOption(page,label){
 await openDiscoveryFilters(page);const text=await page.getByRole('combobox',{name:label,exact:true}).innerText();await finishDiscoveryFilters(page);return text;
}
export async function setDiscoveryBuyinRange(page,min,max,{keepOpen=false}={}){
 const popover=await openDiscoveryFilters(page);
 await popover.getByRole('textbox',{name:'最低报名费',exact:true}).fill(min);
 await popover.getByRole('textbox',{name:'最高报名费',exact:true}).fill(max);
 if(!keepOpen)await finishDiscoveryFilters(page);
}
export async function readDiscoveryBuyinRange(page){
 const popover=await openDiscoveryFilters(page);
 const range={min:await popover.getByRole('textbox',{name:'最低报名费',exact:true}).inputValue(),max:await popover.getByRole('textbox',{name:'最高报名费',exact:true}).inputValue()};
 await finishDiscoveryFilters(page);return range;
}
export async function setDiscoveryFilterChecked(page,label,checked,{keepOpen=false}={}){
 const popover=await openDiscoveryFilters(page);await popover.getByRole('checkbox',{name:label,exact:true}).setChecked(checked);
 if(!keepOpen)await finishDiscoveryFilters(page);
}
export async function readDiscoveryFilterChecked(page,label){
 const popover=await openDiscoveryFilters(page),checked=await popover.getByRole('checkbox',{name:label,exact:true}).getAttribute('aria-checked');await finishDiscoveryFilters(page);return checked;
}
export async function resetDiscoveryFilters(page){
 const popover=await openDiscoveryFilters(page);await popover.getByRole('button',{name:'重置筛选',exact:true}).click();await finishDiscoveryFilters(page);
}
