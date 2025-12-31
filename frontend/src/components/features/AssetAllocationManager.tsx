'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart,
  Plus,
  Trash2,
  Save,
  X,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Edit3,
  Target,
  Percent,
  Calendar,
  FileText,
  Loader2,
} from 'lucide-react';
import {
  TargetAssetAllocation,
  AllocationLineItem,
  AssetClass,
  AllocationEntityType,
  CreateAllocationLineItemDto,
  CreateTargetAllocationDto,
  UpdateTargetAllocationDto,
  ASSET_CLASS_LABELS,
  ASSET_CLASS_COLORS,
  createTargetAllocation,
  updateTargetAllocation,
  deleteTargetAllocation,
  getHouseholdAllocation,
  getAccountAllocation,
  getPersonAllocation,
  getTotalPercentage,
  validateAllocation,
} from '@/services/allocations.service';

interface AssetAllocationManagerProps {
  entityType: AllocationEntityType;
  entityId: string;
  entityName: string;
  onUpdate?: () => void;
}

const ALL_ASSET_CLASSES: AssetClass[] = [
  'US_LARGE_CAP',
  'US_MID_CAP',
  'US_SMALL_CAP',
  'INTERNATIONAL_DEVELOPED',
  'INTERNATIONAL_EMERGING',
  'GLOBAL_EQUITY',
  'US_INVESTMENT_GRADE_BONDS',
  'US_HIGH_YIELD_BONDS',
  'INTERNATIONAL_BONDS',
  'MUNICIPAL_BONDS',
  'TIPS',
  'REAL_ESTATE',
  'COMMODITIES',
  'ALTERNATIVES',
  'CASH',
  'OTHER',
];

