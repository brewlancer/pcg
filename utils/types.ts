export interface OrderItem {
  id: string; // generated uuid for react keys
  productName: string;
  quantity: number;
}

export interface Order {
  orderId: string;
  customerName: string;
  items: OrderItem[];
  note: string;
  paymentStatus: string;

  // New Fields
  channel: string; // ช่องทาง
  phoneNumber: string;
  address: string; // Combined address
  trackingNo: string;

  // Catch-all for everything else to satisfy "Show All Columns"
  rawDetails: Record<string, any>;

  // Metadata for the UI
  packed: boolean;
  hasWarning: boolean; // if note is present or status is unpaid
  noteChecked?: boolean; // NEW: track if the packer has read/acknowledged the note
}

export interface ParsedData {
  orders: Order[];
  summary: Record<string, number>; // SKU -> total quantity
}

export interface OrderList {
  id: string;
  name: string;
  orders: Order[];
  summary: Record<string, number>;
  createdAt: number;
}
