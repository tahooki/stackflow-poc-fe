declare module "dom-to-image-more" {
  type CloneHook = (
    original: HTMLElement,
    clone: HTMLElement,
    after?: boolean
  ) => void | HTMLElement;

  interface CorsImageConfig {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    data?: unknown;
  }

  export interface DomToImageOptions {
    filter?: (node: HTMLElement) => boolean;
    onclone?: (clonedNode: Document | HTMLElement) => void | Promise<void>;
    bgcolor?: string;
    width?: number;
    height?: number;
    style?: Partial<CSSStyleDeclaration>;
    quality?: number;
    scale?: number;
    imagePlaceholder?: string;
    cacheBust?: boolean;
    useCredentials?: boolean;
    useCredentialsFilters?: string[];
    httpTimeout?: number;
    styleCaching?: "strict" | "relaxed";
    copyDefaultStyles?: boolean;
    disableEmbedFonts?: boolean;
    disableInlineImages?: boolean;
    corsImg?: CorsImageConfig;
    adjustClonedNode?: CloneHook;
    filterStyles?: (propertyName: string) => boolean;
  }

  export interface DomToImageApi {
    toSvg(node: Element, options?: DomToImageOptions): Promise<string>;
    toPng(node: Element, options?: DomToImageOptions): Promise<string>;
    toJpeg(node: Element, options?: DomToImageOptions): Promise<string>;
    toBlob(node: Element, options?: DomToImageOptions): Promise<Blob>;
    toPixelData(
      node: Element,
      options?: DomToImageOptions
    ): Promise<Uint8Array>;
    toCanvas(
      node: Element,
      options?: DomToImageOptions
    ): Promise<HTMLCanvasElement>;
  }

  const domtoimage: DomToImageApi;

  export default domtoimage;
}
