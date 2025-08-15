import Layout from '@/components/Layout';
import { Box, Container, Typography } from '@mui/material';
import { NextPage } from 'next';

const AdvancedAnalytics: NextPage = () => {
    return (
        <Layout>
            <Container maxWidth="lg">
                <Box py={4}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Advanced Analytics
                    </Typography>
                    <Typography variant="body1">
                        Welcome to the advanced analytics dashboard. Here you can find detailed statistical analysis and performance metrics.
                    </Typography>
                </Box>
            </Container>
        </Layout>
    );
};

export default AdvancedAnalytics;
