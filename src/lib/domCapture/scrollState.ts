import type { ScrollInfo, ScrollLayoutSnapshot } from "./types";

const SCROLLABLE_OVERFLOW = /(auto|scroll)/i;
let scrollIdSeed = 0;

const DATA_SELECTOR = "[data-scroll-id]";

type CloneRoot = Document | HTMLElement;

// 루트 이하의 모든 스크롤 컨테이너에 식별자와 상태를 부여해 배열로 돌려준다.
export function collectScrollStates(root: HTMLElement): ScrollInfo[] {
  const states: ScrollInfo[] = [];
  if (!root || typeof document === "undefined") {
    return states;
  }

  markIfScrollable(root, states);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let current: Node | null;
  while ((current = walker.nextNode())) {
    markIfScrollable(current as HTMLElement, states);
  }

  return states;
}

// captureVisible 종료 후 data-scroll-id 흔적을 모두 제거한다.
export function cleanupScrollMarks(root: HTMLElement): void {
  if (!root) {
    return;
  }

  if (root.dataset.scrollId) {
    delete root.dataset.scrollId;
    root.removeAttribute("data-scroll-id");
  }

  const marked = root.querySelectorAll<HTMLElement>(DATA_SELECTOR);
  marked.forEach((el) => {
    delete el.dataset.scrollId;
    el.removeAttribute("data-scroll-id");
  });
}

// 클론 DOM의 각 스크롤 컨테이너를 찾아 원래 스크롤 좌표를 다시 흘려 넣는다.
export function applyScrollStates(
  cloneRoot: CloneRoot,
  states: ScrollInfo[]
): void {
  states.forEach(({ id, x, y }) => {
    const target = findScrollableClone(cloneRoot, id);
    if (!target) {
      return;
    }

    target.scrollLeft = x;
    target.scrollTop = y;
  });
}

// 스크롤 후보 요소를 발견하면 data-scroll-id를 부여하고 상태 스냅샷을 생성한다.
function markIfScrollable(
  element: HTMLElement,
  states: ScrollInfo[]
): boolean {
  if (!element) {
    return false;
  }

  if (!isScrollable(element)) {
    return false;
  }

  const id = element.dataset.scrollId ?? `__scroll-${scrollIdSeed++}`;
  element.dataset.scrollId = id;
  element.setAttribute("data-scroll-id", id);
  states.push({
    id,
    x: element.scrollLeft ?? 0,
    y: element.scrollTop ?? 0,
    width: element.clientWidth,
    height: element.clientHeight,
    contentWidth: element.scrollWidth,
    contentHeight: element.scrollHeight,
    layout: snapshotLayout(element),
  });
  return true;
}

// overflow 속성과 scrollWidth/Height 차이를 함께 확인해 스크롤 컨테이너 여부를 판단한다.
function isScrollable(element: HTMLElement): boolean {
  if (typeof window === "undefined" || typeof getComputedStyle === "undefined") {
    return false;
  }

  const style = getComputedStyle(element);
  const allowsHorizontal = SCROLLABLE_OVERFLOW.test(style.overflowX);
  const allowsVertical = SCROLLABLE_OVERFLOW.test(style.overflowY);

  if (!allowsHorizontal && !allowsVertical) {
    return false;
  }

  const hasHorizontalOverflow =
    allowsHorizontal && element.scrollWidth - element.clientWidth > 1;
  const hasVerticalOverflow =
    allowsVertical && element.scrollHeight - element.clientHeight > 1;

  return hasHorizontalOverflow || hasVerticalOverflow || allowsHorizontal || allowsVertical;
}

// flex 레이아웃 등 핵심 스타일만 추려서 복제 가능한 스냅샷을 남긴다.
function snapshotLayout(element: HTMLElement): ScrollLayoutSnapshot {
  if (typeof window === "undefined" || typeof getComputedStyle === "undefined") {
    return {};
  }
  const computed = getComputedStyle(element);
  return {
    display: computed.display,
    flexDirection: computed.flexDirection,
    flexWrap: computed.flexWrap,
    alignItems: computed.alignItems,
    alignContent: computed.alignContent,
    justifyContent: computed.justifyContent,
    gap: computed.gap,
    rowGap: computed.rowGap,
    columnGap: computed.columnGap,
    whiteSpace: computed.whiteSpace,
  };
}

// 클론 문서에서 동일한 data-scroll-id를 가진 요소를 찾는다.
function findScrollableClone(
  root: CloneRoot,
  id: string
): HTMLElement | null {
  if (root instanceof Document) {
    const docMatch = root.querySelector<HTMLElement>(`[data-scroll-id="${id}"]`);
    if (docMatch) {
      return docMatch;
    }

    if (root.documentElement?.dataset.scrollId === id) {
      return root.documentElement as HTMLElement;
    }

    if (root.body?.dataset.scrollId === id) {
      return root.body as HTMLElement;
    }

    return null;
  }

  if (root.dataset?.scrollId === id) {
    return root;
  }

  return root.querySelector<HTMLElement>(`[data-scroll-id="${id}"]`);
}
