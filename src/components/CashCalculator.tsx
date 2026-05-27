/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Client, Strain, Order, OrderItem } from '../types';
import { 
  Flame, 
  Trash2, 
  Sparkles, 
  DollarSign, 
  Check, 
  Plus, 
  Minus, 
  UserPlus, 
  Award,
  CircleCheck,
  Scale
} from 'lucide-react';

interface CashCalculatorProps {
  clients: Client[];
  strains: Strain[];
  onAddOrder: (order: Order, clientPhoneToUpdate?: string) => void;
  onNavigateToClients: () => void;
  accessToken: string | null;
}

const SIZE_PRESETS = [
  { name: 'Shorty', grams: 0.5, desc: 'Quick kick (0.5g)' },
  { name: 'Standard', grams: 1.0, desc: 'Classic burn (1.0g)' },
  { name: 'King Size', grams: 1.5, desc: 'Social roll (1.5g)' },
  { name: 'Double Barrel', grams: 2.0, desc: 'Heavy weight (2.0g)' }
];

const WRAPPERS = [
  { name: 'Raw Classic', price: 0, desc: 'Unrefined natural paper' },
  { name: 'Organic Rice', price: 0.5, desc: 'Ultra-thin, clean burn (+$0.50)' },
  { name: 'Hemp Wrap', price: 1.0, desc: 'Earthy, rich aroma (+$1.00)' },
  { name: 'Preroll Blunt', price: 2.0, desc: 'Slow-burning chamomile wrap (+$2.00)' }
];

