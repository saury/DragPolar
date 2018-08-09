// todo: add option to decide if using get offsetWidth/Height or getBoundingClientRect().width/height when cloning the srcNode
// todo: find solution to replace emitter
/** modules involved */
import emitter from 'contra/emitter'; // event emitter

import { DragPolarOptions } from './DragPolarOptions'; // interface of the options this plugin can take
import {
  $$,
  cloneAndAppend,
  cordLength,
  cordOverLoad,
  dealStyle,
  getScroll,
  getTargetInfo,
  handleEvt,
  isChildNode,
  XEvent,
} from './helper';
import { Fallout } from './Fallout';

export class DragPolar {
  /**
   * function to detect if two rect area touched each other
   * @public
   * @param {any} rectA
   * @param {any} rectB
   * @returns number
   */
  public static detectTouch(rectA: HTMLElement, rectB: HTMLElement): boolean {
    const aInfo = getTargetInfo(rectA);
    const bInfo = getTargetInfo(rectB);
    /**
     * If two area touched each other,
     * the absolute value of their center point's cordinate_X minus each other
     * should be shorter than sum of half of their width.
     * And also their height should be under this fomular
     */
    return (
      Math.abs(aInfo.target_X - bInfo.target_X) <= aInfo.target_W / 2 + bInfo.target_W / 2 &&
      Math.abs(aInfo.target_Y - bInfo.target_Y) <= aInfo.target_H / 2 + bInfo.target_H / 2
    );
  }

  // calc the distance between two nodes' center cord
  public static distanceBetween(node1: [number, number] | HTMLElement, node2: [number, number] | HTMLElement): number {
    return cordLength(cordOverLoad(node1), cordOverLoad(node2));
  }

  /**
   * expose the help fn as a static to this plugin
   */
  public static getTargetInfo(dom: HTMLElement) {
    return getTargetInfo(dom);
  }

  /**
   * expose function to control items move to the assigned area manually
   *
   * @static
   * @param {HTMLElement} ele
   * @param {([number, number] | HTMLElement)} destination
   * @param {number} [duration=0]
   * @param {Function} [moveEndCallback]
   * @param {boolean} [addWrap=false]
   * @param {Function} [addWrapCallback]
   * @returns {Function} function to remove evt listner
   *
   * @memberOf DragPolar
   */
  public static moveItem(
    ele: HTMLElement,
    destination: [number, number] | HTMLElement,
    duration: number = 0,
    moveEndCallback?: (e?: any) => void /* callback after transition */,
    addWrap?: boolean,
    addWrapCallback?: () => void,
  ): void {
    const target = addWrap ? cloneAndAppend(ele, addWrapCallback) : ele;
    const desCor = cordOverLoad(destination, target);

    dealStyle(target, {
      '-webkit-transition': `-webkit-transform ${duration}ms linear`,
      transition: `transform ${duration}ms linear`,
    });

    // execute in next tick to make sure transform works
    setTimeout(() => {
      dealStyle(target, {
        '-webkit-transform': `translate3d(${desCor[0]}px, ${desCor[1]}px, 0)`,
        transform: `translate3d(${desCor[0]}px, ${desCor[1]}px, 0)`,
      });
    });

    duration
      ? handleEvt(target, 'add', 'transitionend', function _moveEndCallback(e) {
          if (e.target !== target) return;
          moveEndCallback && moveEndCallback(e);
          // make sure the move end evt executes only once
          handleEvt(target, 'remove', 'transitionend', _moveEndCallback);
        })
      : moveEndCallback && moveEndCallback();
  }

  // event emitter
  public fallout: Fallout;

  /**
   * Creates an instance of DragPolar.
   * @param {DragPolarOptions} [options={} as DragPolarOptions]
   */
  constructor(private options: DragPolarOptions = {} as DragPolarOptions) {
    // options which can be overload
    const defaultOpt: DragPolarOptions = {
      /* default options: */
      dragItems: '.dp-drag-item',
      dragTokenClass: 'dp-drag-token',
      hasPhantom: false,
      moveTolerant: 0,
      phantomClass: 'dp-phantom',
      sandbox: document.documentElement,
      context: document.body,
      sandboxPad: [0, 0, 0, 0],
    };
    // overload
    this.options = { ...defaultOpt, ...options };
  }

