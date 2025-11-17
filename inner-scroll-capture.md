# DOM 캡처 전략 (현재 화면에 보이는 부분만 캡처)

이 문서는 **현재 화면에 실제로 렌더링되어 있는 영역만 정확하게 캡처**하기 위해,
`dom-to-image-more` 만을 사용하는 경량화된 전략을 정리한 내용입니다.

> ❗ 가상 스크롤(virtual scroll), AG Grid 전체 영역 캡처 같은 "보이지 않는 DOM" 캡처 기능은 제외하고,
> **현재 보여지는 부분만 정확하게 캡처하는 것**에 집중한 버전입니다.

---

# 🔥 목표

1. **일반 HTML/CSS 구조에서 이너 스크롤 요소까지 정확히 캡처**
2. **AG Grid, Virtual Scroll 등도 "화면에 보이는 영역만" 정확히 캡처**
3. 사용 라이브러리는 **오직 `dom-to-image-more`**
4. 복잡한 전체 렌더링 모드 / 스티칭(stitch) 제거 → 간단함 유지
5. 캡처 성공률과 스크롤 재현도를 높이기 위한 커스텀 스크롤 주입 기능 포함

---

# 📌 핵심 구조 요약

현재 화면만 캡처하기 때문에 전체 구조는 매우 단순하다.

```
[1] Scroll State Collector
       ↓
[2] dom-to-image-more (onclone 내부에서 scroll 상태 주입)
```

두 단계면 충분하다.

---

# 1. Scroll State Collector (스크롤 상태 수집)

## 역할

현재 DOM의 각 스크롤 컨테이너의

- scrollTop
- scrollLeft

값을 수집하여 클론 DOM에서도 동일하게 재현할 수 있게 한다.

## 처리 방식 (의사코드)

```ts
collectScrollStates(root): ScrollInfo[]
  traverse DOM
  if overflow: scroll 또는 auto → scrollable element
    assign unique data-scroll-id
    record scrollLeft, scrollTop
return list
```

## 이 단계가 필요한 이유

dom-to-image-more는 DOM을 클론한 뒤 foreignObject → canvas로 렌더링하는데,
이 때 **스크롤 위치가 초기화되어 캡처 결과가 달라지는 문제**가 있음.

Scroll Collector는 이 문제를 완벽하게 해결한다.

---

# 2. dom-to-image-more (onclone에서 scroll 상태 재주입)

## 동작 방식

1. Scroll Collector가 만든 리스트를 받아
2. 클론된 DOM 문서 안에서 같은 요소(data-scroll-id 기반)를 찾고
3. scrollLeft / scrollTop 값을 그대로 세팅한다

이렇게 하면 원본 화면과 1:1 동일한 레이아웃이 된다.

### 실제 코드 흐름

```ts
const scrollStates = collectScrollStates(root);

domtoimage.toPng(root, {
  onclone: (cloneDoc) => {
    scrollStates.forEach(({ id, x, y }) => {
      const el = cloneDoc.querySelector(`[data-scroll-id="${id}"]`);
      if (el) {
        el.scrollLeft = x;
        el.scrollTop = y;
      }
    });
  },
});
```

---

# 🎯 AG Grid / Virtual Scroll에 대한 현재 목표 기준 정리

이 문서의 목적은 **전체 테이블/전체 리스트 캡처 X**,
**현재 화면에 보이는 스크롤된 영역만 캡처 O** 임.

따라서 다음과 같이 동작한다.

## AG Grid

- AG Grid의 viewport는 실제 DOM으로 렌더됨
- 다만 스크롤이 초기화되어 잘못 캡처될 수 있음 → Scroll Collector로 해결
- pinned columns, center viewport 등도 동일

❗ 단, 보이지 않는 row/column(가상 스크롤 영역)은 캡처 불가 (UI 구조 특성, 의도된 동작)

## Virtual Scroll

- transform 기반 가상 스크롤 요소라면 스크롤 위치가 DOM에 반영되지 않을 수 있음
- 하지만 “현재 화면”은 transform 결과가 실제 픽셀로 렌더되어 있으므로 그대로 캡처됨
- overflow 기반 가상 스크롤이라면 Scroll Collector로 문제 없음

## 결론

> **“지금 화면에서 보이는 그대로만” 캡처하는 목적이라면,
> dom-to-image-more + Scroll Collector 조합이면 충분하며,
> AG Grid, Virtual Scroll 모두 정상 동작한다.**

---

# ✔ 최종 캡처 함수 예시 (간단 버전)

```ts
import domtoimage from "dom-to-image-more";

export async function captureVisible(root: HTMLElement) {
  const scrollStates = collectScrollStates(root);

  try {
    const url = await domtoimage.toPng(root, {
      onclone: (doc) => {
        scrollStates.forEach(({ id, x, y }) => {
          const el = doc.querySelector(`[data-scroll-id="${id}"]`);
          if (el) {
            el.scrollLeft = x;
            el.scrollTop = y;
          }
        });
      },
    });

    return url;
  } finally {
    cleanupScrollMarks(root);
  }
}
```

---

# ✔ React Hook 버전 예시 (`useDomCapture`)

React 컴포넌트에서 쉽게 사용할 수 있도록, `rootRef`를 기반으로 현재 화면을 캡처하는 Hook 버전을 설계한다.

## 사용 예시

