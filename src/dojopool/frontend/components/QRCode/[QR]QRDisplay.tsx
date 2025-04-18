import React from "react";
import { Box, Button, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import DownloadIcon from "@mui/icons-material/Download";

interface QRDisplayProps {
  qrCode: string;
  title?: string;
  tableNumber?: number;
  onDownload?: () => void;
}

const QRContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
  maxWidth: "300px",
  margin: "0 auto",
}));

const QRImage = styled("img")({
  width: "100%",
  height: "auto",
  maxWidth: "250px",
});

const QRDisplay: React.FC<QRDisplayProps> = ({
  qrCode,
  title,
  tableNumber,
  onDownload,
}) => {
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }

    // Default download behavior
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `table-${tableNumber || "qr"}-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <QRContainer elevation={3}>
      {title && (
        <Typography variant="h6" component="h2" align="center">
          {title}
        </Typography>
      )}

      {tableNumber && (
        <Typography variant="subtitle1" color="textSecondary">
          Table #{tableNumber}
        </Typography>
      )}

      <QRImage
        src={qrCode}
        alt={`QR Code${tableNumber ? ` for Table #${tableNumber}` : ""}`}
      />

      <Button
        variant="contained"
        startIcon={<DownloadIcon />}
        onClick={handleDownload}
        fullWidth
      >
        Download QR Code
      </Button>
    </QRContainer>
  );
};

export default QRDisplay;
