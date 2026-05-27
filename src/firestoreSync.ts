/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc, 
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Client, Strain, Order } from './types';

// Clients collections
const CLIENTS_PATH = 'clients';
const STRAINS_PATH = 'strains';
const ORDERS_PATH = 'orders';

/**
 * Sync local state with Firestore on initial sign-in.
 * If Firestore is empty, upload local data.
 * If Firestore has data, prioritize Firestore.
 */
export async function syncStorageWithFirestore(localClients: Client[], localStrains: Strain[], localOrders: Order[]) {
  try {
    // 1. Fetch strains
    const strainSnapshot = await getDocs(collection(db, STRAINS_PATH));
    let dbStrains: Strain[] = [];
    strainSnapshot.forEach(doc => {
      dbStrains.push(doc.data() as Strain);
    });

    // 2. Fetch clients
    const clientSnapshot = await getDocs(collection(db, CLIENTS_PATH));
    let dbClients: Client[] = [];
    clientSnapshot.forEach(doc => {
      dbClients.push(doc.data() as Client);
    });

    // 3. Fetch orders
    const orderSnapshot = await getDocs(collection(db, ORDERS_PATH));
    let dbOrders: Order[] = [];
    orderSnapshot.forEach(doc => {
      dbOrders.push(doc.data() as Order);
    });

    const isDbEmpty = dbStrains.length === 0 && dbClients.length === 0 && dbOrders.length === 0;

    if (isDbEmpty) {
      console.log('Firestore is empty. Migrating local data to Cloud Firestore...');
      // Migration: upload local data
      const batch = writeBatch(db);
      
      localStrains.forEach(strain => {
        const strainRef = doc(db, STRAINS_PATH, strain.id);
        batch.set(strainRef, strain);
      });

      localClients.forEach(client => {
        const clientRef = doc(db, CLIENTS_PATH, client.id);
        batch.set(clientRef, client);
      });

      localOrders.forEach(order => {
        const orderRef = doc(db, ORDERS_PATH, order.id);
        batch.set(orderRef, order);
      });

      await batch.commit();
      return { clients: localClients, strains: localStrains, orders: localOrders };
    } else {
      console.log('Cloud Firestore data found. Syncing state...');
      return { clients: dbClients, strains: dbStrains, orders: dbOrders };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'sync_initial');
    return null;
  }
}

/**
 * Save static/updated client to Firestore
 */
export async function dbSaveClient(client: Client) {
  try {
    await setDoc(doc(db, CLIENTS_PATH, client.id), client);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${CLIENTS_PATH}/${client.id}`);
  }
}

/**
 * Remove client from Firestore
 */
export async function dbDeleteClient(clientId: string) {
  try {
    await deleteDoc(doc(db, CLIENTS_PATH, clientId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${CLIENTS_PATH}/${clientId}`);
  }
}

/**
 * Save static/updated strain to Firestore
 */
export async function dbSaveStrain(strain: Strain) {
  try {
    await setDoc(doc(db, STRAINS_PATH, strain.id), strain);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${STRAINS_PATH}/${strain.id}`);
  }
}

/**
 * Remove strain from Firestore
 */
export async function dbDeleteStrain(strainId: string) {
  try {
    await deleteDoc(doc(db, STRAINS_PATH, strainId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${STRAINS_PATH}/${strainId}`);
  }
}

/**
 * Save static/updated order to Firestore
 */
export async function dbSaveOrder(order: Order) {
  try {
    await setDoc(doc(db, ORDERS_PATH, order.id), order);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${ORDERS_PATH}/${order.id}`);
  }
}
