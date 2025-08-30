import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.aa54bad5d11b472b8077c4738f5222a6',
  appName: 'lux-xrpl-vault',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'https://aa54bad5-d11b-472b-8077-c4738f5222a6.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;