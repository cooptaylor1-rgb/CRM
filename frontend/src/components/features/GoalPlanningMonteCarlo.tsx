'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, TrendingUp, TrendingDown, DollarSign, Calendar, Play,
  RefreshCw, Settings, Download, ChevronRight, ChevronDown, Info,
  AlertCircle, CheckCircle, Plus, Edit2, Trash2, BarChart3, Activity,
  Zap, Shield, Clock, Eye, Calculator, PieChart, Sliders
} from 'lucide-react';

// Types
interface FinancialGoal {
  id: string;
  name: string;
  type: 'retirement' | 'education' | 'home' | 'legacy' | 'custom';
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  monthlyContribution: number;
  expectedReturn: number;
  inflationRate: number;
  priority: 'high' | 'medium' | 'low';
}

interface MonteCarloResult {
  percentile: number;
  value: number;
}

interface SimulationRun {
  year: number;
  values: number[];
  percentiles: { p10: number; p25: number; p50: number; p75: number; p90: number };
}

interface GoalAnalysis {
  goalId: string;
  successProbability: number;
  medianOutcome: number;
  shortfallRisk: number;
  recommendedContribution: number;
  percentiles: MonteCarloResult[];
  simulationRuns: SimulationRun[];
}

// Mock Data
const mockGoals: FinancialGoal[] = [
  {
    id: '1', name: 'Retirement', type: 'retirement', targetAmount: 5000000, currentAmount: 1850000,
    targetDate: new Date('2040-06-01'), monthlyContribution: 8500, expectedReturn: 0.07, inflationRate: 0.025, priority: 'high'
  },
  {
    id: '2', name: 'College Fund - Emma', type: 'education', targetAmount: 350000, currentAmount: 125000,
    targetDate: new Date('2032-08-01'), monthlyContribution: 2000, expectedReturn: 0.06, inflationRate: 0.04, priority: 'high'
  },
  {
    id: '3', name: 'Beach House', type: 'home', targetAmount: 800000, currentAmount: 150000,
    targetDate: new Date('2030-12-01'), monthlyContribution: 5000, expectedReturn: 0.065, inflationRate: 0.03, priority: 'medium'
  },
  {
    id: '4', name: 'Legacy for Grandchildren', type: 'legacy', targetAmount: 2000000, currentAmount: 500000,
    targetDate: new Date('2050-01-01'), monthlyContribution: 3000, expectedReturn: 0.07, inflationRate: 0.025, priority: 'low'
  },
];

