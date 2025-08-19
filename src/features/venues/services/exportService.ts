import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { type VenueAnalyticsData } from '../types';

export class AnalyticsExportService {
  static async exportToCSV(data: VenueAnalyticsData): Promise<string> {
    const csvRows: string[] = [];

    // Summary Data
    csvRows.push('Summary Data');
    csvRows.push('Metric,Value');
    csvRows.push(`Total Revenue,${data.totalRevenue}`);
    csvRows.push(`Total Games,${data.totalGames}`);
    csvRows.push(`Average Occupancy,${data.averageOccupancy}%`);
    csvRows.push(
      `Total Maintenance Events,${data.maintenanceStats.totalMaintenance}`
    );
    csvRows.push('');

    // Revenue by Day
    csvRows.push('Revenue by Day');
    csvRows.push('Date,Revenue');
    data.revenueByDay.forEach((day) => {
      csvRows.push(`${day.date},${day.revenue}`);
    });
    csvRows.push('');

    // Games by Day
    csvRows.push('Games by Day');
    csvRows.push('Date,Count');
    data.gamesByDay.forEach((day) => {
      csvRows.push(`${day.date},${day.count}`);
    });
    csvRows.push('');

    // Peak Hours
    csvRows.push('Peak Hours');
    csvRows.push('Hour,Occupancy Rate');
    Object.entries(data.peakHours).forEach(([hour, rate]) => {
      csvRows.push(`${hour},${rate}%`);
    });
    csvRows.push('');

    // Table Utilization
    csvRows.push('Table Utilization');
    csvRows.push('Table ID,Utilization Rate');
    data.tableUtilization.forEach((table) => {
      csvRows.push(`${table.tableId},${table.utilization}%`);
    });
    csvRows.push('');

    // Maintenance Stats
    csvRows.push('Maintenance Statistics');
    csvRows.push('Reason,Count');
    Object.entries(data.maintenanceStats.maintenanceByReason).forEach(
      ([reason, count]) => {
        csvRows.push(`${reason},${count}`);
      }
    );

    return csvRows.join('\n');
  }

  static async exportToPDF(data: VenueAnalyticsData): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.text('Venue Analytics Report', pageWidth / 2, yPos, {
      align: 'center',
    });
    yPos += 20;

    // Summary Section
    doc.setFontSize(14);
    doc.text('Summary', margin, yPos);
    yPos += 10;

    doc.setFontSize(12);
    const summaryData = [
      ['Total Revenue', `$${data.totalRevenue.toLocaleString()}`],
      ['Total Games', data.totalGames.toLocaleString()],
      ['Average Occupancy', `${data.averageOccupancy.toFixed(1)}%`],
      ['Maintenance Events', data.maintenanceStats.totalMaintenance.toString()],
    ];

    (doc as any).autoTable({
      startY: yPos,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      margin: { left: margin },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Revenue by Day Chart
    doc.setFontSize(14);
    doc.text('Revenue Trend', margin, yPos);
    yPos += 10;

    // Add chart image (placeholder - in real implementation, you would render the chart to canvas)
    doc.setFontSize(10);
    doc.text('Revenue Trend Chart', margin, yPos);
    yPos += 50;

    // Table Utilization
    doc.setFontSize(14);
    doc.text('Table Utilization', margin, yPos);
    yPos += 10;

    const tableData = data.tableUtilization.map((table) => [
      table.tableId.toString(),
      `${table.utilization.toFixed(1)}%`,
      table.utilization > 80
        ? 'High'
        : table.utilization > 50
          ? 'Medium'
          : 'Low',
    ]);

    (doc as any).autoTable({
      startY: yPos,
      head: [['Table ID', 'Utilization', 'Status']],
      body: tableData,
      theme: 'grid',
      margin: { left: margin },
    });

    return doc.output('blob');
  }

  static async exportToJSON(data: VenueAnalyticsData): Promise<string> {
    return JSON.stringify(data, null, 2);
  }

  static async exportData(
    data: VenueAnalyticsData,
    format: 'csv' | 'json' | 'pdf'
  ): Promise<Blob | string> {
    switch (format) {
      case 'csv':
        return this.exportToCSV(data);
      case 'json':
        return this.exportToJSON(data);
      case 'pdf':
        return this.exportToPDF(data);
      default:
        throw new Error('Unsupported export format');
    }
  }

  static downloadFile(
    content: Blob | string,
    format: 'csv' | 'json' | 'pdf',
    filename: string
  ): void {
    const blob =
      typeof content === 'string'
        ? new Blob([content], { type: 'text/plain' })
        : content;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
