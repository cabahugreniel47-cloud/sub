import React from 'react';
import { DocumentExportModal } from './DocumentExportModal';

export const PrintCensusModal: React.FC = () => {
  return (
    <DocumentExportModal
      documentType="census"
      title="Official University Clinic Morbidity & Census Form"
    />
  );
};
