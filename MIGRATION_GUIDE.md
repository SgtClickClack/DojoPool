# Component Migration Guide

## Ant Design → Material-UI

### Button
```typescript
// Before
import { Button } from 'antd';
<Button type="primary">Click me</Button>

// After
import { Button } from '@mui/material';
<Button variant="contained">Click me</Button>
```

### Input
```typescript
// Before
import { Input } from 'antd';
<Input placeholder="Enter text" />

// After
import { TextField } from '@mui/material';
<TextField placeholder="Enter text" />
```

## Chart.js → Recharts

### Line Chart
```typescript
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
```

## SWR → React Query

### Data Fetching
```typescript
// Before
import useSWR from 'swr';
const { data, error, isLoading } = useSWR('/api/users', fetcher);

// After
import { useQuery } from '@tanstack/react-query';
const { data, error, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: () => fetch('/api/users').then(res => res.json()),
});
```
