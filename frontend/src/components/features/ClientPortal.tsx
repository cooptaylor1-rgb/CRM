'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, TrendingUp, TrendingDown, FileText, MessageSquare,
  Target, Bell, Calendar, Download, Eye, Send, Paperclip,
  ChevronRight, Lock, Shield, Clock, CheckCircle, AlertCircle,
  DollarSign, PieChart, BarChart3, ArrowUpRight, ArrowDownRight,
  User, Settings, LogOut, Home, Folder, HelpCircle, Phone
} from 'lucide-react';

// Types
interface PortalUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  lastLogin: Date;
  householdId: string;
}

interface PortfolioSummary {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  ytdReturn: number;
  ytdReturnPercent: number;
  cashBalance: number;
  pendingActivity: number;
}

interface AccountSummary {
  id: string;
  name: string;
  type: string;
  custodian: string;
  value: number;
  dayChange: number;
  dayChangePercent: number;
}

interface Holding {
  symbol: string;
  name: string;
  shares: number;
  price: number;
  value: number;
  dayChange: number;
  dayChangePercent: number;
  allocation: number;
  costBasis: number;
  gainLoss: number;
  gainLossPercent: number;
}

interface PortalDocument {
  id: string;
  name: string;
  type: 'statement' | 'tax' | 'report' | 'agreement' | 'correspondence';
  date: Date;
  size: string;
  isNew: boolean;
}

interface Message {
  id: string;
  from: string;
  fromAvatar?: string;
  subject: string;
  preview: string;
  date: Date;
  isRead: boolean;
  hasAttachment: boolean;
}

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  monthlyContribution: number;
  onTrack: boolean;
  probability: number;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'action';
  title: string;
  message: string;
  date: Date;
  isRead: boolean;
  actionUrl?: string;
}

// Mock Data
const mockUser: PortalUser = {
  id: 'user-1',
  name: 'Robert & Sarah Chen',
  email: 'robert.chen@email.com',
  lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  householdId: 'hh-1'
};

const mockPortfolio: PortfolioSummary = {
  totalValue: 2847592.34,
  dayChange: 12847.23,
  dayChangePercent: 0.45,
  ytdReturn: 187432.12,
  ytdReturnPercent: 7.04,
  cashBalance: 124532.00,
  pendingActivity: 3
};

const mockAccounts: AccountSummary[] = [
  { id: '1', name: 'Joint Investment', type: 'Brokerage', custodian: 'Schwab', value: 1245000, dayChange: 5432, dayChangePercent: 0.44 },
  { id: '2', name: 'Robert IRA', type: 'Traditional IRA', custodian: 'Schwab', value: 687000, dayChange: 3210, dayChangePercent: 0.47 },
  { id: '3', name: 'Sarah Roth IRA', type: 'Roth IRA', custodian: 'Fidelity', value: 542000, dayChange: 2105, dayChangePercent: 0.39 },
  { id: '4', name: 'Trust Account', type: 'Trust', custodian: 'Schwab', value: 373592.34, dayChange: 2100, dayChangePercent: 0.56 },
];

