'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Filter, Search, Plus, ChevronDown, ChevronRight, Star, TrendingUp,
  TrendingDown, DollarSign, Activity, Target, Mail, Phone, Calendar, Clock,
  Award, AlertCircle, CheckCircle, BarChart3, PieChart, ArrowUpRight,
  ArrowDownRight, Building2, Briefcase, Crown, Shield, Zap, Heart, Eye,
  MoreVertical, Edit2, UserPlus, Download, RefreshCw, Layers, Grid3X3
} from 'lucide-react';

// Types
interface ClientSegment {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  criteria: SegmentCriteria[];
  clientCount: number;
  totalAUM: number;
  avgRevenue: number;
  avgEngagement: number;
  serviceModel: ServiceModel;
  isDefault: boolean;
}

interface SegmentCriteria {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'between' | 'in';
  value: string | number | number[] | string[];
}

interface ServiceModel {
  id: string;
  name: string;
  meetingFrequency: string;
  reportFrequency: string;
  dedicatedAdvisor: boolean;
  features: string[];
}

interface ClientProfile {
  id: string;
  name: string;
  segmentId: string;
  aum: number;
  revenue: number;
  engagementScore: number;
  profitability: number;
  relationshipLength: number;
  lastContact: Date;
  riskLevel: 'low' | 'medium' | 'high';
  sentiment: 'positive' | 'neutral' | 'negative';
  growthPotential: number;
  referralCount: number;
}

interface SegmentMetrics {
  segmentId: string;
  retention: number;
  satisfaction: number;
  profitMargin: number;
  growthRate: number;
  avgLifetimeValue: number;
}

// Mock Data
const mockSegments: ClientSegment[] = [
  {
    id: '1', name: 'Platinum Elite', description: 'Ultra-high net worth clients with $10M+ AUM',
    color: '#8B5CF6', icon: 'crown',
    criteria: [{ field: 'aum', operator: 'gt', value: 10000000 }],
    clientCount: 23, totalAUM: 485000000, avgRevenue: 125000, avgEngagement: 94,
    serviceModel: {
      id: 'sm1', name: 'White Glove', meetingFrequency: 'Monthly', reportFrequency: 'Weekly',
      dedicatedAdvisor: true, features: ['24/7 Support', 'Custom Research', 'Tax Optimization', 'Estate Planning']
    },
    isDefault: false
  },
  {
    id: '2', name: 'Gold', description: 'High net worth clients with $2M-$10M AUM',
    color: '#F59E0B', icon: 'star',
    criteria: [{ field: 'aum', operator: 'between', value: [2000000, 10000000] }],
    clientCount: 87, totalAUM: 412000000, avgRevenue: 47500, avgEngagement: 78,
    serviceModel: {
      id: 'sm2', name: 'Premium', meetingFrequency: 'Quarterly', reportFrequency: 'Monthly',
      dedicatedAdvisor: true, features: ['Priority Support', 'Financial Planning', 'Tax Guidance']
    },
    isDefault: false
  },
  {
    id: '3', name: 'Silver', description: 'Affluent clients with $500K-$2M AUM',
    color: '#6B7280', icon: 'shield',
    criteria: [{ field: 'aum', operator: 'between', value: [500000, 2000000] }],
    clientCount: 156, totalAUM: 187000000, avgRevenue: 12000, avgEngagement: 65,
    serviceModel: {
      id: 'sm3', name: 'Standard', meetingFrequency: 'Semi-Annual', reportFrequency: 'Quarterly',
      dedicatedAdvisor: false, features: ['Email Support', 'Standard Reporting', 'Online Portal']
    },
    isDefault: false
  },
  {
    id: '4', name: 'Growth', description: 'Emerging clients with $100K-$500K AUM',
    color: '#10B981', icon: 'trending',
    criteria: [{ field: 'aum', operator: 'between', value: [100000, 500000] }],
    clientCount: 234, totalAUM: 58500000, avgRevenue: 2500, avgEngagement: 52,
    serviceModel: {
      id: 'sm4', name: 'Essentials', meetingFrequency: 'Annual', reportFrequency: 'Quarterly',
      dedicatedAdvisor: false, features: ['Email Support', 'Basic Reporting', 'Digital Tools']
    },
    isDefault: true
  },
  {
    id: '5', name: 'At Risk', description: 'Clients showing disengagement signals',
    color: '#EF4444', icon: 'alert',
    criteria: [{ field: 'engagementScore', operator: 'lt', value: 30 }],
    clientCount: 18, totalAUM: 32000000, avgRevenue: 17800, avgEngagement: 22,
    serviceModel: {
      id: 'sm5', name: 'Retention Focus', meetingFrequency: 'Monthly', reportFrequency: 'Weekly',
      dedicatedAdvisor: true, features: ['Proactive Outreach', 'Satisfaction Survey', 'Service Recovery']
    },
    isDefault: false
  },
];

