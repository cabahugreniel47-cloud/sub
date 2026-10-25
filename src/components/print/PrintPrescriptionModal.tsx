import React from 'react';
import { DocumentExportModal } from './DocumentExportModal';

export const PrintPrescriptionModal: React.FC = () => {
  return <DocumentExportModal documentType="rx" title="Official Electronic Prescription Preview (Rx)" />;
};
