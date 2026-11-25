export type ItemCategory = 
  | 'Beans & Roasts' 
  | 'Dairy & Alternative Milk' 
  | 'Syrups & Flavors' 
  | 'Bakery & Snacks' 
  | 'Packaging & Cups' 
  | 'Tea & Matcha';

export type StockStatus = 'In Stock' | 'Low Stock' | 'Critical' | 'Out of Stock';

export type LocationId = 'loc-main' | 'loc-truck-1' | 'loc-truck-2' | 'loc-kiosk-tech';

export interface LocationInfo {
  id: LocationId;
  name: string;
  type: 'Roastery Cafe' | 'Mobile Food Truck' | 'Self-Service Kiosk';
  address: string;
  activeOrders: number;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: ItemCategory;
  stock: number;
  unit: 'kg' | 'g' | 'L' | 'ml' | 'units' | 'bottles' | 'boxes';
  minThreshold: number;
  costPerUnit: number; // e.g. $18.50 per kg
  sellingPrice?: number;
  locationId: LocationId;
  batchNumber: string;
  expiryDate: string;
  lastUpdated: string;
  status: StockStatus;
}

export interface KioskOrder {
  id: string;
  orderNumber: string;
  channel: 'Website' | 'Mobile App' | 'Self-Service Kiosk' | 'Tablet' | 'Walk-in / Counter'
    | 'QR Code Table' | 'Mobile Food Truck Counter';
  locationId: LocationId;
  customerName: string;
  customerPhone?: string;
  items: {
    inventoryItemId?: string;
    name: string;
    quantity: number;
    options?: string;
    price: number;
  }[];
  totalAmount: number;
  stripeStatus: 'Unpaid' | 'Paid' | 'Processing' | 'Failed' | 'Refunded';
  stripeChargeId: string;
  orderStatus: 'Incoming' | 'Brewing / Prep' | 'Ready for Pickup' | 'Completed' | 'Cancelled';
  paymentMethod?: 'Card' | 'Apple Pay' | 'Google Pay' | 'Cash' | 'Stripe' | 'App Wallet';
  createdAt: string;
}

export interface StockAdjustmentLog {
  id: string;
  itemId: string;
  itemName: string;
  type: 'Restock' | 'Wastage / Dial-in' | 'Inter-location Transfer' | 'Sale Deduction';
  amount: number;
  unit: string;
  reason: string;
  timestamp: string;
  user: string;
}

export interface LoyaltyMember {
  id: string;
  name: string;
  email: string;
  tier: 'Gold Roaster' | 'Silver Barista' | 'Member';
  points: number;
  stampsCount: number; // e.g. 8/10 for free cup
  subscriptionPlan?: 'Tallio Mug Club (Unlimited Batch Brew)' | 'Home Roaster Bi-Weekly Box' | 'None';
  monthlySpend: number;
  lastVisit: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  itemsSummary: string;
  totalCost: number;
  status: 'Draft' | 'Sent to Supplier' | 'Delivered' | 'Partially Received';
  orderDate: string;
}

export interface PaymentTransaction {
  id: string;
  transactionRef: string;
  customerName: string;
  channel: 'Self-Service Kiosk' | 'QR Code Table' | 'Mobile Food Truck' | 'Mug Club Subscription';
  amount: number;
  fee: number;
  netRevenue: number;
  method: 'Apple Pay' | 'Credit Card' | 'Google Pay' | 'Stripe Connect';
  status: 'Settled' | 'Processing' | 'Refunded';
  payoutStatus: 'Paid Out' | 'Pending in Stripe' | 'Scheduled Daily Transfer';
  timestamp: string;
  receiptUrl?: string;
}

export type CustomerTier = 'Regular' | 'Mug Club Member' | 'VIP Gold';
export type CustomerStatus = 'Active' | 'Inactive';

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  membership: CustomerTier;
  status: CustomerStatus;
  totalOrders: number;
  totalSpend: number;
  loyaltyPoints: number;
  favoriteDrink: string;
  preferredLocation: string;
  lastOrderDate: string;
  joinedDate: string;
}

