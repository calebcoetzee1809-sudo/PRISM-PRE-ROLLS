/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OrderItem {
  id: string;
  strainName: string;
  type: 'Indica' | 'Sativa' | 'Hybrid';
  sizeName: string; // "Shorty (0.5g)", "Standard (1.0g)", "King (1.5g)", "Double (2.0g)", Custom
  sizeGrams: number;
  wrapper: string; // "Raw Paper", "Hemp Wrap", "Organic Rice", "Blunt Wrap"
  isInfused: boolean; // Hash / Kief oil infusion (+ premium)
  quantity: number;
  pricePerUnit: number;
  total: number;
}

export interface Order {
  id: string;
  clientId?: string; // Optional if walk-in customer
  clientName: string; // Name for easy display
  date: string; // ISO String
  items: OrderItem[];
  subtotal: number;
  discount: number; // in percentage or fixed
  total: number;
  cashReceived: number;
  changeGiven: number;
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  favoriteStrain: string;
  notes: string;
  totalSpend: number;
  joinedDate: string;
  orderHistory: Order[];
  appointments?: {
    id: string;
    summary: string;
    description?: string;
    dateTime: string;
    meetLink?: string;
  }[];
}

export interface Strain {
  id: string;
  name: string;
  type: 'Indica' | 'Sativa' | 'Hybrid';
  pricePerGram: number;
  active: boolean;
}
