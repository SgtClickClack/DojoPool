# Dependency Cleanup Plan for DojoPool

## Current State Analysis

### UI Library Conflicts Identified:
1. **Material-UI (MUI)** - Primary UI library
   - `@mui/material`, `@mui/icons-material`, `@mui/lab`, `@mui/system`, `@mui/x-date-pickers`
   - `@emotion/react`, `@emotion/styled` (MUI dependencies)

2. **Ant Design** - Secondary UI library
   - `antd`, `@ant-design/charts`

3. **Headless UI** - In shared UI package
   - `@headlessui/react`

4. **Styled Components** - CSS-in-JS library
   - `styled-components`

5. **Tailwind CSS** - Utility-first CSS framework
   - `tailwindcss`, `@tailwindcss/forms`

### Data Fetching Libraries:
1. **React Query** - `@tanstack/react-query`
2. **SWR** - `swr`

### Chart Libraries:
1. **Chart.js** - `chart.js`, `react-chartjs-2`
2. **Recharts** - `recharts`
3. **Ant Design Charts** - `@ant-design/charts`

### Map Libraries:
1. **Mapbox** - `mapbox-gl`, `react-map-gl`
2. **MapLibre** - `maplibre-gl`, `@vis.gl/react-maplibre`
3. **Google Maps** - `@react-google-maps/api`

## Cleanup Strategy

### Phase 1: Standardize UI Library (Material-UI)
**Decision**: Keep Material-UI as the primary UI library
**Rationale**: 
- Most comprehensive component set
- Excellent TypeScript support
- Active development and community
- Already heavily used in the codebase

**Actions**:
1. Remove Ant Design dependencies
2. Migrate Ant Design components to Material-UI equivalents
3. Remove styled-components in favor of MUI's styling system
4. Keep Headless UI for complex components not available in MUI

### Phase 2: Standardize Data Fetching (React Query)
**Decision**: Keep React Query as the primary data fetching library
**Rationale**:
- More powerful caching and synchronization
- Better TypeScript support
- More active development

**Actions**:
1. Remove SWR dependency
2. Migrate SWR usage to React Query

### Phase 3: Standardize Chart Library (Recharts)
**Decision**: Keep Recharts as the primary chart library
**Rationale**:
- Better React integration
- More flexible and customizable
- Smaller bundle size

**Actions**:
1. Remove Chart.js and Ant Design Charts
2. Migrate all charts to Recharts

### Phase 4: Standardize Map Library (MapLibre)
**Decision**: Keep MapLibre as the primary map library
**Rationale**:
- Open source alternative to Mapbox
- No API key requirements
- Good performance

**Actions**:
1. Remove Mapbox and Google Maps dependencies
2. Migrate all map usage to MapLibre

## Implementation Plan

### Step 1: Create Migration Scripts
```bash
# Remove redundant dependencies
npm uninstall antd @ant-design/charts chart.js react-chartjs-2 swr mapbox-gl react-map-gl @react-google-maps/api styled-components
```

### Step 2: Update Package.json
Remove the following dependencies:
- `antd`
- `@ant-design/charts`
- `chart.js`
- `react-chartjs-2`
- `swr`
- `mapbox-gl`
- `react-map-gl`
- `@react-google-maps/api`
- `styled-components`
- `@types/styled-components`

### Step 3: Component Migration Guide

#### Ant Design → Material-UI
- `Button` → `Button`
- `Input` → `TextField`
- `Select` → `Select`
- `Table` → `Table`
- `Modal` → `Dialog`
- `Form` → `FormControl`
- `Card` → `Card`
- `Layout` → `Container`/`Grid`
- `Menu` → `Menu`
- `Dropdown` → `Menu`
- `Tooltip` → `Tooltip`
- `Popconfirm` → `Dialog` with confirmation
- `Notification` → `Snackbar`
- `Spin` → `CircularProgress`
- `Pagination` → `Pagination`
- `DatePicker` → `DatePicker` (MUI X)
- `TimePicker` → `TimePicker` (MUI X)

#### Chart.js → Recharts
- `Line` → `LineChart`
- `Bar` → `BarChart`
- `Pie` → `PieChart`
- `Doughnut` → `PieChart` with innerRadius
- `Radar` → `RadarChart`
- `Scatter` → `ScatterChart`

#### SWR → React Query
```typescript
// Before (SWR)
const { data, error, isLoading } = useSWR('/api/users', fetcher);

// After (React Query)
const { data, error, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: () => fetch('/api/users').then(res => res.json()),
});
```

### Step 4: Update Imports
Create a script to automatically update imports:

```typescript
// Import mapping for Ant Design → Material-UI
const importMappings = {
  'antd': '@mui/material',
  'antd/Button': '@mui/material/Button',
  'antd/Input': '@mui/material/TextField',
  'antd/Select': '@mui/material/Select',
  // ... more mappings
};
```

### Step 5: Update Styling
Replace styled-components with MUI's styling system:

```typescript
// Before (styled-components)
const StyledButton = styled.button`
  background-color: blue;
  color: white;
`;

// After (MUI)
const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
}));
```

## Benefits of Cleanup

### Bundle Size Reduction
- **Ant Design**: ~2.5MB → 0MB
- **Chart.js**: ~500KB → 0KB
- **SWR**: ~50KB → 0KB
- **Mapbox**: ~1MB → 0MB
- **Styled Components**: ~200KB → 0KB
- **Total Reduction**: ~4.25MB

### Performance Improvements
- Faster build times
- Reduced bundle size
- Better tree shaking
- Consistent styling system
- Unified component API

### Developer Experience
- Single UI library to learn
- Consistent design system
- Better TypeScript support
- Unified documentation
- Easier maintenance

## Migration Timeline

### Week 1: Preparation
- [ ] Audit all component usage
- [ ] Create migration scripts
- [ ] Set up testing environment

### Week 2: Core Components
- [ ] Migrate Button, Input, Select components
- [ ] Update form components
- [ ] Migrate layout components

### Week 3: Complex Components
- [ ] Migrate Table components
- [ ] Update Modal/Dialog components
- [ ] Migrate navigation components

### Week 4: Charts and Maps
- [ ] Migrate all charts to Recharts
- [ ] Update map components to MapLibre
- [ ] Remove old dependencies

### Week 5: Testing and Cleanup
- [ ] Test all migrated components
- [ ] Update documentation
- [ ] Remove unused code
- [ ] Performance testing

## Risk Mitigation

### Testing Strategy
1. **Unit Tests**: Ensure all components work correctly
2. **Visual Regression Tests**: Compare before/after screenshots
3. **Integration Tests**: Test complete user flows
4. **Performance Tests**: Measure bundle size and load times

### Rollback Plan
1. Keep old components in a separate branch
2. Maintain feature flags for critical components
3. Have automated tests to catch regressions
4. Document all changes for easy rollback

### Gradual Migration
1. Migrate one component at a time
2. Use feature flags to switch between old/new
3. Test thoroughly before removing old code
4. Keep both systems running during transition
