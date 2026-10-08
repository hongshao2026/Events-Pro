import {execFileSync} from 'node:child_process';
for(const file of ['tests/state.test.mjs','tests/agenda.test.mjs','tests/catalog.test.mjs','tests/qpc.test.mjs','tests/jeju.test.mjs','tests/series.test.mjs','tests/auth.test.mjs','tests/settings.test.mjs']){
  execFileSync(process.execPath,[file],{stdio:'inherit'});
}