// Monte Carlo Simulation (simplified for demo)
const runMonteCarloSimulation = (goal: FinancialGoal, numSimulations: number = 1000): GoalAnalysis => {
  const yearsToGoal = Math.max(1, (goal.targetDate.getTime() - Date.now()) / (365 * 24 * 60 * 60 * 1000));
  const monthsToGoal = Math.floor(yearsToGoal * 12);
  
  const simulations: number[] = [];
  const yearlyData: SimulationRun[] = [];
  
  // Initialize yearly tracking
  for (let year = 0; year <= Math.ceil(yearsToGoal); year++) {
    yearlyData.push({ year, values: [], percentiles: { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0 } });
  }
  
  // Run simulations
  for (let sim = 0; sim < numSimulations; sim++) {
    let value = goal.currentAmount;
    const volatility = 0.15; // Annual volatility
    
    for (let month = 0; month < monthsToGoal; month++) {
      // Monthly return with randomness
      const monthlyReturn = (goal.expectedReturn / 12) + (volatility / Math.sqrt(12)) * (Math.random() * 2 - 1);
      value = value * (1 + monthlyReturn) + goal.monthlyContribution;
      
      // Track yearly values
      if ((month + 1) % 12 === 0) {
        const yearIndex = Math.floor((month + 1) / 12);
        if (yearlyData[yearIndex]) {
          yearlyData[yearIndex].values.push(value);
        }
      }
    }
    
    simulations.push(value);
  }
  
  // Calculate percentiles for yearly data
  yearlyData.forEach(yearData => {
    if (yearData.values.length > 0) {
      yearData.values.sort((a, b) => a - b);
      yearData.percentiles = {
        p10: yearData.values[Math.floor(yearData.values.length * 0.1)],
        p25: yearData.values[Math.floor(yearData.values.length * 0.25)],
        p50: yearData.values[Math.floor(yearData.values.length * 0.5)],
        p75: yearData.values[Math.floor(yearData.values.length * 0.75)],
        p90: yearData.values[Math.floor(yearData.values.length * 0.9)],
      };
    }
  });
  
  // Sort final simulations
  simulations.sort((a, b) => a - b);
  
  const successCount = simulations.filter(v => v >= goal.targetAmount).length;
  const successProbability = successCount / numSimulations;
  const medianOutcome = simulations[Math.floor(numSimulations / 2)];
  const shortfallRisk = 1 - successProbability;
  
  // Calculate recommended contribution
  const shortfall = goal.targetAmount - medianOutcome;
  const recommendedContribution = shortfall > 0 
    ? goal.monthlyContribution + (shortfall / monthsToGoal) 
    : goal.monthlyContribution;
  
  const percentiles: MonteCarloResult[] = [
    { percentile: 5, value: simulations[Math.floor(numSimulations * 0.05)] },
    { percentile: 10, value: simulations[Math.floor(numSimulations * 0.1)] },
    { percentile: 25, value: simulations[Math.floor(numSimulations * 0.25)] },
    { percentile: 50, value: simulations[Math.floor(numSimulations * 0.5)] },
    { percentile: 75, value: simulations[Math.floor(numSimulations * 0.75)] },
    { percentile: 90, value: simulations[Math.floor(numSimulations * 0.9)] },
    { percentile: 95, value: simulations[Math.floor(numSimulations * 0.95)] },
  ];
  
  return {
    goalId: goal.id,
    successProbability,
    medianOutcome,
    shortfallRisk,
    recommendedContribution,
    percentiles,
    simulationRuns: yearlyData
  };
};

// Utility Functions
const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
const formatDate = (date: Date) => new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);

