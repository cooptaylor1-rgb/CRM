'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldExclamationIcon,
  ChartPieIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ScaleIcon,
  BeakerIcon,
  ArrowPathIcon,
  QuestionMarkCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

// ============================================
// Types
// ============================================

export type RiskLevel = 'conservative' | 'moderate_conservative' | 'moderate' | 'moderate_aggressive' | 'aggressive';

export interface RiskProfile {
  level: RiskLevel;
  score: number;
  targetEquity: number;
  targetFixed: number;
  targetAlternative: number;
  maxDrawdown: number;
  volatilityTolerance: number;
}

export interface PortfolioRisk {
  currentScore: number;
  targetScore: number;
  volatility: number;
  beta: number;
  sharpeRatio: number;
  maxDrawdown: number;
  concentrationRisk: number;
  allocationDrift: number;
}

export interface StressTest {
  id: string;
  name: string;
  scenario: string;
  impact: number;
  impactPercent: number;
  recoveryTime: string;
}

export interface RebalanceAlert {
  id: string;
  assetClass: string;
  currentAllocation: number;
  targetAllocation: number;
  drift: number;
  action: 'buy' | 'sell';
  amount: number;
  priority: 'low' | 'medium' | 'high';
}

export interface RiskAssessmentModuleProps {
  className?: string;
  onRebalance?: (alerts: RebalanceAlert[]) => void;
}

// ============================================
// Constants & Mock Data
// ============================================

const RISK_LEVELS: Record<RiskLevel, { label: string; color: string; range: string }> = {
  conservative: { label: 'Conservative', color: 'text-blue-600 bg-blue-100', range: '0-20' },
  moderate_conservative: { label: 'Moderately Conservative', color: 'text-cyan-600 bg-cyan-100', range: '21-40' },
  moderate: { label: 'Moderate', color: 'text-green-600 bg-green-100', range: '41-60' },
  moderate_aggressive: { label: 'Moderately Aggressive', color: 'text-orange-600 bg-orange-100', range: '61-80' },
  aggressive: { label: 'Aggressive', color: 'text-red-600 bg-red-100', range: '81-100' },
};