  /**
   * KICK START
   * @public
   */
  public init() {
    // call the emitter
    this.fallout = emitter();

    const settings = this.options;

    // save the event status
    // tslint:disable-next-line:one-variable-per-declaration
    let clickOnItem,
      dragToken,
      ele,
      isDragStart: boolean,
      hasMoved,
      // drag start cordinator
      fingerX,
      fingerY,
      // variables for the purpose to get the bound of the acitved moving area
      maxTranslateX,
      maxTranslateY,
      minTranslateX,
      minTranslateY;
    // evtRemoveList = [], // event need to remove

    // Test via a getter in the options object to see
    // if the passive property is accessed
    let evtOption: boolean | AddEventListenerOptions = false;
    try {
      const opts = Object.defineProperty({}, 'passive', {
        get() {
          evtOption = {
            capture: false,
            passive: false,
          };
        },
      });
      window.addEventListener('test', null, opts);
      window.removeEventListener('test', null, opts);
    } catch (e) {
      throw e;
    }

    const emitMiddleWare = {
      end: (e: XEvent) => this.fallout.emit('_dp-end', e),
      move: (e: XEvent) => this.fallout.emit('_dp-move', e),
      resize: (e: XEvent) => this.fallout.emit('_dp-resize', e),
      start: (e: XEvent) => this.fallout.emit('_dp-start', e),
    };

    // resize evt emitter
    const resizeEmitter = () => {
      if (!isDragStart) return;
      this.fallout.emit('resize', dragToken, ele);
      isDragStart = false;
    };

    const touchStart = (e: XEvent) => {
      // prevent the right click or wheel click
      if ((e as MouseEvent).button && (e as MouseEvent).button > 0) return;
      // limit that evt handler can only be triggered by one touch point
      if ((e as TouchEvent).targetTouches === undefined || (e as TouchEvent).targetTouches.length === 1) {
        // check if the click target is preseted drag item or its childNodes
        const temp = $$(settings.dragItems).filter(
          (item) => item === e.target || isChildNode(e.target as Element, item),
        )[0];

        // return if not touching on the drag item or it contains a disabled class
        if (!temp || (temp && (temp.classList.contains('disabled') || temp.classList.contains('disabled-forever')))) {
          return;
        }
        ele = temp;

        e.preventDefault();
        e.stopImmediatePropagation();

        // duplicate the drag item as a token and emit the cloned evt
        dragToken = cloneAndAppend(
          ele,
          (token) => {
            token.classList.add(settings.dragTokenClass);
            this.fallout.emit('cloned', token, ele);
          },
          settings.context,
        );

        // disable all the drag items to prevent combo operation
        $$(settings.dragItems).forEach((item: Element) => {
          item.classList.add('disabled');
        });

        // phantom of the drag item
        if (settings.hasPhantom) {
          ele.classList.add(settings.phantomClass);
        } else {
          ele.style.visibility = 'hidden';
        }

        const finger = (e as TouchEvent).touches !== undefined ? (e as TouchEvent).touches[0] : (e as MouseEvent);
        // cords of the touch cursor
        fingerX = finger.clientX + getScroll('scrollLeft', 'pageXOffset');
        fingerY = finger.clientY + getScroll('scrollTop', 'pageYOffset');
        clickOnItem = true;

        isDragStart = true;
        hasMoved = false;

        const eleInfo = getTargetInfo(ele);

        this.fallout.emit('start', dragToken, ele, {
          fingerX,
          fingerY,
          startX: eleInfo.target_X,
          startY: eleInfo.target_Y,
        });

        // set border of the dragging area
        setBorder();
      }
    };

    const touchMove = (e: XEvent) => {
      if (!isDragStart) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      // prevent the right click or wheel click
      if ((e as MouseEvent).button && (e as MouseEvent).button > 0) return;
      if ((e as TouchEvent).targetTouches === undefined || (e as TouchEvent).targetTouches.length === 1) {
        const finger = (e as TouchEvent).touches !== undefined ? (e as TouchEvent).touches[0] : (e as MouseEvent);
        const _translateX = finger.clientX + getScroll('scrollLeft', 'pageXOffset') - fingerX;
        const _translateY = finger.clientY + getScroll('scrollTop', 'pageYOffset') - fingerY;

        // info that the drag item hit the edge of the sandbox
        const edge = {
          bottom: false,
          left: false,
          right: false,
          top: false,
        };

        const _moveItem = (x: number, y: number) => {
          // prevent that the clickOnItem val been changed
          if (!hasMoved && Math.abs(x) <= settings.moveTolerant && Math.abs(y) <= settings.moveTolerant) {
            return;
          }
          // move the item, then the click evt won't trigger any more
          clickOnItem = false;
          hasMoved = true;

          const keepTranslateValid = (translateValue: number, limit: number, direction: string, greater?: boolean) => {
            const condition = greater ? translateValue > limit : translateValue < limit;
            if (condition) {
              translateValue = limit;
              edge[direction] = true;
            } else {
              edge[direction] = false;
            }
            return translateValue;
          };

          // detect border and edge info overload
          x = keepTranslateValid(x, minTranslateX, 'left');
          x = keepTranslateValid(x, maxTranslateX, 'right', true);
          y = keepTranslateValid(y, minTranslateY, 'top');
          y = keepTranslateValid(y, maxTranslateY, 'bottom', true);

          dealStyle(dragToken, {
            '-webkit-transform': `translate3d(${x}px, ${y}px, 0)`,
            transform: `translate3d(${x}px, ${y}px, 0)`,
          });

          // callback
          this.fallout.emit('move', dragToken, ele, {
            edge,
            translateX: _translateX,
            translateY: _translateY,
          });
        };

        _moveItem(_translateX, _translateY);
      }
    };

    const touchEnd = () => {
      if (!isDragStart) return;
      clickOnItem ? this.fallout.emit('click', dragToken, ele) : this.fallout.emit('drop', dragToken, ele);

      isDragStart = false;
    };

    this.fallout.on('_dp-resize', resizeEmitter);
    this.fallout.on('_dp-start', touchStart);
    this.fallout.on('_dp-move', touchMove);
    this.fallout.on('_dp-end', touchEnd);

    /**
     * minimum or maximum of translateX, translateY value of drag element can be dragged to:
     */
    const setBorder = () => {
      const eleInfo = getTargetInfo(ele);
      const sandBoxInfo = getTargetInfo(settings.sandbox);
      // (sandbox's left border to client left border) - (element's left border to sandbox's left border ) + (preset padding value)
      minTranslateX = sandBoxInfo.target_L - eleInfo.target_L + settings.sandboxPad[3];
      maxTranslateX =
        minTranslateX + sandBoxInfo.target_W - eleInfo.target_W - settings.sandboxPad[1] - settings.sandboxPad[3];

      minTranslateY = sandBoxInfo.target_T - eleInfo.target_T + settings.sandboxPad[0];
      maxTranslateY =
        minTranslateY + sandBoxInfo.target_H - eleInfo.target_H - settings.sandboxPad[2] - settings.sandboxPad[0];
    };

    // add event to kick off the drag function
    handleEvt(document, 'add', 'start', emitMiddleWare.start, evtOption);
    handleEvt(document, 'add', 'move', emitMiddleWare.move, evtOption);
    handleEvt(document, 'add', 'end', emitMiddleWare.end);
    handleEvt(window, 'add', 'resize', emitMiddleWare.resize); // force end while resizing the window
  }

  /**
   * destroy fn
   * @public
   */
  public destroy() {
    this.fallout && this.fallout.off();
  }

  /**
   * refresh fn
   * @public
   */
  public refresh() {
    this.destroy();
    this.init();
  }
}
