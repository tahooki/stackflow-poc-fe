import { StackScopeProvider, useStacks } from "../contexts/StackContext";
import type { StackName } from "../stack/stackConfig";

import "../assets/stackViewport.css";

export const StackViewport = () => {
  const { stackManager, activeStack } = useStacks();

  return (
    <div className="stack-viewport" data-active-stack={activeStack}>
      {stackManager.getStackNames().map((stackName: StackName) => {
        const StackComponent = stackManager.getStack(stackName).Stack;
        const isActive = stackName === activeStack;

        return (
          <div
            key={stackName}
            className={[
              "stack-viewport__stack",
              isActive ? "stack-viewport__stack--active" : null,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <StackScopeProvider stackName={stackName}>
              <StackComponent />
            </StackScopeProvider>
          </div>
        );
      })}
    </div>
  );
};
