import { AppScreen } from "@stackflow/plugin-basic-ui";
import type { ActivityComponentType } from "@stackflow/react";

import { useNavActions } from "../hooks/useNavActions";
import { useCallback } from "react";

export type HomeActivityParams = Record<string, never>;

const HomeActivity: ActivityComponentType<HomeActivityParams> = () => {
  const { push } = useNavActions();

  const clearLocalStorage = useCallback(() => {
    localStorage.clear();
  }, []);

  const handlerPush = useCallback(
    (activity: string) => {
      clearLocalStorage();

      if (activity === "memory") {
        push(activity, {
          payloadMB: 5,
          label: "Default 5MB payload",
        });
      } else {
        push(activity, {});
      }
    },
    [push, clearLocalStorage]
  );

  return (
    <AppScreen appBar={{ title: "Home" }}>
      <div className="activity">
        <div className="activity__content">
          <div className="activity__actions">
            <button type="button" onClick={() => handlerPush("table")}>
              Open Table Activity
            </button>
            <button type="button" onClick={() => handlerPush("chart")}>
              Open Chart Activity
            </button>
            <button type="button" onClick={() => handlerPush("image-stack")}>
              Open Image Activity
            </button>
            <button type="button" onClick={() => handlerPush("text")}>
              Open Text Activity
            </button>
            <button type="button" onClick={() => handlerPush("memory")}>
              Open Memory Stress Activity
            </button>
          </div>
        </div>
      </div>
    </AppScreen>
  );
};

export default HomeActivity;
