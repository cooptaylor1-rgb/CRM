'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalculatorIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CalendarIcon,
  BanknotesIcon,
  ChartBarIcon,
  DocumentTextIcon,
  LightBulbIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

// ============================================
// Types
// ============================================

export type TaxLotMethod = 'fifo' | 'lifo' | 'hifo' | 'specific_id' | 'average_cost';

export interface TaxLot {
  id: string;
  symbol: string;
  name: string;
  purchaseDate: Date;
  quantity: number;
  costBasis: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  holdingPeriod: 'short' | 'long';
  daysHeld: number;
  washSaleRisk: boolean;
}

export interface HarvestingOpportunity {
  id: string;
  symbol: string;
  name: string;
  currentLoss: number;
  taxSavings: number;
  replacementOptions: string[];
  daysUntilLongTerm?: number;
  washSaleWindow: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface TaxProjection {
  shortTermGains: number;
  longTermGains: number;
  shortTermLosses: number;
  longTermLosses: number;
  netGainLoss: number;
  estimatedTax: number;
  harvestingSavings: number;
}

export interface TaxPlanningToolsProps {
  className?: string;
  onHarvest?: (opportunity: HarvestingOpportunity) => void;
}

// ============================================
// Mock Data
// ============================================

const generateMockData = (): { lots: TaxLot[]; opportunities: HarvestingOpportunity[]; projection: TaxProjection } => {
  const lots: TaxLot[] = [
    { id: 'l1', symbol: 'VTI', name: 'Vanguard Total Stock Market', purchaseDate: new Date('2023-03-15'), quantity: 500, costBasis: 105000, currentValue: 122500, gainLoss: 17500, gainLossPercent: 16.67, holdingPeriod: 'long', daysHeld: 662, washSaleRisk: false },
    { id: 'l2', symbol: 'AAPL', name: 'Apple Inc.', purchaseDate: new Date('2024-08-10'), quantity: 200, costBasis: 42000, currentValue: 35600, gainLoss: -6400, gainLossPercent: -15.24, holdingPeriod: 'short', daysHeld: 149, washSaleRisk: false },
    { id: 'l3', symbol: 'MSFT', name: 'Microsoft Corp.', purchaseDate: new Date('2022-11-20'), quantity: 150, costBasis: 37500, currentValue: 62250, gainLoss: 24750, gainLossPercent: 66.0, holdingPeriod: 'long', daysHeld: 778, washSaleRisk: false },
    { id: 'l4', symbol: 'NVDA', name: 'NVIDIA Corp.', purchaseDate: new Date('2024-09-05'), quantity: 100, costBasis: 12000, currentValue: 13500, gainLoss: 1500, gainLossPercent: 12.5, holdingPeriod: 'short', daysHeld: 123, washSaleRisk: false },
    { id: 'l5', symbol: 'TSLA', name: 'Tesla Inc.', purchaseDate: new Date('2024-06-20'), quantity: 75, costBasis: 18750, currentValue: 14625, gainLoss: -4125, gainLossPercent: -22.0, holdingPeriod: 'short', daysHeld: 200, washSaleRisk: true },
    { id: 'l6', symbol: 'AMZN', name: 'Amazon.com', purchaseDate: new Date('2023-07-12'), quantity: 120, costBasis: 15600, currentValue: 22200, gainLoss: 6600, gainLossPercent: 42.31, holdingPeriod: 'long', daysHeld: 543, washSaleRisk: false },
  ];

  const opportunities: HarvestingOpportunity[] = [
    { id: 'h1', symbol: 'AAPL', name: 'Apple Inc.', currentLoss: 6400, taxSavings: 2368, replacementOptions: ['QQQ', 'XLK', 'VGT'], priority: 'high', washSaleWindow: false },
    { id: 'h2', symbol: 'TSLA', name: 'Tesla Inc.', currentLoss: 4125, taxSavings: 1526, replacementOptions: ['CARZ', 'DRIV', 'IDRV'], daysUntilLongTerm: 165, priority: 'medium', washSaleWindow: true },
  ];

  const projection: TaxProjection = {
    shortTermGains: 1500,
    longTermGains: 48850,
    shortTermLosses: 10525,
    longTermLosses: 0,
    netGainLoss: 39825,
    estimatedTax: 7368,
    harvestingSavings: 3894,
  };

  return { lots, opportunities, projection };
};

// ============================================
// Helper Functions
// ============================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
};

// ============================================
// Sub-Components
// ============================================

