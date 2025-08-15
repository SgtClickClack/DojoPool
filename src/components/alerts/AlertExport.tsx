import React, { useCallback } from "react";
import {
  Box,
  Button,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { Alert } from "../../types/alert";

interface AlertExportProps {
  alerts: Alert[];
  onExportStart?: () => void;
  onExportComplete?: () => void;
  onExportError?: (error: Error) => void;
}

export const AlertExport = React.memo(
  ({
    alerts,
    onExportStart,
    onExportComplete,
    onExportError,
  }: AlertExportProps) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
      setAnchorEl(null);
    };

    const formatAlertForExport = useCallback(
      (alert: Alert) => ({
        id: alert.id,
        type: alert.type,
        status: alert.status,
        message: alert.message,
        timestamp: new Date(alert.timestamp).toISOString(),
        source: alert.source,
        impactScore: alert.impactScore,
      }),
      [],
    );

    const exportToCSV = useCallback(() => {
      try {
        onExportStart?.();
        const headers = [
          "ID",
          "Type",
          "Status",
          "Message",
          "Timestamp",
          "Source",
          "Impact Score",
        ];
        const formattedAlerts = alerts.map(formatAlertForExport);

        const csvContent = [
          headers.join(","),
          ...formattedAlerts.map((alert) =>
            Object.values(alert)
              .map((value) =>
                typeof value === "string"
                  ? `"${value.replace(/"/g, '""')}"`
                  : value,
              )
              .join(","),
          ),
        ].join("\n");

        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `alerts_export_${new Date().toISOString().split("T")[0]}.csv`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        onExportComplete?.();
      } catch (error) {
        onExportError?.(error as Error);
      }
      handleClose();
    }, [
      alerts,
      formatAlertForExport,
      onExportStart,
      onExportComplete,
      onExportError,
    ]);

    const exportToJSON = useCallback(() => {
      try {
        onExportStart?.();
        const formattedAlerts = alerts.map(formatAlertForExport);
        const jsonContent = JSON.stringify(formattedAlerts, null, 2);

        const blob = new Blob([jsonContent], { type: "application/json" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `alerts_export_${new Date().toISOString().split("T")[0]}.json`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        onExportComplete?.();
      } catch (error) {
        onExportError?.(error as Error);
      }
      handleClose();
    }, [
      alerts,
      formatAlertForExport,
      onExportStart,
      onExportComplete,
      onExportError,
    ]);

    const exportToExcel = useCallback(() => {
      try {
        onExportStart?.();
        const formattedAlerts = alerts.map(formatAlertForExport);
        const headers = [
          "ID",
          "Type",
          "Status",
          "Message",
          "Timestamp",
          "Source",
          "Impact Score",
        ];

        // Create XML spreadsheet content
        const xmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
          <head>
            <meta http-equiv="Content-Type" content="text/html;charset=utf-8">
          </head>
          <body>
            <table>
              <tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr>
              ${formattedAlerts
                .map(
                  (alert) => `
                <tr>
                  ${Object.values(alert)
                    .map((value) => `<td>${value}</td>`)
                    .join("")}
                </tr>
              `,
                )
                .join("")}
            </table>
          </body>
        </html>
      `;

        const blob = new Blob([xmlContent], {
          type: "application/vnd.ms-excel",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `alerts_export_${new Date().toISOString().split("T")[0]}.xls`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        onExportComplete?.();
      } catch (error) {
        onExportError?.(error as Error);
      }
      handleClose();
    }, [
      alerts,
      formatAlertForExport,
      onExportStart,
      onExportComplete,
      onExportError,
    ]);

    return (
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<FileDownloadIcon />}
          onClick={handleClick}
          size={isMobile ? "small" : "medium"}
          sx={{
            minWidth: isMobile ? "auto" : undefined,
            px: isMobile ? 1 : 2,
          }}
        >
          Export
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <MenuItem onClick={exportToCSV}>Export as CSV</MenuItem>
          <MenuItem onClick={exportToJSON}>Export as JSON</MenuItem>
          <MenuItem onClick={exportToExcel}>Export as Excel</MenuItem>
        </Menu>
      </Box>
    );
  },
);

AlertExport.displayName = "AlertExport";
