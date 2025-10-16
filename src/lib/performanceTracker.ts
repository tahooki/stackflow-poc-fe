export interface PerformanceRecord {
  id: string;
  activityName: string;
  timestamp: number;
  memoryUsageMB: number;
  stackCount: number;
  stackDepth: number;
}

const PERFORMANCE_STORAGE_KEY = "stackflow-performance-records";

export const performanceTracker = {
  // 성능 기록 저장
  recordPerformance: (record: Omit<PerformanceRecord, "id" | "timestamp">) => {
    if (typeof window === "undefined") return;

    const newRecord: PerformanceRecord = {
      id: `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...record,
    };

    const existingRecords = performanceTracker.getAllRecords();
    const updatedRecords = [...existingRecords, newRecord];

    window.localStorage.setItem(
      PERFORMANCE_STORAGE_KEY,
      JSON.stringify(updatedRecords)
    );
  },

  // 모든 기록 조회
  getAllRecords: (): PerformanceRecord[] => {
    if (typeof window === "undefined") return [];

    try {
      const stored = window.localStorage.getItem(PERFORMANCE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to parse performance records:", error);
      return [];
    }
  },

  // 기록 초기화
  clearAllRecords: () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(PERFORMANCE_STORAGE_KEY);
  },

  // Activity별 기록 조회
  getRecordsByActivity: (activityName: string): PerformanceRecord[] => {
    return performanceTracker
      .getAllRecords()
      .filter((record) => record.activityName === activityName);
  },

  // 메모리 사용량 통계 계산
  getMemoryStats: () => {
    const records = performanceTracker.getAllRecords();
    if (records.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        count: 0,
      };
    }

    const memoryValues = records.map((r) => r.memoryUsageMB);
    const sum = memoryValues.reduce((acc, val) => acc + val, 0);

    return {
      average: sum / memoryValues.length,
      min: Math.min(...memoryValues),
      max: Math.max(...memoryValues),
      count: memoryValues.length,
    };
  },

  // 스택 카운트 통계 계산
  getStackStats: () => {
    const records = performanceTracker.getAllRecords();
    if (records.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        count: 0,
      };
    }

    const stackValues = records.map((r) => r.stackCount);
    const sum = stackValues.reduce((acc, val) => acc + val, 0);

    return {
      average: sum / stackValues.length,
      min: Math.min(...stackValues),
      max: Math.max(...stackValues),
      count: stackValues.length,
    };
  },

  // 최근 기록 조회 (최신순)
  getRecentRecords: (limit: number = 50): PerformanceRecord[] => {
    const records = performanceTracker.getAllRecords();
    return records.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  },
};
