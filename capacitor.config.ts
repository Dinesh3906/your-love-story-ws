import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dinesh.yourlovestory',
  appName: 'Your Love Story',
  webDir: 'dist',
  plugins: {
    AdMob: {
      androidAppId: 'ca-app-pub-5173875521561209~9130663095',
    },
  },
  server: {
    url: 'http://172.50.3.240:3000',
    cleartext: true,
  },
};

export default config;
