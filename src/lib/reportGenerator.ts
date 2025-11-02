import { RecordType } from '../App';
import { getTagGlossary } from './hashtagTaxonomy';

function formatDateLocal(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatDateUTC(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString();
}

function getShortHash(hash: string | undefined): string {
  if (!hash) return 'N/A';
  return hash.substring(0, 8);
}

export function generateLawyerReadyReport(
  records: RecordType[],
  caseLabel: string = 'CASE DOCUMENTATION',
  taxonomy: any
): string {
  const exportTimestamp = new Date().toISOString();
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
  );

  // Calculate date range
  const dateRange =
    records.length > 0
      ? `${formatDateLocal(sortedRecords[0].dateTime)} to ${formatDateLocal(
          sortedRecords[sortedRecords.length - 1].dateTime
        )}`
      : 'N/A';

  // Count entries by tag
  const tagCounts: Record<string, number> = {};
  records.forEach((r) => {
    r.tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Get tag glossary
  const glossary = getTagGlossary(taxonomy);

  // Build report
  let report = '';

  // ============================================
  // COVER PAGE
  // ============================================
  report += `${'═'.repeat(80)}\n`;
  report += `${caseLabel.toUpperCase()}\n`;
  report += `Evidence Documentation Report\n`;
  report += `${'═'.repeat(80)}\n\n`;

  report += `DATE RANGE: ${dateRange}\n`;
  report += `EXPORT TIMESTAMP: ${exportTimestamp} (UTC)\n`;
  report += `TOTAL ENTRIES: ${records.length}\n\n`;

  report += `INTEGRITY NOTE:\n`;
  report += `This report was generated from timestamped documentation entries stored\n`;
  report += `locally on a private device. Each entry includes cryptographic timestamps\n`;
  report += `and integrity hashes where available. See Appendix for full technical details.\n\n`;

  report += `${'═'.repeat(80)}\n\n`;

  // ============================================
  // EXECUTIVE SUMMARY
  // ============================================
  report += `EXECUTIVE SUMMARY\n`;
  report += `${'─'.repeat(80)}\n\n`;

  if (records.length > 0) {
    const startDate = new Date(sortedRecords[0].dateTime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const endDate = new Date(sortedRecords[sortedRecords.length - 1].dateTime).toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    );

    report += `From ${startDate} to ${endDate}: ${records.length} entries documented.\n\n`;

    report += `Top Categories:\n`;
    topTags.forEach(([tag, count]) => {
      report += `  • #${tag}: ${count} ${count === 1 ? 'entry' : 'entries'}\n`;
    });
    report += `\n`;
  } else {
    report += `No entries to summarize.\n\n`;
  }

  report += `${'═'.repeat(80)}\n\n`;

  // ============================================
  // DETAILED ENTRIES (Chronological)
  // ============================================
  report += `DETAILED ENTRIES (Chronological Order)\n`;
  report += `${'═'.repeat(80)}\n\n`;

  sortedRecords.forEach((record, index) => {
    report += `┌${'─'.repeat(78)}┐\n`;
    report += `│ ENTRY #${String(index + 1).padEnd(71)}│\n`;
    report += `└${'─'.repeat(78)}┘\n\n`;

    // Timestamps
    report += `TIMESTAMP (Local): ${formatDateLocal(record.dateTime)}\n`;
    report += `TIMESTAMP (UTC):   ${formatDateUTC(record.dateTime)}\n`;
    report += `CREATED (UTC):     ${formatDateUTC(record.createdAt)}\n`;
    if (record.editedAt) {
      report += `LAST EDITED (UTC): ${formatDateUTC(record.editedAt)}\n`;
    }
    report += `\n`;

    // Tags
    if (record.tags && record.tags.length > 0) {
      report += `CATEGORIES: ${record.tags.map((t) => `#${t}`).join(', ')}\n`;
    }

    // Severity
    if (record.severity) {
      const severityIndicator = '■'.repeat(record.severity) + '□'.repeat(5 - record.severity);
      report += `SEVERITY: ${record.severity}/5 [${severityIndicator}]\n`;
    }

    // People
    if (record.people && record.people.length > 0) {
      report += `PEOPLE INVOLVED: ${record.people.join(', ')}\n`;
    }

    // Location
    if (record.location) {
      report += `LOCATION: ${record.location}\n`;
    }

    report += `\n`;

    // Description
    report += `SUMMARY:\n`;
    report += `${record.description}\n\n`;

    // Attachments
    if (record.files && record.files.length > 0) {
      report += `ATTACHMENTS (${record.files.length}):\n`;
      record.files.forEach((file, fileIndex) => {
        report += `  [${fileIndex + 1}] ${file.name}`;
        if (file.fileHash) {
          report += ` (Hash: ${getShortHash(file.fileHash)})`;
        }
        report += `\n`;

        // OCR excerpt
        if (file.ocrText) {
          const excerpt =
            file.ocrText.length > 200
              ? file.ocrText.substring(0, 200) + '...'
              : file.ocrText;
          report += `      OCR Excerpt: "${excerpt}"\n`;
        }
      });
      report += `\n`;
    }

    // Content hash
    if (record.contentHash) {
      report += `INTEGRITY HASH: ${record.contentHash}\n`;
    }

    report += `\n${'─'.repeat(80)}\n\n`;
  });

  report += `${'═'.repeat(80)}\n\n`;

  // ============================================
  // APPENDIX
  // ============================================
  report += `APPENDIX\n`;
  report += `${'═'.repeat(80)}\n\n`;

  // Integrity Log
  report += `A. INTEGRITY LOG\n`;
  report += `${'─'.repeat(80)}\n\n`;
  sortedRecords.forEach((record, index) => {
    report += `Entry #${index + 1}:\n`;
    if (record.eventLog && record.eventLog.length > 0) {
      record.eventLog.forEach((event) => {
        report += `  ${event.action.toUpperCase()} at ${formatDateUTC(event.timestamp)}\n`;
      });
    } else {
      report += `  CREATED at ${formatDateUTC(record.createdAt)}\n`;
    }
    if (record.editedAt) {
      report += `  EDITED at ${formatDateUTC(record.editedAt)}\n`;
    }
    report += `  EXPORTED at ${exportTimestamp}\n`;
    report += `\n`;
  });

  report += `\n`;

  // Full File Hashes
  report += `B. FILE HASHES (SHA-256)\n`;
  report += `${'─'.repeat(80)}\n\n`;
  let hasFiles = false;
  sortedRecords.forEach((record, index) => {
    if (record.files && record.files.length > 0) {
      hasFiles = true;
      report += `Entry #${index + 1}:\n`;
      record.files.forEach((file, fileIndex) => {
        report += `  [${fileIndex + 1}] ${file.name}\n`;
        report += `      Hash: ${file.fileHash || 'N/A'}\n`;
        report += `      Type: ${file.type}\n`;
        report += `      Source: ${file.source}\n`;
      });
      report += `\n`;
    }
  });
  if (!hasFiles) {
    report += `No file attachments in this report.\n\n`;
  }

  // Tag Glossary
  report += `C. TAG GLOSSARY\n`;
  report += `${'─'.repeat(80)}\n\n`;
  const usedTags = Object.keys(tagCounts).sort();
  usedTags.forEach((tag) => {
    const category = glossary[tag] || 'Custom';
    const count = tagCounts[tag];
    report += `#${tag}\n`;
    report += `  Category: ${category}\n`;
    report += `  Usage: ${count} ${count === 1 ? 'entry' : 'entries'}\n`;
    report += `\n`;
  });

  report += `\n${'═'.repeat(80)}\n\n`;

  // ============================================
  // LEGAL NOTICE
  // ============================================
  report += `LEGAL NOTICE\n`;
  report += `${'─'.repeat(80)}\n\n`;
  report += `This documentation was created using Record Keeper, a personal evidence\n`;
  report += `documentation application. All entries were timestamped at the time of\n`;
  report += `creation and stored locally on the user's private device.\n\n`;

  report += `This report is provided for documentation purposes only and does not\n`;
  report += `constitute legal advice. The admissibility of this evidence may vary by\n`;
  report += `jurisdiction. Consult with a qualified legal professional regarding the\n`;
  report += `use of this documentation in legal proceedings.\n\n`;

  report += `Cryptographic hashes (SHA-256) are provided where available to demonstrate\n`;
  report += `data integrity. Each entry's hash can be independently verified against the\n`;
  report += `original source files.\n\n`;

  report += `For questions about the technical integrity of this report, please retain\n`;
  report += `the original application data and consult with a digital forensics expert.\n\n`;

  report += `${'═'.repeat(80)}\n`;
  report += `END OF REPORT\n`;
  report += `${'═'.repeat(80)}\n`;

  return report;
}
