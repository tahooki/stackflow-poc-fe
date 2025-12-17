import { StackScopeProvider, useStacks } from "../contexts/StackContext";
import { stackList, type StackName } from "../stack/stackConfig";

import "../assets/stackViewport.css";

export const StackViewport = () => {
  const { stacks, activeStack } = useStacks();

  return (
    <div className="stack-viewport" data-active-stack={activeStack}>
      {(Object.keys(stackList) as StackName[]).map((stackName) => {
        const StackComponent = stacks[stackName].Stack;
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

