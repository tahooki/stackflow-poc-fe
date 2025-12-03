import { useEffect } from "react";

import { layerController } from "../lib/layerController";

declare global {
  interface Window {
    onBackKeyClick?: () => void;
    BRIDGE?: {
      onBackKeyReuslt?: (shouldStayOpen: boolean) => void;
    };
  }
}

const defaultConfirmExit = async () => {
  if (typeof window === "undefined" || typeof window.confirm !== "function") {
    return true;
  }
  return window.confirm("앱을 종료할까요?");
};

export const useBackKeyBridge = () => {
  useEffect(() => {
    const handler = async () => {
      const result = await layerController.handleBackPress(defaultConfirmExit);
      const report = window.BRIDGE?.onBackKeyReuslt;

      if (typeof report === "function") {
        // true: 앱이 핸들링됨(종료하지 않음), false: 종료 허용
        report(result.popped !== "exit");
      }
    };

    window.onBackKeyClick = handler;

    return () => {
      if (window.onBackKeyClick === handler) {
        delete window.onBackKeyClick;
      }
    };
  }, []);
};
