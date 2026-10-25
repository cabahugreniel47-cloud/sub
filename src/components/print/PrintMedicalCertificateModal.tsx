import React from 'react';
import { DocumentExportModal } from './DocumentExportModal';

export const PrintMedicalCertificateModal: React.FC = () => {
  return (
    <DocumentExportModal
      documentType="medical-certificate"
      title="Official Medical Certificate & Health Clearance"
    />
  );
};
