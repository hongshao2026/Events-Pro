import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import Planner from '@/app/planner';
import { AccountControl } from './account-control';
import type { AuthRuntime } from '@/lib/auth/client';
import './auth.css';
import {CloudBackupControl} from './cloud-backup-control';

export default function AuthApp({ runtime }: { runtime: AuthRuntime }) {
  const [session, setSession] = useState<Session | null>(runtime.session);
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    if (!runtime.client) return;
    const { data } = runtime.client.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === 'SIGNED_OUT') setExpired(true);
      if (next) setExpired(false);
    });
    return () => data.subscription.unsubscribe();
  }, [runtime.client]);
  return <Planner
    accountInfo={session?{id:session.user.id,email:session.user.email,displayName:typeof session.user.user_metadata?.name==='string'?session.user.user_metadata.name.slice(0,80):undefined,provider:session.user.app_metadata?.provider}:undefined}
    account={<AccountControl runtime={runtime} session={session} expired={expired} onSignedOut={()=>setExpired(false)}/>}
    cloudBackup={import.meta.env.VITE_CLOUD_ENABLED==='true'&&runtime.client&&session?<CloudBackupControl key={session.user.id} client={runtime.client} userId={session.user.id} onDeleted={()=>{setSession(null);setExpired(false);}}/>:undefined}
  />;
}
