import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.mova.motorista.dev',
  appName: 'MOVA DEV',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
