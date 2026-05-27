/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client, Strain, Order } from './types';

export const INITIAL_STRAINS: Strain[] = [
  { id: '1', name: 'Blue Dream', type: 'Sativa', pricePerGram: 10, active: true },
  { id: '2', name: 'Granddaddy Purple', type: 'Indica', pricePerGram: 11, active: true },
  { id: '3', name: 'Sour Diesel', type: 'Sativa', pricePerGram: 12, active: true },
  { id: '4', name: 'Girl Scout Cookies', type: 'Hybrid', pricePerGram: 12, active: true },
  { id: '5', name: 'OG Kush', type: 'Indica', pricePerGram: 11, active: true },
  { id: '6', name: 'Super Lemon Haze', type: 'Sativa', pricePerGram: 13, active: true },
  { id: '7', name: 'Northern Lights', type: 'Indica', pricePerGram: 10, active: true },
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Marcus Thorne',
    phone: '+1 (555) 019-2834',
    email: 'marcus.thorne@domain.com',
    favoriteStrain: 'OG Kush',
    notes: 'Prefers King Size wraps with extra slow burn. Prefers picking up on Friday afternoons.',
    totalSpend: 115.00,
    joinedDate: '2026-02-15T14:30:00Z',
    orderHistory: [
      {
        id: 'o1',
        clientId: 'c1',
        clientName: 'Marcus Thorne',
        date: '2026-05-10T18:15:00Z',
        subtotal: 70.00,
        discount: 5,
        total: 66.50,
        cashReceived: 80.00,
        changeGiven: 13.50,
        notes: 'Quick pickup. Very happy.',
        items: [
          {
            id: 'oi1',
            strainName: 'OG Kush',
            type: 'Indica',
            sizeName: 'Standard (1.0g)',
            sizeGrams: 1.0,
            wrapper: 'Raw Paper',
            isInfused: true,
            quantity: 4,
            pricePerUnit: 17.5, // 11g + 6.5 premium/infused
            total: 70.0
          }
        ]
      },
      {
        id: 'o2',
        clientId: 'c1',
        clientName: 'Marcus Thorne',
        date: '2026-05-24T20:45:00Z',
        subtotal: 48.50,
        discount: 0,
        total: 48.50,
        cashReceived: 50.00,
        changeGiven: 1.50,
        notes: 'Standard prep.',
        items: [
          {
            id: 'oi2',
            strainName: 'OG Kush',
            type: 'Indica',
            sizeName: 'Standard (1.0g)',
            sizeGrams: 1.0,
            wrapper: 'Hemp Wrap',
            isInfused: false,
            quantity: 3,
            pricePerUnit: 12.0, // 11g + 1 wrapper
            total: 36.0
          },
          {
            id: 'oi3',
            strainName: 'Blue Dream',
            type: 'Sativa',
            sizeName: 'Shorty (0.5g)',
            sizeGrams: 0.5,
            wrapper: 'Raw Paper',
            isInfused: false,
            quantity: 2,
            pricePerUnit: 6.25, // 5g + 1.25 base
            total: 12.50
          }
        ]
      }
    ]
  },
  {
    id: 'c2',
    name: 'Elena Rostova',
    phone: '+1 (555) 382-9901',
    email: 'elena.rost@webmail.org',
    favoriteStrain: 'Sour Diesel',
    notes: 'Enjoys energetic Sativas. Prefers organic rice papers. Usually orders bundles.',
    totalSpend: 138.00,
    joinedDate: '2026-03-22T09:12:00Z',
    orderHistory: [
      {
        id: 'o3',
        clientId: 'c2',
        clientName: 'Elena Rostova',
        date: '2026-05-18T16:20:00Z',
        subtotal: 138.00,
        discount: 0,
        total: 138.00,
        cashReceived: 140.00,
        changeGiven: 2.00,
        notes: 'Requested kief dusting on all. Smooth checkout.',
        items: [
          {
            id: 'oi4',
            strainName: 'Sour Diesel',
            type: 'Sativa',
            sizeName: 'King (1.5g)',
            sizeGrams: 1.5,
            wrapper: 'Raw Paper',
            isInfused: true,
            quantity: 6,
            pricePerUnit: 23.0, // 12 * 1.5 = 18 + 5 infusion
            total: 138.0
          }
        ]
      }
    ]
  },
  {
    id: 'c3',
    name: 'Jordan Sparks',
    phone: '+1 (555) 881-2356',
    email: 'jordan.s@pulse.io',
    favoriteStrain: 'Blue Dream',
    notes: 'Sweet tooth. Loves blunt wraps. Prefers high potency.',
    totalSpend: 62.00,
    joinedDate: '2026-04-05T11:45:00Z',
    orderHistory: [
      {
        id: 'o4',
        clientId: 'c3',
        clientName: 'Jordan Sparks',
        date: '2026-05-20T22:00:00Z',
        subtotal: 62.00,
        discount: 0,
        total: 62.00,
        cashReceived: 100.00,
        changeGiven: 38.00,
        notes: 'Wants delivery next time.',
        items: [
          {
            id: 'oi5',
            strainName: 'Blue Dream',
            type: 'Sativa',
            sizeName: 'Double (2.0g)',
            sizeGrams: 2.0,
            wrapper: 'Blunt Wrap',
            isInfused: false,
            quantity: 2,
            pricePerUnit: 22.0, // 10 * 2 = 20 + 2 blunt wrap
            total: 44.0
          },
          {
            id: 'oi6',
            strainName: 'Girl Scout Cookies',
            type: 'Hybrid',
            sizeName: 'Standard (1.0g)',
            sizeGrams: 1.0,
            wrapper: 'Organic Rice',
            isInfused: false,
            quantity: 1,
            pricePerUnit: 18.0, // 12 + 6 kief/filter premium
            total: 18.0
          }
        ]
      }
    ]
  }
];

// Helper to get state
export function getSavedStrains(): Strain[] {
  const saved = localStorage.getItem('prerolll_strains');
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { /* ignore */ }
  }
  localStorage.setItem('prerolll_strains', JSON.stringify(INITIAL_STRAINS));
  return INITIAL_STRAINS;
}

export function saveStrains(strains: Strain[]) {
  localStorage.setItem('prerolll_strains', JSON.stringify(strains));
}

export function getSavedClients(): Client[] {
  const saved = localStorage.getItem('prerolll_clients');
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { /* ignore */ }
  }
  localStorage.setItem('prerolll_clients', JSON.stringify(INITIAL_CLIENTS));
  return INITIAL_CLIENTS;
}

export function saveClients(clients: Client[]) {
  localStorage.setItem('prerolll_clients', JSON.stringify(clients));
}

export function getSavedGlobalOrders(): Order[] {
  // Aggregate from clients default data + custom walk-ins
  const saved = localStorage.getItem('prerolll_walkin_orders');
  let walkins: Order[] = [];
  if (saved) {
    try { walkins = JSON.parse(saved); } catch (e) { /* ignore */ }
  }
  
  const clients = getSavedClients();
  const clientOrders = clients.flatMap(c => c.orderHistory);
  
  const allOrders = [...clientOrders, ...walkins];
  // Sort reverse chronological
  return allOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function addWalkinOrder(order: Order) {
  const saved = localStorage.getItem('prerolll_walkin_orders');
  let walkins: Order[] = [];
  if (saved) {
    try { walkins = JSON.parse(saved); } catch (e) { /* ignore */ }
  }
  walkins.push(order);
  localStorage.setItem('prerolll_walkin_orders', JSON.stringify(walkins));
}
