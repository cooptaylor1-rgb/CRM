'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, TrendingUp, TrendingDown, Bell, Wifi, WifiOff, RefreshCw,
  DollarSign, Users, Briefcase, AlertCircle, CheckCircle, Clock,
  ArrowUpRight, ArrowDownRight, Eye, EyeOff, Volume2, VolumeX,
  Maximize2, Minimize2, Settings, Filter, Zap, Globe, BarChart3,
  ChevronRight, ChevronDown, Play, Pause, Circle
} from 'lucide-react';

// Types
interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  lastUpdate: Date;
}

interface PortfolioTick {
  clientId: string;
  clientName: string;
  totalValue: number;
  previousValue: number;
  change: number;
  changePercent: number;
  lastUpdate: Date;
}

interface LiveAlert {
  id: string;
  type: 'price' | 'rebalance' | 'threshold' | 'compliance' | 'activity';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  client?: string;
  symbol?: string;
  timestamp: Date;
  acknowledged: boolean;
}

interface ActivityEvent {
  id: string;
  type: 'login' | 'trade' | 'document' | 'meeting' | 'message' | 'transfer';
  actor: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, string>;
}

interface StreamMetrics {
  uptime: number;
  messagesPerSecond: number;
  latency: number;
  connected: boolean;
  reconnecting: boolean;
}

