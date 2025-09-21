#!/usr/bin/env node

/**
 * Dependency Cleanup Migration Script
 * 
 * This script helps migrate from multiple UI libraries to a standardized set
 * of dependencies for the DojoPool project.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface MigrationRule {
  from: string;
  to: string;
  type: 'import' | 'component' | 'dependency';
}

class DependencyMigrator {
  private projectRoot: string;
  private migrationRules: MigrationRule[] = [];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.initializeMigrationRules();
  }

  private initializeMigrationRules() {
    // Import migration rules
    this.migrationRules = [
      // Ant Design → Material-UI
      { from: 'antd', to: '@mui/material', type: 'import' },
      { from: 'antd/Button', to: '@mui/material/Button', type: 'import' },
      { from: 'antd/Input', to: '@mui/material/TextField', type: 'import' },
      { from: 'antd/Select', to: '@mui/material/Select', type: 'import' },
      { from: 'antd/Table', to: '@mui/material/Table', type: 'import' },
      { from: 'antd/Modal', to: '@mui/material/Dialog', type: 'import' },
      { from: 'antd/Form', to: '@mui/material/FormControl', type: 'import' },
      { from: 'antd/Card', to: '@mui/material/Card', type: 'import' },
      { from: 'antd/Layout', to: '@mui/material/Container', type: 'import' },
      { from: 'antd/Menu', to: '@mui/material/Menu', type: 'import' },
      { from: 'antd/Dropdown', to: '@mui/material/Menu', type: 'import' },
      { from: 'antd/Tooltip', to: '@mui/material/Tooltip', type: 'import' },
      { from: 'antd/Notification', to: '@mui/material/Snackbar', type: 'import' },
      { from: 'antd/Spin', to: '@mui/material/CircularProgress', type: 'import' },
      { from: 'antd/Pagination', to: '@mui/material/Pagination', type: 'import' },
      { from: 'antd/DatePicker', to: '@mui/x-date-pickers/DatePicker', type: 'import' },
      { from: 'antd/TimePicker', to: '@mui/x-date-pickers/TimePicker', type: 'import' },

      // Chart.js → Recharts
      { from: 'react-chartjs-2', to: 'recharts', type: 'import' },
      { from: 'chart.js', to: 'recharts', type: 'import' },
      { from: '@ant-design/charts', to: 'recharts', type: 'import' },

      // SWR → React Query
      { from: 'swr', to: '@tanstack/react-query', type: 'import' },

      // Map libraries → MapLibre
      { from: 'mapbox-gl', to: 'maplibre-gl', type: 'import' },
      { from: 'react-map-gl', to: '@vis.gl/react-maplibre', type: 'import' },
      { from: '@react-google-maps/api', to: '@vis.gl/react-maplibre', type: 'import' },

      // Styled Components → MUI styled
      { from: 'styled-components', to: '@mui/material/styles', type: 'import' },
    ];
  }

  /**
   * Remove redundant dependencies from package.json
   */
  async removeRedundantDependencies() {
    console.log('🗑️  Removing redundant dependencies...');
    
    const redundantDeps = [
      'antd',
      '@ant-design/charts',
      'chart.js',
      'react-chartjs-2',
      'swr',
      'mapbox-gl',
      'react-map-gl',
      '@react-google-maps/api',
      'styled-components',
      '@types/styled-components',
      '@types/mapbox-gl',
    ];

    const packageJsonPath = path.join(this.projectRoot, 'apps/web/package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Remove from dependencies
    redundantDeps.forEach(dep => {
      if (packageJson.dependencies?.[dep]) {
        delete packageJson.dependencies[dep];
        console.log(`  ✅ Removed ${dep} from dependencies`);
      }
    });

    // Remove from devDependencies
    redundantDeps.forEach(dep => {
      if (packageJson.devDependencies?.[dep]) {
        delete packageJson.devDependencies[dep];
        console.log(`  ✅ Removed ${dep} from devDependencies`);
      }
    });

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('📝 Updated package.json');
  }

  /**
   * Migrate import statements in TypeScript/JavaScript files
   */
  async migrateImports() {
    console.log('🔄 Migrating import statements...');
    
    const srcDir = path.join(this.projectRoot, 'apps/web/src');
    const files = this.getAllTsxFiles(srcDir);
    
    let migratedFiles = 0;
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      let newContent = content;
      let hasChanges = false;

      // Apply migration rules
      for (const rule of this.migrationRules) {
        if (rule.type === 'import') {
          const importRegex = new RegExp(
            `import\\s+([^\\s]+)\\s+from\\s+['"]${rule.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`,
            'g'
          );
          
          if (importRegex.test(content)) {
            newContent = newContent.replace(importRegex, `import $1 from '${rule.to}'`);
            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        fs.writeFileSync(file, newContent);
        migratedFiles++;
        console.log(`  ✅ Migrated ${path.relative(this.projectRoot, file)}`);
      }
    }

    console.log(`📊 Migrated ${migratedFiles} files`);
  }

  /**
   * Create component migration guide
   */
  async createMigrationGuide() {
    console.log('📚 Creating migration guide...');
    
    const guideContent = `# Component Migration Guide

## Ant Design → Material-UI

### Button
\`\`\`typescript
// Before
import { Button } from 'antd';
<Button type="primary">Click me</Button>

// After
import { Button } from '@mui/material';
<Button variant="contained">Click me</Button>
\`\`\`

### Input
\`\`\`typescript
// Before
import { Input } from 'antd';
<Input placeholder="Enter text" />

// After
import { TextField } from '@mui/material';
<TextField placeholder="Enter text" />
\`\`\`

### Select
\`\`\`typescript
// Before
import { Select } from 'antd';
<Select options={options} />

// After
import { Select, MenuItem } from '@mui/material';
<Select>
  {options.map(option => (
    <MenuItem key={option.value} value={option.value}>
      {option.label}
    </MenuItem>
  ))}
</Select>
\`\`\`

### Table
\`\`\`typescript
// Before
import { Table } from 'antd';
<Table columns={columns} dataSource={data} />

// After
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
<TableContainer>
  <Table>
    <TableHead>
      <TableRow>
        {columns.map(col => (
          <TableCell key={col.key}>{col.title}</TableCell>
        ))}
      </TableRow>
    </TableHead>
    <TableBody>
      {data.map(row => (
        <TableRow key={row.key}>
          {columns.map(col => (
            <TableCell key={col.key}>{row[col.dataIndex]}</TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
\`\`\`

### Modal
\`\`\`typescript
// Before
import { Modal } from 'antd';
<Modal open={open} onCancel={onCancel}>
  Content
</Modal>

// After
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
<Dialog open={open} onClose={onCancel}>
  <DialogTitle>Title</DialogTitle>
  <DialogContent>Content</DialogContent>
  <DialogActions>
    <Button onClick={onCancel}>Cancel</Button>
  </DialogActions>
</Dialog>
\`\`\`

## Chart.js → Recharts

### Line Chart
\`\`\`typescript
// Before
import { Line } from 'react-chartjs-2';
<Line data={data} options={options} />

// After
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
<LineChart data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Line type="monotone" dataKey="value" stroke="#8884d8" />
</LineChart>
\`\`\`

### Bar Chart
\`\`\`typescript
// Before
import { Bar } from 'react-chartjs-2';
<Bar data={data} options={options} />

// After
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
<BarChart data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Bar dataKey="value" fill="#8884d8" />
</BarChart>
\`\`\`

## SWR → React Query

### Data Fetching
\`\`\`typescript
// Before
import useSWR from 'swr';
const { data, error, isLoading } = useSWR('/api/users', fetcher);

// After
import { useQuery } from '@tanstack/react-query';
const { data, error, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: () => fetch('/api/users').then(res => res.json()),
});
\`\`\`

### Mutations
\`\`\`typescript
// Before
import useSWRMutation from 'swr/mutation';
const { trigger } = useSWRMutation('/api/users', createUser);

// After
import { useMutation } from '@tanstack/react-query';
const mutation = useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});
\`\`\`

## Map Libraries → MapLibre

### Map Component
\`\`\`typescript
// Before
import Map from 'react-map-gl';
<Map
  mapboxAccessToken={token}
  initialViewState={viewState}
  style={{ width: '100%', height: '100%' }}
/>

// After
import { Map } from '@vis.gl/react-maplibre';
<Map
  initialViewState={viewState}
  style={{ width: '100%', height: '100%' }}
/>
\`\`\`

## Styled Components → MUI Styled

### Styled Components
\`\`\`typescript
// Before
import styled from 'styled-components';
const StyledButton = styled.button\`
  background-color: blue;
  color: white;
\`;

// After
import { styled } from '@mui/material/styles';
import { Button } from '@mui/material';
const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
}));
\`\`\`
`;

    const guidePath = path.join(this.projectRoot, 'MIGRATION_GUIDE.md');
    fs.writeFileSync(guidePath, guideContent);
    console.log('📖 Created migration guide at MIGRATION_GUIDE.md');
  }

  /**
   * Get all TypeScript/JavaScript files recursively
   */
  private getAllTsxFiles(dir: string): string[] {
    const files: string[] = [];
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.getAllTsxFiles(fullPath));
      } else if (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.jsx') || item.endsWith('.js')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  /**
   * Run the complete migration process
   */
  async run() {
    console.log('🚀 Starting dependency cleanup migration...');
    
    try {
      await this.removeRedundantDependencies();
      await this.migrateImports();
      await this.createMigrationGuide();
      
      console.log('✅ Migration completed successfully!');
      console.log('📋 Next steps:');
      console.log('  1. Run npm install to update dependencies');
      console.log('  2. Review the MIGRATION_GUIDE.md for component changes');
      console.log('  3. Test all components to ensure they work correctly');
      console.log('  4. Update any remaining manual imports');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  const projectRoot = process.cwd();
  const migrator = new DependencyMigrator(projectRoot);
  migrator.run();
}

export default DependencyMigrator;
