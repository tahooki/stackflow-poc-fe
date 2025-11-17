// 스크롤 컨테이너를 식별하고, 뷰포트 정보/스크롤 상태/레이아웃을 묶어서 보관하는 구조체.
export type ScrollInfo = {
  // captureVisible 호출 시 부여하는 data-scroll-id 값. 클론 DOM에서 다시 찾아갈 때 사용한다.
  id: string;
  // 현재 scrollLeft, scrollTop 좌표. 클론 DOM에 translate 보정을 적용할 때 활용한다.
  x: number;
  y: number;
  // 화면에 실제로 보여주는 영역의 너비/높이 (clientWidth/Height).
  width: number;
  height: number;
  // 내부 전체 콘텐츠 크기 (scrollWidth/Height). 오프스크린 카드까지 포함하기 위해 필요하다.
  contentWidth: number;
  contentHeight: number;
  // 컨테이너가 flex인지 block인지 등 레이아웃 스냅샷. 클론 DOM에도 동일하게 덮어쓴다.
  layout: ScrollLayoutSnapshot;
};

// 레이아웃 유지에 꼭 필요한 CSS 속성만 간추려 스냅샷으로 만든 타입.
export type ScrollLayoutSnapshot = {
  display?: string;
  flexDirection?: string;
  flexWrap?: string;
  alignItems?: string;
  alignContent?: string;
  justifyContent?: string;
  gap?: string;
  rowGap?: string;
  columnGap?: string;
  whiteSpace?: string;
};
