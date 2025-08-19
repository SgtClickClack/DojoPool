declare module 'test-utils' {
  import { type ReactElement } from 'react';
  import { type render, type RenderOptions } from '@testing-library/react';
  import { ChakraProvider } from '@chakra-ui/react';

  interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    chakraProviderProps?: any;
  }

  function customRender(
    ui: ReactElement,
    options?: CustomRenderOptions
  ): ReturnType<typeof render>;

  export { customRender as render };
  export * from '@testing-library/react';
}
