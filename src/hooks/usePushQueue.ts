import { useCallback, useEffect, useRef, useState } from "react";
import { useNavActions } from "./useNavActions";

type QueueStatus = {
  batchId: string;
  total: number;
  dispatched: number;
  remaining: number;
  completed: boolean;
  canceled: boolean;
};

export interface UsePushQueueOptions {
  activityName: string;
  pushIntervalMs?: number;
}

export interface UsePushQueueReturn {
  queueStatus: QueueStatus | null;
  enqueuePushes: (count: number) => void;
  cancelQueue: () => void;
  canCancelQueue: boolean;
}

export const usePushQueue = ({
  activityName,
  pushIntervalMs = 100,
}: UsePushQueueOptions): UsePushQueueReturn => {
  const { push } = useNavActions();

  const pendingPushCountRef = useRef(0);
  const pushTimerRef = useRef<number | null>(null);
  const queueStatusRef = useRef<QueueStatus | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);

  useEffect(
    () => () => {
      if (pushTimerRef.current !== null) {
        window.clearTimeout(pushTimerRef.current);
      }
      pushTimerRef.current = null;
      pendingPushCountRef.current = 0;
      queueStatusRef.current = null;
      setQueueStatus(null);
    },
    []
  );

  const processNextPush = useCallback(() => {
    if (pendingPushCountRef.current <= 0) {
      pushTimerRef.current = null;
      const status = queueStatusRef.current;
      if (status && !status.completed && !status.canceled) {
        const completedStatus: QueueStatus = {
          ...status,
          dispatched: status.total,
          remaining: 0,
          completed: true,
          canceled: false,
        };
        queueStatusRef.current = completedStatus;
        setQueueStatus(completedStatus);
      }
      return;
    }

    pendingPushCountRef.current -= 1;
    push(activityName, {});

    const status = queueStatusRef.current;
    if (status) {
      const dispatched = Math.min(status.total, status.dispatched + 1);
      const remaining = pendingPushCountRef.current;
      const updatedStatus: QueueStatus = {
        ...status,
        dispatched,
        remaining,
        completed: remaining === 0,
        canceled: false,
      };
      queueStatusRef.current = updatedStatus;
      setQueueStatus(updatedStatus);
    }

    if (pendingPushCountRef.current <= 0) {
      pushTimerRef.current = null;
      return;
    }

    pushTimerRef.current = window.setTimeout(processNextPush, pushIntervalMs);
  }, [push, activityName, pushIntervalMs]);

  const enqueuePushes = useCallback(
    (count: number) => {
      if (count <= 0) {
        return;
      }

      pendingPushCountRef.current += count;

      const existing = queueStatusRef.current;
      if (existing && !existing.completed) {
        if (existing.canceled) {
          const batchId = `${activityName}-${Date.now()}`;
          const initialStatus: QueueStatus = {
            batchId,
            total: count,
            dispatched: 0,
            remaining: pendingPushCountRef.current,
            completed: false,
            canceled: false,
          };
          queueStatusRef.current = initialStatus;
          setQueueStatus(initialStatus);
        } else {
          const updated: QueueStatus = {
            ...existing,
            total: existing.total + count,
            remaining: pendingPushCountRef.current,
            canceled: false,
          };
          queueStatusRef.current = updated;
          setQueueStatus(updated);
        }
      } else {
        const batchId = `${activityName}-${Date.now()}`;
        const initialStatus: QueueStatus = {
          batchId,
          total: count,
          dispatched: 0,
          remaining: pendingPushCountRef.current,
          completed: false,
          canceled: false,
        };
        queueStatusRef.current = initialStatus;
        setQueueStatus(initialStatus);
      }

      if (pushTimerRef.current === null) {
        processNextPush();
      }
    },
    [processNextPush, activityName]
  );

  const cancelQueue = useCallback(() => {
    if (pushTimerRef.current !== null) {
      window.clearTimeout(pushTimerRef.current);
    }
    pushTimerRef.current = null;
    pendingPushCountRef.current = 0;

    const status = queueStatusRef.current;
    if (status) {
      const canceledStatus: QueueStatus = {
        ...status,
        remaining: 0,
        completed: false,
        canceled: true,
      };
      queueStatusRef.current = canceledStatus;
      setQueueStatus(canceledStatus);
    }
  }, []);

  const canCancelQueue =
    queueStatus != null &&
    !queueStatus.completed &&
    !queueStatus.canceled &&
    queueStatus.remaining > 0;

  return {
    queueStatus,
    enqueuePushes,
    cancelQueue,
    canCancelQueue,
  };
};
