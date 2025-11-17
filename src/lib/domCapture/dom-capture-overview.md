# DOM Capture Pipeline

이 문서는 `src/lib/domCapture`에 위치한 유틸리티가 어떤 순서로 현재 화면을 캡처하는지 정리한 개요다. 모든 설명은 `dom-to-image-more` 단일 의존성 위에서 동작하는 구현을 기준으로 한다.

## 1. Scroll State 수집

1. `collectScrollStates(root)`가 루트 이하를 순회하며 `overflow: auto|scroll` 조건을 만족하는 요소마다 `data-scroll-id`를 부여한다.
2. 각 요소에 대해 다음 정보를 `ScrollInfo`로 저장한다.
   - 현재 `scrollLeft`/`scrollTop`
   - 뷰포트 크기(`clientWidth/Height`)
   - 전체 콘텐츠 크기(`scrollWidth/Height`)
   - Flex 레이아웃과 갭을 포함한 최소한의 레이아웃 스냅샷
3. 캡처가 끝나면 `cleanupScrollMarks`가 data 속성을 모두 지워 DOM을 원복한다.

## 2. 스크롤바 및 레이아웃 마스킹

1. 캡처 전 `applyOriginalScrollbarMask`가 실제 DOM의 스크롤 컨테이너에 `dom-capture-scroll-mask` 클래스를 부여해 네이티브 스크롤바를 숨긴다.
2. `captureVisible` 내부에서 `dom-to-image-more`의 `adjustClonedNode`를 이용해 클론 DOM에서도 동일 클래스를 부여하고, overflow를 강제로 `hidden`으로 바꾼다.
3. `applyViewportMask`는 클론 요소 안에 래퍼를 만들고, 저장된 레이아웃 스냅샷(display, flex 속성 등)을 복사한 뒤 `translateX/translateY`로 스크롤 위치를 재현한다.

## 3. dom-to-image-more 렌더링

1. `captureVisible`은 위에서 준비한 옵션과 함께 `domtoimage.toCanvas(root, mergedOptions)`를 호출한다.
2. `onclone` 훅에서는 `applyScrollStates`를 실행해 스크롤 좌표를 그대로 복구하고, 클론 전체를 캡처 가능한 상태로 만든다.
3. `adjustClonedNode` 훅은 클론 생성 과정에서 각 컨테이너가 마스크+transform 보정을 확실히 받도록 하는 보조 장치다.

## 4. 뷰포트 기준 크롭

1. dom-to-image-more는 기본적으로 전체 노드를 전부 포함하는 캔버스를 반환한다.
2. `resolveVisibleClip`이 루트 자체 스크롤 여부를 검사해 캡처해야 할 사각형(ClipRect)을 계산한다.
3. `cropCanvas`는 원본 캔버스에서 해당 영역만 잘라 새로운 캔버스를 생성하고, PNG data URL을 돌려준다.

## 5. React Hook (`useDomCapture`)

1. Hook은 ref와 옵션을 받아 `capture` 함수를 노출한다.
2. `capture()`를 호출하면 위의 전체 파이프라인이 실행되고, data URL이 state에 저장되어 필요 시 미리보기 등에 재사용할 수 있다.
3. 로딩/에러 상태도 함께 반환하므로 UI에서 버튼 비활성화나 에러 메시지 처리에 활용하면 된다.

## 6. 확장 지점

- `DomToImageOptions`를 그대로 전달할 수 있으므로, 호출부에서 `filter`, `style`, `bgcolor` 등을 커스터마이즈 가능하다.
- Scroll state를 수집할 때 식별자를 부여하므로, 필요하면 외부에서 `data-scroll-id`를 미리 지정해 특정 노드만 마스킹하도록 확장할 수 있다.
- 스크롤바를 완전히 숨기기 위해 현재는 CSS 클래스를 사용하지만, 특정 환경(예: 데스크톱 WebKit)에서는 시각적 스크롤을 별도 UI로 대체하는 접근도 고려할 수 있다.

이 과정을 통해 "현재 화면 그대로"를 최대한 정확하게 캡처하면서도 dom-to-image-more 하나만 사용하는 경량 파이프라인을 유지할 수 있다.
