export {};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: any;
        ready: () => void;
        close: () => void;
        expand: () => void;
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          setText: (text: string) => void;
        };
      };
    };
  }
}
