"use client";
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { format } from 'date-fns';
import type { VendorOrder } from '@/hooks/use-vendor-orders';

interface InstallationCertificatePdfProps {
  order: VendorOrder & { installCertificateId?: string };
  companyLogo?: string;
}

export const InstallationCertificatePdf: React.FC<InstallationCertificatePdfProps> = ({ order, companyLogo }) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');
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
    pdf.text('Installation Certificate', margin, yPos);
    yPos += 10;

    // Order Number
    pdf.setFontSize(12);
    pdf.text(`Order Number: ${order.orderNumber}`, margin, yPos);
    yPos += 5;

    // Order Date
    pdf.setFontSize(10);
    pdf.text(`Installation Date: ${format(new Date(), 'dd/MM/yyyy')}`, margin, yPos);
    yPos += 5;
    
    // Deadline Date
    pdf.text(`Deadline Date: ${format(new Date(order.deadlineDate), 'dd/MM/yyyy')}`, margin, yPos);
    yPos += 5;

    // Company Logo
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

    // Installation Sites Header
    pdf.setFont('helvetica', 'bold');
    pdf.text('INSTALLATION SITES', margin, yPos);
    yPos += 6;

    // Group sites by store
    const storeGroups = new Map<string, typeof order.sites>();
    order.sites.forEach(site => {
      const storeKey = site.storeId.toString();
      if (!storeGroups.has(storeKey)) {
        storeGroups.set(storeKey, []);
      }
      storeGroups.get(storeKey)!.push(site);
    });

    // Process each store group - Each store on new page
    let storeIndex = 0;
    for (const [storeKey, sites] of storeGroups.entries()) {
      const firstSite = sites[0];

      // Add new page for each store (except first one)
      if (storeIndex > 0) {
        pdf.addPage();
        yPos = 20;

        // Repeat header on new page
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Installation Certificate', margin, yPos);
        yPos += 10;

        pdf.setFontSize(12);
        pdf.text(`Order Number: ${order.orderNumber}`, margin, yPos);
        yPos += 5;

        pdf.setFontSize(10);
        pdf.text(`Installation Date: ${format(new Date(), 'dd/MM/yyyy')}`, margin, yPos);
        yPos += 5;
        
        // Deadline Date
        pdf.text(`Deadline Date: ${format(new Date(order.deadlineDate), 'dd/MM/yyyy')}`, margin, yPos);
        yPos += 5;

        // Company Logo
        if (companyLogo) {
          const imgWidth = 25;
          const imgHeight = 25;
          pdf.addImage(companyLogo, 'JPEG', pageWidth - margin - imgWidth, 15, imgWidth, imgHeight);
        }
        yPos += 5;

        pdf.setLineWidth(0.5);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;
      }

      storeIndex++;

      // Store Information Box
      pdf.setFillColor(220, 220, 220);
      pdf.rect(margin, yPos, contentWidth, 30, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text(firstSite.storeName, margin + 2, yPos + 6);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      
      // Store location text
      yPos += 11;
      if (firstSite.storeLocation?.coordinates) {
        const [lng, lat] = firstSite.storeLocation.coordinates;
        pdf.text(`Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`, margin + 2, yPos);
      } else {
        pdf.text('Location: Not available', margin + 2, yPos);
      }
      
      yPos += 5;
      pdf.text(`Total Elements: ${sites.length}`, margin + 2, yPos);
      
      yPos += 10;

      // Elements Table for this store
      const tableStartY = yPos;
      const colWidths = [15, 60, 30, 30, 30, 15]; // S.No, Element, Width, Height, Qty, Status
      const colX = [
        margin,
        margin + colWidths[0],
        margin + colWidths[0] + colWidths[1],
        margin + colWidths[0] + colWidths[1] + colWidths[2],
        margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
        margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4],
      ];

      // Table Header
      pdf.setFillColor(220, 220, 220);
      pdf.rect(margin, yPos, contentWidth, 7, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text('S.No', colX[0] + 2, yPos + 5);
      pdf.text('Element', colX[1] + 2, yPos + 5);
      pdf.text('Width', colX[2] + 2, yPos + 5);
      pdf.text('Height', colX[3] + 2, yPos + 5);
      pdf.text('Qty', colX[4] + 2, yPos + 5);
      pdf.text('✓', colX[5] + 2, yPos + 5);
      yPos += 7;

      // Table Rows
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);

      sites.forEach((site, index) => {
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }

        const rowHeight = 8;

        // Row background
        if (index % 2 === 0) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(margin, yPos, contentWidth, rowHeight, 'F');
        }

        // S. No.
        pdf.text((index + 1).toString(), colX[0] + 2, yPos + 5);

        // Element Name
        const elementText = site.elementName;
        pdf.text(elementText, colX[1] + 2, yPos + 5, { maxWidth: colWidths[1] - 4 });

        // Width
        pdf.text(`${site.width} ${site.measurementUnit}`, colX[2] + 2, yPos + 5);

        // Height
        pdf.text(`${site.height} ${site.measurementUnit}`, colX[3] + 2, yPos + 5);

        // Quantity
        pdf.text(site.quantity.toString(), colX[4] + 2, yPos + 5);

        // Checkbox
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.3);
        pdf.rect(colX[5] + 2, yPos + 2, 4, 4, 'S');

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

      // QR Code for this store - positioned on right side
      try {
        const qrUrl = `${window.location.origin}/installation/${order.installCertificateId || order._id}`;
        const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
          width: 100,
          margin: 1,
        });

        if (yPos > 240) {
          yPos = Math.max(yPos, 220);
        }

        const qrSize = 20;
        const qrX = pageWidth - margin - qrSize;
        const qrY = yPos;

        pdf.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Scan for details', qrX + qrSize / 2, qrY + qrSize + 5, { align: 'center' });

        yPos += 30;
      } catch (error) {
        console.error('QR Code generation failed:', error);
      }

      // Signatures for this store
      if (yPos > 240) {
        yPos = 240;
      }

      yPos = Math.max(yPos, 250);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);

      const signatureY = yPos;
      pdf.line(margin, signatureY, margin + 50, signatureY);
      pdf.line(pageWidth - margin - 50, signatureY, pageWidth - margin, signatureY);

      pdf.text('Installer Signature', margin, signatureY + 5);
      pdf.text('Client Signature', pageWidth - margin - 50, signatureY + 5);

      // Footer for this page
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
        pageWidth / 2,
        285,
        { align: 'center' }
      );
    }

    // Generate blob URL
    const pdfBlob = pdf.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    setPdfUrl(url);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `installation_certificate_${order.orderNumber}.pdf`;
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
            title="installation_certificate.pdf"
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