const mockClients: ClientProfile[] = [
  { id: '1', name: 'William Harrison', segmentId: '1', aum: 15200000, revenue: 152000, engagementScore: 96, profitability: 78, relationshipLength: 12, lastContact: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), riskLevel: 'low', sentiment: 'positive', growthPotential: 85, referralCount: 4 },
  { id: '2', name: 'Elizabeth Chen', segmentId: '1', aum: 22500000, revenue: 180000, engagementScore: 92, profitability: 82, relationshipLength: 8, lastContact: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), riskLevel: 'low', sentiment: 'positive', growthPotential: 72, referralCount: 2 },
  { id: '3', name: 'Michael Roberts', segmentId: '2', aum: 4800000, revenue: 48000, engagementScore: 84, profitability: 65, relationshipLength: 6, lastContact: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), riskLevel: 'low', sentiment: 'positive', growthPotential: 90, referralCount: 3 },
  { id: '4', name: 'Sarah Johnson', segmentId: '2', aum: 3200000, revenue: 38000, engagementScore: 71, profitability: 58, relationshipLength: 4, lastContact: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), riskLevel: 'medium', sentiment: 'neutral', growthPotential: 65, referralCount: 1 },
  { id: '5', name: 'David Kim', segmentId: '3', aum: 1100000, revenue: 11000, engagementScore: 68, profitability: 45, relationshipLength: 3, lastContact: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), riskLevel: 'medium', sentiment: 'neutral', growthPotential: 78, referralCount: 0 },
  { id: '6', name: 'Jennifer Martinez', segmentId: '5', aum: 2800000, revenue: 28000, engagementScore: 24, profitability: 52, relationshipLength: 5, lastContact: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), riskLevel: 'high', sentiment: 'negative', growthPotential: 35, referralCount: 0 },
  { id: '7', name: 'Robert Taylor', segmentId: '4', aum: 280000, revenue: 2800, engagementScore: 56, profitability: 32, relationshipLength: 2, lastContact: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), riskLevel: 'low', sentiment: 'positive', growthPotential: 88, referralCount: 1 },
  { id: '8', name: 'Amanda White', segmentId: '3', aum: 890000, revenue: 8900, engagementScore: 72, profitability: 48, relationshipLength: 4, lastContact: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), riskLevel: 'low', sentiment: 'positive', growthPotential: 70, referralCount: 2 },
];

const mockMetrics: SegmentMetrics[] = [
  { segmentId: '1', retention: 98, satisfaction: 4.9, profitMargin: 78, growthRate: 12, avgLifetimeValue: 1250000 },
  { segmentId: '2', retention: 94, satisfaction: 4.5, profitMargin: 65, growthRate: 8, avgLifetimeValue: 475000 },
  { segmentId: '3', retention: 88, satisfaction: 4.2, profitMargin: 52, growthRate: 5, avgLifetimeValue: 120000 },
  { segmentId: '4', retention: 82, satisfaction: 4.0, profitMargin: 38, growthRate: 15, avgLifetimeValue: 25000 },
  { segmentId: '5', retention: 45, satisfaction: 2.8, profitMargin: 42, growthRate: -8, avgLifetimeValue: 89000 },
];

// Utilities
const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(value);
const formatPercent = (value: number) => `${value.toFixed(1)}%`;
const formatDate = (date: Date) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);

