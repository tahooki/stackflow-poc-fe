import { useMemo } from "react";
import { useStack } from "@stackflow/react";

export interface UseStackCountOptions {
  activityName: string;
}

export interface UseStackCountReturn {
  stackCount: number;
}

export const useStackCount = ({
  activityName,
}: UseStackCountOptions): UseStackCountReturn => {
  const stack = useStack();

  // 컴포넌트 생성 시점의 스택 카운트를 고정하여 저장
  const stackCount = useMemo(
    () =>
      stack.activities.filter((activity) => activity.name === activityName)
        .length,
    [] // 빈 의존성 배열로 생성 시점에만 계산
  );

  return {
    stackCount,
  };
};
