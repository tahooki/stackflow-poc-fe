import { useMemo } from "react";

import { useStacks } from "../contexts/StackContext";
import { stackList, type StackName } from "../stack/stackConfig";

import "../assets/bottomNav.css";

export const BottomNav = () => {
  const { activeStack, setActiveStack } = useStacks();

  const items = useMemo(
    () => (Object.keys(stackList) as StackName[]).map((stackName) => ({
      stackName,
      label: stackList[stackName].label,
    })),
    []
  );

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {items.map((item) => (
        <button
          key={item.stackName}
          type="button"
          className={[
            "bottom-nav__item",
            item.stackName === activeStack ? "bottom-nav__item--active" : null,
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => setActiveStack(item.stackName)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
};

