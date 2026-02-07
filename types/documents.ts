export interface Document {
  id: number;
  department: string;
  documentType: string;
  room: string;
  purpose: string;
  destination: string;
  issueDays: string;
  requirements: string;
  qrCode?: string;
  link?: string;
}

export interface DocumentCategory {
  title: string;
  documents: Document[];
}