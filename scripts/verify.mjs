import {spawnSync} from 'node:child_process';

// Use npm's JavaScript entry point so Windows and CI run without a shell.
if (!process.env.npm_execpath) throw new Error('请使用 npm run verify 运行完整验收。');
for (const script of ['lint', 'typecheck', 'test', 'build', 'test:ui', 'test:auth:ui', 'ios:sync', 'ios:check', 'legal:preview', 'test:release:ui', 'test:native:ui']) {
  const result = spawnSync(process.execPath, [process.env.npm_execpath, 'run', script], {stdio: 'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
