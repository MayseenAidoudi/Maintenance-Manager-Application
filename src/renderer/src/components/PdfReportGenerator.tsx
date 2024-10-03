import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import logoUrl from '../assets/marquardt.png'; // Updated with the correct image path

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  scheduledDate: Date;
  machineId: number;
  userId: number | null;
  machine?: { name: string };
  user?: { username: string };
  critical: boolean;
  categoryId?: number;
  category?: { name: string };
}

interface CompletionData {
  problem: string;
  solution: string;
  notes?: string;
}

export class PdfReportGenerator {
  private static readonly MARQUARDT_GREEN = '#00857c';
  private static readonly MARQUARDT_LOGO = logoUrl;

  static async generateReport(ticket: Ticket, completionData: CompletionData): Promise<Blob> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [210, 297], // A4 size with reduced height
    });

    // Add Marquardt logo
    const originalWidth = 870;  // replace with your image's original width
    const originalHeight = 500; // replace with your image's original height

    // New width for the image
    const newWidth = 50;

    // Calculate the aspect ratio
    const aspectRatio = originalWidth / originalHeight;

    // Calculate the new height to maintain the aspect ratio
    const newHeight = newWidth / aspectRatio;

    // Center the image
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const x = (pageWidth - newWidth) / 2;

    // Add the image to the PDF
    doc.addImage(PdfReportGenerator.MARQUARDT_LOGO, 'PNG', x, 3, newWidth, newHeight);

    const headerStartY = 35;

    // Add header
    doc.setFillColor(PdfReportGenerator.MARQUARDT_GREEN);
    doc.rect(0, headerStartY, doc.internal.pageSize.width, 30, 'F');
    
    // Add title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    
    const titleText = 'Ticket Completion Report';
    const titleWidth = doc.getTextWidth(titleText);
    const headerHeight = 30;
    
    // To get a better approximation of text height, you can use a fixed value
    const textHeight = 22; // You can adjust this based on your actual font and size
    
    // Calculate horizontal centering
    const titleX = (pageWidth - titleWidth) / 2;
    
    // Calculate vertical centering
    const titleY = headerStartY + (headerHeight / 2) + (textHeight / 4); // Adjust the offset for better centering
    
    doc.text(titleText, titleX, titleY-3);
    
    doc.setTextColor(PdfReportGenerator.MARQUARDT_GREEN);
    doc.setFontSize(12);

    // Ticket details with color for subtitles
    const details = [
      { label: 'Ticket ID:', value: ticket.id.toString() },
      { label: 'Title:', value: ticket.title },
      { label: 'Description:', value: ticket.description },
      { label: 'Status:', value: ticket.status },
      { label: 'Scheduled Date:', value: ticket.scheduledDate.toLocaleDateString() },
      { label: 'Machine:', value: ticket.machine?.name ?? 'N/A' },
      { label: 'Assigned User:', value: ticket.user?.username ?? 'Unassigned' },
      { label: 'Critical:', value: ticket.critical ? 'Yes' : 'No' },
      { label: 'Category:', value: ticket.category?.name ?? 'N/A' }
    ];

    let yPosition = 80;

    details.forEach(detail => {
      doc.setTextColor(PdfReportGenerator.MARQUARDT_GREEN);
      doc.setFontSize(12);
      doc.text(detail.label, 14, yPosition);

      doc.setTextColor(0, 0, 0);
      doc.text(detail.value, 60, yPosition);

      yPosition += 10;
    });

    // Add completion details
    doc.setTextColor(PdfReportGenerator.MARQUARDT_GREEN);
    doc.setFontSize(12);
    doc.text('Completion Details:', 14, yPosition + 10);

    yPosition += 20;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    const problemLines = doc.splitTextToSize(completionData.problem, 190);
    doc.setTextColor(PdfReportGenerator.MARQUARDT_GREEN);
    doc.text('Problem:', 14, yPosition);
    doc.setTextColor(0,0,0);
    doc.text(problemLines, 14, yPosition + 10);

    const solutionY = yPosition + (problemLines.length * 7) + 10;
    doc.setTextColor(PdfReportGenerator.MARQUARDT_GREEN);
    doc.text('Solution:', 14, solutionY);
    const solutionLines = doc.splitTextToSize(completionData.solution, 190);
    doc.setTextColor(0, 0, 0);
    doc.text(solutionLines, 14, solutionY + 10);

    // Add footer
    const footerStartY = doc.internal.pageSize.height - 30;
    doc.setFillColor(PdfReportGenerator.MARQUARDT_GREEN);
    doc.rect(0, footerStartY, doc.internal.pageSize.width, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('Marquardt Automotive Tunisie', 14, footerStartY + 10);
    doc.text('SARL', 14, footerStartY + 15);
    doc.text(`Lot no 23, 24, Zone Industrielle d'El`, 14, footerStartY + 20);
    doc.text('Agba, 2087, El Hrairia, Tunis, Tunisie', 14, footerStartY + 25);

    doc.text('https://tn.marquardt.com', doc.internal.pageSize.width - 14, footerStartY + 10, { align: 'right' });
    doc.text('Marquardt © All Rights Reserved', doc.internal.pageSize.width - 14, footerStartY + 15, { align: 'right' });

    return doc.output('blob');
  }
}

export default PdfReportGenerator;