const mockHoldings: Holding[] = [
  { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', shares: 1250, price: 245.32, value: 306650, dayChange: 1.23, dayChangePercent: 0.50, allocation: 10.8, costBasis: 275000, gainLoss: 31650, gainLossPercent: 11.5 },
  { symbol: 'VXUS', name: 'Vanguard Total International Stock ETF', shares: 2100, price: 58.45, value: 122745, dayChange: -0.32, dayChangePercent: -0.54, allocation: 4.3, costBasis: 115000, gainLoss: 7745, gainLossPercent: 6.7 },
  { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', shares: 1800, price: 72.18, value: 129924, dayChange: 0.15, dayChangePercent: 0.21, allocation: 4.6, costBasis: 135000, gainLoss: -5076, gainLossPercent: -3.8 },
  { symbol: 'AAPL', name: 'Apple Inc.', shares: 450, price: 198.45, value: 89302.50, dayChange: 2.34, dayChangePercent: 1.19, allocation: 3.1, costBasis: 67500, gainLoss: 21802.50, gainLossPercent: 32.3 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', shares: 320, price: 378.92, value: 121254.40, dayChange: 4.56, dayChangePercent: 1.22, allocation: 4.3, costBasis: 89600, gainLoss: 31654.40, gainLossPercent: 35.3 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', shares: 280, price: 142.67, value: 39947.60, dayChange: 1.89, dayChangePercent: 1.34, allocation: 1.4, costBasis: 35000, gainLoss: 4947.60, gainLossPercent: 14.1 },
];

const mockDocuments: PortalDocument[] = [
  { id: '1', name: 'Q4 2025 Statement', type: 'statement', date: new Date('2026-01-05'), size: '2.4 MB', isNew: true },
  { id: '2', name: '2025 Year-End Tax Summary', type: 'tax', date: new Date('2026-01-03'), size: '1.8 MB', isNew: true },
  { id: '3', name: 'Portfolio Performance Report', type: 'report', date: new Date('2025-12-31'), size: '3.2 MB', isNew: false },
  { id: '4', name: 'Investment Policy Statement', type: 'agreement', date: new Date('2025-11-15'), size: '892 KB', isNew: false },
  { id: '5', name: 'Rebalancing Notification', type: 'correspondence', date: new Date('2025-12-20'), size: '245 KB', isNew: false },
];

const mockMessages: Message[] = [
  { id: '1', from: 'Jennifer Adams, CFP®', subject: 'Your Q1 2026 Review Meeting', preview: 'Hi Robert & Sarah, I wanted to reach out to schedule our quarterly review...', date: new Date('2026-01-05'), isRead: false, hasAttachment: false },
  { id: '2', from: 'Portfolio Team', subject: 'Rebalancing Complete', preview: 'Your portfolio rebalancing has been completed as discussed...', date: new Date('2026-01-03'), isRead: false, hasAttachment: true },
  { id: '3', from: 'Jennifer Adams, CFP®', subject: 'Tax Loss Harvesting Opportunity', preview: 'I identified a potential tax loss harvesting opportunity in your...', date: new Date('2025-12-28'), isRead: true, hasAttachment: false },
];

const mockGoals: Goal[] = [
  { id: '1', name: 'Retirement', targetAmount: 5000000, currentAmount: 2234000, targetDate: new Date('2035-06-01'), monthlyContribution: 8500, onTrack: true, probability: 87 },
  { id: '2', name: 'College Fund - Emma', targetAmount: 250000, currentAmount: 145000, targetDate: new Date('2030-08-01'), monthlyContribution: 1500, onTrack: true, probability: 92 },
  { id: '3', name: 'Vacation Home', targetAmount: 400000, currentAmount: 125000, targetDate: new Date('2028-12-01'), monthlyContribution: 3000, onTrack: false, probability: 68 },
];

const mockNotifications: Notification[] = [
  { id: '1', type: 'action', title: 'Document Requires Signature', message: 'Please sign the updated Investment Policy Statement', date: new Date('2026-01-05'), isRead: false, actionUrl: '/documents' },
  { id: '2', type: 'success', title: 'Dividend Received', message: '$1,234.56 dividend from VTI deposited', date: new Date('2026-01-04'), isRead: false },
  { id: '3', type: 'info', title: 'Market Update', message: 'S&P 500 reached new all-time high', date: new Date('2026-01-03'), isRead: true },
];

// Utility Components
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const formatPercent = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
};

// Sub-components
const PortfolioOverview: React.FC<{ portfolio: PortfolioSummary; accounts: AccountSummary[] }> = ({ portfolio, accounts }) => {
  const [selectedView, setSelectedView] = useState<'accounts' | 'allocation'>('accounts');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white col-span-2"
        >
          <p className="text-blue-100 text-sm">Total Portfolio Value</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(portfolio.totalValue)}</p>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1">
              {portfolio.dayChange >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-300" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-300" />
              )}
              <span className={portfolio.dayChange >= 0 ? 'text-green-300' : 'text-red-300'}>
                {formatCurrency(Math.abs(portfolio.dayChange))} ({formatPercent(portfolio.dayChangePercent)})
              </span>
            </div>
            <span className="text-blue-200 text-sm">Today</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <p className="text-gray-500 dark:text-gray-400 text-sm">YTD Return</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formatPercent(portfolio.ytdReturnPercent)}
          </p>
          <p className="text-green-600 text-sm mt-1">{formatCurrency(portfolio.ytdReturn)}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <p className="text-gray-500 dark:text-gray-400 text-sm">Cash Available</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formatCurrency(portfolio.cashBalance)}
          </p>
          <p className="text-gray-500 text-sm mt-1">{portfolio.pendingActivity} pending</p>
        </motion.div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedView('accounts')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedView === 'accounts'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
          }`}
        >
          By Account
        </button>
        <button
          onClick={() => setSelectedView('allocation')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedView === 'allocation'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
          }`}
        >
          Asset Allocation
        </button>
      </div>

      {/* Accounts List */}
      {selectedView === 'accounts' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {accounts.map((account, idx) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{account.name}</p>
                  <p className="text-sm text-gray-500">{account.type} • {account.custodian}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(account.value)}</p>
                  <p className={`text-sm ${account.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(account.dayChangePercent)}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Allocation View */}
      {selectedView === 'allocation' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'US Stocks', value: 52, color: 'bg-blue-500' },
              { label: 'International', value: 18, color: 'bg-green-500' },
              { label: 'Bonds', value: 22, color: 'bg-yellow-500' },
              { label: 'Cash', value: 8, color: 'bg-gray-500' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-2">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-200 dark:text-gray-700" />
                    <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="8" fill="none"
                      strokeDasharray={`${item.value * 2.2} 220`}
                      className={item.color.replace('bg-', 'text-')}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-900 dark:text-white">
                    {item.value}%
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const HoldingsList: React.FC<{ holdings: Holding[] }> = ({ holdings }) => {
  const [sortBy, setSortBy] = useState<'value' | 'change' | 'gainLoss'>('value');

  const sortedHoldings = [...holdings].sort((a, b) => {
    if (sortBy === 'value') return b.value - a.value;
    if (sortBy === 'change') return b.dayChangePercent - a.dayChangePercent;
    return b.gainLossPercent - a.gainLossPercent;
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Holdings</h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="value">Sort by Value</option>
          <option value="change">Sort by Day Change</option>
          <option value="gainLoss">Sort by Gain/Loss</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr className="text-left text-sm text-gray-500 dark:text-gray-400">
              <th className="px-4 py-3 font-medium">Symbol</th>
              <th className="px-4 py-3 font-medium">Shares</th>
              <th className="px-4 py-3 font-medium text-right">Price</th>
              <th className="px-4 py-3 font-medium text-right">Value</th>
              <th className="px-4 py-3 font-medium text-right">Day Change</th>
              <th className="px-4 py-3 font-medium text-right">Total Gain/Loss</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedHoldings.map((holding) => (
              <tr key={holding.symbol} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 dark:text-white">{holding.symbol}</p>
                  <p className="text-xs text-gray-500 truncate max-w-[150px]">{holding.name}</p>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{holding.shares.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-white">${holding.price.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(holding.value)}</td>
                <td className={`px-4 py-3 text-right ${holding.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(holding.dayChangePercent)}
                </td>
                <td className={`px-4 py-3 text-right ${holding.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <p>{formatCurrency(holding.gainLoss)}</p>
                  <p className="text-xs">{formatPercent(holding.gainLossPercent)}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DocumentVault: React.FC<{ documents: PortalDocument[] }> = ({ documents }) => {
  const [filter, setFilter] = useState<PortalDocument['type'] | 'all'>('all');

  const filteredDocs = filter === 'all' ? documents : documents.filter(d => d.type === filter);
  const typeIcons = {
    statement: FileText,
    tax: DollarSign,
    report: BarChart3,
    agreement: Lock,
    correspondence: MessageSquare,
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          {['all', 'statement', 'tax', 'report', 'agreement', 'correspondence'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type as typeof filter)}
              className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${
                filter === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {filteredDocs.map((doc) => {
          const Icon = typeIcons[doc.type];
          return (
            <div key={doc.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                doc.type === 'statement' ? 'bg-blue-100 text-blue-600' :
                doc.type === 'tax' ? 'bg-green-100 text-green-600' :
                doc.type === 'report' ? 'bg-purple-100 text-purple-600' :
                doc.type === 'agreement' ? 'bg-yellow-100 text-yellow-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{doc.name}</p>
                  {doc.isNew && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">New</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{formatDate(doc.date)} • {doc.size}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Eye className="w-4 h-4 text-gray-500" />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Download className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SecureMessaging: React.FC<{ messages: Message[] }> = ({ messages }) => {
  const [composing, setComposing] = useState(false);
  const [newMessage, setNewMessage] = useState({ subject: '', body: '' });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-600" />
          <span className="text-sm text-gray-500">End-to-end encrypted</span>
        </div>
        <button
          onClick={() => setComposing(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          New Message
        </button>
      </div>

      {composing && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
        >
          <input
            type="text"
            placeholder="Subject"
            value={newMessage.subject}
            onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <textarea
            placeholder="Write your message..."
            value={newMessage.body}
            onChange={(e) => setNewMessage({ ...newMessage, body: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
          />
          <div className="flex items-center justify-between">
            <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Paperclip className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setComposing(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Send className="w-4 h-4" /> Send
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${
              !msg.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                {msg.from.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-medium ${!msg.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                    {msg.from}
                  </p>
                  {msg.hasAttachment && <Paperclip className="w-4 h-4 text-gray-400" />}
                </div>
                <p className={`text-sm ${!msg.isRead ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                  {msg.subject}
                </p>
                <p className="text-sm text-gray-500 truncate">{msg.preview}</p>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(msg.date)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const GoalTracker: React.FC<{ goals: Goal[] }> = ({ goals }) => {
  return (
    <div className="space-y-4">
      {goals.map((goal) => {
        const progress = (goal.currentAmount / goal.targetAmount) * 100;
        const yearsRemaining = Math.max(0, (goal.targetDate.getTime() - Date.now()) / (365 * 24 * 60 * 60 * 1000));

        return (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{goal.name}</h4>
                <p className="text-sm text-gray-500">Target: {formatDate(goal.targetDate)} ({yearsRemaining.toFixed(1)} years)</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                goal.onTrack
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                {goal.probability}% probability
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">{formatCurrency(goal.currentAmount)}</span>
                <span className="text-gray-900 dark:text-white font-medium">{formatCurrency(goal.targetAmount)}</span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${goal.onTrack ? 'bg-green-500' : 'bg-yellow-500'}`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Monthly contribution: {formatCurrency(goal.monthlyContribution)}</span>
              <span className={goal.onTrack ? 'text-green-600' : 'text-yellow-600'}>
                {goal.onTrack ? (
                  <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> On Track</span>
                ) : (
                  <span className="flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Needs Attention</span>
                )}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// Main Component
export const ClientPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'holdings' | 'documents' | 'messages' | 'goals'>('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);

  const user = mockUser;
  const portfolio = mockPortfolio;
  const accounts = mockAccounts;
  const holdings = mockHoldings;
  const documents = mockDocuments;
  const messages = mockMessages;
  const goals = mockGoals;
  const notifications = mockNotifications;

  const unreadNotifications = notifications.filter(n => !n.isRead).length;
  const unreadMessages = messages.filter(m => !m.isRead).length;

  const navItems: Array<{ id: typeof activeTab; label: string; icon: React.ElementType; badge?: number }> = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'holdings', label: 'Holdings', icon: Briefcase },
    { id: 'documents', label: 'Documents', icon: Folder, badge: documents.filter(d => d.isNew).length },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadMessages },
    { id: 'goals', label: 'Goals', icon: Target },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900 dark:text-white">Client Portal</h1>
                <p className="text-xs text-gray-500">Welcome, {user.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <HelpCircle className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Phone className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
              <button className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                  {user.name.charAt(0)}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Dropdown */}
        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-4 top-16 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
            >
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                      !notif.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        notif.type === 'action' ? 'bg-blue-100 text-blue-600' :
                        notif.type === 'success' ? 'bg-green-100 text-green-600' :
                        notif.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {notif.type === 'action' ? <AlertCircle className="w-4 h-4" /> :
                         notif.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
                         <Bell className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.title}</p>
                        <p className="text-xs text-gray-500">{notif.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === item.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                {item.badge && item.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <PortfolioOverview portfolio={portfolio} accounts={accounts} />
            </motion.div>
          )}

          {activeTab === 'holdings' && (
            <motion.div
              key="holdings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <HoldingsList holdings={holdings} />
            </motion.div>
          )}

          {activeTab === 'documents' && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DocumentVault documents={documents} />
            </motion.div>
          )}

          {activeTab === 'messages' && (
            <motion.div
              key="messages"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SecureMessaging messages={messages} />
            </motion.div>
          )}

          {activeTab === 'goals' && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <GoalTracker goals={goals} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>256-bit encryption • SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Last login: {formatDate(user.lastLogin)}</span>
              <button className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ClientPortal;
