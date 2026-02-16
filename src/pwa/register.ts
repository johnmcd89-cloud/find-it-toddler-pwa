import { registerSW } from 'virtual:pwa-register';

export const registerPWA = (): void => {
  registerSW({
    immediate: true,
    onRegisteredSW(swUrl: string) {
      console.info('Service worker registered:', swUrl);
    },
    onRegisterError(error: unknown) {
      console.error('Service worker registration failed', error);
    }
  });
};
