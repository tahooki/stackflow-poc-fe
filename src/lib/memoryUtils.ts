// 브라우저 메모리 사용량 측정 유틸리티
export const memoryUtils = {
  // 현재 메모리 사용량 조회 (MB 단위)
  getCurrentMemoryUsage: (): number => {
    if (typeof window === "undefined") return 0;

    // @ts-ignore - performance.memory는 Chrome에서만 지원
    const memory = performance.memory;
    if (memory && typeof memory.usedJSHeapSize === "number") {
      return memory.usedJSHeapSize / (1024 * 1024); // MB로 변환
    }

    // 대체 방법: 대략적인 메모리 사용량 추정
    return 0;
  },

  // 메모리 사용량이 사용 가능한지 확인
  isMemoryAvailable: (): boolean => {
    if (typeof window === "undefined") return false;

    // @ts-ignore
    const memory = performance.memory;
    return !!(memory && typeof memory.usedJSHeapSize === "number");
  },

  // 메모리 사용량 포맷팅
  formatMemoryUsage: (mb: number): string => {
    if (mb < 1) {
      return `${(mb * 1024).toFixed(1)} KB`;
    }
    return `${mb.toFixed(1)} MB`;
  },
};
