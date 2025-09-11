import { AutomatedReports } from '@/components/Telemetry/AutomatedReports';
import { CustomQueryBuilder } from '@/components/Telemetry/CustomQueryBuilder';
import { InsightsEngine } from '@/components/Telemetry/InsightsEngine';
import { Box, Tab, Tabs, useTheme } from '@mui/material';
import React, { useState } from 'react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`telemetry-tabpanel-${index}`}
      aria-labelledby={`telemetry-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `telemetry-tab-${index}`,
    'aria-controls': `telemetry-tabpanel-${index}`,
  };
}

const TelemetryDashboard: React.FC = () => {
  const theme = useTheme();
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="telemetry dashboard tabs"
          sx={{
            '& .MuiTab-root': {
              minWidth: 160,
              fontSize: '0.875rem',
              fontWeight: 500,
            },
          }}
        >
          <Tab label="📊 Custom Queries" {...a11yProps(0)} />
          <Tab label="📈 Automated Reports" {...a11yProps(1)} />
          <Tab label="🧠 AI Insights" {...a11yProps(2)} />
        </Tabs>
      </Box>

      <TabPanel value={value} index={0}>
        <CustomQueryBuilder />
      </TabPanel>

      <TabPanel value={value} index={1}>
        <AutomatedReports />
      </TabPanel>

      <TabPanel value={value} index={2}>
        <InsightsEngine />
      </TabPanel>
    </Box>
  );
};

export default TelemetryDashboard;
