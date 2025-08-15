import domtoimage from "dom-to-image";
import { jsPDF } from "jspdf";

export const exportToPDF = async (
  elementId: string,
  filename: string = "dashboard",
): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error("Element not found");
    }

    // Convert the element to an image
    const dataUrl = await domtoimage.toPng(element, {
      quality: 1.0,
      bgcolor: "#ffffff",
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
    });

    // Calculate dimensions
    const imgProps = pdf.getImageProperties(dataUrl);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // Add image to PDF
    pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);

    // Save the PDF
    pdf.save(`${filename}_${new Date().toISOString()}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};
