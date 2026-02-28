import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dinesh.yourlovestory.v2',
  appName: 'Your Love Story',
  webDir: 'dist',
  plugins: {
    AdMob: {
      androidAppId: 'ca-app-pub-5173875521561209~1055412706',
    },
  },
};

export default config;
