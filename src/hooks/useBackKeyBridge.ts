import { useEffect, useRef } from "react";

import { Cfg } from "../config/Cfg";
import { useStacks } from "../contexts/StackContext";

declare global {
  interface Window {
    onBackKeyClick?: () => void;
    BRIDGE?: {
      onBackKeyReuslt?: (shouldStayOpen: boolean) => void;
    };
  }
}

export const useBackKeyBridge = () => {
  const { activeStack } = useStacks();
  const activeStackRef = useRef(activeStack);

  useEffect(() => {
    activeStackRef.current = activeStack;
  }, [activeStack]);

  useEffect(() => {
    const handler = async () => {
      console.log("[BackBridge] onBackKeyClick invoked", {
        stack: activeStackRef.current,
      });
      const result = await Cfg.getBack().handleBackPress();
      console.log("[BackBridge] layerController result", result);
      const report = window.BRIDGE?.onBackKeyReuslt;

      if (typeof report === "function") {
        // true: 스택에 더 이상 pop 할 게 없어서 네이티브가 종료 여부를 결정할 수 있게 함
        report(result.popped === "exit");
      }
    };

    console.log("[BackBridge] window.onBackKeyClick registered");
    window.onBackKeyClick = handler;

    return () => {
      if (window.onBackKeyClick === handler) {
        delete window.onBackKeyClick;
      }
    };
  }, []);
};
