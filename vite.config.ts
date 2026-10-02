import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
export default defineConfig({
 plugins:[react()],
 resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},
 base:'./', publicDir:false,
 server:{host:'127.0.0.1'}, preview:{host:'127.0.0.1'},
 build:{outDir:'local-dist',cssCodeSplit:false,modulePreload:false,assetsInlineLimit:1000000,chunkSizeWarningLimit:1000,rolldownOptions:{output:{codeSplitting:false}}},
});
