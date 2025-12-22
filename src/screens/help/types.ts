// src/screens/help/types.ts

export type TicketStatus = "draft" | "submitted" | "resolved" | "closed";

export type TicketCategory =
  | "Delivery Issue"
  | "Batch Issue"
  | "POD Issue"
  | "Payment/Settlement"
  | "App Bug"
  | "Account"
  | "Other"
  | "Safety";

export type TicketPriority = "Normal" | "High";

export type ContactPreference = "Call" | "WhatsApp" | "Email";

export interface TicketAttachment {
  id: string;
  type: "photo" | "screenshot";
  uri: string;
  name?: string;
}

export interface TicketMetadata {
  appVersion?: string;
  device?: string;
}

export interface SupportTicket {
  id: string;
  createdAt: number;
  updatedAt: number;
  status: TicketStatus;
  category: TicketCategory;
  orderId?: string;
  batchId?: string;
  priority: TicketPriority;
  subject: string;
  description: string;
  attachments: TicketAttachment[];
  contactPreference: ContactPreference;
  consentToShareLogs: boolean;
  metadata: TicketMetadata;
}

export interface FAQ {
  id: string;
  title: string;
  shortAnswer: string;
  details?: string[];
  category?: string;
}

export interface SupportPreferences {
  preferredContactMethod: ContactPreference;
  lastViewedFaqId?: string;
}

export interface TicketFormData {
  category: TicketCategory | null;
  orderId: string;
  batchId: string;
  subject: string;
  description: string;
  attachments: TicketAttachment[];
  contactPreference: ContactPreference;
  consentToShareLogs: boolean;
  priority: TicketPriority;
}

export type TicketFilterTab = "all" | "drafts" | "submitted" | "resolved";

export interface ContactOption {
  id: string;
  type: "call" | "whatsapp" | "email";
  label: string;
  value: string;
  availability: string;
  responseTime: string;
}