// Simulated WebSocket for demo
const useSimulatedWebSocket = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [metrics, setMetrics] = useState<StreamMetrics>({
    uptime: 99.97,
    messagesPerSecond: 47,
    latency: 12,
    connected: true,
    reconnecting: false
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        messagesPerSecond: Math.floor(40 + Math.random() * 20),
        latency: Math.floor(8 + Math.random() * 10)
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return { isConnected, metrics, setIsConnected };
};

// Mock Data Generators
const generateMarketData = (): MarketData[] => [
  { symbol: 'SPY', name: 'S&P 500 ETF', price: 478.23 + (Math.random() - 0.5) * 2, change: 0, changePercent: 0, volume: 45678900, lastUpdate: new Date() },
  { symbol: 'QQQ', name: 'Nasdaq 100 ETF', price: 412.67 + (Math.random() - 0.5) * 3, change: 0, changePercent: 0, volume: 32456700, lastUpdate: new Date() },
  { symbol: 'IWM', name: 'Russell 2000 ETF', price: 198.45 + (Math.random() - 0.5) * 1.5, change: 0, changePercent: 0, volume: 18234500, lastUpdate: new Date() },
  { symbol: 'VTI', name: 'Total Stock Market', price: 245.89 + (Math.random() - 0.5) * 1, change: 0, changePercent: 0, volume: 12345600, lastUpdate: new Date() },
  { symbol: 'BND', name: 'Total Bond Market', price: 72.34 + (Math.random() - 0.5) * 0.3, change: 0, changePercent: 0, volume: 8765400, lastUpdate: new Date() },
  { symbol: 'GLD', name: 'Gold ETF', price: 187.56 + (Math.random() - 0.5) * 1, change: 0, changePercent: 0, volume: 9876500, lastUpdate: new Date() },
];

const mockPortfolioTicks: PortfolioTick[] = [
  { clientId: '1', clientName: 'Williams Family Office', totalValue: 12547892, previousValue: 12532000, change: 15892, changePercent: 0.127, lastUpdate: new Date() },
  { clientId: '2', clientName: 'Thompson Trust', totalValue: 8234567, previousValue: 8245000, change: -10433, changePercent: -0.127, lastUpdate: new Date() },
  { clientId: '3', clientName: 'Chen Retirement', totalValue: 3456789, previousValue: 3452000, change: 4789, changePercent: 0.139, lastUpdate: new Date() },
  { clientId: '4', clientName: 'Martinez Holdings', totalValue: 5678901, previousValue: 5670000, change: 8901, changePercent: 0.157, lastUpdate: new Date() },
  { clientId: '5', clientName: 'Anderson Portfolio', totalValue: 2345678, previousValue: 2348000, change: -2322, changePercent: -0.099, lastUpdate: new Date() },
];

const mockAlerts: LiveAlert[] = [
  { id: '1', type: 'threshold', severity: 'critical', title: 'Position Limit Exceeded', message: 'AAPL position in Williams Family exceeds 5% threshold', client: 'Williams Family', symbol: 'AAPL', timestamp: new Date(), acknowledged: false },
  { id: '2', type: 'price', severity: 'warning', title: 'Price Alert Triggered', message: 'NVDA crossed $500 target price', symbol: 'NVDA', timestamp: new Date(Date.now() - 60000), acknowledged: false },
  { id: '3', type: 'rebalance', severity: 'info', title: 'Rebalance Recommended', message: 'Thompson Trust drift exceeds 3%', client: 'Thompson Trust', timestamp: new Date(Date.now() - 120000), acknowledged: true },
  { id: '4', type: 'compliance', severity: 'warning', title: 'Compliance Review', message: 'Trade requires pre-clearance approval', client: 'Martinez Holdings', timestamp: new Date(Date.now() - 180000), acknowledged: false },
];

const mockActivityEvents: ActivityEvent[] = [
  { id: '1', type: 'trade', actor: 'System', description: 'Executed buy order: 100 shares VTI @ $245.67', timestamp: new Date(), metadata: { client: 'Chen Retirement', value: '$24,567' } },
  { id: '2', type: 'login', actor: 'Robert Chen', description: 'Client portal login from iOS app', timestamp: new Date(Date.now() - 30000), metadata: { device: 'iPhone 15 Pro' } },
  { id: '3', type: 'document', actor: 'Jennifer Adams', description: 'Uploaded Q4 Performance Report', timestamp: new Date(Date.now() - 60000), metadata: { file: 'Q4_2025_Performance.pdf' } },
  { id: '4', type: 'meeting', actor: 'System', description: 'Meeting reminder: Thompson Trust quarterly review in 30 min', timestamp: new Date(Date.now() - 90000) },
  { id: '5', type: 'transfer', actor: 'ACH System', description: 'Wire transfer completed: $50,000 to external account', timestamp: new Date(Date.now() - 120000), metadata: { client: 'Anderson Portfolio' } },
];

// Utility Functions
const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const formatPrice = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

// Sub-components
const ConnectionStatus: React.FC<{ metrics: StreamMetrics; isConnected: boolean }> = ({ metrics, isConnected }) => {
  return (
    <div className={`flex items-center gap-4 px-4 py-2 rounded-lg ${isConnected ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
      <div className="flex items-center gap-2">
        {isConnected ? (
          <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-600 dark:text-red-400" />
        )}
        <span className={`text-sm font-medium ${isConnected ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      {isConnected && (
        <>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
            <span>{metrics.messagesPerSecond} msg/s</span>
            <span>{metrics.latency}ms latency</span>
            <span>{metrics.uptime}% uptime</span>
          </div>
        </>
      )}
    </div>
  );
};

const MarketTicker: React.FC<{ data: MarketData[]; paused: boolean }> = ({ data, paused }) => {
  return (
    <div className="bg-gray-900 rounded-xl p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Market Data</span>
        </div>
        <div className="flex items-center gap-2">
          {!paused && <Circle className="w-2 h-2 fill-red-500 text-red-500 animate-pulse" />}
          <span className="text-xs text-gray-500">{paused ? 'Paused' : 'Live'}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {data.map((item) => {
          const isPositive = item.changePercent >= 0;
          return (
            <motion.div
              key={item.symbol}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gray-800 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-bold text-sm">{item.symbol}</span>
                {isPositive ? (
                  <ArrowUpRight className="w-3 h-3 text-green-400" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-red-400" />
                )}
              </div>
              <p className="text-white font-mono text-lg">{formatPrice(item.price)}</p>
              <p className={`text-xs font-mono ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercent(item.changePercent)}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const PortfolioStream: React.FC<{ ticks: PortfolioTick[] }> = ({ ticks }) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const totalAUM = ticks.reduce((sum, t) => sum + t.totalValue, 0);
  const totalChange = ticks.reduce((sum, t) => sum + t.change, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900 dark:text-white">Portfolio Values</span>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(totalAUM)}</p>
            <p className={`text-sm ${totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalChange >= 0 ? '+' : ''}{formatCurrency(totalChange)} today
            </p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-80 overflow-y-auto">
        {ticks.map((tick) => (
          <motion.div
            key={tick.clientId}
            layout
            className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
            onClick={() => setExpanded(expanded === tick.clientId ? null : tick.clientId)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${tick.change >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{tick.clientName}</p>
                  <p className="text-xs text-gray-500">{formatTime(tick.lastUpdate)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(tick.totalValue)}</p>
                <p className={`text-xs ${tick.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tick.change >= 0 ? '+' : ''}{formatCurrency(tick.change)} ({formatPercent(tick.changePercent)})
                </p>
              </div>
            </div>
            <AnimatePresence>
              {expanded === tick.clientId && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700"
                >
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-gray-500">Previous</p>
                      <p className="text-gray-900 dark:text-white font-medium">{formatCurrency(tick.previousValue)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Change</p>
                      <p className={tick.change >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(tick.change)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">% Change</p>
                      <p className={tick.change >= 0 ? 'text-green-600' : 'text-red-600'}>{formatPercent(tick.changePercent)}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const AlertStream: React.FC<{ alerts: LiveAlert[]; onAcknowledge: (id: string) => void }> = ({ alerts, onAcknowledge }) => {
  const unacknowledged = alerts.filter(a => !a.acknowledged).length;

  const severityStyles = {
    critical: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
  };

  const severityIcons = {
    critical: <AlertCircle className="w-4 h-4 text-red-600" />,
    warning: <AlertCircle className="w-4 h-4 text-yellow-600" />,
    info: <Bell className="w-4 h-4 text-blue-600" />
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-orange-600" />
          <span className="font-semibold text-gray-900 dark:text-white">Live Alerts</span>
          {unacknowledged > 0 && (
            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs rounded-full">
              {unacknowledged} new
            </span>
          )}
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-700">Mark all read</button>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-80 overflow-y-auto">
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-3 border-l-4 ${severityStyles[alert.severity]} ${!alert.acknowledged ? 'border-l-4' : 'border-l-0 opacity-60'}`}
            style={{ borderLeftColor: alert.severity === 'critical' ? '#dc2626' : alert.severity === 'warning' ? '#d97706' : '#2563eb' }}
          >
            <div className="flex items-start gap-3">
              {severityIcons[alert.severity]}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{alert.title}</p>
                  <span className="text-xs text-gray-500">{formatTime(alert.timestamp)}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{alert.message}</p>
                {(alert.client || alert.symbol) && (
                  <div className="flex items-center gap-2 mt-1">
                    {alert.client && <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">{alert.client}</span>}
                    {alert.symbol && <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">{alert.symbol}</span>}
                  </div>
                )}
              </div>
              {!alert.acknowledged && (
                <button
                  onClick={() => onAcknowledge(alert.id)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <CheckCircle className="w-4 h-4 text-gray-400 hover:text-green-500" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const ActivityFeed: React.FC<{ events: ActivityEvent[] }> = ({ events }) => {
  const typeIcons: Record<ActivityEvent['type'], React.ReactNode> = {
    login: <Users className="w-4 h-4 text-blue-500" />,
    trade: <TrendingUp className="w-4 h-4 text-green-500" />,
    document: <BarChart3 className="w-4 h-4 text-purple-500" />,
    meeting: <Clock className="w-4 h-4 text-orange-500" />,
    message: <Bell className="w-4 h-4 text-cyan-500" />,
    transfer: <DollarSign className="w-4 h-4 text-emerald-500" />
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-gray-900 dark:text-white">Activity Stream</span>
        </div>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-80 overflow-y-auto">
        {events.map((event, idx) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                {typeIcons[event.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white text-sm">{event.actor}</span>
                  <span className="text-xs text-gray-500">{formatTime(event.timestamp)}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{event.description}</p>
                {event.metadata && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(event.metadata).map(([key, value]) => (
                      <span key={key} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
                        {value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Main Component
export const RealtimeStreamingDashboard: React.FC = () => {
  const { isConnected, metrics, setIsConnected } = useSimulatedWebSocket();
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [marketData, setMarketData] = useState(generateMarketData());
  const [portfolioTicks, setPortfolioTicks] = useState(mockPortfolioTicks);
  const [alerts, setAlerts] = useState(mockAlerts);
  const [activityEvents, setActivityEvents] = useState(mockActivityEvents);

  // Simulate real-time updates
  useEffect(() => {
    if (isPaused || !isConnected) return;

    const marketInterval = setInterval(() => {
      setMarketData(prev => prev.map(item => {
        const newPrice = item.price + (Math.random() - 0.5) * (item.price * 0.001);
        const change = newPrice - item.price;
        return {
          ...item,
          price: newPrice,
          change,
          changePercent: (change / item.price) * 100,
          lastUpdate: new Date()
        };
      }));
    }, 2000);

    const portfolioInterval = setInterval(() => {
      setPortfolioTicks(prev => prev.map(tick => {
        const change = (Math.random() - 0.48) * tick.totalValue * 0.0005;
        return {
          ...tick,
          previousValue: tick.totalValue,
          totalValue: tick.totalValue + change,
          change,
          changePercent: (change / tick.totalValue) * 100,
          lastUpdate: new Date()
        };
      }));
    }, 3000);

    return () => {
      clearInterval(marketInterval);
      clearInterval(portfolioInterval);
    };
  }, [isPaused, isConnected]);

  const handleAcknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  return (
    <div className={`p-6 space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 overflow-auto' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            Real-time Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Live market data, portfolio updates, and activity stream</p>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionStatus metrics={metrics} isConnected={isConnected} />
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`p-2 rounded-md transition-colors ${isPaused ? 'bg-white dark:bg-gray-700 shadow' : ''}`}
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-md transition-colors ${isMuted ? 'bg-white dark:bg-gray-700 shadow' : ''}`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Market Ticker */}
      <MarketTicker data={marketData} paused={isPaused} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PortfolioStream ticks={portfolioTicks} />
        </div>
        <div className="lg:col-span-1">
          <AlertStream alerts={alerts} onAcknowledge={handleAcknowledgeAlert} />
        </div>
        <div className="lg:col-span-1">
          <ActivityFeed events={activityEvents} />
        </div>
      </div>

      {/* Reconnect overlay */}
      <AnimatePresence>
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center max-w-md">
              <WifiOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Connection Lost</h3>
              <p className="text-gray-500 mb-4">Attempting to reconnect to the real-time data stream...</p>
              <button
                onClick={() => setIsConnected(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" /> Reconnect Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RealtimeStreamingDashboard;
