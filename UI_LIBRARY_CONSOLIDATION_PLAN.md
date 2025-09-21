# UI Library Consolidation Plan

## Current State Analysis

### Multiple UI Component Libraries (High Priority)
- **Material-UI**: @mui/material, @mui/icons-material, @mui/lab, @mui/system, @mui/x-date-pickers
- **Ant Design**: antd, @ant-design/charts
- **Styled Components**: styled-components
- **Emotion**: @emotion/react, @emotion/styled

**Impact**: Bundle size increase, inconsistent design system, maintenance overhead

### Multiple Chart Libraries (Medium Priority)
- **Chart.js**: chart.js, react-chartjs-2
- **Recharts**: recharts
- **Ant Design Charts**: @ant-design/charts

**Impact**: Redundant functionality, larger bundle size

### Multiple Animation Libraries (Medium Priority)
- **Framer Motion**: framer-motion
- **Lottie Web**: lottie-web

**Impact**: Overlapping animation capabilities

### Multiple Map Libraries (High Priority)
- **Mapbox GL**: mapbox-gl, react-map-gl
- **Maplibre GL**: maplibre-gl, @vis.gl/react-maplibre
- **React Google Maps**: @react-google-maps/api

**Impact**: Conflicting map implementations, larger bundle size

## Consolidation Strategy

### Phase 1: UI Component Library Consolidation (Immediate)
**Recommendation**: Standardize on Material-UI as primary component library

**Actions**:
1. Audit Ant Design usage and migrate to Material-UI equivalents
2. Remove Ant Design dependencies
3. Consolidate styling approach using Material-UI's theming system
4. Remove styled-components in favor of Material-UI's sx prop and styled components

**Estimated Bundle Size Reduction**: 200-300KB

### Phase 2: Chart Library Consolidation (Short-term)
**Recommendation**: Standardize on Recharts (lighter, more React-friendly)

**Actions**:
1. Audit Chart.js usage and migrate to Recharts
2. Remove Chart.js dependencies
3. Remove Ant Design Charts in favor of Recharts

**Estimated Bundle Size Reduction**: 150-200KB

### Phase 3: Map Library Consolidation (Short-term)
**Recommendation**: Standardize on Mapbox GL (more features, better performance)

**Actions**:
1. Audit Maplibre GL and Google Maps usage
2. Migrate to Mapbox GL implementations
3. Remove redundant map libraries

**Estimated Bundle Size Reduction**: 100-150KB

### Phase 4: Animation Library Consolidation (Medium-term)
**Recommendation**: Keep Framer Motion, evaluate Lottie usage

**Actions**:
1. Audit Lottie usage - keep only if essential for specific animations
2. Standardize on Framer Motion for most animations

**Estimated Bundle Size Reduction**: 50-100KB (if Lottie removed)

## Implementation Plan

### Step 1: Create Migration Scripts
- Generate component mapping from Ant Design to Material-UI
- Create chart migration utilities
- Develop map component consolidation tools

### Step 2: Gradual Migration
- Start with least-used components
- Migrate one component library at a time
- Maintain backward compatibility during transition

### Step 3: Bundle Analysis
- Implement bundle analyzer to track size changes
- Set up automated bundle size monitoring
- Create alerts for size regressions

### Step 4: Testing & Validation
- Ensure visual consistency after migration
- Performance testing for bundle size impact
- Cross-browser compatibility testing

## Expected Results

### Bundle Size Reduction
- **Total Estimated Reduction**: 500-750KB
- **Percentage Reduction**: 15-25% of current bundle size

### Benefits
- Consistent design system
- Reduced maintenance overhead
- Better performance
- Simplified dependency management
- Improved developer experience

### Risks & Mitigation
- **Risk**: Breaking changes during migration
- **Mitigation**: Gradual migration with comprehensive testing

- **Risk**: Loss of specific functionality
- **Mitigation**: Thorough audit before removal, create custom components if needed

## Next Steps

1. **Immediate**: Start with Ant Design to Material-UI migration
2. **Week 1**: Complete UI component library consolidation
3. **Week 2**: Chart library consolidation
4. **Week 3**: Map library consolidation
5. **Week 4**: Animation library evaluation and final optimization

## Monitoring & Metrics

- Bundle size tracking
- Performance metrics
- Developer productivity metrics
- User experience metrics
