import { ComponentType } from 'react';
import { FixedSizeList as OriginalFixedSizeList, ListChildComponentProps as OriginalListChildComponentProps } from 'react-window';

declare module 'react-window' {
  export interface ListChildComponentProps<T = any> extends Omit<OriginalListChildComponentProps, 'data'> {
    data: T;
  }

  export interface FixedSizeListProps<T = any> extends React.ComponentProps<typeof OriginalFixedSizeList> {
    itemData: T;
    children: ComponentType<ListChildComponentProps<T>>;
  }

  export class FixedSizeList<T = any> extends OriginalFixedSizeList {
    props: FixedSizeListProps<T>;
  }
}

declare module 'react-virtualized-auto-sizer' {
  import * as React from 'react';

  export interface Size {
    height: number;
    width: number;
  }

  export interface AutoSizerProps {
    children: (size: Size) => React.ReactNode;
    defaultHeight?: number;
    defaultWidth?: number;
    disableHeight?: boolean;
    disableWidth?: boolean;
    onResize?: (size: Size) => void;
    style?: React.CSSProperties;
  }

  export default class AutoSizer extends React.Component<AutoSizerProps> {}
} 