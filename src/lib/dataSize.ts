const getEncoder = () => {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder();
  }
  return null;
};

const encoder = getEncoder();

export const estimateJsonBytes = (value: unknown): number => {
  try {
    const json = JSON.stringify(value);
    if (typeof json !== "string") {
      return 0;
    }
    if (encoder) {
      return encoder.encode(json).length;
    }
    if (typeof Blob !== "undefined") {
      return new Blob([json]).size;
    }
    return json.length;
  } catch {
    return 0;
  }
};

const BYTE_UNITS = [
  { limit: 1024 ** 3, suffix: "GB" },
  { limit: 1024 ** 2, suffix: "MB" },
];

export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 MB";
  }

  for (const { limit, suffix } of BYTE_UNITS) {
    if (bytes >= limit) {
      const value = bytes / limit;
      return `${value >= 100 ? value.toFixed(0) : value.toFixed(2)} ${suffix}`;
    }
  }

  // 1MB 미만인 경우 MB로 표시
  const mbValue = bytes / 1024 ** 2;
  if (mbValue >= 0.95) {
    return "1.00 MB";
  }
  return `${mbValue.toFixed(2)} MB`;
};
