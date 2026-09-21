export interface ExportCustomizationParams {
  institutionName?: string;
  reportTitle?: string;
  academicYear?: string;
  signerTitle?: string;
  notes?: string;
}

export type ExportFormat = 'EXCEL' | 'PDF';
