import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates and downloads a PDF from an HTML element.
 * @param {HTMLElement} inputElement - The HTML element to be converted into a PDF.
 * @param {string} fileName - The desired name for the downloaded PDF file.
 */
export const generatePDF = (inputElement, fileName) => {
  // Use html2canvas to capture the HTML element as an image
  html2canvas(inputElement, { scale: 2 }) // Higher scale for better quality
    .then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      
      // Create a new jsPDF instance
      // 'p' for portrait, 'mm' for millimeters, 'a4' for A4 size
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      // Calculate the aspect ratio to fit the image onto the PDF page
      const ratio = canvasWidth / canvasHeight;
      const width = pdfWidth;
      const height = width / ratio;

      // Add the captured image to the PDF
      // The image is added at the top-left corner (0, 0)
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      
      // Save the PDF
      pdf.save(`${fileName}.pdf`);
    })
    .catch(err => {
      console.error("Error generating PDF:", err);
      // Optionally, show an error message to the user
    });
};