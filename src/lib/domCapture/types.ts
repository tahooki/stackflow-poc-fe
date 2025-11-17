export type ScrollInfo = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  contentWidth: number;
  contentHeight: number;
  layout: ScrollLayoutSnapshot;
};

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
