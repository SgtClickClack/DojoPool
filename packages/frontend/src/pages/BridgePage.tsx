import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Tabs, 
  Tab, 
  Paper, 
  Grid, 
  Divider,
  Alert,
  Link
} from '@mui/material';
import { 
  SwapHoriz as SwapIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';
import TokenBridge from '../components/bridge/TokenBridge';
import NFTBridge from '../components/bridge/NFTBridge';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`bridge-tabpanel-${index}`}
      aria-labelledby={`bridge-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `bridge-tab-${index}`,
    'aria-controls': `bridge-tabpanel-${index}`,
  };
};

/**
 * Bridge Page Component
 * Provides UI for transferring assets between blockchains
 */
const BridgePage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <PageHeader 
        title="Cross-Chain Bridge" 
        subtitle="Transfer your assets between Ethereum and Solana blockchains"
        icon={<SwapIcon fontSize="large" />}
        divider
      />
      
      <Paper sx={{ mt: 3, p: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="bridge tabs"
          centered
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Token Bridge" {...a11yProps(0)} />
          <Tab label="NFT Bridge" {...a11yProps(1)} />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <TokenBridge />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <NFTBridge />
        </TabPanel>
      </Paper>
      
      <Grid container spacing={4} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              How It Works
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" paragraph>
              The Dojo Pool Cross-Chain Bridge allows you to transfer your assets between Ethereum and Solana blockchains securely and efficiently.
            </Typography>
            <Typography variant="body2" paragraph>
              When you initiate a bridge transaction, your assets are locked in a smart contract on the source chain, and equivalent assets are minted on the destination chain. This process is secured by a network of validators that ensure the integrity of the bridge.
            </Typography>
            <Typography variant="body2">
              For more information, please read our <Link href="/docs/bridge" color="primary">Bridge Documentation</Link>.
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Frequently Asked Questions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              How long do bridge transactions take?
            </Typography>
            <Typography variant="body2" paragraph>
              Token transfers typically complete in 5-20 minutes. NFT transfers may take 20-60 minutes depending on network conditions.
            </Typography>
            
            <Typography variant="subtitle2">
              What are the fees?
            </Typography>
            <Typography variant="body2" paragraph>
              Token bridge fees are 0.5% with a minimum of 1 DOJO. NFT bridge fees are 1% with a minimum of 1 DOJO.
            </Typography>
            
            <Typography variant="subtitle2">
              Is there a limit to how much I can bridge?
            </Typography>
            <Typography variant="body2" paragraph>
              The maximum amount per transaction is 10,000 DOJO. For larger amounts, please contact support.
            </Typography>
            
            <Typography variant="subtitle2">
              Need help?
            </Typography>
            <Typography variant="body2">
              If you encounter any issues, please contact our support team at <Link href="mailto:support@dojopool.com" color="primary">support@dojopool.com</Link>.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      <Alert severity="info" sx={{ mt: 4 }}>
        <Typography variant="body2">
          <strong>Note:</strong> Always ensure you're using the correct destination address. Transactions cannot be reversed once confirmed.
        </Typography>
      </Alert>
    </Container>
  );
};

export default BridgePage; 