// Sub-components
const ProbabilityGauge: React.FC<{ probability: number; size?: 'sm' | 'md' | 'lg' }> = ({ probability, size = 'md' }) => {
  const sizes = { sm: 80, md: 120, lg: 160 };
  const strokeWidths = { sm: 8, md: 12, lg: 16 };
  const diameter = sizes[size];
  const strokeWidth = strokeWidths[size];
  const radius = (diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = probability * circumference;
  
  const getColor = () => {
    if (probability >= 0.8) return '#10b981';
    if (probability >= 0.6) return '#f59e0b';
    return '#ef4444';
  };
  
  return (
    <div className="relative" style={{ width: diameter, height: diameter }}>
      <svg width={diameter} height={diameter} className="transform -rotate-90">
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        <motion.circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold ${size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-lg'}`} style={{ color: getColor() }}>
          {formatPercent(probability)}
        </span>
        <span className="text-xs text-gray-500">Success</span>
      </div>
    </div>
  );
};

const ProjectionChart: React.FC<{ goal: FinancialGoal; analysis: GoalAnalysis }> = ({ goal, analysis }) => {
  const maxValue = Math.max(
    goal.targetAmount,
    ...analysis.simulationRuns.map(r => r.percentiles.p90)
  );
  const chartHeight = 200;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h4 className="font-medium text-gray-900 dark:text-white mb-4">Projection Cone</h4>
      
      <div className="relative h-52">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-6 w-16 flex flex-col justify-between text-xs text-gray-500">
          <span>{formatCurrency(maxValue)}</span>
          <span>{formatCurrency(maxValue * 0.5)}</span>
          <span>$0</span>
        </div>
        
        {/* Chart area */}
        <div className="absolute left-16 right-0 top-0 bottom-6">
          <svg width="100%" height={chartHeight} preserveAspectRatio="none">
            {/* Target line */}
            <line
              x1="0"
              y1={chartHeight - (goal.targetAmount / maxValue) * chartHeight}
              x2="100%"
              y2={chartHeight - (goal.targetAmount / maxValue) * chartHeight}
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="8,4"
            />
            
            {/* Confidence cone (P10-P90) */}
            <motion.path
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ duration: 1 }}
              d={`
                M 0 ${chartHeight - (goal.currentAmount / maxValue) * chartHeight}
                ${analysis.simulationRuns.map((run, i) => {
                  const x = (i / (analysis.simulationRuns.length - 1)) * 100;
                  const y = chartHeight - (run.percentiles.p90 / maxValue) * chartHeight;
                  return `L ${x}% ${y}`;
                }).join(' ')}
                ${analysis.simulationRuns.slice().reverse().map((run, i) => {
                  const x = ((analysis.simulationRuns.length - 1 - i) / (analysis.simulationRuns.length - 1)) * 100;
                  const y = chartHeight - (run.percentiles.p10 / maxValue) * chartHeight;
                  return `L ${x}% ${y}`;
                }).join(' ')}
                Z
              `}
              fill="#3b82f6"
            />
            
            {/* Median line */}
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              d={`
                M 0 ${chartHeight - (goal.currentAmount / maxValue) * chartHeight}
                ${analysis.simulationRuns.map((run, i) => {
                  const x = (i / (analysis.simulationRuns.length - 1)) * 100;
                  const y = chartHeight - (run.percentiles.p50 / maxValue) * chartHeight;
                  return `L ${x}% ${y}`;
                }).join(' ')}
              `}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
            />
          </svg>
          
          {/* Target label */}
          <div
            className="absolute right-0 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded"
            style={{ top: `${(1 - goal.targetAmount / maxValue) * chartHeight - 10}px` }}
          >
            Target: {formatCurrency(goal.targetAmount)}
          </div>
        </div>
        
        {/* X-axis labels */}
        <div className="absolute left-16 right-0 bottom-0 flex justify-between text-xs text-gray-500">
          <span>Today</span>
          <span>{formatDate(goal.targetDate)}</span>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span className="text-xs text-gray-500">Median projection</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500/30 rounded" />
          <span className="text-xs text-gray-500">10th-90th percentile</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 border-t-2 border-red-500 border-dashed" />
          <span className="text-xs text-gray-500">Target</span>
        </div>
      </div>
    </div>
  );
};

