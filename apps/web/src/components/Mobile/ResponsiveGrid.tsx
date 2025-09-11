import { useDevice, useOrientation } from '@/hooks/useDevice';
import { Grid, useTheme } from '@mui/material';
import React from 'react';

interface ResponsiveGridProps {
  children: React.ReactNode;
  spacing?: number;
  container?: boolean;
  item?: boolean;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  mobileColumns?: number;
  tabletColumns?: number;
  desktopColumns?: number;
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  spacing,
  container = true,
  item = false,
  xs,
  sm,
  md,
  lg,
  xl,
  mobileColumns = 12,
  tabletColumns = 12,
  desktopColumns = 12,
  ...props
}) => {
  const theme = useTheme();
  const { isMobile, isTablet, isDesktop } = useDevice();
  const orientation = useOrientation();

  // Auto-calculate responsive breakpoints based on device type
  const getResponsiveProps = () => {
    if (isMobile) {
      // Mobile: single column or specified mobile columns
      return {
        xs: mobileColumns,
        spacing: spacing !== undefined ? spacing : 1,
      };
    } else if (isTablet) {
      // Tablet: 2-3 columns depending on orientation
      const tabletCols = orientation === 'portrait' ? 2 : 3;
      return {
        xs: tabletColumns === 12 ? tabletCols : tabletColumns,
        sm: tabletColumns,
        spacing: spacing !== undefined ? spacing : 2,
      };
    } else if (isDesktop) {
      // Desktop: full responsive grid
      return {
        xs: xs || 12,
        sm: sm || 6,
        md: md || 4,
        lg: lg || 3,
        xl: xl || 3,
        spacing: spacing !== undefined ? spacing : 3,
      };
    }

    // Fallback
    return {
      xs: xs || 12,
      sm: sm || 6,
      md: md || 4,
      lg: lg || 3,
      xl: xl || 3,
      spacing: spacing !== undefined ? spacing : 2,
    };
  };

  const responsiveProps = getResponsiveProps();

  if (container) {
    return (
      <Grid
        container
        spacing={responsiveProps.spacing}
        {...props}
        sx={{
          width: '100%',
          margin: 0,
          ...props.sx,
        }}
      >
        {React.Children.map(children, (child, index) => (
          <Grid
            item
            key={index}
            xs={responsiveProps.xs}
            sm={responsiveProps.sm}
            md={responsiveProps.md}
            lg={responsiveProps.lg}
            xl={responsiveProps.xl}
          >
            {child}
          </Grid>
        ))}
      </Grid>
    );
  }

  if (item) {
    return (
      <Grid
        item
        xs={responsiveProps.xs}
        sm={responsiveProps.sm}
        md={responsiveProps.md}
        lg={responsiveProps.lg}
        xl={responsiveProps.xl}
        {...props}
      >
        {children}
      </Grid>
    );
  }

  // If neither container nor item, just return children
  return <>{children}</>;
};

// Pre-configured responsive grid components
export const MobileGrid: React.FC<
  Omit<
    ResponsiveGridProps,
    'mobileColumns' | 'tabletColumns' | 'desktopColumns'
  >
> = (props) => (
  <ResponsiveGrid
    {...props}
    mobileColumns={1}
    tabletColumns={2}
    desktopColumns={3}
  />
);

export const CardGrid: React.FC<
  Omit<
    ResponsiveGridProps,
    'mobileColumns' | 'tabletColumns' | 'desktopColumns'
  >
> = (props) => (
  <ResponsiveGrid
    {...props}
    mobileColumns={1}
    tabletColumns={2}
    desktopColumns={4}
  />
);

export const ListGrid: React.FC<
  Omit<
    ResponsiveGridProps,
    'mobileColumns' | 'tabletColumns' | 'desktopColumns'
  >
> = (props) => (
  <ResponsiveGrid
    {...props}
    mobileColumns={1}
    tabletColumns={1}
    desktopColumns={2}
  />
);

export default ResponsiveGrid;
