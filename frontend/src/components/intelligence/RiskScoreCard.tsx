'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlertIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  RefreshCwIcon,
} from 'lucide-react';
import { Card, Badge, Button, Skeleton } from '@/components/ui';
import {
  intelligenceService,
  RiskScore,
  riskLevelLabels,
  riskLevelColors,
} from '@/services/intelligence.service';
import toast from 'react-hot-toast';

// =============================================================================
// Types
// =============================================================================

interface RiskScoreCardProps {
  householdId: string;
  compact?: boolean;
  showHistory?: boolean;
  onCalculate?: (score: RiskScore) => void;
}

// =============================================================================
// Component
// =============================================================================

export function RiskScoreCard({
  householdId,
  compact = false,
  showHistory = false,
  onCalculate,
}: RiskScoreCardProps) {
  const [loading, setLoading] = React.useState(true);
  const [calculating, setCalculating] = React.useState(false);
  const [riskScore, setRiskScore] = React.useState<RiskScore | null>(null);
  const [history, setHistory] = React.useState<RiskScore[]>([]);

  const loadData = React.useCallback(async () => {
    try {
      const [scoreData, historyData] = await Promise.all([
        intelligenceService.getRiskScore(householdId),
        showHistory ? intelligenceService.getRiskScoreHistory(householdId, 6) : Promise.resolve([]),
      ]);
      setRiskScore(scoreData);
      setHistory(historyData);
    } catch {
      // Score may not exist yet
    } finally {
      setLoading(false);
    }
  }, [householdId, showHistory]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const score = await intelligenceService.calculateRiskScore(householdId);
      setRiskScore(score);
      onCalculate?.(score);
      toast.success('Risk score calculated');
    } catch {
      toast.error('Failed to calculate risk score');
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return <Skeleton className={compact ? 'h-24' : 'h-64'} />;
  }

  if (!riskScore) {
    return (
      <Card className="p-6 text-center">
        <ShieldAlertIcon className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
        <h3 className="font-medium text-foreground mb-2">No Risk Score</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Calculate the risk score to see client health metrics
        </p>
        <Button onClick={handleCalculate} disabled={calculating}>
          {calculating ? 'Calculating...' : 'Calculate Now'}
        </Button>
      </Card>
    );
  }

  if (compact) {
    return (
      <CompactRiskScore riskScore={riskScore} onRecalculate={handleCalculate} calculating={calculating} />
    );
  }

  return (
    <DetailedRiskScore
      riskScore={riskScore}
      history={history}
      showHistory={showHistory}
      onRecalculate={handleCalculate}
      calculating={calculating}
    />
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function CompactRiskScore({
  riskScore,
  onRecalculate,
  calculating,
}: {
  riskScore: RiskScore;
  onRecalculate: () => void;
  calculating: boolean;
}) {
  const score = Number(riskScore.overallScore);
  const TrendIcon = riskScore.trendDirection === 'improving'
    ? TrendingDownIcon
    : riskScore.trendDirection === 'declining'
    ? TrendingUpIcon
    : MinusIcon;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RiskGauge score={score} size="sm" />
          <div>
            <div className="flex items-center gap-2">
              <Badge className={riskLevelColors[riskScore.riskLevel]}>
                {riskLevelLabels[riskScore.riskLevel]}
              </Badge>
              <TrendIcon className={`w-4 h-4 ${
                riskScore.trendDirection === 'improving' ? 'text-green-500' :
                riskScore.trendDirection === 'declining' ? 'text-red-500' :
                'text-gray-400'
              }`} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {riskScore.keyFactors[0]}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRecalculate}
          disabled={calculating}
        >
          <RefreshCwIcon className={`w-4 h-4 ${calculating ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </Card>
  );
}

function DetailedRiskScore({
  riskScore,
  history,
  showHistory,
  onRecalculate,
  calculating,
}: {
  riskScore: RiskScore;
  history: RiskScore[];
  showHistory: boolean;
  onRecalculate: () => void;
  calculating: boolean;
}) {
  const score = Number(riskScore.overallScore);

  return (
    <Card>
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlertIcon className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Risk Assessment</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRecalculate}
          disabled={calculating}
          className="gap-2"
        >
          <RefreshCwIcon className={`w-4 h-4 ${calculating ? 'animate-spin' : ''}`} />
          Recalculate
        </Button>
      </div>

      <div className="p-6">
        {/* Main Score */}
        <div className="flex items-center justify-center mb-6">
          <RiskGauge score={score} size="lg" />
        </div>

        <div className="text-center mb-6">
          <Badge className={`${riskLevelColors[riskScore.riskLevel]} text-base px-4 py-1`}>
            {riskLevelLabels[riskScore.riskLevel]} Risk
          </Badge>
          {riskScore.trendDirection && (
            <p className={`text-sm mt-2 ${
              riskScore.trendDirection === 'improving' ? 'text-green-600' :
              riskScore.trendDirection === 'declining' ? 'text-red-600' :
              'text-gray-500'
            }`}>
              {riskScore.trendDirection === 'improving' && '↓ Improving'}
              {riskScore.trendDirection === 'declining' && '↑ Declining'}
              {riskScore.trendDirection === 'stable' && '→ Stable'}
              {riskScore.scoreChange ? ` (${riskScore.scoreChange > 0 ? '+' : ''}${riskScore.scoreChange.toFixed(1)})` : ''}
            </p>
          )}
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <ScoreIndicator label="Attrition" score={Number(riskScore.attritionScore)} />
          <ScoreIndicator label="Compliance" score={Number(riskScore.complianceScore)} />
          <ScoreIndicator label="Portfolio" score={Number(riskScore.portfolioScore)} />
          <ScoreIndicator label="Engagement" score={Number(riskScore.engagementScore)} inverted />
        </div>

        {/* Key Factors */}
        {riskScore.keyFactors.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-foreground mb-2">Key Risk Factors</h4>
            <ul className="space-y-1">
              {riskScore.keyFactors.map((factor, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <AlertTriangleIcon className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {riskScore.recommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Recommendations</h4>
            <ul className="space-y-1">
              {riskScore.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* History Chart */}
        {showHistory && history.length > 1 && (
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="text-sm font-medium text-foreground mb-3">Score History</h4>
            <div className="flex items-end gap-1 h-16">
              {history.map((h, i) => (
                <div
                  key={h.id}
                  className="flex-1 bg-primary/20 rounded-t"
                  style={{ height: `${Number(h.overallScore)}%` }}
                  title={`${new Date(h.calculatedAt).toLocaleDateString()}: ${Number(h.overallScore).toFixed(0)}`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{history.length > 0 ? new Date(history[0].calculatedAt).toLocaleDateString() : ''}</span>
              <span>{history.length > 0 ? new Date(history[history.length - 1].calculatedAt).toLocaleDateString() : ''}</span>
            </div>
          </div>
        )}

        {/* Last Calculated */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          Last calculated: {new Date(riskScore.calculatedAt).toLocaleString()}
        </p>
      </div>
    </Card>
  );
}

function RiskGauge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { width: 60, height: 60, strokeWidth: 6, fontSize: 'text-lg' },
    md: { width: 100, height: 100, strokeWidth: 8, fontSize: 'text-2xl' },
    lg: { width: 140, height: 140, strokeWidth: 10, fontSize: 'text-4xl' },
  };

  const { width, height, strokeWidth, fontSize } = sizes[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = radius * Math.PI;
  const progress = (score / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 80) return '#ef4444'; // red
    if (score >= 60) return '#f97316'; // orange
    if (score >= 40) return '#eab308'; // yellow
    if (score >= 20) return '#84cc16'; // lime
    return '#22c55e'; // green
  };

  return (
    <div className="relative" style={{ width, height }}>
      <svg width={width} height={height} className="transform -rotate-90">
        {/* Background arc */}
        <circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          className="text-muted/20"
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <motion.circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          fill="none"
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${progress} ${circumference}` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-bold text-foreground ${fontSize}`}>{score.toFixed(0)}</span>
      </div>
    </div>
  );
}

function ScoreIndicator({
  label,
  score,
  inverted = false,
}: {
  label: string;
  score: number;
  inverted?: boolean;
}) {
  // For inverted scores (like engagement), lower is worse
  const displayScore = inverted ? 100 - score : score;
  const getColor = (s: number) => {
    if (s >= 60) return 'bg-red-500';
    if (s >= 40) return 'bg-orange-500';
    if (s >= 20) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="p-3 rounded-lg bg-background-secondary">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground">{score.toFixed(0)}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${getColor(displayScore)} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export default RiskScoreCard;
