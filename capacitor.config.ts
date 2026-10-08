import type {CapacitorConfig} from '@capacitor/cli';
import releaseInfo from './app-release.config.json';

const config:CapacitorConfig={
  appId:releaseInfo.bundleId,
  appName:releaseInfo.appName,
  webDir:'ios-dist',
  backgroundColor:'#f5f6f9',
  ios:{contentInset:'never',preferredContentMode:'mobile',backgroundColor:'#f5f6f9'},
};
// Bundled assets only: never point a shipping app at a development web server.
export default config;
