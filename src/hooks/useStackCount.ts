import { useMemo } from "react";
import { useStack } from "@stackflow/react";

export interface UseStackCountOptions {
  activityName: string;
}

export interface UseStackCountReturn {
  stackCount: number;
  stackDepth: number;
}

export const useStackCount = ({
  activityName,
}: UseStackCountOptions): UseStackCountReturn => {
  const stack = useStack();

  const stackCount = useMemo(
    () =>
      stack.activities.filter((activity) => activity.name === activityName)
        .length,
    [activityName, stack.activities]
  );

  return {
    stackCount,
    stackDepth: stack.activities.length,
  };
};
