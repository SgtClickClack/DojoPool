import { Box, Button, Container, Typography } from '@mui/material';
import React from 'react';
import { Link } from 'react-router-dom';

const ServerError = () => {
    return (
        <Container>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '80vh',
                    textAlign: 'center',
                }}
            >
                <Typography variant="h1" component="h1" gutterBottom>
                    500
                </Typography>
                <Typography variant="h4" component="h2" gutterBottom>
                    Server Error
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    Sorry, something went wrong on our end. Please try again later.
                </Typography>
                <Button
                    component={Link}
                    to="/"
                    variant="contained"
                    color="primary"
                    size="large"
                    sx={{ mt: 2 }}
                >
                    Back to Home
                </Button>
            </Box>
        </Container>
    );
};

export default ServerError; 