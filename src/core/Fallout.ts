import { XEvent } from './helper';

type ProtectEvtType = '_dp-start' | '_dp-move' | '_dp-end' | '_dp-resize';

type ProtectEventEmiter = (protectEvtType: ProtectEvtType, e: XEvent) => void;

interface ProtectFallout {
  emit: ProtectEventEmiter;
  on: (protectEvtType: ProtectEvtType, fn: (e?: XEvent) => any) => void;
}

type ResizeEmiter = (publicEvtType: 'resize', token: HTMLElement, srcElement: HTMLElement) => void;

interface ResizeFallout {
  emit: ResizeEmiter;
  on: (publicEvtType: 'resize', resizeCallback: (token: HTMLElement, srcElement: HTMLElement) => void) => void;
}

type ClonedEmiter = (publicEvtType: 'cloned', token: HTMLElement, srcElement: HTMLElement) => void;

interface ClonedFallout {
  emit: ClonedEmiter;
  on: (publicEvtType: 'cloned', clonedCallback: (token: HTMLElement, srcElement: HTMLElement) => void) => void;
}

type ClickEmiter = (publicEvtType: 'click', token: HTMLElement, srcElement: HTMLElement) => void;

interface ClickFallout {
  emit: ClickEmiter;
  on: (publicEvtType: 'click', clickCallback: (token: HTMLElement, srcElement: HTMLElement) => void) => void;
}

type StartEmiter = (
  publicEvtType: 'start',
  token: HTMLElement,
  srcElement: HTMLElement,
  { fingerX, fingerY, startX, startY },
) => void;

interface StartFallout {
  emit: StartEmiter;
  on: (
    publicEvtType: 'start',
    startCallback: (token: HTMLElement, srcElement: HTMLElement, { fingerX, fingerY, startX, startY }) => void,
  ) => void;
}

type MoveEmiter = (
  publicEvtType: 'move',
  token: HTMLElement,
  srcElement: HTMLElement,
  { edge, translateX, translateY },
) => void;

interface MoveFallout {
  emit: MoveEmiter;
  on: (
    publicEvtType: 'move',
    moveCallback: (token: HTMLElement, srcElement: HTMLElement, { edge, translateX, translateY }) => void,
  ) => void;
}

type DropEmiter = (publicEvtType: 'drop', token: HTMLElement, srcElement: HTMLElement) => void;

interface DropFallout {
  emit: DropEmiter;
  on: (publicEvtType: 'drop', dropCallback: (token: HTMLElement, srcElement: HTMLElement) => void) => void;
}

export type Fallout = ProtectFallout &
  ResizeFallout &
  ClonedFallout &
  ClickFallout &
  StartFallout &
  MoveFallout &
  DropFallout & {
    off: () => void;
  };
