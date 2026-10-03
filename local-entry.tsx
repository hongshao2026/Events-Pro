import {createRoot} from 'react-dom/client';
import Planner from './app/planner';
import './app/globals.css';
import { authEnabled } from './lib/auth/config';

const root = createRoot(document.getElementById('root')!);
// The explicit build flag keeps the auth SDK out of the default/offline bundle.
if (import.meta.env.VITE_AUTH_ENABLED === 'true' && authEnabled(import.meta.env, window.location.protocol)) {
  root.render(<div className="app-shell"><main className="workspace" role="status">正在恢复登录状态…</main></div>);
  try {
    const [{ default: AuthApp }, { bootstrapAuth }] = await Promise.all([
      import('./components/auth/auth-app'), import('./lib/auth/client'),
    ]);
    const runtime = await bootstrapAuth(import.meta.env);
    root.render(<AuthApp runtime={runtime}/>);
  } catch {
    // The local planner remains available even if the auth module cannot load.
    root.render(<Planner account={<span className="app-local" role="status">登录暂不可用</span>}/>);
  }
} else {
  root.render(<Planner/>);
}
