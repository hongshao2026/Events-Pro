import {preview} from 'vite';
export async function releaseServer(){
 const server=await preview({build:{outDir:'ios-dist'},preview:{host:'127.0.0.1',port:0,strictPort:false}});
 const {port}=server.httpServer.address();
 return {url:`http://127.0.0.1:${port}`,close:()=>new Promise(resolve=>server.httpServer.close(resolve))};
}
