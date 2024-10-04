// SurfingKeys API TypeScript Definitions

interface SurfingKeysOptions {
  domain?: RegExp
  repeatIgnore?: boolean
}

interface Clipboard {
  read(onReady: (response: { data: string }) => void): void
  write(text: string): void
}

interface Hints {
  setNumeric(): void
  setCharacters(characters: string): void
  click(links: string | HTMLElement[], force?: boolean): void
  create(
    cssSelector: string | HTMLElement[],
    onHintKey: (element: HTMLElement) => void,
    attrs?: { active?: boolean; tabbed?: boolean; multipleHits?: boolean }
  ): boolean
  dispatchMouseClick(element: HTMLElement): void
  style(css: string, mode?: string): void
}

interface Normal {
  passThrough(timeout?: number): void
  scroll(
    type:
      | "down"
      | "up"
      | "pageDown"
      | "fullPageDown"
      | "pageUp"
      | "fullPageUp"
      | "top"
      | "bottom"
      | "left"
      | "right"
      | "leftmost"
      | "rightmost"
      | "byRatio"
  ): void
  feedkeys(keys: string): void
  jumpVIMark(mark: string): void
}

interface Visual {
  style(element: "marks" | "cursor", style: string): void
}

interface Front {
  showEditor(
    element: HTMLElement | string,
    onWrite: (data: string) => void,
    type?: string,
    useNeovim?: boolean
  ): void
  openOmnibar(args: { type: string }): void
  registerInlineQuery(args: {
    url: string | (() => string)
    parseResult: (result: any) => string
    headers?: Record<string, string>
  }): void
  showBanner(msg: string, timeout?: number): void
  showPopup(msg: string): void
}

interface SurfingKeysAPI {
  mapkey(
    keys: string,
    annotation: string,
    jscode: (arg?: string) => void,
    options?: SurfingKeysOptions
  ): void
  vmapkey(
    keys: string,
    annotation: string,
    jscode: (arg?: string) => void,
    options?: SurfingKeysOptions
  ): void
  imapkey(
    keys: string,
    annotation: string,
    jscode: (arg?: string) => void,
    options?: SurfingKeysOptions
  ): void
  map(
    newKeystroke: string,
    oldKeystroke: string,
    domain?: RegExp,
    newAnnotation?: string
  ): void
  unmap(keystroke: string, domain?: RegExp): void
  unmapAllExcept(keystrokes: string[], domain?: RegExp): void
  imap(
    newKeystroke: string,
    oldKeystroke: string,
    domain?: RegExp,
    newAnnotation?: string
  ): void
  iunmap(keystroke: string, domain?: RegExp): void
  cmap(
    newKeystroke: string,
    oldKeystroke: string,
    domain?: RegExp,
    newAnnotation?: string
  ): void
  vmap(
    newKeystroke: string,
    oldKeystroke: string,
    domain?: RegExp,
    newAnnotation?: string
  ): void
  vunmap(keystroke: string, domain?: RegExp): void
  lmap(
    newKeystroke: string,
    oldKeystroke: string,
    domain?: RegExp,
    newAnnotation?: string
  ): void
  aceVimMap(lhs: string, rhs: string, ctx: string): void
  addVimMapKey(
    objects: {
      keys: string
      type: string
      motion: string
      motionArgs: Record<string, any>
    }[]
  ): void
  addSearchAlias(
    alias: string,
    prompt: string,
    searchUrl: string,
    searchLeaderKey?: string,
    suggestionUrl?: string,
    callbackToParseSuggestion?: (response: any) => string[],
    onlyThisSiteKey?: string,
    options?: { faviconUrl?: string; skipMaps?: boolean }
  ): void
  removeSearchAlias(
    alias: string,
    searchLeaderKey?: string,
    onlyThisSiteKey?: string
  ): void
  searchSelectedWith(
    se: string,
    onlyThisSite?: boolean,
    interactive?: boolean,
    alias?: string
  ): void
  Clipboard: Clipboard
  Hints: Hints
  Normal: Normal
  Visual: Visual
  Front: Front
  getBrowserName(): "Chrome" | "Firefox" | "Safari"
  isElementPartiallyInViewport(el: Element, ignoreSize?: boolean): boolean
  getClickableElements(selectorString: string, pattern: RegExp): HTMLElement[]
  tabOpenLink(str: string, simultaneousness?: number): void
  insertJS(code: string | (() => void), onload?: () => void): void
  RUNTIME(
    action: string,
    args: Record<string, any>,
    callback: (response: any) => void
  ): void
}

declare global {
  var api: SurfingKeysAPI // You can replace 'any' with a more specific type if needed
  var surfingKeys: undefined | SurfingKeysAPI
}

const getApi = () => {
  if (typeof window !== "undefined" && typeof api !== "undefined") {
    // Surfingkeys >= 1.0
    return api
  }

  throw new Error("api not found")
}

export default getApi()