const PercentileTable: React.FC<{ percentiles: MonteCarloResult[]; target: number }> = ({ percentiles, target }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h4 className="font-medium text-gray-900 dark:text-white mb-4">Outcome Distribution</h4>
      <div className="space-y-2">
        {percentiles.map((p) => {
          const meetsTarget = p.value >= target;
          const barWidth = Math.min(100, (p.value / (target * 1.5)) * 100);
          
          return (
            <div key={p.percentile} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-12">{p.percentile}th</span>
              <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ duration: 1, delay: p.percentile * 0.01 }}
                  className={`h-full rounded-full ${meetsTarget ? 'bg-green-500' : 'bg-yellow-500'}`}
                />
                {/* Target marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500"
                  style={{ left: `${Math.min(100, (target / (target * 1.5)) * 100)}%` }}
                />
              </div>
              <span className={`text-sm font-medium w-24 text-right ${meetsTarget ? 'text-green-600' : 'text-yellow-600'}`}>
                {formatCurrency(p.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ScenarioSliders: React.FC<{
  goal: FinancialGoal;
  onChange: (updates: Partial<FinancialGoal>) => void;
}> = ({ goal, onChange }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Sliders className="w-4 h-4" /> Scenario Analysis
      </h4>
      
      <div className="space-y-6">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Monthly Contribution</label>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(goal.monthlyContribution)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={goal.monthlyContribution * 3}
            step={100}
            value={goal.monthlyContribution}
            onChange={(e) => onChange({ monthlyContribution: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Expected Return</label>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{formatPercent(goal.expectedReturn)}</span>
          </div>
          <input
            type="range"
            min={0.02}
            max={0.12}
            step={0.005}
            value={goal.expectedReturn}
            onChange={(e) => onChange({ expectedReturn: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Target Date</label>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(goal.targetDate)}</span>
          </div>
          <input
            type="range"
            min={Date.now()}
            max={Date.now() + 30 * 365 * 24 * 60 * 60 * 1000}
            step={365 * 24 * 60 * 60 * 1000}
            value={goal.targetDate.getTime()}
            onChange={(e) => onChange({ targetDate: new Date(parseInt(e.target.value)) })}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Target Amount</label>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(goal.targetAmount)}</span>
          </div>
          <input
            type="range"
            min={goal.currentAmount}
            max={goal.targetAmount * 2}
            step={10000}
            value={goal.targetAmount}
            onChange={(e) => onChange({ targetAmount: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

const GoalCard: React.FC<{
  goal: FinancialGoal;
  analysis: GoalAnalysis;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ goal, analysis, isSelected, onSelect }) => {
  const progress = goal.currentAmount / goal.targetAmount;
  const yearsRemaining = Math.max(0, (goal.targetDate.getTime() - Date.now()) / (365 * 24 * 60 * 60 * 1000));
  
  const typeIcons = {
    retirement: '🏖️',
    education: '🎓',
    home: '🏠',
    legacy: '💎',
    custom: '🎯'
  };
  
  const priorityColors = {
    high: 'border-red-400',
    medium: 'border-yellow-400',
    low: 'border-green-400'
  };
  
  return (
    <motion.div
      layout
      onClick={onSelect}
      className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-4 cursor-pointer transition-all ${
        isSelected ? 'border-blue-500 shadow-lg' : `border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600`
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{typeIcons[goal.type]}</span>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">{goal.name}</h4>
            <p className="text-xs text-gray-500">{formatDate(goal.targetDate)} • {yearsRemaining.toFixed(1)} years</p>
          </div>
        </div>
        <div className={`w-2 h-8 rounded-full ${priorityColors[goal.priority]}`} title={`${goal.priority} priority`} />
      </div>
      
      <div className="flex items-center gap-4 mb-3">
        <ProbabilityGauge probability={analysis.successProbability} size="sm" />
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatPercent(progress)}</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              className={`h-full rounded-full ${
                analysis.successProbability >= 0.8 ? 'bg-green-500' :
                analysis.successProbability >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatCurrency(goal.currentAmount)}</span>
            <span>{formatCurrency(goal.targetAmount)}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
          <p className="text-gray-500">Monthly</p>
          <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(goal.monthlyContribution)}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
          <p className="text-gray-500">Median Outcome</p>
          <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(analysis.medianOutcome)}</p>
        </div>
      </div>
    </motion.div>
  );
};

// Main Component
export const GoalPlanningMonteCarlo: React.FC = () => {
  const [goals, setGoals] = useState<FinancialGoal[]>(mockGoals);
  const [selectedGoalId, setSelectedGoalId] = useState<string>(mockGoals[0].id);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulations, setSimulations] = useState(1000);
  
  const selectedGoal = useMemo(() => goals.find(g => g.id === selectedGoalId), [goals, selectedGoalId]);
  
  const analyses = useMemo(() => {
    return goals.reduce((acc, goal) => {
      acc[goal.id] = runMonteCarloSimulation(goal, simulations);
      return acc;
    }, {} as Record<string, GoalAnalysis>);
  }, [goals, simulations]);
  
  const selectedAnalysis = selectedGoal ? analyses[selectedGoal.id] : null;
  
  const handleRunSimulation = useCallback(() => {
    setIsSimulating(true);
    setTimeout(() => {
      // Trigger recalculation
      setSimulations(s => s);
      setIsSimulating(false);
    }, 1500);
  }, []);
  
  const handleGoalUpdate = useCallback((updates: Partial<FinancialGoal>) => {
    setGoals(prev => prev.map(g => 
      g.id === selectedGoalId ? { ...g, ...updates } : g
    ));
  }, [selectedGoalId]);
  
  // Summary statistics
  const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalCurrentAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const avgSuccessProbability = Object.values(analyses).reduce((sum, a) => sum + a.successProbability, 0) / goals.length;
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            Goal Planning & Monte Carlo
          </h1>
          <p className="text-gray-500 mt-1">Probabilistic financial goal analysis with scenario modeling</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={simulations}
            onChange={(e) => setSimulations(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800"
          >
            <option value={100}>100 simulations</option>
            <option value={1000}>1,000 simulations</option>
            <option value={5000}>5,000 simulations</option>
            <option value={10000}>10,000 simulations</option>
          </select>
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isSimulating ? 'Running...' : 'Run Simulation'}
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 mb-1">Total Goals</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{goals.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 mb-1">Total Target</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalTargetAmount)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 mb-1">Current Progress</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalCurrentAmount)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 mb-1">Avg Success Rate</p>
          <p className={`text-2xl font-bold ${
            avgSuccessProbability >= 0.8 ? 'text-green-600' : avgSuccessProbability >= 0.6 ? 'text-yellow-600' : 'text-red-600'
          }`}>{formatPercent(avgSuccessProbability)}</p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Goals List */}
        <div className="col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Financial Goals</h3>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                analysis={analyses[goal.id]}
                isSelected={selectedGoalId === goal.id}
                onSelect={() => setSelectedGoalId(goal.id)}
              />
            ))}
          </div>
        </div>
        
        {/* Analysis Panel */}
        <div className="col-span-8 space-y-6">
          {selectedGoal && selectedAnalysis && (
            <>
              {/* Header with main probability */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{selectedGoal.name}</h3>
                    <p className="text-blue-100">Target: {formatCurrency(selectedGoal.targetAmount)} by {formatDate(selectedGoal.targetDate)}</p>
                  </div>
                  <ProbabilityGauge probability={selectedAnalysis.successProbability} size="lg" />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div>
                    <p className="text-blue-200 text-sm">Median Outcome</p>
                    <p className="text-2xl font-bold">{formatCurrency(selectedAnalysis.medianOutcome)}</p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm">Shortfall Risk</p>
                    <p className="text-2xl font-bold">{formatPercent(selectedAnalysis.shortfallRisk)}</p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm">Recommended Monthly</p>
                    <p className="text-2xl font-bold">{formatCurrency(selectedAnalysis.recommendedContribution)}</p>
                  </div>
                </div>
              </div>
              
              {/* Charts */}
              <div className="grid grid-cols-2 gap-6">
                <ProjectionChart goal={selectedGoal} analysis={selectedAnalysis} />
                <PercentileTable percentiles={selectedAnalysis.percentiles} target={selectedGoal.targetAmount} />
              </div>
              
              {/* Scenario Sliders */}
              <ScenarioSliders goal={selectedGoal} onChange={handleGoalUpdate} />
            </>
          )}

          {/* Compliance Disclaimer */}
          <div className="mt-8 p-4 bg-neutral-100 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-neutral-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                <strong className="text-neutral-600 dark:text-neutral-300">Important Disclosure:</strong> Monte Carlo simulations are hypothetical illustrations based on assumed rates of return, volatility, and other factors. Results shown are statistical projections, not predictions or guarantees. Actual results will vary and may be significantly different from simulated outcomes. Success probabilities represent historical statistical likelihood, not certainty of achieving goals. Investment decisions should not be based solely on these projections. Past performance does not guarantee future results. Please consult with your financial advisor and consider all relevant factors before making investment decisions.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalPlanningMonteCarlo;
