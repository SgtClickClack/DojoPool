import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Tab,
    Tabs,
    Box
} from '@mui/material';
import QRScanner from './QRScanner';
import QRDisplay from './QRDisplay';

interface QRDialogProps {
    open: boolean;
    onClose: () => void;
    onScan?: (data: string) => void;
    qrCode?: string;
    tableNumber?: number;
    mode?: 'scan' | 'display' | 'both';
    title?: string;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
    <div
        role="tabpanel"
        hidden={value !== index}
        id={`qr-tabpanel-${index}`}
        aria-labelledby={`qr-tab-${index}`}
    >
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
);

const QRDialog: React.FC<QRDialogProps> = ({
    open,
    onClose,
    onScan,
    qrCode,
    tableNumber,
    mode = 'both',
    title
}) => {
    const [activeTab, setActiveTab] = useState(mode === 'display' ? 1 : 0);

    const handleScan = (data: string) => {
        if (onScan) {
            onScan(data);
        }
        onClose();
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const showTabs = mode === 'both';
    const showScanner = mode === 'scan' || mode === 'both';
    const showDisplay = mode === 'display' || mode === 'both';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                {title || 'QR Code Scanner'}
            </DialogTitle>

            <DialogContent>
                {showTabs && (
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        centered
                        sx={{ mb: 2 }}
                    >
                        <Tab label="Scan QR Code" />
                        <Tab label="View QR Code" />
                    </Tabs>
                )}

                {showScanner && (
                    <TabPanel value={activeTab} index={0}>
                        <QRScanner
                            onScan={handleScan}
                            onClose={onClose}
                        />
                    </TabPanel>
                )}

                {showDisplay && qrCode && (
                    <TabPanel value={activeTab} index={1}>
                        <QRDisplay
                            qrCode={qrCode}
                            tableNumber={tableNumber}
                        />
                    </TabPanel>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default QRDialog; 