// Sub-components
const SegmentCard: React.FC<{
  segment: ClientSegment;
  metrics: SegmentMetrics;
  isSelected: boolean;
  onClick: () => void;
}> = ({ segment, metrics, isSelected, onClick }) => {
  const icons: Record<string, React.ElementType> = {
    crown: Crown, star: Star, shield: Shield, trending: TrendingUp, alert: AlertCircle
  };
  const Icon = icons[segment.icon] || Users;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${segment.color}20` }}>
            <Icon className="w-5 h-5" style={{ color: segment.color }} />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">{segment.name}</h4>
            <p className="text-xs text-gray-500">{segment.clientCount} clients</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(segment.totalAUM)}</p>
          <p className="text-xs text-gray-500">Total AUM</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500">Retention</p>
          <p className="font-semibold text-gray-900 dark:text-white">{metrics.retention}%</p>
        </div>
        <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500">Margin</p>
          <p className="font-semibold text-gray-900 dark:text-white">{metrics.profitMargin}%</p>
        </div>
        <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500">Growth</p>
          <p className={`font-semibold ${metrics.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {metrics.growthRate > 0 ? '+' : ''}{metrics.growthRate}%
          </p>
        </div>
        <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500">Engage</p>
          <p className="font-semibold text-gray-900 dark:text-white">{segment.avgEngagement}%</p>
        </div>
      </div>
    </motion.div>
  );
};

const ClientRow: React.FC<{
  client: ClientProfile;
  segment: ClientSegment;
}> = ({ client, segment }) => {
  const sentimentColors = {
    positive: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    neutral: 'text-gray-600 bg-gray-100 dark:bg-gray-700',
    negative: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  };

  const riskColors = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-red-600',
  };

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
            {client.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{client.name}</p>
            <p className="text-xs text-gray-500">{client.relationshipLength}yr relationship</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${segment.color}20`, color: segment.color }}>
          {segment.name}
        </span>
      </td>
      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(client.aum)}</td>
      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{formatCurrency(client.revenue)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="h-2 rounded-full bg-blue-500" style={{ width: `${client.engagementScore}%` }} />
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">{client.engagementScore}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`${riskColors[client.riskLevel]} capitalize text-sm`}>{client.riskLevel}</span>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-xs capitalize ${sentimentColors[client.sentiment]}`}>
          {client.sentiment}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">{client.growthPotential}%</span>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-500 text-sm">{formatDate(client.lastContact)}</td>
      <td className="px-4 py-3">
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>
      </td>
    </motion.tr>
  );
};

const ServiceModelCard: React.FC<{ model: ServiceModel; color: string }> = ({ model, color }) => (
  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
        <Award className="w-4 h-4" style={{ color }} />
      </div>
      <h4 className="font-semibold text-gray-900 dark:text-white">{model.name}</h4>
    </div>
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-500">Meetings</span>
        <span className="text-gray-900 dark:text-white">{model.meetingFrequency}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Reports</span>
        <span className="text-gray-900 dark:text-white">{model.reportFrequency}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Dedicated Advisor</span>
        <span className={model.dedicatedAdvisor ? 'text-green-600' : 'text-gray-400'}>
          {model.dedicatedAdvisor ? <CheckCircle className="w-4 h-4" /> : '—'}
        </span>
      </div>
    </div>
    <div className="flex flex-wrap gap-1 mt-3">
      {model.features.map((feature) => (
        <span key={feature} className="px-2 py-0.5 bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs rounded">
          {feature}
        </span>
      ))}
    </div>
  </div>
);

