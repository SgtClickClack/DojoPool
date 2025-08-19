// Lightweight Chakra UI shim using MUI under the hood
// Goal: Provide minimal API compatibility for components used in this repo
// NOTE: This is an interim bridge to complete migration away from Chakra.

import React, { PropsWithChildren } from 'react';
import {
  Alert as MUIAlert,
  AlertProps as MUIAlertProps,
  Box as MUIBox,
  BoxProps as MUIBoxProps,
  Button as MUIButton,
  ButtonProps as MUIButtonProps,
  Chip as MUIChip,
  Container as MUIContainer,
  ContainerProps as MUIContainerProps,
  Stack as MUIStack,
  StackProps as MUIStackProps,
  Typography,
} from '@mui/material';

// Basic prop helpers
type Sx = MUIBoxProps['sx'];

// Box
export const Box: React.FC<MUIBoxProps> = (props) => <MUIBox {...props} />;

// Container (map Chakra's maxW to MUI's maxWidth and allow numeric/sx props like py)
export const Container: React.FC<
  PropsWithChildren<MUIContainerProps & { maxW?: string | number; py?: number; px?: number }>
> = ({ maxW, py, px, sx, ...rest }) => {
  const mapped: Partial<MUIContainerProps> = {};
  // Map common Chakra container sizes to MUI maxWidth values
  const sizeMap: Record<string, MUIContainerProps['maxWidth']> = {
    'container.sm': 'sm',
    'container.md': 'md',
    'container.lg': 'lg',
    'container.xl': 'xl',
    'container.2xl': false as unknown as any, // no direct 2xl; false => maxWidth disabled
  };
  if (typeof maxW === 'string') {
    mapped.maxWidth = sizeMap[maxW] ?? 'lg';
  }
  return (
    <MUIContainer
      {...mapped}
      {...rest}
      sx={{ py, px, ...(sx as Sx) }}
    />
  );
};

// Heading -> Typography with variant mapping
export const Heading: React.FC<
  PropsWithChildren<{
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    mb?: number;
    mt?: number;
    textAlign?: 'left' | 'center' | 'right';
    [key: string]: any;
  }>
> = ({ size = 'md', mb, mt, textAlign, children, ...rest }) => {
  const variantMap: Record<string, any> = {
    xs: 'subtitle2',
    sm: 'subtitle1',
    md: 'h6',
    lg: 'h5',
    xl: 'h4',
    '2xl': 'h3',
  };
  return (
    <Typography
      variant={variantMap[size] ?? 'h6'}
      sx={{ mb, mt, textAlign }}
      {...rest}
    >
      {children}
    </Typography>
  );
};

// Text -> Typography
export const Text: React.FC<
  PropsWithChildren<{
    fontSize?: string | number;
    fontWeight?: any;
    color?: string;
    mb?: number;
    mt?: number;
    [key: string]: any;
  }>
> = ({ fontSize, fontWeight, color, mb, mt, children, ...rest }) => (
  <Typography sx={{ fontSize, fontWeight, color, mb, mt }} {...rest}>
    {children}
  </Typography>
);

// VStack / HStack -> Stack
type AlignItems = 'stretch' | 'center' | 'flex-start' | 'flex-end' | 'baseline' | 'initial' | 'inherit';
export const VStack: React.FC<
  PropsWithChildren<{
    spacing?: number;
    align?: 'stretch' | 'start' | 'center' | 'end' | 'baseline';
    [key: string]: any;
  } & MUIStackProps>
> = ({ spacing, align = 'stretch', children, ...rest }) => (
  <MUIStack
    direction="column"
    spacing={spacing}
    alignItems={align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : (align as AlignItems)}
    {...rest}
  >
    {children}
  </MUIStack>
);

export const HStack: React.FC<
  PropsWithChildren<{
    spacing?: number;
    justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
    [key: string]: any;
  } & MUIStackProps>
> = ({ spacing, justify, children, ...rest }) => (
  <MUIStack
    direction="row"
    spacing={spacing}
    justifyContent={
      justify === 'start'
        ? 'flex-start'
        : justify === 'end'
        ? 'flex-end'
        : (justify as any)
    }
    {...rest}
  >
    {children}
  </MUIStack>
);

