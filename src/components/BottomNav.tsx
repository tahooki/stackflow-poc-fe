import { useMemo } from "react";

import { useStacks } from "../contexts/StackContext";
import { stackList, type StackName } from "../stack/stackConfig";
import { useStackActions } from "../hooks/useStackActions";

import "../assets/bottomNav.css";

export const BottomNav = () => {
  const { activeStack, setActiveStack } = useStacks();
  const { push } = useStackActions();

  const items = useMemo(() => {
    const stackItems = (Object.keys(stackList) as StackName[]).map(
      (stackName) => ({
        key: `stack:${stackName}`,
        label: stackList[stackName].label,
        isActive: (current: StackName) => current === stackName,
        onClick: () => setActiveStack(stackName),
      })
    );

    const quickItems = [
      {
        key: "quick:detail",
        label: "Detail",
        isActive: () => false,
        onClick: () =>
          push("detail", { id: String(Date.now()) }, { stack: "home" }),
      },
      {
        key: "quick:modal",
        label: "Modal",
        isActive: () => false,
        onClick: () => push("modal", {}, { stack: "home" }),
      },
    ];

    return [...stackItems, ...quickItems];
  }, [push, setActiveStack]);

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={[
            "bottom-nav__item",
            item.isActive(activeStack) ? "bottom-nav__item--active" : null,
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={item.onClick}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
};