const ProfitabilityMatrix: React.FC<{ segments: ClientSegment[]; metrics: SegmentMetrics[] }> = ({ segments, metrics }) => {
  const data = segments.map(seg => {
    const met = metrics.find(m => m.segmentId === seg.id)!;
    return { segment: seg, metrics: met };
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Profitability Matrix</h3>
      <div className="relative h-64">
        {/* Y Axis Label */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-gray-500 whitespace-nowrap">
          Profit Margin
        </div>
        {/* X Axis Label */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs text-gray-500">
          Client Volume →
        </div>
        {/* Plot Area */}
        <div className="absolute inset-8 border-l-2 border-b-2 border-gray-200 dark:border-gray-700">
          {data.map((d) => {
            const x = (d.segment.clientCount / 250) * 100;
            const y = 100 - d.metrics.profitMargin;
            return (
              <motion.div
                key={d.segment.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute w-4 h-4 rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${Math.min(x, 95)}%`,
                  top: `${y}%`,
                  backgroundColor: d.segment.color,
                  boxShadow: `0 0 0 4px ${d.segment.color}40`,
                }}
                title={`${d.segment.name}: ${d.segment.clientCount} clients, ${d.metrics.profitMargin}% margin`}
              />
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        {segments.map((seg) => (
          <div key={seg.id} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-gray-600 dark:text-gray-400">{seg.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Component
export const ClientSegmentationEngine: React.FC = () => {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'segments' | 'clients'>('segments');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = useMemo(() => {
    let clients = mockClients;
    if (selectedSegment) {
      clients = clients.filter(c => c.segmentId === selectedSegment);
    }
    if (searchQuery) {
      clients = clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return clients;
  }, [selectedSegment, searchQuery]);

  const totalAUM = mockSegments.reduce((sum, s) => sum + s.totalAUM, 0);
  const totalClients = mockSegments.reduce((sum, s) => sum + s.clientCount, 0);
  const avgEngagement = Math.round(mockSegments.reduce((sum, s) => sum + s.avgEngagement * s.clientCount, 0) / totalClients);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            Client Segmentation
          </h1>
          <p className="text-gray-500 mt-1">Automated tiering, service models, and profitability analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {['segments', 'clients'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as typeof viewMode)}
                className={`px-4 py-2 text-sm capitalize ${
                  viewMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                {mode === 'segments' ? <Grid3X3 className="w-4 h-4" /> : <Users className="w-4 h-4" />}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Create Segment
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total AUM', value: formatCurrency(totalAUM), icon: DollarSign, color: 'blue' },
          { label: 'Total Clients', value: totalClients.toLocaleString(), icon: Users, color: 'green' },
          { label: 'Avg Engagement', value: `${avgEngagement}%`, icon: Activity, color: 'purple' },
          { label: 'Segments', value: mockSegments.length.toString(), icon: Layers, color: 'orange' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{stat.label}</span>
              <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {viewMode === 'segments' ? (
        <div className="grid grid-cols-12 gap-6">
          {/* Segment Cards */}
          <div className="col-span-8 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {mockSegments.map((segment) => {
                const metrics = mockMetrics.find(m => m.segmentId === segment.id)!;
                return (
                  <SegmentCard
                    key={segment.id}
                    segment={segment}
                    metrics={metrics}
                    isSelected={selectedSegment === segment.id}
                    onClick={() => setSelectedSegment(selectedSegment === segment.id ? null : segment.id)}
                  />
                );
              })}
            </div>

            {/* Service Models */}
            {selectedSegment && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Service Model</h3>
                <ServiceModelCard
                  model={mockSegments.find(s => s.id === selectedSegment)!.serviceModel}
                  color={mockSegments.find(s => s.id === selectedSegment)!.color}
                />
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-span-4 space-y-6">
            <ProfitabilityMatrix segments={mockSegments} metrics={mockMetrics} />

            {/* Segment Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">AUM Distribution</h3>
              <div className="space-y-3">
                {mockSegments.map((segment) => {
                  const pct = (segment.totalAUM / totalAUM) * 100;
                  return (
                    <div key={segment.id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">{segment.name}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{pct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          className="h-2 rounded-full"
                          style={{ backgroundColor: segment.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Clients Table View */
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <select
              value={selectedSegment || ''}
              onChange={(e) => setSelectedSegment(e.target.value || null)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="">All Segments</option>
              {mockSegments.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Segment</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">AUM</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Engagement</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Risk</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sentiment</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Growth</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Contact</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredClients.map((client) => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    segment={mockSegments.find(s => s.id === client.segmentId)!}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSegmentationEngine;
