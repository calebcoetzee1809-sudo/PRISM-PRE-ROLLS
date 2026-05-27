/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Strain } from '../types';
import { 
  Leaf, 
  Plus, 
  Trash2, 
  Check, 
  X,
  Sparkles,
  Edit2,
  DollarSign
} from 'lucide-react';

interface StrainsManagerProps {
  strains: Strain[];
  onAddStrain: (strain: Omit<Strain, 'id'>) => void;
  onUpdateStrain: (id: string, updated: Partial<Strain>) => void;
  onDeleteStrain: (id: string) => void;
}

export default function StrainsManager({
  strains,
  onAddStrain,
  onUpdateStrain,
  onDeleteStrain
}: StrainsManagerProps) {
  
  // Create state
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'Indica' | 'Sativa' | 'Hybrid'>('Sativa');
  const [newPrice, setNewPrice] = useState<number>(10);

  // Edit inline state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(10);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newPrice <= 0) return;
    
    onAddStrain({
      name: newName.trim(),
      type: newType,
      pricePerGram: newPrice,
      active: true
    });

    setNewName('');
    setNewPrice(10);
    setIsAdding(false);
  };

  const handleStartEdit = (strain: Strain) => {
    setEditingId(strain.id);
    setEditPrice(strain.pricePerGram);
  };

  const handleSaveEdit = (id: string) => {
    if (editPrice <= 0) return;
    onUpdateStrain(id, { pricePerGram: editPrice });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (strains.length <= 1) {
      alert("You need to keep at least 1 strain in the dispensary inventory to ensure calculations stay functioning!");
      return;
    }
    if (confirm("Are you sure you want to remove this strain? Future custom calculations won't have it listed.")) {
      onDeleteStrain(id);
    }
  };

  const toggleActive = (strain: Strain) => {
    onUpdateStrain(strain.id, { active: !strain.active });
  };

  // Stats
  const activeCount = strains.filter(s => s.active).length;
  const avgPrice = strains.reduce((sum, s) => sum + s.pricePerGram, 0) / strains.length;

  return (
    <div className="space-y-6">
      
      {/* Header with quick statistic cards */}
      <div className="border-b border-stone-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-sans font-bold text-stone-100 flex items-center gap-2">
            <Leaf className="text-emerald-500 w-6 h-6 stroke-[2]" />
            Dispensary Strains Inventory
          </h2>
          <p className="text-xs font-mono text-stone-400 mt-1">
            Configure active strains on the inventory menu to populate the joint calculator weight estimates automatically.
          </p>
        </div>

        <button
          id="btn-trigger-add-strain"
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-stone-900 font-sans font-semibold py-2 px-4 rounded-lg shadow transition cursor-pointer text-xs"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Add Custom Strain
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl text-left">
          <span className="text-[10px] font-mono text-stone-500 uppercase block mb-1">Total Strains</span>
          <div className="text-xl font-mono font-bold text-stone-100">{strains.length} Profiles</div>
          <span className="text-[9px] font-mono text-stone-400 block">Catalog count</span>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl text-left">
          <span className="text-[10px] font-mono text-stone-500 uppercase block mb-1">Active for Sales</span>
          <div className="text-xl font-mono font-bold text-emerald-400">{activeCount} Strains</div>
          <span className="text-[9px] font-mono text-emerald-500 block">Currently selectable</span>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl text-left">
          <span className="text-[10px] font-mono text-stone-500 uppercase block mb-1">Avg Base Price</span>
          <div className="text-xl font-mono font-bold text-stone-100">${avgPrice.toFixed(2)}/g</div>
          <span className="text-[9px] font-mono text-stone-400 block">Excluding sizing premiums</span>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl text-left">
          <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold block mb-1">Quick Customization</span>
          <p className="text-[10px] font-mono text-stone-400 leading-normal">
            Update pricing directly on the cards below to instantly sync ledger quotes!
          </p>
        </div>
      </div>

      {/* Adding Strain form panel */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreate} className="bg-stone-900 border border-stone-800 p-5 rounded-xl space-y-4 max-w-2xl text-left">
              <div className="flex justify-between items-center border-b border-stone-800 pb-2">
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Define New Strain profile
                </span>
                <button
                  id="btn-close-strain-form"
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-stone-400 hover:text-stone-200 text-xs font-mono cursor-pointer"
                >
                  Close [X]
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-stone-400 uppercase font-semibold">Strain Name *</label>
                  <input
                    id="new-strain-name"
                    type="text"
                    required
                    placeholder="E.g. Pineapple Express"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-850 text-stone-200 text-xs font-mono py-2 px-3 rounded-lg focus:outline-none focus:border-stone-700 placeholder-stone-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-stone-400 uppercase font-semibold">Strain category</label>
                  <select
                    id="new-strain-type"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-stone-950 border border-stone-850 text-stone-200 text-xs font-mono py-2 px-3 rounded-lg focus:outline-none focus:border-stone-700"
                  >
                    <option value="Sativa">Sativa (Energy)</option>
                    <option value="Indica">Indica (Relax)</option>
                    <option value="Hybrid">Hybrid (Balanced)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-stone-400 uppercase font-semibold">Base Price per Gram ($) *</label>
                  <input
                    id="new-strain-price"
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-850 text-stone-200 text-xs font-mono py-2 px-3 rounded-lg focus:outline-none focus:border-stone-700"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  id="btn-add-strain-submit"
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-stone-900 font-sans font-bold py-2 px-5 rounded-lg text-xs transition duration-150 shadow"
                >
                  Save Strain Catalog Item
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Strain Grid display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {strains.map((strain) => {
          const isEditingThis = editingId === strain.id;
          return (
            <div
              key={strain.id}
              id={`strain-card-${strain.id}`}
              className={`bg-stone-900 border rounded-xl p-4 flex flex-col justify-between space-y-4 text-left ${
                strain.active ? 'border-stone-800' : 'border-stone-850 opacity-60'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-sans font-bold text-stone-200 text-sm leading-tight">{strain.name}</h4>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase mt-1 inline-block ${
                    strain.type === 'Sativa' ? 'text-amber-400 bg-amber-955' :
                    strain.type === 'Indica' ? 'text-indigo-400 bg-indigo-955' : 'text-emerald-400 bg-emerald-955'
                  }`}>
                    {strain.type}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    id={`btn-strain-toggle-active-${strain.id}`}
                    onClick={() => toggleActive(strain)}
                    className={`text-[9px] font-mono py-0.5 px-2 rounded-md border cursor-pointer ${
                      strain.active 
                        ? 'bg-emerald-955/40 text-emerald-400 border-emerald-900/40' 
                        : 'bg-stone-950 text-stone-500 border-stone-850'
                    }`}
                  >
                    {strain.active ? 'Active' : 'Disabled'}
                  </button>
                  <button
                    id={`btn-delete-strain-${strain.id}`}
                    onClick={() => handleDelete(strain.id)}
                    className="p-1 text-stone-500 hover:text-rose-400 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Price row */}
              <div className="bg-stone-950 p-3 rounded-lg border border-stone-850 flex items-center justify-between">
                <span className="text-[10px] font-mono text-stone-500 uppercase font-semibold">Price Per Gram:</span>
                
                {isEditingThis ? (
                  <div className="flex items-center gap-1 text-xs font-mono">
                    <DollarSign className="w-3.5 h-3.5 text-stone-500" />
                    <input
                      id={`edit-price-input-${strain.id}`}
                      type="number"
                      step="0.5"
                      min="1"
                      value={editPrice}
                      onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                      className="w-16 bg-stone-900 border border-stone-800 rounded py-0.5 px-1 text-right text-stone-100 placeholder-stone-700"
                    />
                    <button
                      id={`btn-save-price-${strain.id}`}
                      onClick={() => handleSaveEdit(strain.id)}
                      className="p-1 bg-emerald-600 hover:bg-emerald-500 text-stone-900 rounded cursor-pointer ml-1"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      id={`btn-cancel-price-${strain.id}`}
                      onClick={() => setEditingId(null)}
                      className="p-1 bg-stone-800 text-stone-405 rounded cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold text-stone-100">
                      ${strain.pricePerGram.toFixed(2)}
                    </span>
                    <button
                      id={`btn-edit-price-${strain.id}`}
                      onClick={() => handleStartEdit(strain)}
                      className="p-1 text-stone-500 hover:text-stone-350 hover:bg-stone-900 rounded cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
      
    </div>
  );
}
