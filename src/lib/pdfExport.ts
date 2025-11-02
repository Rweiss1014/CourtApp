import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EncryptedRecord } from './security/encryptedStorage';

export interface PDFExportOptions {
  title?: string;
  dateRange?: { start: Date; end: Date };
  tags?: string[];
  includeIntegrityHash?: boolean;
}

export class PDFExportService {
  private static instance: PDFExportService;

  private constructor() {}

  static getInstance(): PDFExportService {
    if (!PDFExportService.instance) {
      PDFExportService.instance = new PDFExportService();
    }
    return PDFExportService.instance;
  }

  /**
   * Convert image URL (including blob URLs) to base64 data URL
   */
  private async loadImageAsDataUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // If it's already a data URL, return it
      if (url.startsWith('data:')) {
        resolve(url);
        return;
      }

      const img = new Image();

      // For blob URLs, don't use crossOrigin
      if (!url.startsWith('blob:')) {
        img.crossOrigin = 'anonymous';
      }

      img.onload = () => {
        try {
          // Create canvas and draw image
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;

          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0);

          // Convert to data URL (PNG format for best quality)
          try {
            const dataUrl = canvas.toDataURL('image/png');
            if (dataUrl === 'data:,') {
              reject(new Error('Canvas returned empty data URL'));
              return;
            }
            resolve(dataUrl);
          } catch (canvasError) {
            console.error('Canvas toDataURL error:', canvasError);
            reject(new Error(`Failed to convert canvas to data URL: ${canvasError}`));
          }
        } catch (error) {
          console.error('Image drawing error:', error);
          reject(error);
        }
      };

      img.onerror = (event) => {
        console.error('Image load error event:', event);
        reject(new Error(`Failed to load image from URL: ${url}. Check if the blob URL is still valid.`));
      };

      // Set src after handlers are attached
      try {
        img.src = url;
      } catch (error) {
        reject(new Error(`Failed to set image src: ${error}`));
      }
    });
  }

  /**
   * Generate PDF report from evidence records
   */
  async generateEvidenceReport(
    records: EncryptedRecord[],
    options: PDFExportOptions = {}
  ): Promise<Blob> {
    const {
      title = 'Evidence Report',
      dateRange,
      tags,
      includeIntegrityHash = true
    } = options;

    // Filter records
    let filteredRecords = [...records];

    if (dateRange) {
      filteredRecords = filteredRecords.filter(r => {
        const recordDate = new Date(r.timestamp);
        return recordDate >= dateRange.start && recordDate <= dateRange.end;
      });
    }

    if (tags && tags.length > 0) {
      filteredRecords = filteredRecords.filter(r =>
        tags.some(tag => r.tags.includes(tag))
      );
    }

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header
    this.addHeader(doc, title);

    // Document Information
    let yPos = 40;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Records: ${filteredRecords.length}`, 14, yPos);
    yPos += 6;

    if (dateRange) {
      doc.text(
        `Date Range: ${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`,
        14,
        yPos
      );
      yPos += 6;
    }

    if (tags && tags.length > 0) {
      doc.text(`Filtered by Tags: ${tags.join(', ')}`, 14, yPos);
      yPos += 6;
    }

    yPos += 10;

    // Table of Contents
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Evidence Timeline', 14, yPos);
    yPos += 10;

    // Evidence Records Table
    const tableData = filteredRecords.map((record, index) => {
      const date = new Date(record.timestamp).toLocaleString();
      const tagList = record.tags.split(',').join(', ');
      const contentPreview = record.content.substring(0, 80) + (record.content.length > 80 ? '...' : '');
      const hasAttachments = (record as any).files && (record as any).files.length > 0;
      const attachmentCount = hasAttachments ? `${(record as any).files.length} file(s)` : '-';

      return [
        (index + 1).toString(),
        date,
        record.type,
        tagList,
        contentPreview,
        attachmentCount
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Date & Time', 'Type', 'Tags', 'Content', 'Attachments']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 35 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 'auto' },
        5: { cellWidth: 20 }
      },
      didDrawPage: (data) => {
        // Footer on each page
        this.addFooter(doc, data.pageNumber);
      }
    });

    // Detailed Records Section
    const finalY = (doc as any).lastAutoTable.finalY || yPos + 50;
    let detailY = finalY + 20;

    // Add new page for detailed records
    doc.addPage();
    detailY = 20;

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Detailed Evidence Records', 14, detailY);
    detailY += 10;

    // Add each record in detail
    for (let i = 0; i < filteredRecords.length; i++) {
      const record = filteredRecords[i];

      // Check if we need a new page
      if (detailY > pageHeight - 60) {
        doc.addPage();
        detailY = 20;
      }

      // Record header
      doc.setFillColor(240, 240, 240);
      doc.rect(14, detailY - 5, pageWidth - 28, 8, 'F');

      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'bold');
      doc.text(`Record #${i + 1}`, 16, detailY);
      detailY += 10;

      // Record details
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      doc.setFont('helvetica', 'bold');
      doc.text('Date & Time:', 16, detailY);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(record.timestamp).toLocaleString(), 50, detailY);
      detailY += 6;

      doc.setFont('helvetica', 'bold');
      doc.text('Type:', 16, detailY);
      doc.setFont('helvetica', 'normal');
      doc.text(record.type, 50, detailY);
      detailY += 6;

      doc.setFont('helvetica', 'bold');
      doc.text('Tags:', 16, detailY);
      doc.setFont('helvetica', 'normal');
      const tagsText = record.tags.split(',').join(', ');
      doc.text(tagsText, 50, detailY);
      detailY += 6;

      doc.setFont('helvetica', 'bold');
      doc.text('Content:', 16, detailY);
      detailY += 6;

      doc.setFont('helvetica', 'normal');
      const contentLines = doc.splitTextToSize(record.content, pageWidth - 40);
      doc.text(contentLines, 16, detailY);
      detailY += contentLines.length * 5;

      if (includeIntegrityHash) {
        detailY += 3;
        doc.setFontSize(7);
        doc.setTextColor(100);
        doc.text(`Integrity Hash: ${record.hash}`, 16, detailY);
        detailY += 5;
      }

      // Handle image attachments
      if ((record as any).files && (record as any).files.length > 0) {
        detailY += 5;
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text('Evidence Attachments:', 16, detailY);
        detailY += 8;

        for (const file of (record as any).files) {
          // Check if we need a new page
          if (detailY > pageHeight - 100) {
            doc.addPage();
            detailY = 20;
          }

          // Display filename
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100);
          doc.text(`${file.name} (${file.type})`, 16, detailY);
          detailY += 6;

          // Embed image if it's an image type
          if (file.type === 'image' && file.url) {
            try {
              console.log(`Loading image for PDF: ${file.name}`, file.url);

              // Convert blob URL to data URL for jsPDF
              const imageDataUrl = await this.loadImageAsDataUrl(file.url);
              console.log(`Successfully converted image to data URL: ${file.name}`);

              // Calculate image dimensions (max width: page width - 40px margin)
              const maxWidth = pageWidth - 40;
              const maxHeight = 120; // Max height in mm

              // Add image to PDF
              const imgProps = doc.getImageProperties(imageDataUrl);
              const imgWidth = imgProps.width;
              const imgHeight = imgProps.height;

              // Calculate scaled dimensions to fit within bounds
              let displayWidth = maxWidth;
              let displayHeight = (imgHeight * maxWidth) / imgWidth;

              if (displayHeight > maxHeight) {
                displayHeight = maxHeight;
                displayWidth = (imgWidth * maxHeight) / imgHeight;
              }

              // Check if image fits on current page
              if (detailY + displayHeight > pageHeight - 20) {
                doc.addPage();
                detailY = 20;
              }

              // Add the image (auto-detect format: JPEG, PNG, etc.)
              const format = imageDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
              doc.addImage(imageDataUrl, format, 20, detailY, displayWidth, displayHeight);
              console.log(`Successfully embedded image in PDF: ${file.name}`);
              detailY += displayHeight + 8;

            } catch (error) {
              // If image fails to load, just show the filename
              console.error(`Failed to embed image "${file.name}" in PDF:`, error);
              console.error('Image URL was:', file.url);
              doc.setFontSize(7);
              doc.setTextColor(200, 0, 0);
              doc.text('(Image could not be embedded - see error in console)', 20, detailY);
              detailY += 6;
            }
          }

          detailY += 3;
          doc.setTextColor(0);
        }
      } else if (record.attachments) {
        // Fallback for old attachment format
        detailY += 3;
        doc.setFontSize(8);
        doc.setTextColor(0, 100, 200);
        doc.text(`Attachments: ${record.attachments}`, 16, detailY);
        detailY += 6;
      }

      detailY += 10;
      doc.setTextColor(0);
    }

    // Certification Page
    doc.addPage();
    this.addCertificationPage(doc, filteredRecords, includeIntegrityHash);

    // Convert to Blob
    const pdfBlob = doc.output('blob');
    return pdfBlob;
  }

  /**
   * Download PDF report
   */
  async downloadReport(
    records: EncryptedRecord[],
    filename: string = 'evidence-report.pdf',
    options: PDFExportOptions = {}
  ): Promise<void> {
    const blob = await this.generateEvidenceReport(records, options);

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    // Cleanup
    URL.revokeObjectURL(url);
  }

  /**
   * Add header to PDF
   */
  private addHeader(doc: jsPDF, title: string): void {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(title, pageWidth / 2, 20, { align: 'center' });

    // App name
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text('Her Law Family Court Organizer', pageWidth / 2, 28, { align: 'center' });

    // Line
    doc.setLineWidth(0.5);
    doc.setDrawColor(0);
    doc.line(14, 32, pageWidth - 14, 32);
  }

  /**
   * Add footer to PDF
   */
  private addFooter(doc: jsPDF, pageNumber: number): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${pageNumber} | Generated by Her Law Family Court Organizer`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    // Confidentiality notice
    doc.setFontSize(7);
    doc.text(
      'CONFIDENTIAL - Contains Sensitive Legal Information',
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  /**
   * Add certification page
   */
  private addCertificationPage(
    doc: jsPDF,
    records: EncryptedRecord[],
    includeHashes: boolean
  ): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 30;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Document Certification', pageWidth / 2, yPos, { align: 'center' });

    yPos += 20;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const certText = [
      'This document contains evidence records generated and stored using',
      'Her Law Family Court Organizer, a secure evidence documentation system.',
      '',
      `Total Records: ${records.length}`,
      `Generation Date: ${new Date().toLocaleString()}`,
      '',
      'Each record in this document has been cryptographically hashed to ensure',
      'data integrity. Any modification to the records will result in hash',
      'verification failure, proving tampering.',
      '',
      'The timestamps associated with each record reflect the time the evidence',
      'was documented in the system.',
    ];

    certText.forEach(line => {
      doc.text(line, pageWidth / 2, yPos, { align: 'center' });
      yPos += 6;
    });

    if (includeHashes) {
      yPos += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Integrity Verification Hashes', 14, yPos);
      yPos += 10;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');

      records.forEach((record, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        doc.text(`Record #${index + 1}: ${record.hash}`, 14, yPos);
        yPos += 5;
      });
    }

    // Signature section
    yPos += 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Document Prepared By:', 14, yPos);
    yPos += 15;
    doc.line(14, yPos, 100, yPos);
    yPos += 5;
    doc.setFontSize(8);
    doc.text('Signature', 14, yPos);

    yPos -= 20;
    doc.setFontSize(10);
    doc.text('Date:', pageWidth - 100, yPos);
    yPos += 15;
    doc.line(pageWidth - 100, yPos, pageWidth - 14, yPos);
  }

  /**
   * Export individual record as PDF
   */
  async exportSingleRecord(record: EncryptedRecord, filename?: string): Promise<void> {
    const defaultFilename = `evidence-${record.id || 'record'}-${Date.now()}.pdf`;
    await this.downloadReport([record], filename || defaultFilename);
  }
}

export const pdfExport = PDFExportService.getInstance();
