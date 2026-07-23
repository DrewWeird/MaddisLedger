export interface StockItem {
  id: number;
  code: string;
  category: string;
  name: string;
  size: string | null;
  unitPrice: number;
  quantityOnHand: number;
  quantityOnOrder: number;
  reorderLevel: number;
  isActive: boolean;
}

export type SaveStockItem = Omit<StockItem, 'id'>;

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postalCode: string | null;
}

export type SaveCustomer = Omit<Customer, 'id'>;

export interface BusinessProfile {
  id: number;
  businessName: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
  bankName: string | null;
  bankAccountHolder: string | null;
  bankAccountNumber: string | null;
  bankBranchCode: string | null;
  logoPath: string | null;
}

export type SaveBusinessProfile = Omit<BusinessProfile, 'id' | 'logoPath'>;

export type DocumentStatus = 'Active' | 'Voided';

export interface InvoiceLineItem {
  id: number;
  stockItemId: number;
  descriptionSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  lineTotal: number;
  deliveredQuantity: number;
  remainingQuantity: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  customerId: number;
  customerNameSnapshot: string;
  customerAddressSnapshot: string | null;
  issueDate: string;
  status: DocumentStatus;
  total: number;
  notes: string | null;
  pdfPath: string | null;
  createdAt: string;
  lineItems: InvoiceLineItem[];
}

export interface InvoiceSummary {
  id: number;
  invoiceNumber: string;
  customerId: number;
  customerNameSnapshot: string;
  issueDate: string;
  status: DocumentStatus;
  total: number;
}

export interface CreateInvoiceLineItem {
  stockItemId: number;
  quantity: number;
  unitPrice: number;
}

export interface CreateInvoice {
  customerId: number;
  issueDate: string;
  notes?: string;
  lineItems: CreateInvoiceLineItem[];
}

export interface DeliverableLine {
  invoiceLineItemId: number;
  descriptionSnapshot: string;
  orderedQuantity: number;
  alreadyDeliveredQuantity: number;
  remainingQuantity: number;
}

export interface DeliveryNoteLineItem {
  id: number;
  invoiceLineItemId: number;
  descriptionSnapshot: string;
  quantityDelivered: number;
}

export interface DeliveryNote {
  id: number;
  deliveryNoteNumber: string;
  invoiceId: number;
  invoiceNumber: string;
  customerId: number;
  customerNameSnapshot: string;
  deliveryDate: string;
  status: DocumentStatus;
  notes: string | null;
  pdfPath: string | null;
  createdAt: string;
  lineItems: DeliveryNoteLineItem[];
}

export interface DeliveryNoteSummary {
  id: number;
  deliveryNoteNumber: string;
  invoiceId: number;
  invoiceNumber: string;
  customerNameSnapshot: string;
  deliveryDate: string;
  status: DocumentStatus;
}

export interface CreateDeliveryNoteLineItem {
  invoiceLineItemId: number;
  quantityDelivered: number;
}

export interface CreateDeliveryNote {
  invoiceId: number;
  deliveryDate: string;
  notes?: string;
  lineItems: CreateDeliveryNoteLineItem[];
}

export interface LowStockItem {
  id: number;
  code: string;
  category: string;
  name: string;
  size: string | null;
  quantityOnHand: number;
  reorderLevel: number;
}

export interface DashboardSummary {
  invoiceCountToday: number;
  invoiceTotalToday: number;
  lowStockItemCount: number;
}

export interface VoidDocument {
  reason?: string;
}
