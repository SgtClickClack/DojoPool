#!/usr/bin/env node

/**
 * Dependency Cleanup Migration Script
 */

const fs = require('fs');
const path = require('path');

class DependencyMigrator {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
  }

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
    
    if (!fs.existsSync(packageJsonPath)) {
      console.log('📝 Web app package.json not found, skipping...');
      return;
    }

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
`;

    const guidePath = path.join(this.projectRoot, 'MIGRATION_GUIDE.md');
    fs.writeFileSync(guidePath, guideContent);
    console.log('📖 Created migration guide at MIGRATION_GUIDE.md');
  }

  async run() {
    console.log('🚀 Starting dependency cleanup migration...');
    
    try {
      await this.removeRedundantDependencies();
      await this.createMigrationGuide();
      
      console.log('✅ Migration completed successfully!');
      console.log('📋 Next steps:');
      console.log('  1. Run yarn install to update dependencies');
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

module.exports = DependencyMigrator;