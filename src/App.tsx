/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Client, Strain, Order } from './types';
import { 
  getSavedClients, 
  saveClients, 
  getSavedStrains, 
  saveStrains, 
  getSavedGlobalOrders, 
  addWalkinOrder 
} from './defaultData';
import Overview from './components/Overview';
import CashCalculator from './components/CashCalculator';
import ClientBase from './components/ClientBase';
import StrainsManager from './components/StrainsManager';
import WorkspaceHub from './components/WorkspaceHub';
import { initAuth } from './firebase';
import { 
  Flame, 
  Users, 
  Leaf, 
  LayoutDashboard, 
  Clock, 
  UserCheck, 
  DollarSign, 
  ShieldCheck,
  Cpu,
  Cloud
} from 'lucide-react';

export default function App() {
  
  // Tab routing
  const [activeTab, setActiveTab] = useState<'overview' | 'calc' | 'clients' | 'strains' | 'workspace'>('overview');
  
  // Primary state pools
  const [clients, setClients] = useState<Client[]>([]);
  const [strains, setStrains] = useState<Strain[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Google Auth dynamic states
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Navigation helper state
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  
  // Real-time UTC ticking clock for high-concept realism
  const [currentTime, setCurrentTime] = useState<string>('');

  // Initial load sync
  useEffect(() => {
    setClients(getSavedClients());
    setStrains(getSavedStrains());
    setOrders(getSavedGlobalOrders());

    // Listen to Google Auth states
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );

    // Tick clock
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, []);

  // Sync state pools dynamically with Firestore database when user logs in with Google OAuth connection
  useEffect(() => {
    if (user && accessToken) {
      import('./firestoreSync').then(({ syncStorageWithFirestore }) => {
        syncStorageWithFirestore(clients, strains, orders).then((syncRes) => {
          if (syncRes) {
            setClients(syncRes.clients);
            setStrains(syncRes.strains);
            setOrders(syncRes.orders);
            saveClients(syncRes.clients);
            saveStrains(syncRes.strains);
          }
        });
      });
    }
  }, [user, accessToken]);

  // Update real-time arrays & write back to LocalStorage
  const handleAddOrder = (order: Order, clientJsonString?: string) => {
    let updatedClients = [...clients];
    
    // Check if we also need to enroll a custom Client first
    if (clientJsonString) {
      try {
        const metadata = JSON.parse(clientJsonString);
        const newClient: Client = {
          id: `c-${Date.now()}`,
          name: metadata.name,
          phone: metadata.phone,
          email: metadata.email || '',
          favoriteStrain: order.items[0]?.strainName || '',
          notes: 'Customer enrolled during cash register assembly checkout.',
          totalSpend: order.total,
          joinedDate: new Date().toISOString(),
          orderHistory: [order]
        };
        // Re-assign appropriate relationship pointer
        order.clientId = newClient.id;
        updatedClients.push(newClient);
      } catch (err) {
        console.error("Failed to parse quick customer registration metadata", err);
      }
    } else if (order.clientId) {
      // Find existing customer, append transaction, update total spend in stats
      updatedClients = clients.map(c => {
        if (c.id === order.clientId) {
          const currentHistory = c.orderHistory || [];
          return {
            ...c,
            totalSpend: parseFloat((c.totalSpend + order.total).toFixed(2)),
            orderHistory: [order, ...currentHistory],
            // Update favorite strain over time automatically if needed
            favoriteStrain: order.items[0]?.strainName || c.favoriteStrain
          };
        }
        return c;
      });
    } else {
      // Pure walk-in guest order, written to auxiliary ledger file log
      addWalkinOrder(order);
    }

    // Save state
    saveClients(updatedClients);
    setClients(updatedClients);
    
    // Auto-sync new sale transaction or registered CRM client to Firestore database if online
    if (user) {
      import('./firestoreSync').then(({ dbSaveClient, dbSaveOrder }) => {
        if (clientJsonString) {
          try {
            const raw = JSON.parse(clientJsonString);
            const matchesNewClient = updatedClients.find(c => c.phone === raw.phone);
            if (matchesNewClient) {
              dbSaveClient(matchesNewClient);
            }
          } catch(e) {}
        } else if (order.clientId) {
          const matchedExistC = updatedClients.find(c => c.id === order.clientId);
          if (matchedExistC) {
            dbSaveClient(matchedExistC);
          }
        }
        dbSaveOrder(order);
      });
    }

    // Refresh local orders list
    const allLatestOrders = getSavedGlobalOrders();
    setOrders(allLatestOrders);
  };

  // Client database callbacks
  const handleAddClient = (clientData: Omit<Client, 'id' | 'joinedDate' | 'orderHistory' | 'totalSpend'>) => {
    const newClient: Client = {
      ...clientData,
      id: `c-${Date.now()}`,
      joinedDate: new Date().toISOString(),
      orderHistory: [],
      totalSpend: 0
    };
    const updated = [...clients, newClient];
    saveClients(updated);
    setClients(updated);
    setSelectedClientId(newClient.id);

    // Save client to firestore if online
    if (user) {
      import('./firestoreSync').then(({ dbSaveClient }) => {
        dbSaveClient(newClient);
      });
    }
  };

  const handleUpdateClient = (id: string, updatedFields: Partial<Client>) => {
    const updated = clients.map(c => {
      if (c.id === id) {
        return { ...c, ...updatedFields };
      }
      return c;
    });
    saveClients(updated);
    setClients(updated);

    // Sync edited client fields to Firestore
    if (user) {
      const targetC = updated.find(c => c.id === id);
      if (targetC) {
        import('./firestoreSync').then(({ dbSaveClient }) => {
          dbSaveClient(targetC);
        });
      }
    }
  };

  const handleDeleteClient = (id: string) => {
    const updated = clients.filter(c => c.id !== id);
    saveClients(updated);
    setClients(updated);
    if (selectedClientId === id) {
      setSelectedClientId('');
    }

    // Delete client from firestore if online
    if (user) {
      import('./firestoreSync').then(({ dbDeleteClient }) => {
        dbDeleteClient(id);
      });
    }
  };

  // Strains database callbacks
  const handleAddStrain = (strainData: Omit<Strain, 'id'>) => {
    const newStrain: Strain = {
      ...strainData,
      id: `s-${Date.now()}`
    };
    const updated = [...strains, newStrain];
    saveStrains(updated);
    setStrains(updated);

    // Sync strain creation to Firestore
    if (user) {
      import('./firestoreSync').then(({ dbSaveStrain }) => {
        dbSaveStrain(newStrain);
      });
    }
  };

  const handleUpdateStrain = (id: string, updatedFields: Partial<Strain>) => {
    const updated = strains.map(s => {
      if (s.id === id) {
        return { ...s, ...updatedFields };
      }
      return s;
    });
    saveStrains(updated);
    setStrains(updated);

    // Sync strain update to Firestore
    if (user) {
      const targetS = updated.find(s => s.id === id);
      if (targetS) {
        import('./firestoreSync').then(({ dbSaveStrain }) => {
          dbSaveStrain(targetS);
        });
      }
    }
  };

  const handleDeleteStrain = (id: string) => {
    const updated = strains.filter(s => s.id !== id);
    saveStrains(updated);
    setStrains(updated);

    // Sync strain deletion to Firestore
    if (user) {
      import('./firestoreSync').then(({ dbDeleteStrain }) => {
        dbDeleteStrain(id);
      });
    }
  };

  // Interactive router navigation bridges
  const navigateToCalculator = () => {
    setActiveTab('calc');
  };

  const navigateToClients = () => {
    setActiveTab('clients');
    // Ensure first client is focused if none selected
    if (!selectedClientId && clients.length > 0) {
      setSelectedClientId(clients[0].id);
    }
  };

  const handleSelectClientFromOuter = (clientId: string) => {
    setSelectedClientId(clientId);
    setActiveTab('clients');
  };

  return (
    <div className="min-h-screen bg-[#0e110e] text-stone-100 flex flex-col font-sans">
      
      {/* Interactive, elegant luxury Header branding bar */}
      <header className="border-b border-stone-850 bg-[#121512]/90 backdrop-blur sticky top-0 z-40 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 border border-emerald-900/40 flex items-center justify-center text-emerald-500 shadow-md">
              <Flame className="w-5 h-5 fill-emerald-500/10 stroke-[2]" />
            </div>
            <div className="text-left">
              <h1 className="text-md font-sans font-black tracking-tight uppercase text-stone-100 flex items-center gap-1">
                PREROLL LEDGER <span className="text-[9px] font-mono tracking-widest text-[#10b981] bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-900/50">v2.4</span>
              </h1>
              <p className="text-[10px] font-mono text-stone-400">
                Dispensary CRM & Cash Till Calculator
              </p>
            </div>
          </div>

          {/* Realtime Stats / System Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-mono text-stone-400">
            <span className="flex items-center gap-1.5 bg-stone-900/40 py-1 px-2.5 rounded border border-stone-850">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <span>{currentTime || 'Synchronizing Time...'}</span>
            </span>
            {user ? (
              <span className="flex items-center gap-1.5 bg-stone-900/40 py-1.5 px-3 rounded border border-emerald-900/60 text-emerald-400 font-extrabold shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>Cloud Register Online</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-stone-900/40 py-1.5 px-2.5 rounded border border-stone-850 text-stone-500">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-600 shrink-0" />
                <span>Workspace Offline</span>
              </span>
            )}
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 md:py-8 space-y-6">
        
        {/* Navigation Tab Menu Grid */}
        <div className="flex items-center border-b border-stone-850 bg-[#121512]/50 p-1 rounded-xl max-w-2xl mx-auto flex-wrap sm:flex-nowrap">
          <button
            id="tab-overview"
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'overview'
                ? 'bg-emerald-600 text-stone-950 font-extrabold shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Overview
          </button>

          <button
            id="tab-calc"
            onClick={() => setActiveTab('calc')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'calc'
                ? 'bg-emerald-600 text-stone-950 font-extrabold shadow-md'
                : 'text-stone-400 hover:text-stone-200 font-bold'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Rolling Calc
          </button>

          <button
            id="tab-clients"
            onClick={() => setActiveTab('clients')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'clients'
                ? 'bg-emerald-600 text-stone-950 font-extrabold shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Clients
          </button>

          <button
            id="tab-strains"
            onClick={() => setActiveTab('strains')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'strains'
                ? 'bg-emerald-600 text-stone-950 font-extrabold shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            Inventory
          </button>

          <button
            id="tab-workspace"
            onClick={() => setActiveTab('workspace')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'workspace'
                ? 'bg-emerald-600 text-stone-950 font-extrabold shadow-md'
                : 'text-[#a7f3d0] hover:text-[#34d399]/90 font-bold'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            Sync Hub
          </button>
        </div>

        {/* Workspace Dynamic Tab Space */}
        <div className="min-h-[460px]">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="tab-overview-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <Overview 
                  clients={clients}
                  strains={strains}
                  orders={orders}
                  onNavigateToCalc={navigateToCalculator}
                  onNavigateToClients={navigateToClients}
                  onSelectClient={handleSelectClientFromOuter}
                />
              </motion.div>
            )}

            {activeTab === 'calc' && (
              <motion.div
                key="tab-calc-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <CashCalculator 
                  clients={clients}
                  strains={strains}
                  onAddOrder={handleAddOrder}
                  onNavigateToClients={navigateToClients}
                  accessToken={accessToken}
                />
              </motion.div>
            )}

            {activeTab === 'clients' && (
              <motion.div
                key="tab-clients-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <ClientBase 
                  clients={clients}
                  strains={strains}
                  selectedClientId={selectedClientId}
                  onSelectClient={setSelectedClientId}
                  onAddClient={handleAddClient}
                  onUpdateClient={handleUpdateClient}
                  onDeleteClient={handleDeleteClient}
                  accessToken={accessToken}
                />
              </motion.div>
            )}

            {activeTab === 'strains' && (
              <motion.div
                key="tab-strains-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <StrainsManager 
                  strains={strains}
                  onAddStrain={handleAddStrain}
                  onUpdateStrain={handleUpdateStrain}
                  onDeleteStrain={handleDeleteStrain}
                />
              </motion.div>
            )}

            {activeTab === 'workspace' && (
              <motion.div
                key="tab-workspace-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <WorkspaceHub 
                  user={user}
                  accessToken={accessToken}
                  clients={clients}
                  onAddClient={handleAddClient}
                  onRefreshAuth={(u, tok) => {
                    setUser(u);
                    setAccessToken(tok);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>

      {/* Footer System indicators info bar */}
      <footer className="border-t border-stone-850 bg-[#0e110e] text-stone-500 py-6 text-center text-[10px] font-mono space-y-2 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <div>
            Preroll Joint Ledger System &bull; Secure Client-persistent Database
          </div>
          <div className="flex items-center gap-1 bg-stone-900 border border-stone-850 px-2 py-1 rounded">
            <Cpu className="w-3 h-3 text-emerald-400" />
            <span>Local Offline Cache Active: Node Session Persistent</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