// Button -> MUI Button (map colorScheme to color)
export const Button: React.FC<MUIButtonProps & { colorScheme?: MUIButtonProps['color'] }> = ({
  colorScheme,
  ...rest
}) => <MUIButton color={colorScheme as any} variant={rest.variant ?? 'contained'} {...rest} />;

// Alert -> MUI Alert (map status to severity, borderRadius to sx)
export const Alert: React.FC<
  PropsWithChildren<
    Partial<MUIAlertProps> & {
      status?: 'info' | 'warning' | 'success' | 'error';
      borderRadius?: number | string;
    }
  >
> = ({ status = 'info', borderRadius, children, sx, ...rest }) => (
  <MUIAlert severity={status as any} sx={{ borderRadius, ...(sx as Sx) }} {...rest}>
    {children}
  </MUIAlert>
);

// AlertIcon placeholder (MUI Alert renders an icon by default; keep as no-op to satisfy usage)
export const AlertIcon: React.FC = () => null;

// Badge -> use Chip to render a label-like badge
export const Badge: React.FC<
  PropsWithChildren<{ colorScheme?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'; mt?: number; sx?: Sx }>
> = ({ colorScheme = 'default', children, mt, sx }) => {
  const colorMap: Record<string, any> = {
    default: 'default',
    blue: 'primary',
    green: 'success',
    red: 'error',
    orange: 'warning',
    teal: 'info',
    primary: 'primary',
    secondary: 'secondary',
    error: 'error',
    info: 'info',
    success: 'success',
    warning: 'warning',
  };
  return <MUIChip label={children as any} color={colorMap[colorScheme] ?? 'default'} size="small" sx={{ mt, ...(sx as Sx) }} />;
};

// Grid / GridItem: provide simple CSS grid wrappers for basic layout use
export const Grid: React.FC<
  PropsWithChildren<{ templateColumns?: string; gap?: number | string; [key: string]: any }>
> = ({ templateColumns = 'repeat(1, 1fr)', gap = 0, children, sx, ...rest }) => (
  <MUIBox display="grid" gridTemplateColumns={templateColumns} gap={gap} sx={sx as Sx} {...rest}>
    {children}
  </MUIBox>
);

export const GridItem: React.FC<PropsWithChildren<{ [key: string]: any }>> = ({ children, ...rest }) => (
  <MUIBox {...rest}>{children}</MUIBox>
);

// Tabs placeholders: pass-through containers to maintain structure; state handled externally where used
export const Tabs: React.FC<
  PropsWithChildren<{ index?: number; onChange?: (index: number) => void; variant?: string; [key: string]: any }>
> = ({ children }) => <>{children}</>;

export const TabList: React.FC<PropsWithChildren<{}>> = ({ children }) => <>{children}</>;
export const TabsList: React.FC<PropsWithChildren<{}>> = ({ children }) => <>{children}</>; // alias used in some files
export const TabsPanels: React.FC<PropsWithChildren<{}>> = ({ children }) => <>{children}</>;
export const TabPanels: React.FC<PropsWithChildren<{}>> = ({ children }) => <>{children}</>;
export const TabPanel: React.FC<PropsWithChildren<{}>> = ({ children }) => <>{children}</>;
export const Tab: React.FC<PropsWithChildren<{}>> = ({ children }) => <>{children}</>;

// Center -> Box with flex centering
export const Center: React.FC<PropsWithChildren<MUIBoxProps>> = ({ children, sx, ...rest }) => (
  <MUIBox display="flex" alignItems="center" justifyContent="center" sx={sx as Sx} {...rest}>
    {children}
  </MUIBox>
);

// useToast placeholder: returns a function that logs, shape-compatible with Chakra's usage in this repo
export const useToast = () => {
  return (options: { title?: string; description?: string; status?: 'info' | 'warning' | 'success' | 'error'; duration?: number; isClosable?: boolean }) => {
    if (options?.status === 'error') {
      console.error(`[toast:${options.status}] ${options.title ?? ''} - ${options.description ?? ''}`);
    } else {
      console.log(`[toast:${options?.status ?? 'info'}] ${options?.title ?? ''} - ${options?.description ?? ''}`);
    }
  };
};

// ChakraProvider stub (in case tests or legacy code reference it) - no-op wrapper
export const ChakraProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => <>{children}</>;

// Utilities occasionally referenced
export const useColorModeValue = <T,>(light: T, dark: T): T => light; // simple stub

export default {};
