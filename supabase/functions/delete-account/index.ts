import {createClient} from 'npm:@supabase/supabase-js@2.117.2';
import {handleDeleteAccount} from './handler.js';

const url=Deno.env.get('SUPABASE_URL')!;
// This key only lives in the server function environment, never the app or backup.
const admin=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const auth=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
Deno.serve((request:Request)=>handleDeleteAccount(request,{
 origins:(Deno.env.get('EVENTS_PRO_ALLOWED_ORIGINS')||'').split(',').map(value=>value.trim()).filter(Boolean),
 authenticate:async(token:string)=>{const {data,error}=await auth.auth.getUser(token);return error?null:data.user?.id??null;},
 revoke:async(token:string)=>{const {error}=await admin.auth.admin.signOut(token,'global');if(error)throw error;},
 remove:async(userId:string)=>{const {error}=await admin.auth.admin.deleteUser(userId);if(error)throw error;},
}));