const ProjectionCard: React.FC<{ projection: TaxProjection }> = ({ projection }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      <CalculatorIcon className="w-5 h-5 text-blue-500" />
      Tax Projection Summary
    </h3>
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div>
        <p className="text-xs text-gray-500 mb-1">Short-Term Gains</p>
        <p className="text-lg font-semibold text-green-600">{formatCurrency(projection.shortTermGains)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-1">Long-Term Gains</p>
        <p className="text-lg font-semibold text-green-600">{formatCurrency(projection.longTermGains)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-1">Short-Term Losses</p>
        <p className="text-lg font-semibold text-red-600">{formatCurrency(projection.shortTermLosses)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-1">Long-Term Losses</p>
        <p className="text-lg font-semibold text-red-600">{formatCurrency(projection.longTermLosses)}</p>
      </div>
    </div>
    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
      <div className="flex justify-between">
        <span className="text-gray-600 dark:text-gray-300">Net Gain/Loss</span>
        <span className={`font-semibold ${projection.netGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(projection.netGainLoss)}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600 dark:text-gray-300">Estimated Tax</span>
        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(projection.estimatedTax)}</span>
      </div>
      <div className="flex justify-between text-green-600">
        <span>Potential Savings (Harvesting)</span>
        <span className="font-semibold">{formatCurrency(projection.harvestingSavings)}</span>
      </div>
    </div>
  </div>
);

const OpportunityCard: React.FC<{ opportunity: HarvestingOpportunity; onHarvest: () => void }> = ({ opportunity, onHarvest }) => (
  <div className={`p-4 rounded-xl border ${
    opportunity.priority === 'high' ? 'border-green-200 bg-green-50 dark:bg-green-900/20' :
    opportunity.priority === 'medium' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20' :
    'border-gray-200 bg-white dark:bg-gray-800'
  }`}>
    <div className="flex items-start justify-between mb-3">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900 dark:text-white">{opportunity.symbol}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            opportunity.priority === 'high' ? 'bg-green-200 text-green-800' :
            opportunity.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
            'bg-gray-200 text-gray-800'
          }`}>
            {opportunity.priority} priority
          </span>
        </div>
        <p className="text-sm text-gray-500">{opportunity.name}</p>
      </div>
      {opportunity.washSaleWindow && (
        <span className="flex items-center gap-1 text-xs text-orange-600">
          <ExclamationTriangleIcon className="w-4 h-4" />
          Wash sale risk
        </span>
      )}
    </div>
    
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div>
        <p className="text-xs text-gray-500">Harvestable Loss</p>
        <p className="text-lg font-bold text-red-600">{formatCurrency(opportunity.currentLoss)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Tax Savings</p>
        <p className="text-lg font-bold text-green-600">{formatCurrency(opportunity.taxSavings)}</p>
      </div>
    </div>

    <div className="mb-4">
      <p className="text-xs text-gray-500 mb-2">Replacement Options</p>
      <div className="flex gap-2">
        {opportunity.replacementOptions.map(opt => (
          <span key={opt} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium">
            {opt}
          </span>
        ))}
      </div>
    </div>

    {opportunity.daysUntilLongTerm && (
      <p className="text-xs text-gray-500 mb-3">
        <ClockIcon className="w-3 h-3 inline mr-1" />
        {opportunity.daysUntilLongTerm} days until long-term
      </p>
    )}

    <button
      onClick={onHarvest}
      disabled={opportunity.washSaleWindow}
      className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      <ArrowTrendingDownIcon className="w-4 h-4" />
      Harvest Loss
    </button>
  </div>
);

const TaxLotRow: React.FC<{ lot: TaxLot }> = ({ lot }) => (
  <div className="px-4 py-3 flex items-center gap-4 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-0.5">
        <span className="font-medium text-gray-900 dark:text-white">{lot.symbol}</span>
        <span className={`px-1.5 py-0.5 rounded text-xs ${
          lot.holdingPeriod === 'long' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {lot.holdingPeriod === 'long' ? 'Long' : 'Short'}
        </span>
        {lot.washSaleRisk && (
          <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" title="Wash sale risk" />
        )}
      </div>
      <p className="text-xs text-gray-500">{lot.quantity} shares • {lot.daysHeld} days</p>
    </div>
    <div className="text-right">
      <p className="text-sm text-gray-500">Cost Basis</p>
      <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(lot.costBasis)}</p>
    </div>
    <div className="text-right">
      <p className="text-sm text-gray-500">Current</p>
      <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(lot.currentValue)}</p>
    </div>
    <div className="text-right w-24">
      <p className="text-sm text-gray-500">Gain/Loss</p>
      <p className={`font-semibold ${lot.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {lot.gainLoss >= 0 ? '+' : ''}{formatCurrency(lot.gainLoss)}
        <span className="text-xs ml-1">({lot.gainLossPercent.toFixed(1)}%)</span>
      </p>
    </div>
  </div>
);

// ============================================
// Main Component
// ============================================

export const TaxPlanningTools: React.FC<TaxPlanningToolsProps> = ({
  className = '',
  onHarvest,
}) => {
  const [data] = useState(() => generateMockData());
  const [activeTab, setActiveTab] = useState<'opportunities' | 'lots'>('opportunities');

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tax Planning Tools</h1>
          <p className="text-gray-500 mt-1">Optimize your tax efficiency with smart harvesting</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Projection Summary */}
        <div className="lg:col-span-1">
          <ProjectionCard projection={data.projection} />
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
            <LightBulbIcon className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{data.opportunities.length}</p>
            <p className="text-sm opacity-80">Harvesting Opportunities</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
            <BanknotesIcon className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{formatCurrency(data.projection.harvestingSavings)}</p>
            <p className="text-sm opacity-80">Potential Tax Savings</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
            <ChartBarIcon className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{data.lots.length}</p>
            <p className="text-sm opacity-80">Tax Lots Tracked</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white">
            <ExclamationTriangleIcon className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{data.lots.filter(l => l.washSaleRisk).length}</p>
            <p className="text-sm opacity-80">Wash Sale Alerts</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 w-fit">
        <button
          onClick={() => setActiveTab('opportunities')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'opportunities' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-600'
          }`}
        >
          Harvesting Opportunities
        </button>
        <button
          onClick={() => setActiveTab('lots')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'lots' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-600'
          }`}
        >
          Tax Lots ({data.lots.length})
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'opportunities' && (
          <motion.div
            key="opportunities"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {data.opportunities.map(opp => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                onHarvest={() => onHarvest?.(opp)}
              />
            ))}
            {data.opportunities.length === 0 && (
              <div className="col-span-2 py-12 text-center text-gray-500">
                <CheckCircleIcon className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p>No tax-loss harvesting opportunities at this time</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'lots' && (
          <motion.div
            key="lots"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {data.lots.map(lot => (
              <TaxLotRow key={lot.id} lot={lot} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaxPlanningTools;
