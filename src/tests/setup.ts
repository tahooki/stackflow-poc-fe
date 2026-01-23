import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

const activeIntervals = new Set<ReturnType<typeof setInterval>>();
const activeTimeouts = new Set<ReturnType<typeof setTimeout>>();

const originalSetInterval = globalThis.setInterval;
const originalClearInterval = globalThis.clearInterval;
const originalSetTimeout = globalThis.setTimeout;
const originalClearTimeout = globalThis.clearTimeout;

globalThis.setInterval = ((...args: Parameters<typeof setInterval>) => {
  const id = originalSetInterval(...args);
  activeIntervals.add(id);
  return id;
}) as typeof setInterval;

globalThis.clearInterval = ((id?: Parameters<typeof clearInterval>[0]) => {
  if (id !== undefined) {
    activeIntervals.delete(id as ReturnType<typeof setInterval>);
  }
  return originalClearInterval(id as never);
}) as typeof clearInterval;

globalThis.setTimeout = ((...args: Parameters<typeof setTimeout>) => {
  const id = originalSetTimeout(...args);
  activeTimeouts.add(id);
  return id;
}) as typeof setTimeout;

globalThis.clearTimeout = ((id?: Parameters<typeof clearTimeout>[0]) => {
  if (id !== undefined) {
    activeTimeouts.delete(id as ReturnType<typeof setTimeout>);
  }
  return originalClearTimeout(id as never);
}) as typeof clearTimeout;

afterEach(() => {
  cleanup();
  activeIntervals.forEach((id) => originalClearInterval(id));
  activeIntervals.clear();
  activeTimeouts.forEach((id) => originalClearTimeout(id));
  activeTimeouts.clear();
});
