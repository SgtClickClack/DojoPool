import { Box, Tab, Tabs, Typography } from '@mui/material';
import React from 'react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`cms-tabpanel-${index}`}
      aria-labelledby={`cms-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `cms-tab-${index}`,
    'aria-controls': `cms-tabpanel-${index}`,
  };
}

interface CMSTabsProps {
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
  children: React.ReactNode[];
}

const CMSTabs: React.FC<CMSTabsProps> = ({ value, onChange, children }) => {
  const tabLabels = [
    'Events',
    'News Articles',
    'System Messages',
    'Content Moderation',
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={onChange}
          aria-label="CMS management tabs"
        >
          {tabLabels.map((label, index) => (
            <Tab
              key={index}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {label}
                  </Typography>
                </Box>
              }
              {...a11yProps(index)}
            />
          ))}
        </Tabs>
      </Box>

      {children.map((child, index) => (
        <TabPanel key={index} value={value} index={index}>
          {child}
        </TabPanel>
      ))}
    </Box>
  );
};

export default CMSTabs;
