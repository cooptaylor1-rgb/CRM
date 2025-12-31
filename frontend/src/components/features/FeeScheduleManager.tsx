'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Plus,
  Trash2,
  Save,
  X,
  AlertCircle,
  Edit3,
  Calendar,
  Loader2,
  Calculator,
  Receipt,
  TrendingUp,
  Clock,
  Layers,
} from 'lucide-react';
import {
  FeeSchedule,
  FeeTier,
  FeeType,
  FeeFrequency,
  BillingMethod,
  AllocationEntityType,
  CreateFeeTierDto,
  CreateFeeScheduleDto,
  UpdateFeeScheduleDto,
  FeeCalculationResult,
  FEE_TYPE_LABELS,
  FEE_FREQUENCY_LABELS,
  createFeeSchedule,
  updateFeeSchedule,
  deleteFeeSchedule,
  getHouseholdFeeSchedule,
  getAccountFeeSchedule,
  getPersonFeeSchedule,
  calculateFee,
  formatFeeAmount,
  formatPercentage,
  formatBasisPoints,
} from '@/services/allocations.service';

interface FeeScheduleManagerProps {
  entityType: AllocationEntityType;
  entityId: string;
  entityName: string;
  currentAUM?: number;
  onUpdate?: () => void;
}

const FEE_TYPES: FeeType[] = ['AUM', 'FLAT', 'HOURLY', 'PERFORMANCE', 'SUBSCRIPTION', 'TRANSACTION'];
const FEE_FREQUENCIES: FeeFrequency[] = ['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL'];
const BILLING_METHODS: BillingMethod[] = ['ADVANCE', 'ARREARS'];

const FEE_TYPE_ICONS: Record<FeeType, React.ReactNode> = {
  AUM: <TrendingUp className="w-4 h-4" />,
  FLAT: <DollarSign className="w-4 h-4" />,
  HOURLY: <Clock className="w-4 h-4" />,
  PERFORMANCE: <TrendingUp className="w-4 h-4" />,
  SUBSCRIPTION: <Calendar className="w-4 h-4" />,
  TRANSACTION: <Receipt className="w-4 h-4" />,
};

