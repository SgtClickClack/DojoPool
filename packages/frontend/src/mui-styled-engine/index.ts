import createStyled from '@emotion/styled';
import { keyframes, css, ThemeContext } from '@emotion/react';
import { EmotionCache } from '@emotion/cache';
import * as React from 'react';

// Create a theme context
const ThemeContext = React.createContext({});

const styled = createStyled;

interface MUIStyledCommonProps {
  className?: string;
  component?: React.ElementType;
  theme?: any;
}

export interface StyledEngineOptions {
  defaultTheme?: object;
  injectFirst?: boolean;
  cache?: EmotionCache;
}

export interface StyledComponentProps<Theme extends object = {}> extends MUIStyledCommonProps {
  as?: React.ElementType;
  theme?: Theme;
}

export interface CreateStyledComponent<ComponentProps extends {}> {
  <AdditionalProps extends {} = {}>(
    styles: any,
    options?: Omit<any, keyof ComponentProps>,
  ): React.ComponentType<ComponentProps & AdditionalProps>;
  (template: TemplateStringsArray, ...args: any[]): React.ComponentType<ComponentProps>;
}

export interface MUIStyledComponent<Props extends {}> extends React.ComponentType<Props> {
  withComponent<Tag extends keyof JSX.IntrinsicElements>(
    tag: Tag,
  ): CreateStyledComponent<JSX.IntrinsicElements[Tag]>;
}

export type CreateMUIStyled = <Tag extends keyof JSX.IntrinsicElements | React.ComponentType<any>>(
  tag: Tag,
  options?: any,
) => CreateStyledComponent<
  Tag extends keyof JSX.IntrinsicElements
    ? JSX.IntrinsicElements[Tag]
    : Tag extends React.ComponentType<infer Props>
    ? Props
    : {}
>;

const muiStyled = styled as CreateMUIStyled;

export default muiStyled;

export const internal_processStyles = () => null;

export const StyledEngineProvider = ({ children }: { children?: React.ReactNode }) => {
  return children;
};

export const getThemeProps = (params: {
  theme: any;
  name: string;
  props?: any;
}) => {
  const { theme, name, props } = params;
  if (!theme || !name || !theme.components || !theme.components[name] || !theme.components[name].defaultProps) {
    return props || {};
  }
  return { ...theme.components[name].defaultProps, ...props };
};

export const useThemeProps = <Props extends { theme?: any }>({ props, name }: { props: Props; name: string }) => {
  return props;
};

export const rootShouldForwardProp = (prop: string) => !prop.startsWith('$') && prop !== 'theme' && prop !== 'as';
export const slotShouldForwardProp = rootShouldForwardProp;
export const prepareStyles = () => '';

// Export theme context for MUI
export { ThemeContext };

// Type definitions
export type StyleFunction<Props> = (props: Props) => any;

export interface StyledOptions<Props> {
  name?: string;
  slot?: string;
  overridesResolver?: (props: any, styles: Record<string, any>) => any;
  skipVariantsResolver?: boolean;
  skipSx?: boolean;
} 