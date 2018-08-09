export interface DragPolarOptions {
  dragItems?: string;
  hasPhantom?: boolean; // the drag item'll leave a phantom shadow at its place
  phantomClass?: string;
  dragTokenClass?: string;
  sandbox?: HTMLElement; // sandbox restrict the drag moving area
  sandboxPad?: [number, number, number, number]; // padding of the sand box: this shall be an work round to solve the edge rendering issue in firefox on win platform
  moveTolerant?: number; // fault-tolerant option for distinguish click from touchmove
  context?: HTMLElement;
  [propName: string]: any;
}
