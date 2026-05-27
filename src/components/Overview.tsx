/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Client, Order, Strain } from '../types';
import CashTrendChart from './CashTrendChart';
import { 
  TrendingUp, 
  Users, 
  Layers, 
  Flame, 
  DollarSign, 
  Plus, 
  ShoppingBag,
  Clock,
  ChevronRight
} from 'lucide-react';

interface OverviewProps {
  clients: Client[];
  strains: Strain[];
  orders: Order[];
  onNavigateToCalc: () => void;
  onNavigateToClients: () => void;
  onSelectClient: (id: string) => void;
}

export default function Overview({ 
  clients, 
  strains, 
  orders, 
  onNavigateToCalc, 
  onNavigateToClients,
  onSelectClient 
}: OverviewProps) {
  
  // STATS calculations
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalSpendByClients = clients.reduce((sum, c) => sum + c.totalSpend, 0);
  
  // Total joints sold (rolled)
  const totalJointsSold = orders.reduce((sum, o) => {
    return sum + o.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
  }, 0);

  // Average ticket price
  const averageTicket = orders.length > 0 ? totalRevenue / orders.length : 0;

  // Strains popularity
  const strainCounts: Record<string, number> = {};
  orders.forEach(o => {
    o.items.forEach(item => {
      strainCounts[item.strainName] = (strainCounts[item.strainName] || 0) + item.quantity;
    });
  });

  const sortedPopularStrains = Object.entries(strainCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Type counts (Sativa vs Indica vs Hybrid)
  const typeCounts = { Indica: 0, Sativa: 0, Hybrid: 0 };
  orders.forEach(o => {
    o.items.forEach(item => {
      if (item.type === 'Indica' || item.type === 'Sativa' || item.type === 'Hybrid') {
        typeCounts[item.type] += item.quantity;
      }
    });
  });

  const totalTypeQuantity = Math.max(typeCounts.Indica + typeCounts.Sativa + typeCounts.Hybrid, 1);
  const typePercentages = {
    Indica: Math.round((typeCounts.Indica / totalTypeQuantity) * 100),
    Sativa: Math.round((typeCounts.Sativa / totalTypeQuantity) * 100),
    Hybrid: Math.round((typeCounts.Hybrid / totalTypeQuantity) * 100),
  };

  // Recent 5 transactions
  const recentOrders = orders.slice(0, 5);

  // High rollers (VIP clients by spend)
  const vipClients = [...clients]
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Header section with Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800 pb-6">
        <div>
          <h1 className="text-3xl font-sans font-bold tracking-tight text-stone-100">
            Ledger Overview
          </h1>
          <p className="text-sm font-mono text-stone-400 mt-1">
            Real-time track of clients, sales, and custom-rolled joints.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="btn-quick-calc"
            onClick={onNavigateToCalc}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-stone-900 font-sans font-semibold py-2.5 px-4 rounded-lg shadow-md transition-colors text-sm"
          >
            <Plus className="w-4 h-4 text-stone-900 stroke-[2.5]" />
            New Roll Calculation
          </button>
          <button
            id="btn-view-clients"
            onClick={onNavigateToClients}
            className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 hover:border-stone-600 font-sans font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            <Users className="w-4 h-4" />
            Clients ({clients.length})
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          id="metric-revenue"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-stone-900 border border-stone-800 p-5 rounded-xl flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-mono text-stone-400 uppercase tracking-wider">Accumulated Cash</span>
            <div className="text-2xl font-sans font-bold text-stone-100">${totalRevenue.toFixed(2)}</div>
            <span className="text-[10px] font-mono text-emerald-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              100% Client-backed flow
            </span>
          </div>
          <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 rounded-lg text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div 
          id="metric-joints"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-stone-900 border border-stone-800 p-5 rounded-xl flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-mono text-stone-400 uppercase tracking-wider">Joints Rolled & Sold</span>
            <div className="text-2xl font-sans font-bold text-stone-100">{totalJointsSold} units</div>
            <span className="text-[10px] font-mono text-emerald-400">
              Across Sativa, Indica & Hybrids
            </span>
          </div>
          <div className="p-3 bg-stone-800 border border-stone-700 rounded-lg text-emerald-400">
            <Flame className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div 
          id="metric-clients"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-stone-900 border border-stone-800 p-5 rounded-xl flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-mono text-stone-400 uppercase tracking-wider font-medium">Customer base</span>
            <div className="text-2xl font-sans font-bold text-stone-100">{clients.length} Customers</div>
            <span className="text-[10px] font-mono text-stone-400">
              Active purchasing database
            </span>
          </div>
          <div className="p-3 bg-stone-800 border border-stone-700 rounded-lg text-stone-300">
            <Users className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div 
          id="metric-average"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-stone-900 border border-stone-800 p-5 rounded-xl flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-mono text-stone-400 uppercase tracking-wider">Avg Order Value</span>
            <div className="text-2xl font-sans font-bold text-stone-100">${averageTicket.toFixed(2)}</div>
            <span className="text-[10px] font-mono text-stone-400">
              From {orders.length} calculated sales
            </span>
          </div>
          <div className="p-3 bg-stone-800 border border-stone-700 rounded-lg text-stone-300">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </motion.div>
      </div>

      {/* Main Stats / Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Joint Formulation Breakdown & Strain Stock */}
        <div className="lg:col-span-2 space-y-6">
          <CashTrendChart orders={orders} />

          <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
            <h3 className="text-lg font-sans font-bold text-stone-100 flex items-center gap-2 mb-4">
              <Layers className="text-emerald-500 w-5 h-5" />
              Herbal Profile Strain Makeup
            </h3>
            
            <p className="text-xs font-mono text-stone-400 mb-6">
              Distribution of strain types calculated based on items sold.
            </p>

            <div className="space-y-5">
              {/* Indica Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-indigo-400 flex items-center gap-1.5 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
                    Indica (Relax / Heavy)
                  </span>
                  <span className="text-stone-300">{typePercentages.Indica}% ({typeCounts.Indica} joints)</span>
                </div>
                <div className="w-full bg-stone-800 h-3.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${typePercentages.Indica}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-indigo-500"
                  />
                </div>
              </div>

              {/* Sativa Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-amber-400 flex items-center gap-1.5 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                    Sativa (Energy / Spark)
                  </span>
                  <span className="text-stone-300">{typePercentages.Sativa}% ({typeCounts.Sativa} joints)</span>
                </div>
                <div className="w-full bg-stone-800 h-3.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${typePercentages.Sativa}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                    className="h-full bg-amber-500"
                  />
                </div>
              </div>

              {/* Hybrid Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                    Hybrid (Balanced Flow)
                  </span>
                  <span className="text-stone-300">{typePercentages.Hybrid}% ({typeCounts.Hybrid} joints)</span>
                </div>
                <div className="w-full bg-stone-800 h-3.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${typePercentages.Hybrid}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                    className="h-full bg-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Micro details */}
            <div className="grid grid-cols-3 gap-4 border-t border-stone-800 mt-6 pt-5 text-center text-xs font-mono">
              <div>
                <div className="text-stone-400 mb-1">Total Indica</div>
                <div className="text-indigo-400 font-bold text-sm">{typeCounts.Indica}</div>
              </div>
              <div>
                <div className="text-stone-400 mb-1">Total Sativa</div>
                <div className="text-amber-400 font-bold text-sm">{typeCounts.Sativa}</div>
              </div>
              <div>
                <div className="text-stone-400 mb-1">Total Hybrid</div>
                <div className="text-emerald-400 font-bold text-sm">{typeCounts.Hybrid}</div>
              </div>
            </div>
          </div>

          {/* Strain list with active metrics */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
            <h3 className="text-lg font-sans font-bold text-stone-100 flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-emerald-400 rotate-45" />
              Top Strains Roll Tracker
            </h3>
            {sortedPopularStrains.length === 0 ? (
              <p className="text-sm font-mono text-stone-500 py-4 text-center">
                No custom joint calculations added to calculations ledger yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sortedPopularStrains.slice(0, 4).map((strain, index) => {
                  const percent = Math.round((strain.count / Math.max(totalJointsSold, 1)) * 100);
                  return (
                    <div key={strain.name} className="bg-stone-950 p-4 border border-stone-850 rounded-lg flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-sans font-bold text-stone-200">{strain.name}</span>
                        <span className="text-xs bg-stone-800 px-1.5 py-0.5 rounded font-mono text-emerald-400">#{index + 1}</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <span className="text-xs text-stone-400 font-mono">Rolled units</span>
                        <span className="text-lg font-mono font-bold text-stone-100">
                          {strain.count} <span className="text-xs text-stone-500 font-normal">({percent}%)</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: High Rollers & Recent Transactions */}
        <div className="space-y-6">
          {/* VIP High Rollers */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
            <h3 className="text-md font-sans font-bold text-stone-100 flex items-center gap-2 mb-3 px-1">
              <Users className="text-emerald-500 w-4 h-4" />
              VIP Clientele
            </h3>
            
            <div className="space-y-2">
              {vipClients.map((client, i) => (
                <div 
                  key={client.id}
                  id={`client-vip-${client.id}`}
                  onClick={() => onSelectClient(client.id)}
                  className="bg-stone-950 hover:bg-stone-900 border border-stone-850 hover:border-emerald-900/40 p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-900 flex items-center justify-center font-mono text-emerald-400 font-bold text-xs uppercase">
                      {client.name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-sans font-semibold text-stone-200 group-hover:text-emerald-400 transition-colors">
                        {client.name}
                      </div>
                      <span className="text-[10px] font-mono text-stone-400 block">
                        Prefers: {client.favoriteStrain || 'None listed'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold text-stone-200">${client.totalSpend.toFixed(2)}</div>
                    <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest">VIP Leader</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Cash Flow Log */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-sans font-bold text-stone-100 flex items-center gap-2 px-1">
                <Clock className="text-emerald-500 w-4 h-4" />
                Ledger Logs
              </h3>
              <span className="text-[10px] font-mono bg-stone-800 text-stone-300 py-0.5 px-2 rounded">
                Live
              </span>
            </div>

            <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
              {recentOrders.length === 0 ? (
                <p className="text-xs font-mono text-stone-500 py-6 text-center">
                  No calculated transactions found in local storage.
                </p>
              ) : (
                recentOrders.map((order) => (
                  <div 
                    key={order.id}
                    id={`order-log-${order.id}`}
                    className="border-b border-stone-850 pb-2.5 last:border-0 last:pb-0"
                  >
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-sans font-semibold text-stone-200 truncate max-w-[130px]" title={order.clientName}>
                        {order.clientName}
                      </span>
                      <span className="text-stone-100 font-mono font-bold">${order.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-stone-400">
                      <span className="truncate max-w-[150px]">
                        {order.items.map(i => `${i.quantity}x ${i.strainName}`).join(', ')}
                      </span>
                      <span>
                        {new Date(order.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <button
              id="goto-calc-from-logs"
              onClick={onNavigateToCalc}
              className="w-full text-center mt-4 pt-3 border-t border-stone-800 flex items-center justify-center text-xs font-mono text-emerald-500 hover:text-emerald-400 transition-colors group cursor-pointer"
            >
              Open Rolling Calculator
              <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
