////////////////////
// help functions //
////////////////////
/*easy dom selector*/
const $$ = (selector: string, context?: HTMLElement): Element[] =>
  [].slice.call((context || document).querySelectorAll(selector));

const isChildNode = (ele: Element, parentEle: Element): boolean => {
  while (ele !== undefined && ele !== null && ele.tagName.toUpperCase() !== 'BODY') {
    if (ele === parentEle) {
      return true;
    }
    ele = ele.parentNode as Element;
  }
  return false;
};

/**
 * Write or read css style
 * obj accepted only when
 */
const dealStyle = (target: HTMLElement, rule: {}) => {
  // if (typeof rule === 'string') {
  //   return parseInt(getComputedStyle(target)[rule], 10);
  // }
  for (const prop in rule) {
    if ((rule as object).hasOwnProperty(prop)) {
      target.style[prop] = rule[prop];
    }
  }
  return target;
};

const cordOverLoad = (eleOrCord: [number, number] | HTMLElement, ref?: HTMLElement): [number, number] => {
  if (Array.isArray(eleOrCord)) return eleOrCord;
  const info = getTargetInfo(eleOrCord);
  const refInfo = ref ? getTargetInfo(ref) : { target_X: 0, target_Y: 0 };
  return [info.target_X - refInfo.target_X, info.target_Y - refInfo.target_Y];
};

/**
 * Get the length between two cordinators
 * @param  {[Array]} cordStart [x1, y1]
 * @param  {[Array]} cordEnd   [x2, y2]
 * @return {[number]}         [length between cords]
 */
const cordLength = (cordStart: [number, number], cordEnd: [number, number]) =>
  Math.sqrt(Math.pow(cordStart[0] - cordEnd[0], 2) + Math.pow(cordStart[1] - cordEnd[1], 2));

type Operation = 'add' | 'remove';
type EventType = 'start' | 'move' | 'end' | 'resize' | 'scroll' | 'transitionend';
type XEvent = MouseEvent | TouchEvent | PointerEvent;

const evtList: object = (() => {
  // tslint:disable-next-line:one-variable-per-declaration
  const common = {
      end: ['touchend', 'touchcancel', 'mouseup'],
      move: ['touchmove', 'mousemove'],
      start: ['touchstart', 'mousedown'],
    },
    pointers = {
      end: ['pointerup'],
      move: ['pointermove'],
      start: ['pointerdown'],
    },
    msPointers = {
      end: ['MSPointerUp'],
      move: ['MSPointerMove'],
      start: ['MSPointerDown'],
    };
  const _evtList = {
    resize: ['resize'],
    scroll: ['scroll'],
    transitionend: ['webkitTransitionEnd', 'transitionend'],
  };
  let result;
  if (window.navigator.pointerEnabled) {
    result = { ..._evtList, ...pointers };
  } else if (window.navigator.msPointerEnabled) {
    result = { ..._evtList, ...msPointers };
  } else {
    result = { ..._evtList, ...common };
  }
  return result;
})();

/**
 * add or remove event listener
 * @param {HTMLElement | Window | Document} ele
 * @param {Operation} operation
 * @param {EventType} eventType
 * @param {Function} handler
 * @param {any} [capture]
 */
const handleEvt = (
  target: HTMLElement | Window | Document,
  operation: Operation,
  eventType: EventType,
  handler: (e: any) => any,
  capture?: any,
) => {
  switch (operation) {
    case 'add':
      evtList[eventType].forEach((type) => target.addEventListener(type, handler as EventListener, capture || false));
      break;
    case 'remove':
      evtList[eventType].forEach((type) => target.removeEventListener(type, handler as EventListener));
      break;
  }
};

/**
 * Get the element's positon information referring to the document
 * @param  {[HTMLElement]} dom [target element]
 * @return {[Object]}             [ return an object contains top and left value]
 */
const getTargetInfo = (dom: HTMLElement) => {
  const rectInfo = dom.getBoundingClientRect();
  return {
    target_H: dom.offsetHeight,
    // target_H: rectInfo.height,
    target_L: rectInfo.left + document.body.scrollLeft,
    target_T: rectInfo.top + document.body.scrollTop,
    target_W: dom.offsetWidth,
    // target_W: rectInfo.width,
    target_X: rectInfo.left + document.body.scrollLeft + rectInfo.width / 2,
    target_Y: rectInfo.top + document.body.scrollTop + rectInfo.height / 2,
  };
};

/**
 * create a new div element from a html ement node and append to the specified cotext
 *
 * @param {HTMLElement} fett
 * @param {Function} [callback]
 * @param {HTMLElement} [context=document.body]
 * @returns {HTMLElement}
 */
const cloneAndAppend = (fett: HTMLElement, callback?: (el: any) => any, context?: HTMLElement): HTMLElement => {
  const trooper = document.createElement('div');
  const targetInfo = getTargetInfo(fett);
  context = context || document.body;
  trooper.appendChild(fett.cloneNode(true));
  dealStyle(trooper, {
    height: `${targetInfo.target_H}px`,
    left: `${targetInfo.target_X - targetInfo.target_W / 2}px`,
    margin: 0,
    position: 'absolute',
    top: `${targetInfo.target_Y - targetInfo.target_H / 2}px`,
    width: `${targetInfo.target_W}px`,
    zIndex: 99,
  });
  context.appendChild(trooper);
  if (callback) callback(trooper);
  return trooper;
};

type ScrollProp = 'scrollLeft' | 'scrollTop';
type OffsetProp = 'pageXOffset' | 'pageYOffset';

/**
 * Get the scroll offset value
 *
 * @param {string} scrollProp
 * @param {string} offsetProp
 * @returns {number}
 */
const getScroll = (scrollProp: ScrollProp, offsetProp: OffsetProp): number => {
  if (typeof window[offsetProp] !== 'undefined') {
    return window[offsetProp];
  }
  if (document.documentElement.clientHeight) {
    return document.documentElement[scrollProp];
  }
  return document.body[scrollProp];
};

export {
  $$,
  isChildNode,
  dealStyle,
  cordOverLoad,
  cordLength,
  handleEvt,
  getTargetInfo,
  cloneAndAppend,
  getScroll,
  XEvent,
};