const QUESTIONNAIRE = [
  { id: 'q1', question: 'What is your investment time horizon?', options: ['Less than 3 years', '3-5 years', '5-10 years', '10-20 years', 'More than 20 years'] },
  { id: 'q2', question: 'If your portfolio lost 20% in a month, what would you do?', options: ['Sell everything', 'Sell some', 'Hold steady', 'Buy more', 'Buy significantly more'] },
  { id: 'q3', question: 'What is your primary investment goal?', options: ['Capital preservation', 'Income generation', 'Balanced growth', 'Growth', 'Aggressive growth'] },
  { id: 'q4', question: 'What percentage of your income do you save monthly?', options: ['0-5%', '5-10%', '10-20%', '20-30%', 'More than 30%'] },
  { id: 'q5', question: 'How would you describe your investment knowledge?', options: ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'] },
];

const generateMockData = (): { profile: RiskProfile; portfolioRisk: PortfolioRisk; stressTests: StressTest[]; alerts: RebalanceAlert[] } => {
  const profile: RiskProfile = {
    level: 'moderate',
    score: 55,
    targetEquity: 60,
    targetFixed: 30,
    targetAlternative: 10,
    maxDrawdown: 25,
    volatilityTolerance: 15,
  };

  const portfolioRisk: PortfolioRisk = {
    currentScore: 62,
    targetScore: 55,
    volatility: 14.2,
    beta: 1.05,
    sharpeRatio: 1.32,
    maxDrawdown: 18.5,
    concentrationRisk: 22,
    allocationDrift: 5.3,
  };

  const stressTests: StressTest[] = [
    { id: 's1', name: '2008 Financial Crisis', scenario: 'Market crash similar to 2008', impact: -245000, impactPercent: -38.5, recoveryTime: '4-5 years' },
    { id: 's2', name: 'COVID-19 March 2020', scenario: 'Rapid market decline and recovery', impact: -165000, impactPercent: -26.0, recoveryTime: '6-12 months' },
    { id: 's3', name: 'Rising Interest Rates', scenario: '200bps rate increase', impact: -52000, impactPercent: -8.2, recoveryTime: '1-2 years' },
    { id: 's4', name: 'Stagflation', scenario: 'High inflation with low growth', impact: -98000, impactPercent: -15.4, recoveryTime: '2-3 years' },
  ];

  const alerts: RebalanceAlert[] = [
    { id: 'a1', assetClass: 'US Large Cap', currentAllocation: 42, targetAllocation: 35, drift: 7, action: 'sell', amount: 44500, priority: 'high' },
    { id: 'a2', assetClass: 'International Equity', currentAllocation: 12, targetAllocation: 15, drift: -3, action: 'buy', amount: 19000, priority: 'medium' },
    { id: 'a3', assetClass: 'Fixed Income', currentAllocation: 26, targetAllocation: 30, drift: -4, action: 'buy', amount: 25500, priority: 'medium' },
    { id: 'a4', assetClass: 'Alternatives', currentAllocation: 8, targetAllocation: 10, drift: -2, action: 'buy', amount: 12700, priority: 'low' },
  ];

  return { profile, portfolioRisk, stressTests, alerts };
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

const RiskGauge: React.FC<{ score: number; targetScore: number }> = ({ score, targetScore }) => {
  const getColor = (s: number) => {
    if (s <= 20) return '#3B82F6';
    if (s <= 40) return '#06B6D4';
    if (s <= 60) return '#22C55E';
    if (s <= 80) return '#F97316';
    return '#EF4444';
  };

  return (
    <div className="relative w-48 h-24 mx-auto">
      <svg viewBox="0 0 200 100" className="w-full h-full">
        {/* Background arc */}
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#E5E7EB" strokeWidth="12" strokeLinecap="round" />
        {/* Score arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={getColor(score)}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 251} 251`}
        />
        {/* Target marker */}
        <circle
          cx={20 + (160 * targetScore / 100)}
          cy={100 - Math.sin(Math.acos((targetScore - 50) / 50)) * 80}
          r="6"
          fill="#6B7280"
          stroke="white"
          strokeWidth="2"
        />
      </svg>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <p className="text-3xl font-bold" style={{ color: getColor(score) }}>{score}</p>
        <p className="text-xs text-gray-500">Target: {targetScore}</p>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string; subValue?: string; status?: 'good' | 'warning' | 'bad' }> = ({
  label, value, subValue, status,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <div className="flex items-center gap-2">
      <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      {status && (
        <span className={`w-2 h-2 rounded-full ${
          status === 'good' ? 'bg-green-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
        }`} />
      )}
    </div>
    {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
  </div>
);

const StressTestCard: React.FC<{ test: StressTest }> = ({ test }) => (
  <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
    <div className="flex items-start justify-between mb-2">
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white">{test.name}</h4>
        <p className="text-sm text-gray-500">{test.scenario}</p>
      </div>
      <BeakerIcon className="w-5 h-5 text-purple-500" />
    </div>
    <div className="flex items-end justify-between mt-4">
      <div>
        <p className="text-2xl font-bold text-red-600">{formatCurrency(test.impact)}</p>
        <p className="text-sm text-red-500">{test.impactPercent.toFixed(1)}% loss</p>
      </div>
      <p className="text-xs text-gray-500">Recovery: {test.recoveryTime}</p>
    </div>
  </div>
);

const RebalanceAlertRow: React.FC<{ alert: RebalanceAlert }> = ({ alert }) => (
  <div className="px-4 py-3 flex items-center gap-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
      alert.action === 'buy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
    }`}>
      {alert.action === 'buy' ? <ArrowTrendingDownIcon className="w-5 h-5 rotate-180" /> : <ArrowTrendingDownIcon className="w-5 h-5" />}
    </div>
    <div className="flex-1">
      <p className="font-medium text-gray-900 dark:text-white">{alert.assetClass}</p>
      <p className="text-sm text-gray-500">
        {alert.currentAllocation}% → {alert.targetAllocation}% ({alert.drift > 0 ? '+' : ''}{alert.drift}%)
      </p>
    </div>
    <div className="text-right">
      <p className={`font-semibold ${alert.action === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
        {alert.action === 'buy' ? 'Buy' : 'Sell'} {formatCurrency(alert.amount)}
      </p>
      <span className={`text-xs px-2 py-0.5 rounded-full ${
        alert.priority === 'high' ? 'bg-red-100 text-red-600' :
        alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
        'bg-gray-100 text-gray-600'
      }`}>
        {alert.priority}
      </span>
    </div>
  </div>
);

const QuestionnaireModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const currentQ = QUESTIONNAIRE[step];
  const isComplete = step >= QUESTIONNAIRE.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6"
      >
        {isComplete ? (
          <div className="text-center py-8">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Assessment Complete!</h3>
            <p className="text-gray-500 mb-6">Your risk profile has been updated.</p>
            <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              View Results
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Risk Assessment</h3>
              <span className="text-sm text-gray-500">{step + 1} of {QUESTIONNAIRE.length}</span>
            </div>
            
            <div className="h-1 bg-gray-200 rounded-full mb-6">
              <div className="h-1 bg-blue-600 rounded-full transition-all" style={{ width: `${((step + 1) / QUESTIONNAIRE.length) * 100}%` }} />
            </div>

            <p className="text-gray-900 dark:text-white font-medium mb-4">{currentQ.question}</p>
            
            <div className="space-y-2 mb-6">
              {currentQ.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setAnswers({ ...answers, [currentQ.id]: i });
                    setStep(step + 1);
                  }}
                  className={`w-full p-3 text-left rounded-lg border transition-colors ${
                    answers[currentQ.id] === i
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="text-sm text-gray-500 hover:text-gray-700">
                ← Back
              </button>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

// ============================================
// Main Component
// ============================================

export const RiskAssessmentModule: React.FC<RiskAssessmentModuleProps> = ({
  className = '',
  onRebalance,
}) => {
  const [data] = useState(() => generateMockData());
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'stress' | 'rebalance'>('overview');

  const riskConfig = RISK_LEVELS[data.profile.level];

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Risk Assessment</h1>
          <p className="text-gray-500 mt-1">Monitor and manage portfolio risk</p>
        </div>
        <button
          onClick={() => setShowQuestionnaire(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <QuestionMarkCircleIcon className="w-5 h-5" />
          Retake Assessment
        </button>
      </div>

      {/* Risk Profile Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Risk Score</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${riskConfig.color}`}>
              {riskConfig.label}
            </span>
          </div>
          <RiskGauge score={data.portfolioRisk.currentScore} targetScore={data.portfolioRisk.targetScore} />
          <p className="text-center text-sm text-gray-500 mt-4">
            {data.portfolioRisk.currentScore > data.portfolioRisk.targetScore ? 
              'Portfolio is more aggressive than target' : 
              'Portfolio is within risk tolerance'}
          </p>
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Volatility" value={`${data.portfolioRisk.volatility}%`} status={data.portfolioRisk.volatility < 15 ? 'good' : 'warning'} />
          <MetricCard label="Beta" value={data.portfolioRisk.beta.toFixed(2)} status={data.portfolioRisk.beta < 1.1 ? 'good' : 'warning'} />
          <MetricCard label="Sharpe Ratio" value={data.portfolioRisk.sharpeRatio.toFixed(2)} status={data.portfolioRisk.sharpeRatio > 1 ? 'good' : 'warning'} />
          <MetricCard label="Max Drawdown" value={`${data.portfolioRisk.maxDrawdown}%`} status={data.portfolioRisk.maxDrawdown < 20 ? 'good' : 'warning'} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 w-fit">
        {(['overview', 'stress', 'rebalance'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-600'
            }`}
          >
            {tab === 'rebalance' ? `Rebalance (${data.alerts.length})` : tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Target Allocation</h3>
            <div className="space-y-4">
              {[
                { label: 'Equity', target: data.profile.targetEquity, color: 'bg-blue-500' },
                { label: 'Fixed Income', target: data.profile.targetFixed, color: 'bg-green-500' },
                { label: 'Alternatives', target: data.profile.targetAlternative, color: 'bg-purple-500' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{item.target}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className={`h-2 ${item.color} rounded-full`} style={{ width: `${item.target}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'stress' && (
          <motion.div
            key="stress"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {data.stressTests.map(test => (
              <StressTestCard key={test.id} test={test} />
            ))}
          </motion.div>
        )}

        {activeTab === 'rebalance' && (
          <motion.div
            key="rebalance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {data.alerts.map(alert => (
                <RebalanceAlertRow key={alert.id} alert={alert} />
              ))}
            </div>
            <button
              onClick={() => onRebalance?.(data.alerts)}
              className="mt-4 w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Execute Rebalance
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Questionnaire Modal */}
      <QuestionnaireModal isOpen={showQuestionnaire} onClose={() => setShowQuestionnaire(false)} />
    </div>
  );
};

export default RiskAssessmentModule;