export function FeeScheduleManager({ entityType, entityId, entityName, currentAUM, onUpdate }: FeeScheduleManagerProps) {
  const [feeSchedule, setFeeSchedule] = useState<FeeSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feeCalculation, setFeeCalculation] = useState<FeeCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editFeeType, setEditFeeType] = useState<FeeType>('AUM');
  const [editFrequency, setEditFrequency] = useState<FeeFrequency>('QUARTERLY');
  const [editBillingMethod, setEditBillingMethod] = useState<BillingMethod>('ARREARS');
  const [editTiers, setEditTiers] = useState<CreateFeeTierDto[]>([]);
  const [editMinFee, setEditMinFee] = useState<string>('');
  const [editMaxFee, setEditMaxFee] = useState<string>('');
  const [editEffectiveDate, setEditEffectiveDate] = useState('');

  // Fetch fee schedule
  useEffect(() => {
    fetchFeeSchedule();
  }, [entityType, entityId]);

  // Calculate fee when schedule changes
  useEffect(() => {
    if (feeSchedule && currentAUM && feeSchedule.feeType === 'AUM') {
      calculateCurrentFee();
    } else {
      setFeeCalculation(null);
    }
  }, [feeSchedule, currentAUM]);

  const fetchFeeSchedule = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let result: FeeSchedule | null = null;
      if (entityType === 'household') {
        result = await getHouseholdFeeSchedule(entityId);
      } else if (entityType === 'account') {
        result = await getAccountFeeSchedule(entityId);
      } else if (entityType === 'person') {
        result = await getPersonFeeSchedule(entityId);
      }
      setFeeSchedule(result);
    } catch (err) {
      console.error('Error fetching fee schedule:', err);
      setFeeSchedule(null);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCurrentFee = async () => {
    if (!feeSchedule || !currentAUM) return;
    setIsCalculating(true);
    try {
      const result = await calculateFee({
        feeScheduleId: feeSchedule.id,
        billableAmount: currentAUM,
      });
      setFeeCalculation(result);
    } catch (err) {
      console.error('Error calculating fee:', err);
      setFeeCalculation(null);
    } finally {
      setIsCalculating(false);
    }
  };

  // Start editing
  const startEditing = () => {
    if (feeSchedule) {
      setEditName(feeSchedule.name);
      setEditDescription(feeSchedule.description || '');
      setEditFeeType(feeSchedule.feeType);
      setEditFrequency(feeSchedule.frequency);
      setEditBillingMethod(feeSchedule.billingMethod);
      setEditTiers(feeSchedule.tiers.map(tier => ({
        minValue: tier.minValue,
        maxValue: tier.maxValue,
        rate: tier.rate,
        flatFee: tier.flatFee,
      })));
      setEditMinFee(feeSchedule.minimumFee?.toString() || '');
      setEditMaxFee(feeSchedule.maximumFee?.toString() || '');
      setEditEffectiveDate(feeSchedule.effectiveDate?.split('T')[0] || '');
    } else {
      setEditName(`${entityName} Fee Schedule`);
      setEditDescription('');
      setEditFeeType('AUM');
      setEditFrequency('QUARTERLY');
      setEditBillingMethod('ARREARS');
      setEditTiers([{ minValue: 0, rate: 0.01 }]);
      setEditMinFee('');
      setEditMaxFee('');
      setEditEffectiveDate(new Date().toISOString().split('T')[0]);
    }
    setIsEditing(true);
    setError(null);
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setError(null);
  };

  // Add tier
  const addTier = () => {
    const lastTier = editTiers[editTiers.length - 1];
    const newMinValue = lastTier?.maxValue || lastTier?.minValue + 1000000 || 0;
    setEditTiers([...editTiers, { minValue: newMinValue, rate: 0.005 }]);
  };

  // Remove tier
  const removeTier = (index: number) => {
    if (editTiers.length <= 1) return;
    setEditTiers(editTiers.filter((_, i) => i !== index));
  };

  // Update tier
  const updateTier = (index: number, updates: Partial<CreateFeeTierDto>) => {
    setEditTiers(editTiers.map((tier, i) => 
      i === index ? { ...tier, ...updates } : tier
    ));
  };

  // Save fee schedule
  const saveFeeSchedule = async () => {
    if (editTiers.length === 0) {
      setError('At least one fee tier is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (feeSchedule) {
        // Update existing
        const updateDto: UpdateFeeScheduleDto = {
          name: editName,
          description: editDescription || undefined,
          feeType: editFeeType,
          frequency: editFrequency,
          billingMethod: editBillingMethod,
          tiers: editTiers,
          minimumFee: editMinFee ? parseFloat(editMinFee) : undefined,
          maximumFee: editMaxFee ? parseFloat(editMaxFee) : undefined,
          effectiveDate: editEffectiveDate || undefined,
        };
        await updateFeeSchedule(feeSchedule.id, updateDto);
      } else {
        // Create new
        const createDto: CreateFeeScheduleDto = {
          entityType,
          [entityType === 'household' ? 'householdId' : entityType === 'account' ? 'accountId' : 'personId']: entityId,
          name: editName,
          description: editDescription || undefined,
          feeType: editFeeType,
          frequency: editFrequency,
          billingMethod: editBillingMethod,
          tiers: editTiers,
          minimumFee: editMinFee ? parseFloat(editMinFee) : undefined,
          maximumFee: editMaxFee ? parseFloat(editMaxFee) : undefined,
          effectiveDate: editEffectiveDate || undefined,
        };
        await createFeeSchedule(createDto);
      }

      await fetchFeeSchedule();
      setIsEditing(false);
      onUpdate?.();
    } catch (err: any) {
      console.error('Error saving fee schedule:', err);
      setError(err.response?.data?.message || 'Failed to save fee schedule');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete fee schedule
  const handleDelete = async () => {
    if (!feeSchedule) return;
    if (!confirm('Are you sure you want to delete this fee schedule?')) return;

    setIsSaving(true);
    try {
      await deleteFeeSchedule(feeSchedule.id);
      setFeeSchedule(null);
      setIsEditing(false);
      onUpdate?.();
    } catch (err: any) {
      console.error('Error deleting fee schedule:', err);
      setError(err.response?.data?.message || 'Failed to delete fee schedule');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTierRange = (tier: FeeTier | CreateFeeTierDto, index: number, tiers: (FeeTier | CreateFeeTierDto)[]) => {
    const min = tier.minValue;
    const max = tier.maxValue || (index < tiers.length - 1 ? tiers[index + 1].minValue - 1 : undefined);
    if (max) {
      return `${formatFeeAmount(min)} - ${formatFeeAmount(max)}`;
    }
    return `${formatFeeAmount(min)}+`;
  };

  if (isLoading) {
    return (
      <div className="bg-stone-900/50 border border-stone-800 rounded-lg p-6">
        <div className="flex items-center justify-center gap-3 text-stone-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading fee schedule...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-900/50 border border-stone-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-medium text-white">Fee Schedule</h3>
            {feeSchedule && !isEditing && (
              <p className="text-sm text-stone-400">
                {FEE_TYPE_LABELS[feeSchedule.feeType]} • {FEE_FREQUENCY_LABELS[feeSchedule.frequency]} • {feeSchedule.billingMethod === 'ADVANCE' ? 'Billed in Advance' : 'Billed in Arrears'}
              </p>
            )}
          </div>
        </div>

        {!isEditing && (
          <button
            onClick={startEditing}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors"
          >
            {feeSchedule ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {feeSchedule ? 'Edit' : 'Add Fee Schedule'}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Name */}
              <div>
                <label className="block text-sm text-stone-400 mb-1.5">Schedule Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="Fee schedule name"
                />
              </div>

              {/* Fee Type and Frequency */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-stone-400 mb-1.5">Fee Type</label>
                  <select
                    value={editFeeType}
                    onChange={(e) => setEditFeeType(e.target.value as FeeType)}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    {FEE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {FEE_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-stone-400 mb-1.5">Frequency</label>
                  <select
                    value={editFrequency}
                    onChange={(e) => setEditFrequency(e.target.value as FeeFrequency)}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    {FEE_FREQUENCIES.map((freq) => (
                      <option key={freq} value={freq}>
                        {FEE_FREQUENCY_LABELS[freq]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-stone-400 mb-1.5">Billing Method</label>
                  <select
                    value={editBillingMethod}
                    onChange={(e) => setEditBillingMethod(e.target.value as BillingMethod)}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    {BILLING_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method === 'ADVANCE' ? 'In Advance' : 'In Arrears'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fee Tiers */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-stone-400">Fee Tiers</label>
                  <button
                    onClick={addTier}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Tier
                  </button>
                </div>

                <div className="space-y-2">
                  {editTiers.map((tier, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-stone-800/50 rounded-lg"
                    >
                      <Layers className="w-4 h-4 text-stone-500 flex-shrink-0" />
                      <div className="flex-1 grid grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-stone-500 mb-1">Min Value</label>
                          <input
                            type="number"
                            value={tier.minValue}
                            onChange={(e) => updateTier(index, { minValue: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 bg-stone-700 border border-stone-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            min="0"
                            step="10000"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-stone-500 mb-1">Max Value (optional)</label>
                          <input
                            type="number"
                            value={tier.maxValue || ''}
                            onChange={(e) => updateTier(index, { maxValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                            className="w-full px-2 py-1 bg-stone-700 border border-stone-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            min="0"
                            step="10000"
                            placeholder="∞"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-stone-500 mb-1">
                            {editFeeType === 'FLAT' || editFeeType === 'HOURLY' ? 'Amount' : 'Rate (decimal)'}
                          </label>
                          <input
                            type="number"
                            value={tier.rate}
                            onChange={(e) => updateTier(index, { rate: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 bg-stone-700 border border-stone-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            min="0"
                            step={editFeeType === 'FLAT' || editFeeType === 'HOURLY' ? '100' : '0.0001'}
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={() => removeTier(index)}
                            disabled={editTiers.length <= 1}
                            className="p-1.5 text-stone-500 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Min/Max Fee and Effective Date */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-stone-400 mb-1.5">Minimum Fee (optional)</label>
                  <input
                    type="number"
                    value={editMinFee}
                    onChange={(e) => setEditMinFee(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="No minimum"
                    min="0"
                    step="100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-stone-400 mb-1.5">Maximum Fee (optional)</label>
                  <input
                    type="number"
                    value={editMaxFee}
                    onChange={(e) => setEditMaxFee(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="No maximum"
                    min="0"
                    step="100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-stone-400 mb-1.5">Effective Date</label>
                  <input
                    type="date"
                    value={editEffectiveDate}
                    onChange={(e) => setEditEffectiveDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-stone-400 mb-1.5">Description (optional)</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                  rows={2}
                  placeholder="Notes about this fee schedule..."
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  {feeSchedule && (
                    <button
                      onClick={handleDelete}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={cancelEditing}
                    disabled={isSaving}
                    className="px-4 py-1.5 text-sm text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveFeeSchedule}
                    disabled={isSaving || editTiers.length === 0}
                    className="flex items-center gap-2 px-4 py-1.5 text-sm text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          ) : feeSchedule ? (
            <motion.div
              key="display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Fee Summary Card */}
              {feeCalculation && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-stone-400">
                        Estimated {FEE_FREQUENCY_LABELS[feeSchedule.frequency]} Fee
                      </p>
                      <p className="text-2xl font-semibold text-white mt-1">
                        {formatFeeAmount(feeCalculation.totalFee)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-stone-400">Effective Rate</p>
                      <p className="text-lg font-medium text-emerald-400 mt-1">
                        {formatBasisPoints(feeCalculation.effectiveRate)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tiers Display */}
              <div>
                <h4 className="text-sm text-stone-400 mb-2">Fee Tiers</h4>
                <div className="space-y-1.5">
                  {feeSchedule.tiers.map((tier, index) => (
                    <div
                      key={tier.id || index}
                      className="flex items-center justify-between p-2.5 bg-stone-800/50 rounded-lg"
                    >
                      <span className="text-sm text-stone-300">
                        {formatTierRange(tier, index, feeSchedule.tiers)}
                      </span>
                      <span className="text-sm font-medium text-white">
                        {feeSchedule.feeType === 'FLAT' || feeSchedule.feeType === 'HOURLY'
                          ? formatFeeAmount(tier.rate)
                          : formatPercentage(tier.rate)}
                        {feeSchedule.feeType === 'HOURLY' && '/hr'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Min/Max Constraints */}
              {(feeSchedule.minimumFee || feeSchedule.maximumFee) && (
                <div className="flex gap-4 text-sm">
                  {feeSchedule.minimumFee && (
                    <div className="flex items-center gap-2 text-stone-400">
                      <span>Min:</span>
                      <span className="text-white">{formatFeeAmount(feeSchedule.minimumFee)}</span>
                    </div>
                  )}
                  {feeSchedule.maximumFee && (
                    <div className="flex items-center gap-2 text-stone-400">
                      <span>Max:</span>
                      <span className="text-white">{formatFeeAmount(feeSchedule.maximumFee)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {feeSchedule.description && (
                <p className="text-sm text-stone-400 bg-stone-800/50 rounded-lg p-3">
                  {feeSchedule.description}
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 text-stone-500"
            >
              <DollarSign className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">No fee schedule defined</p>
              <p className="text-xs mt-1">Click &ldquo;Add Fee Schedule&rdquo; to set up fee tiers</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default FeeScheduleManager;
