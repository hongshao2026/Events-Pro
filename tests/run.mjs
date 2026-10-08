import {execFileSync} from 'node:child_process';
for(const file of ['tests/state.test.mjs','tests/agenda.test.mjs','tests/shortlist.test.mjs','tests/catalog.test.mjs','tests/qpc.test.mjs','tests/jeju.test.mjs','tests/series.test.mjs','tests/auth.test.mjs','tests/settings.test.mjs','tests/money-krw.test.mjs','tests/kpc.test.mjs','tests/registration.test.mjs','tests/event-tags.test.mjs','tests/buyin-range.test.mjs','tests/event-targets.test.mjs']){
  execFileSync(process.execPath,[file],{stdio:'inherit'});
}
