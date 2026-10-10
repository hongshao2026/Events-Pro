// Dependencies are injected so identity, revocation and failure paths can be tested locally.
export async function handleDeleteAccount(request, dependencies) {
 const origin=request.headers.get('origin');
 const allowed=origin&&dependencies.origins.includes(origin);
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
 if(allowed)Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'});
 const reply=(status,value)=>new Response(JSON.stringify(value),{status,headers});
 if(origin&&!allowed)return reply(403,{error:'origin_not_allowed'});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='POST')return reply(405,{error:'method_not_allowed'});
 const match=/^Bearer ([^\s]+)$/i.exec(request.headers.get('authorization')||'');
 if(!match)return reply(401,{error:'authentication_required'});
 try{
  const body=await request.json();
  if(body?.confirm!==true||Object.keys(body).some(key=>key!=='confirm'))return reply(400,{error:'confirmation_required'});
 }catch{return reply(400,{error:'invalid_request'});}
 try{
  const userId=await dependencies.authenticate(match[1]);
  if(!userId)return reply(401,{error:'authentication_required'});
  await dependencies.revoke(match[1]);
  await dependencies.remove(userId);
  return reply(200,{deleted:true});
 }catch{return reply(503,{error:'deletion_not_confirmed'});}
}