```tsx
import React, { useRef } from "react";
import { useDomCapture } from "@/lib/domCapture";

export function MyCaptureComponent() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { capture, loading, error, lastDataUrl } = useDomCapture(rootRef);

  const handleClick = async () => {
    const url = await capture();
    if (!url) return;
    // 예: 새 창 열기
    window.open(url, "_blank");
  };

  return (
    <div>
      <button onClick={handleClick} disabled={loading}>
        {loading ? "캡처 중…" : "캡처하기"}
      </button>

      {error && <p style={{ color: "red" }}>{error.message}</p>}

      <div ref={rootRef}>{/* 이 영역이 그대로 캡처됨 */}</div>

      {lastDataUrl && (
        <img
          src={lastDataUrl}
          alt="capture preview"
          style={{ maxWidth: "100%", marginTop: 16 }}
        />
      )}
    </div>
  );
}
```

## Hook 구현 예시

```ts
// src/lib/domCapture/useDomCapture.ts
import { useCallback, useState } from "react";
import { captureVisible } from "./captureVisible";

export interface UseDomCaptureResult {
  capture: () => Promise<string | null>;
  loading: boolean;
  error: Error | null;
  lastDataUrl: string | null;
}

export function useDomCapture<T extends HTMLElement>(
  rootRef: React.RefObject<T>
): UseDomCaptureResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastDataUrl, setLastDataUrl] = useState<string | null>(null);

  const capture = useCallback(async () => {
    const root = rootRef.current;
    if (!root) {
      const err = new Error("rootRef가 아직 연결되지 않았습니다.");
      setError(err);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const url = await captureVisible(root);
      setLastDataUrl(url);
      return url;
    } catch (e) {
      const err =
        e instanceof Error ? e : new Error("캡처 중 오류가 발생했습니다.");
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [rootRef]);

  return { capture, loading, error, lastDataUrl };
}
```

---

# 📦 TypeScript 유틸 라이브러리 구조

프로젝트 내에서 재사용 가능한 **유틸 라이브러리 형태**로 정리한 구조 예시.

```text
src/
  lib/
    domCapture/
      index.ts
      types.ts
      scrollState.ts
      captureVisible.ts
      useDomCapture.ts   // (React 프로젝트에서만 사용)
```

## 1) types.ts

```ts
// src/lib/domCapture/types.ts

export type ScrollInfo = {
  id: string;
  x: number;
  y: number;
};
```

## 2) scrollState.ts

```ts
// src/lib/domCapture/scrollState.ts

import type { ScrollInfo } from "./types";

let scrollIdSeed = 0;

export function collectScrollStates(root: HTMLElement): ScrollInfo[] {
  const result: ScrollInfo[] = [];

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);

  let node: Node | null;
  while ((node = walker.nextNode())) {
    const el = node as HTMLElement;
    const style = getComputedStyle(el);

    const scrollableX = /(auto|scroll)/.test(style.overflowX);
    const scrollableY = /(auto|scroll)/.test(style.overflowY);

    if (!scrollableX && !scrollableY) continue;

    const id = el.dataset.scrollId || `__scroll-${scrollIdSeed++}`;
    el.dataset.scrollId = id;

    result.push({ id, x: el.scrollLeft || 0, y: el.scrollTop || 0 });
  }

  return result;
}

export function cleanupScrollMarks(root: HTMLElement): void {
  const markedElements = root.querySelectorAll<HTMLElement>("[data-scroll-id]");
  markedElements.forEach((el) => {
    delete el.dataset.scrollId;
  });
}

export function applyScrollStates(doc: Document, states: ScrollInfo[]): void {
  states.forEach(({ id, x, y }) => {
    const el = doc.querySelector<HTMLElement>(`[data-scroll-id="${id}"]`);
    if (!el) return;
    el.scrollLeft = x;
    el.scrollTop = y;
  });
}
```

## 3) captureVisible.ts

```ts
// src/lib/domCapture/captureVisible.ts

import domtoimage from "dom-to-image-more";
import {
  collectScrollStates,
  cleanupScrollMarks,
  applyScrollStates,
} from "./scrollState";

export async function captureVisible(root: HTMLElement): Promise<string> {
  const scrollStates = collectScrollStates(root);

  try {
    const dataUrl = await domtoimage.toPng(root, {
      onclone: (cloneDoc) => {
        applyScrollStates(cloneDoc, scrollStates);
      },
    });

    return dataUrl;
  } finally {
    cleanupScrollMarks(root);
  }
}
```

## 4) useDomCapture.ts

앞에서 작성한 Hook 코드를 그대로 사용.

```ts
// src/lib/domCapture/useDomCapture.ts

export * from "./useDomCapture";
```

## 5) index.ts

```ts
// src/lib/domCapture/index.ts

export * from "./types";
export * from "./scrollState";
export * from "./captureVisible";
export * from "./useDomCapture"; // 필요 없다면 제거 가능
```

---

# 🎉 최종 정리

- **dom-to-image-more 단일 사용** + **Scroll State 수집/주입**으로

  - 일반 DOM 이너 스크롤
  - AG Grid / Virtual Scroll의 "현재 보이는 화면"
    을 높은 신뢰도로 캡처 가능

- React 프로젝트에서는 `useDomCapture` Hook으로 사용성을 극대화
- TypeScript 유틸 라이브러리 구조로 정리해두면

  - 다른 프로젝트에서도 그대로 가져다 쓸 수 있는 수준의 재사용성 확보

필요하다면 이 구조를 npm 패키지로 뽑을 때의 `package.json`, `tsconfig`, `build` 설정 예시까지도 이어서 정리할 수 있다.
