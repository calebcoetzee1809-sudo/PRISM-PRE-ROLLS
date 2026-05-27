/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Client, Strain, Order } from '../types';
import { 
  Search, 
  UserPlus, 
  Trash2, 
  Edit3, 
  Phone, 
  Mail, 
  Sparkles, 
  Calendar, 
  DollarSign, 
  Archive, 
  Heart,
  ChevronRight,
  Clock,
  Check,
  X
} from 'lucide-react';
import ClientScheduler from './ClientScheduler';


interface ClientBaseProps {
  clients: Client[];
  strains: Strain[];
  selectedClientId: string;
  onSelectClient: (id: string) => void;
  onAddClient: (client: Omit<Client, 'id' | 'joinedDate' | 'orderHistory' | 'totalSpend'>) => void;
  onUpdateClient: (id: string, updated: Partial<Client>) => void;
  onDeleteClient: (id: string) => void;
  accessToken: string | null;
}

export default function ClientBase({
  clients,
  strains,
  selectedClientId,
  onSelectClient,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  accessToken
}: ClientBaseProps) {
  
  // Search query
  const [searchQuery, setSearchQuery] = useState('');
  
  // Client editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editFavStrain, setEditFavStrain] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Client creation modal toggle
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newFavStrain, setNewFavStrain] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const activeClient = clients.find(c => c.id === selectedClientId) || null;

  // Filter client base
  const filteredClients = clients.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.favoriteStrain.toLowerCase().includes(q)
    );
  });

  // Handle open edit state
  const handleStartEdit = () => {
    if (!activeClient) return;
    setEditName(activeClient.name);
    setEditPhone(activeClient.phone);
    setEditEmail(activeClient.email);
    setEditFavStrain(activeClient.favoriteStrain);
    setEditNotes(activeClient.notes);
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient) return;
    onUpdateClient(activeClient.id, {
      name: editName,
      phone: editPhone,
      email: editEmail,
      favoriteStrain: editFavStrain,
      notes: editNotes
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;
    onAddClient({
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim(),
      favoriteStrain: newFavStrain,
      notes: newNotes.trim()
    });
    
    // Clear forms
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewFavStrain('');
    setNewNotes('');
    setIsAddingNew(false);
  };

  const handleDeleteTrigger = (id: string) => {
    if (confirm("Are you sure you want to remove this client from the active LEDGER? All historic sales metadata remains archived in cumulative stats, but this record will be deleted.")) {
      onDeleteClient(id);
    }
  };

  // Quick helper to fetch customer order frequency
  const getOrderCount = (c: Client) => c.orderHistory ? c.orderHistory.length : 0;

  // Calculate Average ticket per client
  const getAverageSpend = (c: Client) => {
    const orders = c.orderHistory || [];
    if (orders.length === 0) return 0;
    return c.totalSpend / orders.length;
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-sans font-bold text-stone-100 flex items-center gap-2">
            <Archive className="text-emerald-500 w-6 h-6 stroke-[2]" />
            Client Base Manager & CRM
          </h2>
          <p className="text-xs font-mono text-stone-400 mt-1">
            Search customer records, audit joint formulations, update purchase annotations, and track customer lifespand metrics.
          </p>
        </div>
        
        <button
          id="btn-trigger-signup"
          onClick={() => setIsAddingNew(true)}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-stone-900 font-sans font-semibold py-2 px-4 rounded-lg shadow transition-colors cursor-pointer text-xs"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
          Enroll New Customer
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column - Customer Database Listing (Grid Col: 4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-3">
            <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase tracking-wider block">
              Customer Directory Search
            </span>

            {/* Quick search container */}
            <div className="relative bg-stone-950 border border-stone-850 rounded-lg flex items-center px-2.5 py-1.5 shadow">
              <Search className="w-4 h-4 text-stone-500 shrink-0 mr-2" />
              <input 
                id="search-client"
                type="text"
                placeholder="Search name, phone, strain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-stone-200 text-xs font-mono border-0 focus:ring-0 focus:outline-none placeholder-stone-600"
              />
              {searchQuery && (
                <button 
                  id="btn-clear-search"
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-mono text-stone-400 hover:text-stone-200 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            
            <div className="text-[10px] font-mono text-stone-500 flex justify-between px-1">
              <span>Showing {filteredClients.length} of {clients.length} results</span>
              <span>Filter ACTIVE</span>
            </div>
          </div>

          {/* Customer list core */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow">
            <div className="max-h-[500px] overflow-y-auto divide-y divide-stone-850">
              {filteredClients.length === 0 ? (
                <div className="p-8 text-center text-stone-550 text-xs font-mono space-y-2">
                  <div>No clients found matching directory search filters.</div>
                  <button
                    id="btn-enroll-first"
                    onClick={() => setIsAddingNew(true)}
                    className="text-emerald-500 hover:text-emerald-400 underline"
                  >
                    Quick Enroll Client
                  </button>
                </div>
              ) : (
                filteredClients.map((client) => {
                  const isCurSelected = client.id === selectedClientId;
                  return (
                    <div
                      key={client.id}
                      id={`list-client-card-${client.id}`}
                      onClick={() => onSelectClient(client.id)}
                      className={`p-3.5 text-left cursor-pointer transition-all flex items-center justify-between group ${
                        isCurSelected 
                          ? 'bg-emerald-950/40 border-l-4 border-l-emerald-500' 
                          : 'bg-stone-900 hover:bg-stone-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-stone-800 border border-stone-750 flex items-center justify-center font-mono text-stone-400 font-bold text-xs uppercase group-hover:bg-emerald-900/10 group-hover:text-emerald-400 group-hover:border-emerald-900/50 transition-colors">
                          {client.name.split(' ').map(n=>n[0]).join('')}
                        </div>
                        <div>
                          <div className={`text-xs font-sans font-bold ${isCurSelected ? 'text-emerald-400' : 'text-stone-200'}`}>
                            {client.name}
                          </div>
                          <span className="text-[9px] font-mono text-stone-400 block mt-0.5">
                            {client.favoriteStrain ? `Pref: ${client.favoriteStrain}` : 'No strain set'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-stone-200">${client.totalSpend.toFixed(2)}</div>
                        <span className="text-[8px] font-mono text-stone-500">
                          {getOrderCount(client)} orders
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right column - Customer Ledger Focus Detail Sheet (Grid Col: 8) */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {!activeClient ? (
              <motion.div 
                key="no-client-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-stone-900 border border-stone-800 border-dashed rounded-xl p-12 text-center"
              >
                <div className="mx-auto w-12 h-12 bg-stone-800 rounded-full flex items-center justify-center text-stone-550 mb-4">
                  <Archive className="w-6 h-6" />
                </div>
                <h4 className="font-sans font-bold text-stone-300">Browse Customer Records</h4>
                <p className="text-xs font-mono text-stone-500 max-w-sm mx-auto mt-2">
                  Select a registered client from the directory directory search list on the left to review their purchase history logs, joint configurations, custom annotations, and total spent.
                </p>
              </motion.div>
            ) : isEditing ? (
              /* Profile Editor layout formulation */
              <motion.form 
                key="edit-client-panel"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                onSubmit={handleSaveEdit}
                className="bg-stone-900 border border-stone-800 rounded-xl p-6 space-y-5 text-left"
              >
                <div className="flex justify-between items-center border-b border-stone-800 pb-3">
                  <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold flex items-center gap-1">
                    <Edit3 className="w-3.5 h-3.5" />
                    Modify Client Record: {activeClient.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      id="edit-cancel"
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-stone-400 hover:text-stone-200 p-1.5 text-xs font-mono cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      id="edit-save"
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-500 text-stone-900 font-sans font-bold text-xs py-1.5 px-4 rounded-md transition cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-stone-400 uppercase font-semibold">Full Name *</label>
                    <input
                      id="edit-client-name"
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-850 text-stone-200 text-xs font-mono py-2 px-3 rounded-lg focus:outline-none focus:border-stone-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-stone-400 uppercase font-semibold">Phone Contact *</label>
                    <input
                      id="edit-client-phone"
                      type="text"
                      required
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-850 text-stone-200 text-xs font-mono py-2 px-3 rounded-lg focus:outline-none focus:border-stone-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-stone-400 uppercase font-semibold">Email Address</label>
                    <input
                      id="edit-client-email"
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-850 text-stone-200 text-xs font-mono py-2 px-3 rounded-lg focus:outline-none focus:border-stone-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-stone-400 uppercase font-semibold">Preferred Strain</label>
                    <select
                      id="edit-client-fav-strain"
                      value={editFavStrain}
                      onChange={(e) => setEditFavStrain(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-850 text-stone-200 text-xs font-mono py-2 px-3 rounded-lg focus:outline-none focus:border-stone-700"
                    >
                      <option value="">No specific strain</option>
                      {strains.map(s => (
                        <option key={s.id} value={s.name}>{s.name} ({s.type})</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-mono text-stone-400 uppercase font-semibold">CRM Notes & Custom Preroll Needs</label>
                    <textarea
                      id="edit-client-notes"
                      rows={3}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="E.g. Prefers raw classic 1.5g wraps, kief layers. Only text messages."
                      className="w-full bg-stone-950 border border-stone-850 text-stone-200 text-xs font-mono py-2 px-3 rounded-lg focus:outline-none focus:border-stone-700 resize-none"
                    />
                  </div>
                </div>
              </motion.form>
            ) : (
              /* Default Detailed Sheet display layout */
              <motion.div 
                key="client-detail-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                
                {/* Client top profile block details */}
                <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 relative">
                  <div className="absolute top-6 right-6 flex items-center gap-1.5">
                    <button
                      id="btn-client-edit"
                      onClick={handleStartEdit}
                      className="flex items-center gap-1 bg-stone-950 border border-stone-850 hover:border-stone-700 text-stone-300 hover:text-stone-100 font-mono text-[10px] py-1 px-3 rounded-lg transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Details
                    </button>
                    <button
                      id="btn-client-delete"
                      onClick={() => handleDeleteTrigger(activeClient.id)}
                      className="flex items-center gap-1 bg-stone-950 border border-stone-850 hover:border-rose-950/40 text-stone-500 hover:text-rose-400 font-mono text-[10px] py-1 px-2.5 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-950/60 border-2 border-emerald-900 text-emerald-400 flex items-center justify-center font-bold text-lg font-mono uppercase shrink-0">
                      {activeClient.name.split(' ').map(n=>n[0]).join('')}
                    </div>

                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-sans font-extrabold text-stone-100">{activeClient.name}</h3>
                        <span className="text-[10px] font-mono bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 py-0.5 px-2 rounded-md font-semibold flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-emerald-400/10" />
                          Favorite: {activeClient.favoriteStrain || 'None Listed'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-stone-400 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-stone-500" />
                          {activeClient.phone}
                        </span>
                        {activeClient.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-stone-500" />
                            {activeClient.email}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-stone-500" />
                          Enrolled: {new Date(activeClient.joinedDate).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CRM Joint annotations detail wrapper */}
                  <div className="border-t border-stone-850 mt-5 pt-4 text-left">
                    <span className="text-[10px] font-mono text-stone-400 uppercase font-semibold block mb-1">
                      Rolling Preferences & Delivery Instructions:
                    </span>
                    <p className="text-xs font-mono text-stone-300 bg-stone-950 p-3 rounded-lg leading-relaxed border border-stone-850 italic">
                      "{activeClient.notes || 'No roll instructions compiled for this customer. Enter custom preferences in the details editor.'}"
                    </p>
                  </div>
                </div>

                {/* Grid metrics summary row info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl text-left">
                    <span className="text-[10px] font-mono text-stone-500 uppercase block mb-1">Accumulated Buy-in</span>
                    <div className="text-xl font-mono font-bold text-stone-100">${activeClient.totalSpend.toFixed(2)}</div>
                    <span className="text-[9px] font-mono text-emerald-500 block">Complete ledger history</span>
                  </div>

                  <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl text-left">
                    <span className="text-[10px] font-mono text-stone-500 uppercase block mb-1">Joint Bunches Bought</span>
                    <div className="text-xl font-mono font-bold text-stone-100">{getOrderCount(activeClient)} sales</div>
                    <span className="text-[9px] font-mono text-stone-400 block">Total visits</span>
                  </div>

                  <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl text-left">
                    <span className="text-[10px] font-mono text-stone-400 uppercase block mb-1">Average Order Ticket</span>
                    <div className="text-xl font-mono font-bold text-stone-100">${getAverageSpend(activeClient).toFixed(2)}</div>
                    <span className="text-[9px] font-mono text-stone-400 block">Per checkout session</span>
                  </div>
                </div>

                {/* Google Calendar & Meet integrated Actions scheduler */}
                <ClientScheduler 
                  client={activeClient}
                  accessToken={accessToken}
                  onUpdateClient={onUpdateClient}
                />

                {/* Customer historic transactions register */}
                <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 text-left">
                  <div className="border-b border-stone-800 pb-3 mb-4 flex items-center justify-between">
                    <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Historic Joint Calculations Ledger
                    </span>
                    <span className="text-[10px] font-mono text-stone-400 uppercase bg-stone-950 py-0.5 px-2 rounded-md border border-stone-850">
                      Archive logs
                    </span>
                  </div>

                  {activeClient.orderHistory && activeClient.orderHistory.length === 0 ? (
                    <div className="text-center py-8 text-xs font-mono text-stone-500">
                      No calculated sales logged to this client record yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeClient.orderHistory.map((order) => (
                        <div 
                          key={order.id}
                          className="border border-stone-850 bg-stone-950 p-4 rounded-xl space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 border-b border-stone-855 pb-2 text-xs font-mono">
                            <div>
                              <span className="text-stone-100 font-bold">{order.id}</span>
                              <span className="text-stone-500 mx-2">&bull;</span>
                              <span className="text-stone-400">
                                {new Date(order.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="text-stone-200">
                              Total calculated: <span className="text-emerald-400 font-bold">${order.total.toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Items listed in order */}
                          <div className="space-y-2 text-xs font-mono">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex justify-between items-center text-stone-300">
                                <div>
                                  <span className="text-stone-100 font-semibold">{item.quantity}x {item.strainName}</span>
                                  <span className="text-stone-500 text-[10px] ml-2">({item.sizeName} &bull; {item.wrapper})</span>
                                  {item.isInfused && (
                                    <span className="text-[8px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-1 rounded uppercase ml-2 select-none">
                                      Infused
                                    </span>
                                  )}
                                </div>
                                <span className="text-stone-300 text-xs">${item.total.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          {order.notes && (
                            <div className="p-2 sm:p-2.5 bg-stone-900 rounded text-[11px] font-mono text-stone-450 italic">
                              * Notes: {order.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Enroll client dialog modal */}
      <AnimatePresence>
        {isAddingNew && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingNew(false)}
              className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-stone-900 border border-stone-800 rounded-2xl p-6 max-w-lg w-full relative z-10 shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center border-b border-stone-800 pb-3">
                <h3 className="text-lg font-sans font-extrabold text-stone-100 flex items-center gap-2">
                  <UserPlus className="text-emerald-500 w-5 h-5 stroke-[2]" />
                  Enroll Customer to CRM Database
                </h3>
                <button
                  id="btn-close-signup"
                  onClick={() => setIsAddingNew(false)}
                  className="text-stone-400 hover:text-stone-200 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateClient} className="space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-stone-400 uppercase font-bold block">First & Last Name *</label>
                    <input
                      id="new-client-name-modal"
                      type="text"
                      required
                      placeholder="E.g. David Chang"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-850 text-stone-200 text-xs font-mono py-2.5 px-3 rounded-lg focus:outline-none focus:border-stone-700 placeholder-stone-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-stone-400 uppercase font-bold block">Phone Contact *</label>
                    <input
                      id="new-client-phone-modal"
                      type="text"
                      required
                      placeholder="E.g. +1 (555) 018-9122"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-850 text-stone-200 text-xs font-mono py-2.5 px-3 rounded-lg focus:outline-none focus:border-stone-700 placeholder-stone-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-stone-400 uppercase font-bold block">Email Address (Optional)</label>
                    <input
                      id="new-client-email-modal"
                      type="email"
                      placeholder="E.g. dchang@domain.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-850 text-stone-200 text-xs font-mono py-2.5 px-3 rounded-lg focus:outline-none focus:border-stone-700 placeholder-stone-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-stone-400 uppercase font-bold block">Preferred Strain</label>
                    <select
                      id="new-client-fav-strain-modal"
                      value={newFavStrain}
                      onChange={(e) => setNewFavStrain(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-850 text-stone-200 text-xs font-mono py-2.5 px-3 rounded-lg focus:outline-none focus:border-stone-700"
                    >
                      <option value="">No preference</option>
                      {strains.map(s => (
                        <option key={s.id} value={s.name}>{s.name} ({s.type})</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-mono text-stone-400 uppercase font-bold block">Custom rolling preferences or delivery notes</label>
                    <textarea
                      id="new-client-notes-modal"
                      rows={3}
                      placeholder="Notes: Needs extra glass filter tips. Prefers Friday pick-up or deliveries."
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-850 text-stone-200 text-xs font-mono py-2 px-3 rounded-lg focus:outline-none focus:border-stone-700 resize-none placeholder-stone-700"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-stone-800">
                  <button
                    id="btn-modal-cancel"
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="text-xs font-mono text-stone-400 hover:text-stone-200 py-2 px-4 rounded border border-transparent cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-modal-submit"
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-stone-900 font-sans font-bold py-2 px-5 rounded-lg text-xs transition duration-150 shadow cursor-pointer"
                  >
                    Confirm CRM Enrollment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
