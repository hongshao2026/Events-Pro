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