export function AssetAllocationManager({ entityType, entityId, entityName, onUpdate }: AssetAllocationManagerProps) {
  const [allocation, setAllocation] = useState<TargetAssetAllocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLineItems, setEditLineItems] = useState<CreateAllocationLineItemDto[]>([]);
  const [editEffectiveDate, setEditEffectiveDate] = useState('');
  const [showAddAssetClass, setShowAddAssetClass] = useState(false);

  // Fetch allocation
  useEffect(() => {
    fetchAllocation();
  }, [entityType, entityId]);

  const fetchAllocation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let result: TargetAssetAllocation | null = null;
      if (entityType === 'household') {
        result = await getHouseholdAllocation(entityId);
      } else if (entityType === 'account') {
        result = await getAccountAllocation(entityId);
      } else if (entityType === 'person') {
        result = await getPersonAllocation(entityId);
      }
      setAllocation(result);
    } catch (err) {
      console.error('Error fetching allocation:', err);
      setAllocation(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Start editing
  const startEditing = () => {
    if (allocation) {
      setEditName(allocation.name);
      setEditDescription(allocation.description || '');
      setEditLineItems(allocation.lineItems.map(item => ({
        assetClass: item.assetClass,
        targetPercentage: item.targetPercentage,
        minPercentage: item.minPercentage,
        maxPercentage: item.maxPercentage,
        notes: item.notes,
      })));
      setEditEffectiveDate(allocation.effectiveDate?.split('T')[0] || '');
    } else {
      setEditName(`${entityName} Target Allocation`);
      setEditDescription('');
      setEditLineItems([]);
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

  // Add asset class
  const addAssetClass = (assetClass: AssetClass) => {
    if (editLineItems.some(item => item.assetClass === assetClass)) {
      return;
    }
    setEditLineItems([...editLineItems, {
      assetClass,
      targetPercentage: 0,
    }]);
    setShowAddAssetClass(false);
  };

  // Remove asset class
  const removeAssetClass = (index: number) => {
    setEditLineItems(editLineItems.filter((_, i) => i !== index));
  };

  // Update line item
  const updateLineItem = (index: number, updates: Partial<CreateAllocationLineItemDto>) => {
    setEditLineItems(editLineItems.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    ));
  };

  // Available asset classes for adding
  const availableAssetClasses = ALL_ASSET_CLASSES.filter(
    ac => !editLineItems.some(item => item.assetClass === ac)
  );

  // Validation
  const validation = useMemo(() => validateAllocation(editLineItems), [editLineItems]);
  const totalPercentage = useMemo(() => getTotalPercentage(editLineItems), [editLineItems]);

  // Save allocation
  const saveAllocation = async () => {
    if (!validation.valid) {
      setError(validation.error || 'Invalid allocation');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (allocation) {
        // Update existing
        const updateDto: UpdateTargetAllocationDto = {
          name: editName,
          description: editDescription || undefined,
          lineItems: editLineItems,
          effectiveDate: editEffectiveDate || undefined,
        };
        await updateTargetAllocation(allocation.id, updateDto);
      } else {
        // Create new
        const createDto: CreateTargetAllocationDto = {
          entityType,
          [entityType === 'household' ? 'householdId' : entityType === 'account' ? 'accountId' : 'personId']: entityId,
          name: editName,
          description: editDescription || undefined,
          lineItems: editLineItems,
          effectiveDate: editEffectiveDate || undefined,
        };
        await createTargetAllocation(createDto);
      }

      await fetchAllocation();
      setIsEditing(false);
      onUpdate?.();
    } catch (err: any) {
      console.error('Error saving allocation:', err);
      setError(err.response?.data?.message || 'Failed to save allocation');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete allocation
  const handleDelete = async () => {
    if (!allocation) return;
    if (!confirm('Are you sure you want to delete this target allocation?')) return;

    setIsSaving(true);
    try {
      await deleteTargetAllocation(allocation.id);
      setAllocation(null);
      setIsEditing(false);
      onUpdate?.();
    } catch (err: any) {
      console.error('Error deleting allocation:', err);
      setError(err.response?.data?.message || 'Failed to delete allocation');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-stone-900/50 border border-stone-800 rounded-lg p-6">
        <div className="flex items-center justify-center gap-3 text-stone-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading allocation...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-900/50 border border-stone-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Target className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-white">Target Asset Allocation</h3>
            {allocation && !isEditing && (
              <p className="text-sm text-stone-400">
                {allocation.lineItems.length} asset classes • Effective {new Date(allocation.effectiveDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {!isEditing && (
          <button
            onClick={startEditing}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors"
          >
            {allocation ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {allocation ? 'Edit' : 'Add Allocation'}
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
              {/* Name and Description */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-stone-400 mb-1.5">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Allocation name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-stone-400 mb-1.5">Effective Date</label>
                  <input
                    type="date"
                    value={editEffectiveDate}
                    onChange={(e) => setEditEffectiveDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-stone-400 mb-1.5">Description (optional)</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  rows={2}
                  placeholder="Notes about this allocation strategy..."
                />
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-stone-400">Asset Classes</label>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${
                      Math.abs(totalPercentage - 100) < 0.01 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      Total: {totalPercentage.toFixed(1)}%
                    </span>
                    <div className="relative">
                      <button
                        onClick={() => setShowAddAssetClass(!showAddAssetClass)}
                        disabled={availableAssetClasses.length === 0}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Class
                      </button>
                      
                      <AnimatePresence>
                        {showAddAssetClass && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute right-0 top-full mt-1 z-20 w-64 max-h-64 overflow-y-auto bg-stone-800 border border-stone-700 rounded-lg shadow-xl"
                          >
                            {availableAssetClasses.map((ac) => (
                              <button
                                key={ac}
                                onClick={() => addAssetClass(ac)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-300 hover:text-white hover:bg-stone-700 transition-colors text-left"
                              >
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: ASSET_CLASS_COLORS[ac] }}
                                />
                                {ASSET_CLASS_LABELS[ac]}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {editLineItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-stone-500">
                    <PieChart className="w-10 h-10 mb-2 opacity-50" />
                    <p className="text-sm">No asset classes added yet</p>
                    <p className="text-xs mt-1">Click &ldquo;Add Class&rdquo; to start building the allocation</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {editLineItems.map((item, index) => (
                      <div
                        key={item.assetClass}
                        className="flex items-center gap-3 p-3 bg-stone-800/50 rounded-lg"
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: ASSET_CLASS_COLORS[item.assetClass] }}
                        />
                        <span className="text-sm text-white flex-1 truncate">
                          {ASSET_CLASS_LABELS[item.assetClass]}
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={item.targetPercentage}
                            onChange={(e) => updateLineItem(index, { targetPercentage: parseFloat(e.target.value) || 0 })}
                            className="w-20 px-2 py-1 bg-stone-700 border border-stone-600 rounded text-white text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span className="text-sm text-stone-400">%</span>
                          <button
                            onClick={() => removeAssetClass(index)}
                            className="p-1 text-stone-500 hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                  {allocation && (
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
                    onClick={saveAllocation}
                    disabled={isSaving || !validation.valid || editLineItems.length === 0}
                    className="flex items-center gap-2 px-4 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          ) : allocation ? (
            <motion.div
              key="display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Allocation Visualization */}
              <div className="flex gap-6">
                {/* Pie Chart */}
                <div className="relative w-32 h-32 flex-shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {(() => {
                      let cumulativePercentage = 0;
                      return allocation.lineItems.map((item) => {
                        const startAngle = (cumulativePercentage / 100) * 360;
                        cumulativePercentage += item.targetPercentage;
                        const endAngle = (cumulativePercentage / 100) * 360;
                        
                        const startRad = (startAngle * Math.PI) / 180;
                        const endRad = (endAngle * Math.PI) / 180;
                        const largeArc = item.targetPercentage > 50 ? 1 : 0;
                        
                        const x1 = 50 + 40 * Math.cos(startRad);
                        const y1 = 50 + 40 * Math.sin(startRad);
                        const x2 = 50 + 40 * Math.cos(endRad);
                        const y2 = 50 + 40 * Math.sin(endRad);
                        
                        const d = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
                        
                        return (
                          <path
                            key={item.assetClass}
                            d={d}
                            fill={ASSET_CLASS_COLORS[item.assetClass]}
                            className="transition-opacity hover:opacity-80"
                          />
                        );
                      });
                    })()}
                  </svg>
                </div>

                {/* Legend */}
                <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {allocation.lineItems
                    .sort((a, b) => b.targetPercentage - a.targetPercentage)
                    .map((item) => (
                      <div key={item.assetClass} className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: ASSET_CLASS_COLORS[item.assetClass] }}
                        />
                        <span className="text-xs text-stone-400 truncate flex-1">
                          {ASSET_CLASS_LABELS[item.assetClass]}
                        </span>
                        <span className="text-xs text-white font-medium">
                          {item.targetPercentage.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Description */}
              {allocation.description && (
                <p className="text-sm text-stone-400 bg-stone-800/50 rounded-lg p-3">
                  {allocation.description}
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
              <PieChart className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">No target allocation defined</p>
              <p className="text-xs mt-1">Click &ldquo;Add Allocation&rdquo; to set target asset classes</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default AssetAllocationManager;
