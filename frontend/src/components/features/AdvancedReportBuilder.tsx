'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  FileText, Plus, Trash2, Copy, Download, Eye, Settings, Save,
  BarChart3, PieChart, LineChart, Table, Type, Image, Minus,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Palette,
  Calendar, Clock, Mail, Printer, Share2, ChevronRight, ChevronDown,
  GripVertical, Layers, Grid, Filter, RefreshCw, CheckCircle,
  Play, Pause, Lock, Unlock, MoreVertical, Maximize2
} from 'lucide-react';

// Types
interface ReportElement {
  id: string;
  type: 'text' | 'chart' | 'table' | 'metric' | 'image' | 'divider' | 'spacer';
  config: Record<string, unknown>;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface ChartConfig {
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'donut';
  title: string;
  dataSource: string;
  colors: string[];
  showLegend: boolean;
  showGrid: boolean;
}

interface TableConfig {
  title: string;
  columns: string[];
  dataSource: string;
  sortable: boolean;
  pageSize: number;
}

interface MetricConfig {
  title: string;
  value: string;
  change?: number;
  format: 'currency' | 'percent' | 'number';
  color: string;
}

interface TextConfig {
  content: string;
  fontSize: number;
  fontWeight: 'normal' | 'medium' | 'bold';
  align: 'left' | 'center' | 'right';
  color: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: 'performance' | 'compliance' | 'billing' | 'client' | 'custom';
  elements: ReportElement[];
}

interface ScheduledReport {
  id: string;
  reportId: string;
  reportName: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  nextRun: Date;
  recipients: string[];
  format: 'pdf' | 'excel' | 'html';
  active: boolean;
}

// Mock Data
const mockTemplates: ReportTemplate[] = [
  { id: '1', name: 'Quarterly Performance', description: 'Comprehensive portfolio performance with benchmarks', thumbnail: '/templates/performance.png', category: 'performance', elements: [] },
  { id: '2', name: 'Client Statement', description: 'Monthly client account statement', thumbnail: '/templates/statement.png', category: 'client', elements: [] },
  { id: '3', name: 'Fee Summary', description: 'Billing and fee breakdown report', thumbnail: '/templates/billing.png', category: 'billing', elements: [] },
  { id: '4', name: 'Compliance Review', description: 'Regulatory compliance status report', thumbnail: '/templates/compliance.png', category: 'compliance', elements: [] },
  { id: '5', name: 'AUM Analytics', description: 'Assets under management trends', thumbnail: '/templates/aum.png', category: 'performance', elements: [] },
  { id: '6', name: 'Risk Analysis', description: 'Portfolio risk metrics and exposure', thumbnail: '/templates/risk.png', category: 'performance', elements: [] },
];

const mockScheduledReports: ScheduledReport[] = [
  { id: '1', reportId: '1', reportName: 'Quarterly Performance - All Clients', frequency: 'quarterly', nextRun: new Date('2026-04-01'), recipients: ['team@advisors.com'], format: 'pdf', active: true },
  { id: '2', reportId: '2', reportName: 'Monthly Statements', frequency: 'monthly', nextRun: new Date('2026-02-01'), recipients: ['clients@advisors.com'], format: 'pdf', active: true },
  { id: '3', reportId: '3', reportName: 'Weekly Fee Report', frequency: 'weekly', nextRun: new Date('2026-01-13'), recipients: ['billing@advisors.com'], format: 'excel', active: false },
];

const dataSources = [
  { id: 'portfolio_performance', name: 'Portfolio Performance', fields: ['date', 'value', 'return', 'benchmark'] },
  { id: 'client_accounts', name: 'Client Accounts', fields: ['client', 'account', 'balance', 'type'] },
  { id: 'transactions', name: 'Transactions', fields: ['date', 'type', 'symbol', 'amount', 'price'] },
  { id: 'fee_schedule', name: 'Fee Schedule', fields: ['client', 'fee_type', 'amount', 'date'] },
  { id: 'holdings', name: 'Holdings', fields: ['symbol', 'shares', 'value', 'allocation'] },
];

// Element Palette
const elementTypes = [
  { type: 'text', label: 'Text Block', icon: Type, description: 'Add headers, paragraphs, or labels' },
  { type: 'chart', label: 'Chart', icon: BarChart3, description: 'Visualize data with charts' },
  { type: 'table', label: 'Data Table', icon: Table, description: 'Display tabular data' },
  { type: 'metric', label: 'Metric Card', icon: LineChart, description: 'Highlight key metrics' },
  { type: 'image', label: 'Image', icon: Image, description: 'Add logos or images' },
  { type: 'divider', label: 'Divider', icon: Minus, description: 'Horizontal separator' },
  { type: 'spacer', label: 'Spacer', icon: Grid, description: 'Add vertical spacing' },
];

// Sub-components
const ElementPalette: React.FC<{ onAdd: (type: ReportElement['type']) => void }> = ({ onAdd }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <Layers className="w-4 h-4" /> Elements
      </h3>
      <div className="space-y-2">
        {elementTypes.map((element) => (
          <button
            key={element.type}
            onClick={() => onAdd(element.type as ReportElement['type'])}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
              <element.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{element.label}</p>
              <p className="text-xs text-gray-500 truncate">{element.description}</p>
            </div>
            <Plus className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
};

const CanvasElement: React.FC<{
  element: ReportElement;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdate: (config: Record<string, unknown>) => void;
}> = ({ element, isSelected, onSelect, onDelete, onUpdate }) => {
  const renderContent = () => {
    switch (element.type) {
      case 'text':
        const textConfig = element.config as unknown as TextConfig;
        return (
          <div
            className={`p-4 text-${textConfig.align}`}
            style={{
              fontSize: textConfig.fontSize,
              fontWeight: textConfig.fontWeight,
              color: textConfig.color
            }}
          >
            {textConfig.content || 'Click to edit text...'}
          </div>
        );
      case 'chart':
        const chartConfig = element.config as unknown as ChartConfig;
        return (
          <div className="p-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{chartConfig.title || 'Chart Title'}</p>
            <div className="h-40 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                <p className="text-xs">{chartConfig.chartType || 'bar'} chart</p>
                <p className="text-xs text-gray-400">{chartConfig.dataSource || 'Select data source'}</p>
              </div>
            </div>
          </div>
        );
      case 'table':
        const tableConfig = element.config as unknown as TableConfig;
        return (
          <div className="p-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{tableConfig.title || 'Table Title'}</p>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-800 grid grid-cols-4 gap-px">
                {(tableConfig.columns || ['Column 1', 'Column 2', 'Column 3', 'Column 4']).map((col, i) => (
                  <div key={i} className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400">{col}</div>
                ))}
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 h-20 flex items-center justify-center text-xs text-gray-500">
                Data preview
              </div>
            </div>
          </div>
        );
      case 'metric':
        const metricConfig = element.config as unknown as MetricConfig;
        return (
          <div className="p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">{metricConfig.title || 'Metric Title'}</p>
            <p className="text-2xl font-bold" style={{ color: metricConfig.color || '#2563eb' }}>
              {metricConfig.value || '$0.00'}
            </p>
            {metricConfig.change !== undefined && (
              <p className={`text-xs ${metricConfig.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metricConfig.change >= 0 ? '+' : ''}{metricConfig.change}%
              </p>
            )}
          </div>
        );
      case 'divider':
        return <div className="py-4 px-4"><hr className="border-gray-300 dark:border-gray-600" /></div>;
      case 'spacer':
        return <div className="h-12 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center text-xs text-gray-400">Spacer</div>;
      case 'image':
        return (
          <div className="p-4 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Image className="w-8 h-8 mx-auto mb-2" />
              <p className="text-xs">Drop image or click to upload</p>
            </div>
          </div>
        );
      default:
        return <div className="p-4 text-gray-500">Unknown element type</div>;
    }
  };

  return (
    <motion.div
      layout
      className={`relative bg-white dark:bg-gray-800 rounded-lg border-2 transition-colors ${
        isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 dark:border-gray-700'
      }`}
      onClick={onSelect}
    >
      {/* Drag handle */}
      <div className="absolute top-2 left-2 p-1 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100">
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      {/* Actions */}
      {isSelected && (
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" onClick={(e) => { e.stopPropagation(); }}>
            <Copy className="w-3 h-3 text-gray-400" />
          </button>
          <button className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="w-3 h-3 text-red-500" />
          </button>
        </div>
      )}

      {renderContent()}
    </motion.div>
  );
};

const PropertiesPanel: React.FC<{
  element: ReportElement | null;
  onUpdate: (config: Record<string, unknown>) => void;
}> = ({ element, onUpdate }) => {
  if (!element) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Settings className="w-4 h-4" /> Properties
        </h3>
        <p className="text-sm text-gray-500 text-center py-8">Select an element to edit its properties</p>
      </div>
    );
  }

  const renderProperties = () => {
    switch (element.type) {
      case 'text':
        const textConfig = element.config as unknown as TextConfig;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
              <textarea
                value={textConfig.content || ''}
                onChange={(e) => onUpdate({ ...element.config, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Font Size</label>
                <select
                  value={textConfig.fontSize || 14}
                  onChange={(e) => onUpdate({ ...element.config, fontSize: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700"
                >
                  <option value={12}>12px</option>
                  <option value={14}>14px</option>
                  <option value={16}>16px</option>
                  <option value={20}>20px</option>
                  <option value={24}>24px</option>
                  <option value={32}>32px</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Weight</label>
                <select
                  value={textConfig.fontWeight || 'normal'}
                  onChange={(e) => onUpdate({ ...element.config, fontWeight: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700"
                >
                  <option value="normal">Normal</option>
                  <option value="medium">Medium</option>
                  <option value="bold">Bold</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Alignment</label>
              <div className="flex gap-1">
                {['left', 'center', 'right'].map((align) => (
                  <button
                    key={align}
                    onClick={() => onUpdate({ ...element.config, align })}
                    className={`flex-1 p-2 rounded-lg border ${textConfig.align === align ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700'}`}
                  >
                    {align === 'left' && <AlignLeft className="w-4 h-4 mx-auto" />}
                    {align === 'center' && <AlignCenter className="w-4 h-4 mx-auto" />}
                    {align === 'right' && <AlignRight className="w-4 h-4 mx-auto" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 'chart':
        const chartConfig = element.config as unknown as ChartConfig;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Chart Title</label>
              <input
                type="text"
                value={chartConfig.title || ''}
                onChange={(e) => onUpdate({ ...element.config, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700"
                placeholder="Enter title..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Chart Type</label>
              <div className="grid grid-cols-5 gap-1">
                {['bar', 'line', 'pie', 'area', 'donut'].map((type) => (
                  <button
                    key={type}
                    onClick={() => onUpdate({ ...element.config, chartType: type })}
                    className={`p-2 rounded-lg border text-xs capitalize ${chartConfig.chartType === type ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Data Source</label>
              <select
                value={chartConfig.dataSource || ''}
                onChange={(e) => onUpdate({ ...element.config, dataSource: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700"
              >
                <option value="">Select data source...</option>
                {dataSources.map((ds) => (
                  <option key={ds.id} value={ds.id}>{ds.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={chartConfig.showLegend}
                  onChange={(e) => onUpdate({ ...element.config, showLegend: e.target.checked })}
                  className="rounded"
                />
                Show Legend
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={chartConfig.showGrid}
                  onChange={(e) => onUpdate({ ...element.config, showGrid: e.target.checked })}
                  className="rounded"
                />
                Show Grid
              </label>
            </div>
          </div>
        );
      case 'metric':
        const metricConfig = element.config as unknown as MetricConfig;
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Metric Title</label>
              <input
                type="text"
                value={metricConfig.title || ''}
                onChange={(e) => onUpdate({ ...element.config, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Value</label>
              <input
                type="text"
                value={metricConfig.value || ''}
                onChange={(e) => onUpdate({ ...element.config, value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Format</label>
              <select
                value={metricConfig.format || 'currency'}
                onChange={(e) => onUpdate({ ...element.config, format: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700"
              >
                <option value="currency">Currency</option>
                <option value="percent">Percent</option>
                <option value="number">Number</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
              <input
                type="color"
                value={metricConfig.color || '#2563eb'}
                onChange={(e) => onUpdate({ ...element.config, color: e.target.value })}
                className="w-full h-10 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        );
      default:
        return <p className="text-sm text-gray-500 text-center py-4">No properties available</p>;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <Settings className="w-4 h-4" /> Properties
      </h3>
      {renderProperties()}
    </div>
  );
};

const TemplateGallery: React.FC<{ templates: ReportTemplate[]; onSelect: (template: ReportTemplate) => void }> = ({ templates, onSelect }) => {
  const [filter, setFilter] = useState<ReportTemplate['category'] | 'all'>('all');

  const filteredTemplates = filter === 'all' ? templates : templates.filter(t => t.category === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {['all', 'performance', 'client', 'billing', 'compliance', 'custom'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat as typeof filter)}
            className={`px-3 py-1.5 rounded-full text-sm capitalize ${filter === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <motion.div
            key={template.id}
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onSelect(template)}
          >
            <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center">
              <FileText className="w-12 h-12 text-blue-300 dark:text-blue-700" />
            </div>
            <div className="p-4">
              <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
              <p className="text-xs text-gray-500 mt-1">{template.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const ScheduleManager: React.FC<{ schedules: ScheduledReport[] }> = ({ schedules }) => {
  const formatDate = (date: Date) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{schedules.length} scheduled reports</p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Schedule
        </button>
      </div>
      <div className="space-y-3">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${!schedule.active ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 dark:text-white">{schedule.reportName}</p>
                  {schedule.active ? (
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">Active</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">Paused</span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1 capitalize">
                    <RefreshCw className="w-3 h-3" /> {schedule.frequency}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Next: {formatDate(schedule.nextRun)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {schedule.recipients.length} recipients
                  </span>
                  <span className="uppercase text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{schedule.format}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  {schedule.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <Settings className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Component
export const AdvancedReportBuilder: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'builder' | 'templates' | 'scheduled'>('builder');
  const [elements, setElements] = useState<ReportElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [reportName, setReportName] = useState('Untitled Report');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleAddElement = useCallback((type: ReportElement['type']) => {
    const newElement: ReportElement = {
      id: `element-${Date.now()}`,
      type,
      config: type === 'text' ? { content: '', fontSize: 14, fontWeight: 'normal', align: 'left', color: '#1f2937' } :
              type === 'chart' ? { chartType: 'bar', title: '', dataSource: '', colors: [], showLegend: true, showGrid: true } :
              type === 'table' ? { title: '', columns: [], dataSource: '', sortable: true, pageSize: 10 } :
              type === 'metric' ? { title: '', value: '', format: 'currency', color: '#2563eb' } : {},
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 }
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  }, [elements]);

  const handleDeleteElement = useCallback((id: string) => {
    setElements(elements.filter(e => e.id !== id));
    if (selectedElement === id) setSelectedElement(null);
  }, [elements, selectedElement]);

  const handleUpdateElement = useCallback((id: string, config: Record<string, unknown>) => {
    setElements(elements.map(e => e.id === id ? { ...e, config } : e));
  }, [elements]);

  const selectedElementData = useMemo(() => elements.find(e => e.id === selectedElement) || null, [elements, selectedElement]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <input
              type="text"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              className="text-xl font-bold text-gray-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
            />
            <p className="text-sm text-gray-500">Drag and drop elements to build your report</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${isPreviewMode ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
          >
            <Eye className="w-4 h-4" /> {isPreviewMode ? 'Edit' : 'Preview'}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700">
            <Download className="w-4 h-4" /> Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'builder', label: 'Report Builder', icon: Layers },
          { id: 'templates', label: 'Templates', icon: Grid },
          { id: 'scheduled', label: 'Scheduled', icon: Calendar },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'builder' && (
          <motion.div
            key="builder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-12 gap-6"
          >
            {/* Left Sidebar - Elements */}
            <div className="col-span-2">
              <ElementPalette onAdd={handleAddElement} />
            </div>

            {/* Canvas */}
            <div className="col-span-7">
              <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 min-h-[600px] p-6 ${isPreviewMode ? 'shadow-xl' : ''}`}>
                {elements.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Layers className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium">Start Building Your Report</p>
                    <p className="text-sm">Drag elements from the left panel or click to add</p>
                  </div>
                ) : (
                  <Reorder.Group axis="y" values={elements} onReorder={setElements} className="space-y-4">
                    {elements.map((element) => (
                      <Reorder.Item key={element.id} value={element}>
                        <CanvasElement
                          element={element}
                          isSelected={selectedElement === element.id}
                          onSelect={() => setSelectedElement(element.id)}
                          onDelete={() => handleDeleteElement(element.id)}
                          onUpdate={(config) => handleUpdateElement(element.id, config)}
                        />
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                )}
              </div>
            </div>

            {/* Right Sidebar - Properties */}
            <div className="col-span-3">
              <PropertiesPanel
                element={selectedElementData}
                onUpdate={(config) => selectedElement && handleUpdateElement(selectedElement, config)}
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <TemplateGallery templates={mockTemplates} onSelect={(t) => { setActiveTab('builder'); }} />
          </motion.div>
        )}

        {activeTab === 'scheduled' && (
          <motion.div
            key="scheduled"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ScheduleManager schedules={mockScheduledReports} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedReportBuilder;