export default function CashCalculator({ 
  clients, 
  strains, 
  onAddOrder,
  onNavigateToClients,
  accessToken
}: CashCalculatorProps) {
  
  // Google Chat notification status states
  const [notifyChat, setNotifyChat] = useState<boolean>(false);
  const [selectedChatSpace, setSelectedChatSpace] = useState<string>('');
  const [chatSpaces, setChatSpaces] = useState<any[]>([]);

  // Custom joint config state
  const [selectedStrain, setSelectedStrain] = useState<Strain>(strains[0] || { id: '1', name: 'Blue Dream', type: 'Sativa', pricePerGram: 10, active: true });
  const [selectedSizePreset, setSelectedSizePreset] = useState<string>('Standard');
  const [customGrams, setCustomGrams] = useState<number>(1.0);
  const [selectedWrapper, setSelectedWrapper] = useState<string>('Raw Classic');
  const [isInfused, setIsInfused] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);
  
  // Accumulator list
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  
  // Checkout math states
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  
  // Custom or Linked Client state
  const [customerType, setCustomerType] = useState<'walkin' | 'existing' | 'new'>('walkin');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [newClientName, setNewClientName] = useState<string>('');
  const [newClientPhone, setNewClientPhone] = useState<string>('');
  const [newClientEmail, setNewClientEmail] = useState<string>('');
  
  // Cash drawer inputs
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'calc' | 'receipt'>('calc');
  const [lastReceipt, setLastReceipt] = useState<Order | null>(null);

  // Synchronize grams value when size preset changes
  useEffect(() => {
    const preset = SIZE_PRESETS.find(p => p.name === selectedSizePreset);
    if (preset) {
      setCustomGrams(preset.grams);
    }
  }, [selectedSizePreset]);

  // Sync Google Chat space list dynamically if user is signed into workspace
  useEffect(() => {
    if (accessToken) {
      import('../workspace').then(({ listChatSpaces }) => {
        listChatSpaces(accessToken)
          .then(spaces => {
            setChatSpaces(spaces);
            if (spaces.length > 0) {
              setSelectedChatSpace(spaces[0].name);
            }
          })
          .catch(err => console.error('Failed to pre-fetch Chat spaces in retail calc:', err));
      });
    } else {
      setChatSpaces([]);
      setNotifyChat(false);
    }
  }, [accessToken]);

  // Handle custom grams slider change
  const handleCustomGramsChange = (val: number) => {
    setSelectedSizePreset('Custom');
    setCustomGrams(parseFloat(val.toFixed(2)));
  };

  // Compute live price for a single joint
  const computeSingleJointPrice = (): number => {
    const strainPriceGrams = selectedStrain.pricePerGram;
    const baseFlowerPrice = strainPriceGrams * customGrams;
    
    // Wrapper surcharge
    const wrapperObj = WRAPPERS.find(w => w.name === selectedWrapper);
    const wrapperSurcharge = wrapperObj ? wrapperObj.price : 0;
    
    // Hash oil / kief infusion surcharge
    const infusionSurcharge = isInfused ? 6.50 : 0;
    
    return baseFlowerPrice + wrapperSurcharge + infusionSurcharge;
  };

  // Add constructed joint formulated item to local accumulator list
  const handleAddItemToAccumulator = () => {
    const unitPrice = computeSingleJointPrice();
    const itemTotal = unitPrice * quantity;
    
    const newItem: OrderItem = {
      id: `oi-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      strainName: selectedStrain.name,
      type: selectedStrain.type,
      sizeName: selectedSizePreset === 'Custom' ? `${customGrams.toFixed(1)}g Custom` : `${selectedSizePreset} (${customGrams.toFixed(1)}g)`,
      sizeGrams: customGrams,
      wrapper: selectedWrapper,
      isInfused: isInfused,
      quantity: quantity,
      pricePerUnit: parseFloat(unitPrice.toFixed(2)),
      total: parseFloat(itemTotal.toFixed(2))
    };

    setCartItems([...cartItems, newItem]);
    
    // Reset secondary options for comfort
    setIsInfused(false);
    setQuantity(1);
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
    setDiscountPercent(0);
    setCashReceived(0);
    setNotes('');
  };

  // Calculations for total billing
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = cartSubtotal * (discountPercent / 100);
  const cartTotal = Math.max(0, cartSubtotal - discountAmount);
  
  const changeDue = cashReceived > 0 ? cashReceived - cartTotal : 0;
  const isCashSufficient = cashReceived >= cartTotal - 0.001;

  // Click quick bills on the physical-feel drawer panel
  const handleAddBill = (amount: number) => {
    setCashReceived(prev => parseFloat((prev + amount).toFixed(2)));
  };

  // Fast exact cash match button
  const handleExactCash = () => {
    setCashReceived(parseFloat(cartTotal.toFixed(2)));
  };

  // Checkout process trigger
  const handleRegisterReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    let finalClientName = 'Walk-in Guest';
    let finalClientId: string | undefined = undefined;
    let clientPhoneToUpdate: string | undefined = undefined;

    if (customerType === 'existing') {
      const existing = clients.find(c => c.id === selectedClientId);
      if (existing) {
        finalClientName = existing.name;
        finalClientId = existing.id;
      }
    } else if (customerType === 'new') {
      finalClientName = newClientName ? newClientName.trim() : 'New Guest';
      clientPhoneToUpdate = newClientPhone ? newClientPhone.trim() : `Temp-${Date.now()}`;
    }

    const order: Order = {
      id: `ord-${Date.now()}`,
      clientId: finalClientId,
      clientName: finalClientName,
      date: new Date().toISOString(),
      items: cartItems,
      subtotal: parseFloat(cartSubtotal.toFixed(2)),
      discount: discountPercent,
      total: parseFloat(cartTotal.toFixed(2)),
      cashReceived: parseFloat(cashReceived.toFixed(2)),
      changeGiven: parseFloat((changeDue > 0 ? changeDue : 0).toFixed(2)),
      notes: notes.trim() || undefined
    };

    // Callback updates upper state directly (App level state)
    // If client is new, we also pass registration metadata
    onAddOrder(order, customerType === 'new' ? JSON.stringify({
      name: finalClientName,
      phone: newClientPhone.trim(),
      email: newClientEmail.trim()
    }) : undefined);

    // Broadcast automated register receipt directly into selected Google Chat room space channel
    if (notifyChat && accessToken && selectedChatSpace) {
      import('../workspace').then(({ sendChatMessage }) => {
        const itemDetails = cartItems.map(it => `• ${it.quantity}x *${it.strainName}* (${it.sizeName} • ${it.wrapper}${it.isInfused ? ' • INFUSED' : ''})`).join('\n');
        const alertBody = `🔔 *Preroll joints CRM checkout registered!* 🌿\n\n*Receipt Ref:* \`${order.id}\`\n*Timestamp:* _${new Date(order.date).toLocaleString()}_\n*Client Profile:* *${finalClientName}*\n\n*Accumulated Items Table:*\n${itemDetails}\n\n*Subtotal:* $${order.subtotal.toFixed(2)}\n*Discount Percent:* ${order.discount}%\n*Net Ledger Total Saved:* *$${order.total.toFixed(2)}*\n\n*Drawer Ledger Annotation:* _"${notes.trim() || 'Standard formulation assembly completion.'}"_`;
        sendChatMessage(accessToken, selectedChatSpace, alertBody)
          .then(() => console.log('Successfully broadcast cash log item alert to google chat!'))
          .catch(err => console.error('Google Chat API failed to dispatch message alert:', err));
      });
    }

    // Track receipt for display popup
    setLastReceipt(order);
    setActiveTab('receipt');
  };

  // Close receipt and clear calculator state
  const handleNextAssembly = () => {
    clearCart();
    // Return to calculation panel
    setActiveTab('calc');
    setLastReceipt(null);
  };

  // Quick strain pick button helper
  const handleStrainPick = (strain: Strain) => {
    setSelectedStrain(strain);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-2xl font-sans font-bold text-stone-100 flex items-center gap-2">
            <Flame className="text-emerald-500 w-6 h-6 stroke-[2]" />
            Preroll Joint Accumulative Calculator
          </h2>
          <p className="text-xs font-mono text-stone-400 mt-1">
            Formulate premium client joints, calculate weight-based strain pricing, and manage real-time retail cash sales.
          </p>
        </div>
        
        {cartItems.length > 0 && (
          <button
            id="btn-quick-clear-all"
            onClick={clearCart}
            className="text-xs font-mono text-stone-400 hover:text-rose-400 border border-stone-800 hover:border-rose-950/50 bg-stone-900 py-1 px-3 rounded-md transition-all"
          >
            Clear Ledger
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'receipt' && lastReceipt ? (
          /* Receipt Overlay / Illusive Creative UI screen */
          <motion.div 
            key="receipt-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md mx-auto bg-stone-900 border border-emerald-900/40 rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="bg-emerald-950/60 p-6 text-center border-b border-stone-800">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500 text-stone-950 flex items-center justify-center font-bold mb-3">
                <CircleCheck className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="font-sans font-bold text-lg text-stone-100 uppercase tracking-widest">Calculated & Logged</h3>
              <p className="text-xs font-mono text-emerald-400 mt-1">Transaction Registered in Ledger History</p>
            </div>

            <div className="p-6 font-mono text-stone-300 text-xs space-y-4">
              <div className="flex justify-between border-b border-stone-800 pb-2">
                <span>Receipt Ref:</span>
                <span className="text-stone-100">{lastReceipt.id}</span>
              </div>
              <div className="flex justify-between border-b border-stone-800 pb-2">
                <span>Timestamp:</span>
                <span className="text-stone-100">{new Date(lastReceipt.date).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-stone-800 pb-2">
                <span>Client Name:</span>
                <span className="text-stone-100 font-bold">{lastReceipt.clientName}</span>
              </div>

              {/* Items Table */}
              <div className="space-y-2 border-b border-stone-800 py-2">
                <span className="text-[10px] text-stone-400 uppercase tracking-widest block font-bold">Rolled Joint Formulations:</span>
                {lastReceipt.items.map((item, index) => (
                  <div key={index} className="flex justify-between leading-relaxed text-[11px]">
                    <span className="text-stone-100 truncate max-w-[220px]">
                      {item.quantity}x {item.strainName} ({item.sizeName})
                    </span>
                    <span>${item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Math totals */}
              <div className="space-y-1.5 border-b border-stone-800 py-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${lastReceipt.subtotal.toFixed(2)}</span>
                </div>
                {lastReceipt.discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount applied:</span>
                    <span>-{lastReceipt.discount}%</span>
                  </div>
                )}
                <div className="flex justify-between text-[14px] font-bold text-stone-100 pt-1">
                  <span>GRAND TOTAL:</span>
                  <span>${lastReceipt.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Cash transaction drawer info */}
              <div className="space-y-1 bg-stone-950 p-3 rounded border border-stone-850">
                <div className="flex justify-between font-bold">
                  <span>Cash Tendered:</span>
                  <span className="text-emerald-400">${lastReceipt.cashReceived.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Change Dispensed:</span>
                  <span>${lastReceipt.changeGiven.toFixed(2)}</span>
                </div>
              </div>

              {lastReceipt.notes && (
                <div className="bg-stone-950/60 p-2.5 rounded text-[10px] text-stone-400 italic">
                  * Note: {lastReceipt.notes}
                </div>
              )}
            </div>

            <div className="p-4 bg-stone-900 border-t border-stone-800">
              <button
                id="btn-next-assembly"
                onClick={handleNextAssembly}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-stone-900 font-sans font-bold py-3 pr-2 rounded-xl text-center cursor-pointer transition-colors"
              >
                Assemble Next Joint Bundle
              </button>
            </div>
          </motion.div>
        ) : (
          /* Custom Calculator Screen */
          <div key="calc-screen" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Formulator Panel (Grid Col: 7) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Joint customization segment */}
              <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-5">
                <div className="flex justify-between items-center border-b border-stone-800 pb-3">
                  <h3 className="text-sm font-mono text-emerald-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    1. Joint Roll Configuration
                  </h3>
                  <div className="text-xs font-mono text-stone-400">
                    Live Formulation Estimate:{' '} 
                    <span className="text-stone-100 font-bold">${computeSingleJointPrice().toFixed(2)} / unit</span>
                  </div>
                </div>

                {/* Strain Selections Grid with quick filters */}
                <div className="space-y-2">
                  <span className="text-xs font-mono text-stone-400 block font-semibold">Select Strain Type:</span>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {strains.map((strain) => {
                      const isSelected = selectedStrain.id === strain.id;
                      return (
                        <button
                          key={strain.id}
                          id={`strain-btn-${strain.id}`}
                          type="button"
                          onClick={() => handleStrainPick(strain)}
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-emerald-950/60 border-emerald-500/80 text-stone-50' 
                              : 'bg-stone-950 border-stone-850 text-stone-300 hover:bg-stone-900 hover:border-stone-700'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-sans font-bold block truncate max-w-[100px]">{strain.name}</span>
                            <span className={`text-[8px] font-mono px-1 rounded uppercase ${
                              strain.type === 'Sativa' ? 'text-amber-400 bg-amber-950/60' :
                              strain.type === 'Indica' ? 'text-indigo-400 bg-indigo-950/60' : 'text-emerald-400 bg-emerald-950/60'
                            }`}>{strain.type[0]}</span>
                          </div>
                          <span className="text-[10px] font-mono text-stone-400 block mt-1">${strain.pricePerGram}/g</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Size Presets Weight row */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-stone-400 block font-semibold">Select Size (Weight):</span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">{customGrams.toFixed(2)}g</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SIZE_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        id={`size-btn-${preset.name}`}
                        type="button"
                        onClick={() => setSelectedSizePreset(preset.name)}
                        className={`py-2 px-1.5 rounded-lg border text-center cursor-pointer transition-all ${
                          selectedSizePreset === preset.name 
                            ? 'bg-emerald-950/60 border-emerald-500/80 text-stone-50' 
                            : 'bg-stone-950 border-stone-850 text-stone-400 hover:bg-stone-900 hover:border-stone-700'
                        }`}
                      >
                        <div className="text-xs font-sans font-bold">{preset.name}</div>
                        <div className="text-[9px] font-mono text-stone-500 mt-0.5">{preset.grams}g</div>
                      </button>
                    ))}
                  </div>

                  {/* Manual adjustment weight slider slider and indicators */}
                  <div className="bg-stone-950 p-2.5 border border-stone-850 rounded-lg flex items-center gap-3">
                    <Scale className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div className="flex-1">
                      <input 
                        type="range"
                        min="0.3" 
                        max="3.0" 
                        step="0.1" 
                        value={customGrams}
                        onChange={(e) => handleCustomGramsChange(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-stone-800 accent-emerald-500 cursor-pointer rounded-lg"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-stone-400 min-w-[50px] text-right">0.3g - 3g</span>
                  </div>
                </div>

                {/* Wrapping style paper preset layout */}
                <div className="space-y-2">
                  <span className="text-xs font-mono text-stone-400 block font-semibold">Wrapping Paper Customization:</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {WRAPPERS.map((wrap) => {
                      const isSelected = selectedWrapper === wrap.name;
                      return (
                        <button
                          key={wrap.name}
                          id={`wrapper-btn-${wrap.name.toLowerCase().replace(/\s+/g, '-')}`}
                          type="button"
                          onClick={() => setSelectedWrapper(wrap.name)}
                          className={`p-2 rounded-lg border text-center flex flex-col justify-between h-[64px] cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-emerald-950/60 border-emerald-500/80 text-stone-50' 
                              : 'bg-stone-950 border-stone-850 text-stone-400 hover:bg-stone-900 shadow-sm'
                          }`}
                        >
                          <span className="text-[10px] font-sans font-bold leading-tight block">{wrap.name}</span>
                          <span className="text-[9px] font-mono text-stone-500 block">
                            {wrap.price === 0 ? 'Free' : `+$${wrap.price.toFixed(2)}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dual Extravagant Infusion toggle row */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-stone-950 border border-stone-850 p-3.5 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-950 border border-emerald-900 text-emerald-400 flex items-center justify-center font-bold">
                      <Flame className="w-5 h-5 fill-emerald-400/20" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-sans font-bold text-stone-200 block">Infuse with Hash Oil & Kief Dusting</span>
                      <span className="text-[10px] font-mono text-stone-500 block">Coats wrapper outer surface for maximum depth (+ $6.50 surcharge)</span>
                    </div>
                  </div>
                  <div>
                    <button
                      id="btn-infusion-toggle"
                      type="button"
                      onClick={() => setIsInfused(!isInfused)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        isInfused ? 'bg-emerald-600' : 'bg-stone-800'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-stone-100 transition-transform ${
                          isInfused ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Quantity selector and ADD accumulator button */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="inline-flex items-center bg-stone-950 border border-stone-850 rounded-xl p-1 shrink-0">
                    <button
                      id="btn-qty-dec"
                      type="button"
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      className="p-2 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 font-mono font-bold text-stone-100 text-sm min-w-[24px] text-center">{quantity}</span>
                    <button
                      id="btn-qty-inc"
                      type="button"
                      onClick={() => setQuantity(prev => prev + 1)}
                      className="p-2 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    id="btn-add-to-accumulator"
                    type="button"
                    onClick={handleAddItemToAccumulator}
                    className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-950 font-sans font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    Add joint formulation to Accumulator (${(computeSingleJointPrice() * quantity).toFixed(2)})
                  </button>
                </div>

              </div>

              {/* Accumulator visual ledger item line reviews */}
              <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
                <span className="text-xs font-mono text-stone-400 uppercase tracking-widest font-semibold block mb-3">
                  Current Accumulative Ledger ({cartItems.length} styles)
                </span>

                {cartItems.length === 0 ? (
                  <div className="border border-dashed border-stone-800 rounded-lg p-8 text-center text-stone-500 text-xs font-mono space-y-1">
                    <div>No items added to current sale stack.</div>
                    <div>Configure a premium joint roll blueprint above.</div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {cartItems.map((item) => (
                      <div 
                        key={item.id}
                        id={`item-row-${item.id}`}
                        className="bg-stone-950 border border-stone-850 p-3 rounded-lg flex items-center justify-between gap-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-sans font-bold text-stone-100">{item.strainName}</span>
                            <span className="text-[9px] font-mono bg-stone-800 text-stone-400 py-0.5 px-1.5 rounded uppercase">
                              {item.type}
                            </span>
                            {item.isInfused && (
                              <span className="text-[8px] font-sans font-extrabold tracking-widest bg-emerald-900/30 text-emerald-400 py-0.5 px-2 rounded uppercase border border-emerald-900/40">
                                Infused
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-stone-400 mt-0.5 block">
                            {item.quantity} units &bull; {item.sizeName} &bull; {item.wrapper}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-xs font-mono font-bold text-stone-100">${item.total.toFixed(2)}</div>
                            <span className="text-[9px] font-mono text-stone-500">${item.pricePerUnit} / unit</span>
                          </div>
                          <button
                            id={`btn-remove-item-${item.id}`}
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 text-stone-500 hover:text-rose-400 hover:bg-stone-900 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: Checkout ledger & cash register (Grid Col: 5) */}
            <div className="lg:col-span-5 space-y-6">
              
              <form onSubmit={handleRegisterReceipt} className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-5">
                <span className="text-sm font-mono text-emerald-400 uppercase tracking-widest font-semibold flex items-center gap-1.5 border-b border-stone-800 pb-2.5">
                  <DollarSign className="w-4 h-4" />
                  2. Cash Drawer Accumulator
                </span>

                {/* Linked Client Dropdown Section */}
                <div className="space-y-2">
                  <span className="text-xs font-mono text-stone-400 block font-semibold">Select Customer:</span>
                  
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      id="opt-walkin"
                      type="button"
                      onClick={() => setCustomerType('walkin')}
                      className={`text-[10px] font-mono py-1 rounded border cursor-pointer ${
                        customerType === 'walkin' 
                          ? 'bg-emerald-950 border-emerald-500/80 text-stone-100' 
                          : 'bg-stone-950 border-stone-850 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      Walk-in guest
                    </button>
                    <button
                      id="opt-existing"
                      type="button"
                      onClick={() => setCustomerType('existing')}
                      className={`text-[10px] font-mono py-1 rounded border cursor-pointer ${
                        customerType === 'existing' 
                          ? 'bg-emerald-950 border-emerald-500/80 text-stone-100' 
                          : 'bg-stone-950 border-stone-850 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      Exisiting Client
                    </button>
                    <button
                      id="opt-new"
                      type="button"
                      onClick={() => setCustomerType('new')}
                      className={`text-[10px] font-mono py-1 rounded border cursor-pointer ${
                        customerType === 'new' 
                          ? 'bg-emerald-950 border-emerald-500/80 text-stone-100' 
                          : 'bg-stone-950 border-stone-850 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      New Client
                    </button>
                  </div>

                  {/* Existing Customers select */}
                  {customerType === 'existing' && (
                    <div className="bg-stone-950 p-2 border border-stone-850 rounded-lg">
                      <select
                        id="select-existing-client"
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        required
                        className="w-full bg-transparent text-stone-200 text-xs font-mono border-0 focus:ring-0 cursor-pointer"
                      >
                        <option value="" disabled className="bg-stone-900 text-stone-400">-- Choose Client --</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id} className="bg-stone-900 text-stone-200">
                            {c.name} ({c.favoriteStrain})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* New Customer Quick Signup Form */}
                  {customerType === 'new' && (
                    <div className="bg-stone-950 border border-stone-850 p-3 rounded-lg space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Quick CRM Database Enrollment</span>
                      </div>
                      
                      <div className="space-y-1.5">
                        <input
                          id="new-client-name"
                          type="text"
                          required
                          placeholder="Client Name *"
                          value={newClientName}
                          onChange={(e) => setNewClientName(e.target.value)}
                          className="w-full bg-stone-900 border border-stone-800 text-stone-200 text-xs font-mono py-1.5 px-2 rounded focus:outline-none focus:border-stone-700"
                        />
                        <input
                          id="new-client-phone"
                          type="text"
                          required
                          placeholder="Phone Contact *"
                          value={newClientPhone}
                          onChange={(e) => setNewClientPhone(e.target.value)}
                          className="w-full bg-stone-900 border border-stone-800 text-stone-200 text-xs font-mono py-1.5 px-2 rounded focus:outline-none focus:border-stone-700"
                        />
                        <input
                          id="new-client-email"
                          type="email"
                          placeholder="Email Address (optional)"
                          value={newClientEmail}
                          onChange={(e) => setNewClientEmail(e.target.value)}
                          className="w-full bg-stone-900 border border-stone-800 text-stone-200 text-xs font-mono py-1.5 px-2 rounded focus:outline-none focus:border-stone-700"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Subtotals, Discount triggers and Net Ledger Calculation */}
                <div className="bg-stone-950 border border-stone-850 p-4 rounded-xl space-y-3 font-mono">
                  <div className="flex justify-between text-xs text-stone-400">
                    <span>Subtotal:</span>
                    <span className="text-stone-200">${cartSubtotal.toFixed(2)}</span>
                  </div>

                  {/* Advanced discount preset sliders */}
                  <div className="space-y-1.5 border-t border-stone-850 pt-2 text-xs">
                    <span className="text-stone-400 flex justify-between items-center text-[10px]">
                      <span>Discount:</span>
                      <span className="text-emerald-400 font-bold">{discountPercent}%</span>
                    </span>
                    <div className="grid grid-cols-5 gap-1">
                      {[0, 5, 10, 15, 20].map((disc) => (
                        <button
                          key={disc}
                          id={`disc-btn-${disc}`}
                          type="button"
                          onClick={() => setDiscountPercent(disc)}
                          className={`text-[9px] py-1 border rounded cursor-pointer ${
                            discountPercent === disc 
                              ? 'bg-emerald-950 border-emerald-500/50 text-emerald-400 font-bold' 
                              : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                          }`}
                        >
                          {disc}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between text-stone-100 font-bold text-lg pt-1.5 border-t border-stone-800 font-mono">
                    <span>LEGER TOTAL:</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Satifying Physical Cash Till Drawer Panel */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-stone-400 font-semibold uppercase tracking-wider block">
                      Cash Tender Till
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        id="btn-fast-exact"
                        type="button"
                        onClick={handleExactCash}
                        className="text-[9px] font-mono border border-stone-800 hover:border-stone-700 text-stone-300 bg-stone-950 py-0.5 px-2 rounded hover:text-stone-100 cursor-pointer"
                      >
                        Exact Cash
                      </button>
                      <button
                        id="btn-fast-clear"
                        type="button"
                        onClick={() => setCashReceived(0)}
                        className="text-[9px] font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 py-0.5 px-1.5 rounded cursor-pointer"
                      >
                        Clear Tender
                      </button>
                    </div>
                  </div>

                  {/* Cash received number display input */}
                  <div className="bg-stone-950 border border-stone-850 p-2.5 rounded-lg flex items-center justify-between">
                    <DollarSign className="w-5 h-5 text-emerald-500 shrink-0" />
                    <input 
                      id="input-cash-tender"
                      type="number"
                      step="0.01"
                      min="0"
                      value={cashReceived === 0 ? '' : cashReceived}
                      onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full bg-transparent text-right text-lg font-mono font-bold text-stone-100 border-0 focus:ring-0 focus:outline-none placeholder-stone-700"
                    />
                  </div>

                  {/* Cash Till Drawer grid selector buttons */}
                  <div className="grid grid-cols-4 gap-1 pt-1 text-xs">
                    {[5, 10, 20, 50].map((bill) => (
                      <button
                        key={bill}
                        id={`till-bill-${bill}`}
                        type="button"
                        onClick={() => handleAddBill(bill)}
                        className="py-1.5 bg-stone-950 border border-stone-850 text-stone-300 font-mono font-bold hover:bg-stone-800 rounded-lg text-center cursor-pointer hover:border-stone-700 transition"
                      >
                        +${bill}
                      </button>
                    ))}
                  </div>

                  {/* Cash tender delta state */}
                  {cartTotal > 0 && (
                    <div className="pt-1.5">
                      {isCashSufficient ? (
                        <div className="bg-emerald-950/40 border border-emerald-900/60 rounded-lg p-2.5 flex justify-between items-center text-xs font-mono">
                          <span className="text-stone-300">Change Due Back:</span>
                          <span className="text-emerald-400 font-bold text-sm">${changeDue.toFixed(2)}</span>
                        </div>
                      ) : (
                        <div className="bg-rose-950/40 border border-rose-900/40 rounded-lg p-2.5 flex justify-between items-center text-xs font-mono">
                          <span className="text-stone-300">Remaining Balance Overdue:</span>
                          <span className="text-rose-400 font-bold text-sm">
                            -${(cartTotal - cashReceived).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Google Chat broadcast setup alerts */}
                {accessToken && chatSpaces.length > 0 && (
                  <div className="space-y-2 p-3 bg-stone-950/80 border border-stone-855 rounded-xl font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <input
                        id="notify-chat-checkbox"
                        type="checkbox"
                        checked={notifyChat}
                        onChange={(e) => setNotifyChat(e.target.checked)}
                        className="rounded text-emerald-600 bg-stone-900 border-stone-800 focus:ring-emerald-500 cursor-pointer"
                      />
                      <label htmlFor="notify-chat-checkbox" className="text-stone-300 font-bold block cursor-pointer select-none text-[10px] uppercase tracking-wider">
                        📢 Broadcast Receipt Alert to Google Chat Space
                      </label>
                    </div>

                    {notifyChat && (
                      <div className="space-y-1 pl-5 animate-fadeIn">
                        <label className="text-[9px] text-stone-500 uppercase font-semibold block">Select alert channel space:</label>
                        <select
                          id="chat-notification-channel-select"
                          value={selectedChatSpace}
                          onChange={(e) => setSelectedChatSpace(e.target.value)}
                          className="w-full bg-stone-900 border border-stone-800 text-stone-200 text-[10px] py-1 px-1.5 rounded focus:outline-none"
                        >
                          {chatSpaces.map(sp => (
                            <option key={sp.name} value={sp.name}>{sp.displayName || sp.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Additional transaction description/notes */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-stone-500 uppercase font-semibold">Order Note annotations</span>
                  <input
                    id="input-notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="E.g. Extra kief coated, custom hemp filter, next Friday pickup..."
                    className="w-full bg-stone-950 border border-stone-850 text-stone-200 text-xs font-mono py-2 px-3 rounded-lg focus:outline-none focus:border-stone-700"
                  />
                </div>

                {/* Approve final ledger triggers */}
                <button
                  id="btn-register-checkout"
                  type="submit"
                  disabled={cartItems.length === 0 || !isCashSufficient}
                  className={`w-full py-3.5 px-4 font-sans font-extrabold rounded-xl text-center text-sm shadow transition-all cursor-pointer ${
                    cartItems.length === 0 
                      ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-850'
                      : !isCashSufficient
                        ? 'bg-rose-950 border border-rose-900/40 text-rose-300 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-stone-900 font-extrabold scale-[1.01]'
                  }`}
                >
                  {cartItems.length === 0 
                    ? 'Accummulator Ledger is Empty' 
                    : !isCashSufficient 
                      ? 'Awaiting Complete Cash Tender' 
                      : `Approve Cash Sale ($${cartTotal.toFixed(2)})`
                  }
                </button>

              </form>

            </div>

          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
