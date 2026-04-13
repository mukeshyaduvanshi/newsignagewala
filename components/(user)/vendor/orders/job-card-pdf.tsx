"use client";
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, Square } from 'lucide-react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { priceCalculatorNumber } from '@/lib/utils/priceCalculator';
import { format } from 'date-fns';
import type { VendorOrder } from '@/hooks/use-vendor-orders';

interface JobCardPdfProps {
  order: VendorOrder & { openjobcardsId?: string; jobCardNumber?: number };
    companyLogo?: string;
}

export const JobCardPdf: React.FC<JobCardPdfProps> = ({ order,companyLogo }) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  console.log({order});
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    generatePDF();
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [order]);

  const generatePDF = async () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    let yPos = 20;
    const pageWidth = 210;
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Production Job Card', margin, yPos);
    yPos += 10;

    // Order Number
    pdf.setFontSize(12);
    pdf.text(`Order Number: ${order.orderNumber}`, margin, yPos);
    yPos += 5;

    // Job Card Number
    if (order.jobCardNumber) {
      pdf.text(`Job Card #: ${order.jobCardNumber}`, margin, yPos);
      yPos += 5;
    }

    // Order Date and Deadline Date
    pdf.setFontSize(10);
    pdf.text(`Order Date: ${format(new Date(order.orderDate), 'dd/MM/yyyy')} to ${format(new Date(order.deadlineDate), 'dd/MM/yyyy')}`,margin, yPos);
    yPos += 5;

    // Vendor Company Logo
    if (companyLogo) {
      const imgWidth = 25;
      const imgHeight = 25;
      pdf.addImage(companyLogo, 'JPEG', pageWidth - margin - imgWidth, margin, imgWidth, imgHeight);
    }
    yPos += 5;
    
    
    


    // Horizontal line
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    // Brand Information
    // pdf.setFontSize(10);
    // pdf.setFont('helvetica', 'bold');
    // pdf.text('BRAND INFORMATION', margin, yPos);
    // yPos += 6;

    // pdf.setFont('helvetica', 'normal');
    // if (order.brandId) {
    //   pdf.text(`Company: ${order.brandId.companyName || 'N/A'}`, margin, yPos);
    //   yPos += 5;
    //   pdf.text(`Email: ${order.brandId.email || 'N/A'}`, margin, yPos);
    //   yPos += 5;
    //   pdf.text(`Phone: ${order.brandId.phone || 'N/A'}`, margin, yPos);
    //   yPos += 8;
    // }

    // Order Details
    // pdf.setFont('helvetica', 'bold');
    // pdf.text('ORDER DETAILS', margin, yPos);
    // yPos += 6;

    // pdf.setFont('helvetica', 'normal');
    // pdf.text(`Order Date: ${format(new Date(order.orderDate), 'dd/MM/yyyy')}`, margin, yPos);
    // pdf.text(`Deadline: ${format(new Date(order.deadlineDate), 'dd/MM/yyyy')}`, margin + 70, yPos);
    // yPos += 5;
    // pdf.text(`Status: ${order.orderStatus.toUpperCase()}`, margin, yPos);
    // pdf.text(`Total Sites: ${order.sites.length}`, margin + 70, yPos);
    // yPos += 8;

    // if (order.poNumber) {
    //   pdf.text(`PO Number: ${order.poNumber}`, margin, yPos);
    //   yPos += 8;
    // }

    // Sites Table Header
    pdf.setFont('helvetica', 'bold');
    pdf.text('SITE DETAILS', margin, yPos);
    yPos += 6;

    // Table
    const tableStartY = yPos;
    const colWidths = [15, 75, 25, 25, 25, 15]; // S.No, Elements, Width, Height, Qty, Tick
    const colX = [
      margin,
      margin + colWidths[0],
      margin + colWidths[0] + colWidths[1],
      margin + colWidths[0] + colWidths[1] + colWidths[2],
      margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
      margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4],
    ];


    // Table Header
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPos, contentWidth, 8, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('S. No', colX[0] + 2, yPos + 5);
    pdf.text('Elements', colX[1] + 2, yPos + 5);
    pdf.text('Width', colX[2] + 2, yPos + 5);
    pdf.text('Height', colX[3] + 2, yPos + 5);
    pdf.text('Qty', colX[4] + 2, yPos + 5);
    pdf.text('Tick', colX[5] + 2, yPos + 5);
    yPos += 8;

    // Table Rows
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);

    order.sites.forEach((site, index) => {
      // Check if we need a new page
      if (yPos > 270) {
        pdf.addPage();
        yPos = 20;
      }

    //   const siteTotal = priceCalculatorNumber(site);
      const rowHeight = 10;

      // Row background (alternating)
      if (index % 2 === 0) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(margin, yPos, contentWidth, rowHeight, 'F');
      }

      // S. No.
      pdf.text((index + 1).toString(), colX[0] + 2, yPos + 4);

      // Elements and Description
      const siteText = `${site.elementName}`;
      const description = `${site.siteDescription}`
      pdf.text(siteText, colX[1] + 2, yPos + 4, { maxWidth: colWidths[1] - 4 });
      pdf.text(description, colX[1] + 2, yPos + 8, { maxWidth: colWidths[1] - 4 }); 
      
      // Width
      const widthText = `${site.width} ${site.measurementUnit}`;
      pdf.text(widthText, colX[2] + 2, yPos + 4);
      
      // Height
      const heightText = `${site.height} ${site.measurementUnit}`;
      pdf.text(heightText, colX[3] + 2, yPos + 4, { maxWidth: colWidths[3] - 4 });
      
      // Quantity
      const quantityText = site.quantity.toString();
      pdf.text(quantityText, colX[4] + 2, yPos + 4);
      
      // Tick - Draw a checkbox
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.3);
      pdf.rect(colX[5] + 2, yPos + 1, 5, 5, 'S'); // Draw empty square/checkbox

      // If status is printed, draw a checkmark using lines
      if (site.status === 'printed') {
        pdf.setDrawColor(0, 128, 0); // Green color for checkmark
        pdf.setLineWidth(0.6); // Thicker line for checkmark
        
        // Draw checkmark as two lines forming a tick
        const boxX = colX[5] + 2;
        const boxY = yPos + 1;
        const boxSize = 5;
        console.log({boxX,boxY,boxSize});
        
        
        // First line (bottom-left to middle)
        pdf.line(
          boxX + boxSize * 0.2,  // Start X
          boxY + boxSize * 0.5,  // Start Y 
          boxX + boxSize * 0.4,  // End X 
          boxY + boxSize * 0.7   // End Y 
        );
        
        // Second line (middle to top-right)
        pdf.line(
          boxX + boxSize * 0.31,  // Start X
          boxY + boxSize * 0.7,  // Start Y
          boxX + boxSize * 0.8,  // End X
          boxY + boxSize * 0.25  // End Y
        );
        
        // Reset to default
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.3);
      }

      yPos += rowHeight;
    });

    // Table border
    pdf.setDrawColor(200, 200, 200);
    for (let i = 0; i < colX.length; i++) {
      pdf.line(colX[i], tableStartY, colX[i], yPos);
    }
    pdf.line(margin + contentWidth, tableStartY, margin + contentWidth, yPos);
    pdf.line(margin, tableStartY, margin + contentWidth, tableStartY);
    pdf.line(margin, yPos, margin + contentWidth, yPos);

    yPos += 10;

    // Check if we need a new page for pricing
    if (yPos > 240) {
      pdf.addPage();
      yPos = 20;
    }

    // Pricing Summary
    // const summaryX = pageWidth - margin - 60;
    // pdf.setFont('helvetica', 'normal');
    // pdf.setFontSize(10);

    // pdf.text('Subtotal:', summaryX, yPos);
    // pdf.text(`₹${order.subtotal.toFixed(2)}`, summaryX + 40, yPos, { align: 'right' });
    // yPos += 6;

    // pdf.text('Additional Charges:', summaryX, yPos);
    // pdf.text(`₹${(order.additionalChargesTotal || 0).toFixed(2)}`, summaryX + 40, yPos, { align: 'right' });
    // yPos += 6;

    // pdf.text('Tax (GST 18%):', summaryX, yPos);
    // pdf.text(`₹${order.tax.toFixed(2)}`, summaryX + 40, yPos, { align: 'right' });
    // yPos += 2;

    // pdf.setLineWidth(0.3);
    // pdf.line(summaryX, yPos, summaryX + 40, yPos);
    // yPos += 6;

    // pdf.setFont('helvetica', 'bold');
    // pdf.setFontSize(12);
    // pdf.text('Total:', summaryX, yPos);
    // pdf.text(`₹${order.total.toFixed(2)}`, summaryX + 40, yPos, { align: 'right' });
    // yPos += 10;

    // Notes
    if (order.notes) {
      if (yPos > 240) {
        pdf.addPage();
        yPos = 20;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('NOTES:', margin, yPos);
      yPos += 6;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      const splitNotes = pdf.splitTextToSize(order.notes, contentWidth);
      pdf.text(splitNotes, margin, yPos);
      yPos += splitNotes.length * 5 + 10;
    }

    // QR Code
    try {
      const qrUrl = `${window.location.origin}/openjobcards/${order.openjobcardsId || order._id}`;
      const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 100,
        margin: 1,
      });
      
      // Position QR code on right side before signatures
      const qrSize = 20; // 20mm Change the size as needed
      const qrX = pageWidth - margin - qrSize;
      const qrY = yPos;
      
      pdf.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      
      // Add text below QR code
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Scan for details', qrX + qrSize/2, qrY + qrSize + 5, { align: 'center' });
      
      yPos += 10; // Add some spacing
    } catch (error) {
      console.error('QR Code generation failed:', error);
    }

    // Signatures
    if (yPos > 240) {
      pdf.addPage();
      yPos = 20;
    }

    yPos = Math.max(yPos, 250); // Position signatures near bottom
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    const signatureY = yPos;
    pdf.line(margin, signatureY, margin + 50, signatureY);
    pdf.line(pageWidth - margin - 50, signatureY, pageWidth - margin, signatureY);

    pdf.text('Vendor Signature', margin, signatureY + 5);
    pdf.text('Brand Signature', pageWidth - margin - 50, signatureY + 5);

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      `Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
      pageWidth / 2,
      285,
      { align: 'center' }
    );

    // Generate blob URL for preview
    const pdfBlob = pdf.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    setPdfUrl(url);
  };

//   const handlePrint = () => {
//     if (iframeRef.current && iframeRef.current.contentWindow) {
//       iframeRef.current.contentWindow.print();
//     }
//   };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'job_card.pdf';
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button onClick={handleDownload} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        {pdfUrl ? (
          <iframe
            ref={iframeRef}
            src={pdfUrl}
            className="w-full h-[600px]"
            title="job_card.pdf"
          />
        ) : (
          <div className="text-center p-8">
            <p className="text-muted-foreground">Generating PDF...</p>
          </div>
        )}
      </div>
    </div>
  );
};