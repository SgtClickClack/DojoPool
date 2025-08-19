declare module 'react-dom/server' {
  import { type ReactElement } from 'react';

  export function renderToString(element: ReactElement): string;
  export function renderToStaticMarkup(element: ReactElement): string;

  export default {
    renderToString,
    renderToStaticMarkup,
  };
}
