'use client';

import * as React from 'react';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { cn } from './utils';

// ============================================================================
// Types
// ============================================================================

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'between'
  | 'is_empty'
  | 'is_not_empty'
  | 'in'
  | 'not_in'
  | 'before'
  | 'after'
  | 'within_last'
  | 'within_next';

export type FilterFieldType = 'text' | 'number' | 'date' | 'select' | 'multi_select' | 'boolean';

export interface FilterField {
  id: string;
  label: string;
  type: FilterFieldType;
  options?: Array<{ value: string; label: string }>;
  icon?: React.FC<{ className?: string }>;
}

export interface FilterCondition {
  id: string;
  fieldId: string;
  operator: FilterOperator;
  value: unknown;
  value2?: unknown; // For 'between' operator
}

export interface FilterGroup {
  id: string;
  logic: 'and' | 'or';
  conditions: FilterCondition[];
}

export interface SmartListDefinition {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  filters: FilterGroup[];
  sortBy?: { field: string; direction: 'asc' | 'desc' };
  columns?: string[];
  isSystem?: boolean;
  isPinned?: boolean;
  createdAt: Date;
  updatedAt: Date;
  count?: number;
}

// ============================================================================
// Smart Lists Sidebar
// ============================================================================

export interface SmartListsSidebarProps {
  lists: SmartListDefinition[];
  activeListId?: string;
  onSelectList: (listId: string) => void;
  onCreateList: () => void;
  onEditList: (list: SmartListDefinition) => void;
  onDeleteList: (listId: string) => void;
  onDuplicateList: (list: SmartListDefinition) => void;
  onReorderLists: (lists: SmartListDefinition[]) => void;
  onPinList: (listId: string, pinned: boolean) => void;
  className?: string;
}

export function SmartListsSidebar({
  lists,
  activeListId,
  onSelectList,
  onCreateList,
  onEditList,
  onDeleteList,
  onDuplicateList,
  onReorderLists,
  onPinList,
  className,
}: SmartListsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState<'pinned' | 'all' | 'system'>('all');

  // Group lists
  const { pinnedLists, userLists, systemLists } = useMemo(() => {
    const filtered = lists.filter((list) =>
      list.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return {
      pinnedLists: filtered.filter((l) => l.isPinned && !l.isSystem),
      userLists: filtered.filter((l) => !l.isPinned && !l.isSystem),
      systemLists: filtered.filter((l) => l.isSystem),
    };
  }, [lists, searchQuery]);

  return (
    <div className={cn('flex flex-col h-full bg-neutral-900', className)}>
      {/* Header */}
      <div className="p-4 border-b border-neutral-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Smart Lists</h2>
          <button
            onClick={onCreateList}
            className="p-1.5 rounded-lg bg-accent-600 text-white hover:bg-accent-500 transition-colors"
            title="Create new list"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search lists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'w-full pl-9 pr-3 py-2 text-sm rounded-lg',
              'bg-neutral-800 border border-neutral-700',
              'text-white placeholder-neutral-500',
              'focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500'
            )}
          />
        </div>
      </div>

      {/* Lists */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Pinned Lists */}
        {pinnedLists.length > 0 && (
          <ListSection
            title="Pinned"
            lists={pinnedLists}
            activeListId={activeListId}
            onSelectList={onSelectList}
            onEditList={onEditList}
            onDeleteList={onDeleteList}
            onDuplicateList={onDuplicateList}
            onPinList={onPinList}
            expanded={expandedSection === 'pinned'}
            onToggle={() => setExpandedSection(expandedSection === 'pinned' ? 'all' : 'pinned')}
          />
        )}

        {/* User Lists */}
        <ListSection
          title="My Lists"
          lists={userLists}
          activeListId={activeListId}
          onSelectList={onSelectList}
          onEditList={onEditList}
          onDeleteList={onDeleteList}
          onDuplicateList={onDuplicateList}
          onPinList={onPinList}
          expanded={true}
          reorderable
          onReorder={(newOrder) => {
            const reordered = [
              ...pinnedLists,
              ...newOrder,
              ...systemLists,
            ];
            onReorderLists(reordered);
          }}
        />

        {/* System Lists */}
        {systemLists.length > 0 && (
          <ListSection
            title="System"
            lists={systemLists}
            activeListId={activeListId}
            onSelectList={onSelectList}
            onEditList={onEditList}
            onDeleteList={onDeleteList}
            onDuplicateList={onDuplicateList}
            onPinList={onPinList}
            expanded={expandedSection === 'system'}
            onToggle={() => setExpandedSection(expandedSection === 'system' ? 'all' : 'system')}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// List Section
// ============================================================================

interface ListSectionProps {
  title: string;
  lists: SmartListDefinition[];
  activeListId?: string;
  onSelectList: (listId: string) => void;
  onEditList: (list: SmartListDefinition) => void;
  onDeleteList: (listId: string) => void;
  onDuplicateList: (list: SmartListDefinition) => void;
  onPinList: (listId: string, pinned: boolean) => void;
  expanded?: boolean;
  onToggle?: () => void;
  reorderable?: boolean;
  onReorder?: (lists: SmartListDefinition[]) => void;
}

function ListSection({
  title,
  lists,
  activeListId,
  onSelectList,
  onEditList,
  onDeleteList,
  onDuplicateList,
  onPinList,
  expanded = true,
  onToggle,
  reorderable = false,
  onReorder,
}: ListSectionProps) {
  if (lists.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider hover:text-neutral-400"
      >
        {title}
        {onToggle && (
          <ChevronIcon
            className={cn(
              'w-4 h-4 transition-transform',
              expanded && 'rotate-180'
            )}
          />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {reorderable && onReorder ? (
              <Reorder.Group
                axis="y"
                values={lists}
                onReorder={onReorder}
                className="space-y-0.5"
              >
                {lists.map((list) => (
                  <Reorder.Item key={list.id} value={list}>
                    <SmartListItem
                      list={list}
                      isActive={activeListId === list.id}
                      onSelect={() => onSelectList(list.id)}
                      onEdit={() => onEditList(list)}
                      onDelete={() => onDeleteList(list.id)}
                      onDuplicate={() => onDuplicateList(list)}
                      onPin={() => onPinList(list.id, !list.isPinned)}
                      draggable
                    />
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            ) : (
              <div className="space-y-0.5">
                {lists.map((list) => (
                  <SmartListItem
                    key={list.id}
                    list={list}
                    isActive={activeListId === list.id}
                    onSelect={() => onSelectList(list.id)}
                    onEdit={() => onEditList(list)}
                    onDelete={() => onDeleteList(list.id)}
                    onDuplicate={() => onDuplicateList(list)}
                    onPin={() => onPinList(list.id, !list.isPinned)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Smart List Item
// ============================================================================

interface SmartListItemProps {
  list: SmartListDefinition;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onPin: () => void;
  draggable?: boolean;
}

function SmartListItem({
  list,
  isActive,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onPin,
  draggable = false,
}: SmartListItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const listColors: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    pink: 'bg-pink-500',
    yellow: 'bg-yellow-500',
    cyan: 'bg-cyan-500',
  };

  return (
    <div className="relative group">
      <button
        onClick={onSelect}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-2 text-left',
          'transition-colors duration-150',
          isActive
            ? 'bg-accent-600/20 text-white border-l-2 border-accent-500'
            : 'text-neutral-300 hover:bg-neutral-800/50 hover:text-white border-l-2 border-transparent'
        )}
      >
        {draggable && (
          <GripIcon className="w-3 h-3 text-neutral-600 opacity-0 group-hover:opacity-100 cursor-grab" />
        )}

        {/* Color indicator */}
        <div
          className={cn(
            'w-2 h-2 rounded-full flex-shrink-0',
            list.color ? listColors[list.color] || 'bg-neutral-500' : 'bg-neutral-500'
          )}
        />

        {/* Icon & Name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {list.icon && <span className="text-sm">{list.icon}</span>}
            <span className="text-sm font-medium truncate">{list.name}</span>
          </div>
        </div>

        {/* Count badge */}
        {list.count !== undefined && (
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-neutral-700 text-neutral-300 rounded">
            {list.count}
          </span>
        )}

        {/* Pinned indicator */}
        {list.isPinned && (
          <PinFilledIcon className="w-3 h-3 text-accent-400" />
        )}
      </button>

      {/* Menu button */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white"
        >
          <MoreIcon className="w-4 h-4" />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              className="absolute right-0 top-full mt-1 z-50 w-40 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl overflow-hidden"
            >
              <button
                onClick={() => {
                  onEdit();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700 hover:text-white"
              >
                <EditIcon className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => {
                  onDuplicate();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700 hover:text-white"
              >
                <DuplicateIcon className="w-4 h-4" />
                Duplicate
              </button>
              <button
                onClick={() => {
                  onPin();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700 hover:text-white"
              >
                <PinIcon className="w-4 h-4" />
                {list.isPinned ? 'Unpin' : 'Pin'}
              </button>
              {!list.isSystem && (
                <>
                  <div className="border-t border-neutral-700 my-1" />
                  <button
                    onClick={() => {
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-600/10"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================================
// Filter Builder
// ============================================================================

export interface FilterBuilderProps {
  fields: FilterField[];
  filters: FilterGroup[];
  onChange: (filters: FilterGroup[]) => void;
  className?: string;
}

export function FilterBuilder({
  fields,
  filters,
  onChange,
  className,
}: FilterBuilderProps) {
  const addGroup = useCallback(() => {
    onChange([
      ...filters,
      {
        id: `group-${Date.now()}`,
        logic: 'and',
        conditions: [],
      },
    ]);
  }, [filters, onChange]);

  const updateGroup = useCallback((groupId: string, updates: Partial<FilterGroup>) => {
    onChange(
      filters.map((g) => (g.id === groupId ? { ...g, ...updates } : g))
    );
  }, [filters, onChange]);

  const removeGroup = useCallback((groupId: string) => {
    onChange(filters.filter((g) => g.id !== groupId));
  }, [filters, onChange]);

  const addCondition = useCallback((groupId: string) => {
    onChange(
      filters.map((g) =>
        g.id === groupId
          ? {
              ...g,
              conditions: [
                ...g.conditions,
                {
                  id: `condition-${Date.now()}`,
                  fieldId: fields[0]?.id || '',
                  operator: 'equals',
                  value: '',
                },
              ],
            }
          : g
      )
    );
  }, [filters, fields, onChange]);

  const updateCondition = useCallback(
    (groupId: string, conditionId: string, updates: Partial<FilterCondition>) => {
      onChange(
        filters.map((g) =>
          g.id === groupId
            ? {
                ...g,
                conditions: g.conditions.map((c) =>
                  c.id === conditionId ? { ...c, ...updates } : c
                ),
              }
            : g
        )
      );
    },
    [filters, onChange]
  );

  const removeCondition = useCallback((groupId: string, conditionId: string) => {
    onChange(
      filters.map((g) =>
        g.id === groupId
          ? { ...g, conditions: g.conditions.filter((c) => c.id !== conditionId) }
          : g
      )
    );
  }, [filters, onChange]);

  return (
    <div className={cn('space-y-4', className)}>
      {filters.length === 0 ? (
        <div className="text-center py-8">
          <FilterIcon className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <p className="text-sm text-neutral-400 mb-3">No filters applied</p>
          <button
            onClick={addGroup}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent-600 text-white rounded-lg hover:bg-accent-500 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add Filter Group
          </button>
        </div>
      ) : (
        <>
          {filters.map((group, groupIndex) => (
            <div key={group.id}>
              {groupIndex > 0 && (
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-neutral-700" />
                  <span className="text-xs font-medium text-neutral-500 uppercase">
                    OR
                  </span>
                  <div className="flex-1 h-px bg-neutral-700" />
                </div>
              )}

              <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
                {/* Group Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-neutral-400">
                      Match
                    </span>
                    <select
                      value={group.logic}
                      onChange={(e) =>
                        updateGroup(group.id, { logic: e.target.value as 'and' | 'or' })
                      }
                      className="px-2 py-1 text-xs bg-neutral-700 border border-neutral-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-accent-500"
                    >
                      <option value="and">ALL</option>
                      <option value="or">ANY</option>
                    </select>
                    <span className="text-xs font-medium text-neutral-400">
                      of these conditions
                    </span>
                  </div>
                  <button
                    onClick={() => removeGroup(group.id)}
                    className="p-1 rounded hover:bg-neutral-700 text-neutral-500 hover:text-red-400"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Conditions */}
                <div className="space-y-2">
                  {group.conditions.map((condition, condIndex) => (
                    <FilterConditionRow
                      key={condition.id}
                      condition={condition}
                      fields={fields}
                      isFirst={condIndex === 0}
                      logic={group.logic}
                      onChange={(updates) =>
                        updateCondition(group.id, condition.id, updates)
                      }
                      onRemove={() => removeCondition(group.id, condition.id)}
                    />
                  ))}
                </div>

                {/* Add Condition */}
                <button
                  onClick={() => addCondition(group.id)}
                  className="mt-3 flex items-center gap-1.5 text-xs text-accent-400 hover:text-accent-300"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  Add condition
                </button>
              </div>
            </div>
          ))}

          {/* Add Group Button */}
          <button
            onClick={addGroup}
            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white"
          >
            <PlusIcon className="w-4 h-4" />
            Add filter group (OR)
          </button>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Filter Condition Row
// ============================================================================

interface FilterConditionRowProps {
  condition: FilterCondition;
  fields: FilterField[];
  isFirst: boolean;
  logic: 'and' | 'or';
  onChange: (updates: Partial<FilterCondition>) => void;
  onRemove: () => void;
}

function FilterConditionRow({
  condition,
  fields,
  isFirst,
  logic,
  onChange,
  onRemove,
}: FilterConditionRowProps) {
  const field = fields.find((f) => f.id === condition.fieldId);
  const operators = getOperatorsForFieldType(field?.type || 'text');

  return (
    <div className="flex items-center gap-2">
      {/* Logic indicator */}
      {!isFirst && (
        <span className="w-10 text-xs text-neutral-500 uppercase text-center">
          {logic}
        </span>
      )}
      {isFirst && <span className="w-10" />}

      {/* Field selector */}
      <select
        value={condition.fieldId}
        onChange={(e) => onChange({ fieldId: e.target.value })}
        className="flex-1 px-3 py-2 text-sm bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-500/50"
      >
        {fields.map((f) => (
          <option key={f.id} value={f.id}>
            {f.label}
          </option>
        ))}
      </select>

      {/* Operator selector */}
      <select
        value={condition.operator}
        onChange={(e) => onChange({ operator: e.target.value as FilterOperator })}
        className="w-40 px-3 py-2 text-sm bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-500/50"
      >
        {operators.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>

      {/* Value input */}
      {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
        <FilterValueInput
          field={field}
          operator={condition.operator}
          value={condition.value}
          value2={condition.value2}
          onChange={(value, value2) => onChange({ value, value2 })}
        />
      )}

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="p-2 rounded-lg hover:bg-neutral-700 text-neutral-500 hover:text-red-400"
      >
        <CloseIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

// ============================================================================
// Filter Value Input
// ============================================================================

interface FilterValueInputProps {
  field?: FilterField;
  operator: FilterOperator;
  value: unknown;
  value2?: unknown;
  onChange: (value: unknown, value2?: unknown) => void;
}

function FilterValueInput({
  field,
  operator,
  value,
  value2,
  onChange,
}: FilterValueInputProps) {
  const isBetween = operator === 'between';
  const isMulti = ['in', 'not_in'].includes(operator);
  const isRelativeDate = ['within_last', 'within_next'].includes(operator);

  if (field?.type === 'select' || field?.type === 'multi_select') {
    return (
      <select
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-3 py-2 text-sm bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-500/50"
      >
        <option value="">Select...</option>
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (field?.type === 'boolean') {
    return (
      <select
        value={String(value)}
        onChange={(e) => onChange(e.target.value === 'true')}
        className="flex-1 px-3 py-2 text-sm bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-500/50"
      >
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }

  if (field?.type === 'date') {
    if (isRelativeDate) {
      return (
        <div className="flex items-center gap-2 flex-1">
          <input
            type="number"
            value={value as number}
            onChange={(e) => onChange(parseInt(e.target.value))}
            placeholder="Days"
            className="w-20 px-3 py-2 text-sm bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-500/50"
          />
          <span className="text-sm text-neutral-400">days</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 flex-1">
        <input
          type="date"
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 text-sm bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-500/50"
        />
        {isBetween && (
          <>
            <span className="text-sm text-neutral-400">to</span>
            <input
              type="date"
              value={value2 as string}
              onChange={(e) => onChange(value, e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-500/50"
            />
          </>
        )}
      </div>
    );
  }

  if (field?.type === 'number') {
    return (
      <div className="flex items-center gap-2 flex-1">
        <input
          type="number"
          value={value as number}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          placeholder="Value"
          className="flex-1 px-3 py-2 text-sm bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-500/50"
        />
        {isBetween && (
          <>
            <span className="text-sm text-neutral-400">to</span>
            <input
              type="number"
              value={value2 as number}
              onChange={(e) => onChange(value, parseFloat(e.target.value))}
              placeholder="Value"
              className="flex-1 px-3 py-2 text-sm bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-500/50"
            />
          </>
        )}
      </div>
    );
  }

  // Default: text input
  return (
    <input
      type="text"
      value={value as string}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Value"
      className="flex-1 px-3 py-2 text-sm bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50"
    />
  );
}

// ============================================================================
// Saved View Header
// ============================================================================

export interface SavedViewHeaderProps {
  list: SmartListDefinition;
  onEdit: () => void;
  onSave: () => void;
  onExport?: () => void;
  hasChanges?: boolean;
  className?: string;
}

export function SavedViewHeader({
  list,
  onEdit,
  onSave,
  onExport,
  hasChanges = false,
  className,
}: SavedViewHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between py-4', className)}>
      <div className="flex items-center gap-3">
        {list.icon && <span className="text-2xl">{list.icon}</span>}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-white">{list.name}</h1>
            {list.count !== undefined && (
              <span className="px-2 py-0.5 text-sm bg-neutral-700 text-neutral-300 rounded">
                {list.count} {list.count === 1 ? 'result' : 'results'}
              </span>
            )}
            {hasChanges && (
              <span className="px-2 py-0.5 text-xs bg-yellow-900/50 text-yellow-400 rounded">
                Unsaved changes
              </span>
            )}
          </div>
          {list.description && (
            <p className="text-sm text-neutral-400 mt-0.5">{list.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-300 bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 hover:text-white transition-colors"
        >
          <FilterIcon className="w-4 h-4" />
          Edit Filters
        </button>
        {hasChanges && (
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-accent-600 rounded-lg hover:bg-accent-500 transition-colors"
          >
            <SaveIcon className="w-4 h-4" />
            Save
          </button>
        )}
        {onExport && (
          <button
            onClick={onExport}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            title="Export"
          >
            <ExportIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getOperatorsForFieldType(type: FilterFieldType) {
  const baseOperators = [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ];

  const textOperators = [
    ...baseOperators,
    { value: 'contains', label: 'contains' },
    { value: 'not_contains', label: 'does not contain' },
    { value: 'starts_with', label: 'starts with' },
    { value: 'ends_with', label: 'ends with' },
  ];

  const numberOperators = [
    ...baseOperators,
    { value: 'greater_than', label: 'greater than' },
    { value: 'less_than', label: 'less than' },
    { value: 'greater_than_or_equal', label: 'at least' },
    { value: 'less_than_or_equal', label: 'at most' },
    { value: 'between', label: 'between' },
  ];

  const dateOperators = [
    ...baseOperators,
    { value: 'before', label: 'before' },
    { value: 'after', label: 'after' },
    { value: 'between', label: 'between' },
    { value: 'within_last', label: 'within last' },
    { value: 'within_next', label: 'within next' },
  ];

  const selectOperators = [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
    { value: 'in', label: 'is any of' },
    { value: 'not_in', label: 'is none of' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ];

  switch (type) {
    case 'text':
      return textOperators;
    case 'number':
      return numberOperators;
    case 'date':
      return dateOperators;
    case 'select':
    case 'multi_select':
      return selectOperators;
    case 'boolean':
      return baseOperators.slice(0, 2);
    default:
      return baseOperators;
  }
}

// ============================================================================
// Icons
// ============================================================================

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function GripIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function PinFilledIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function DuplicateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );
}

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  );
}

function ExportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

export default SmartListsSidebar;
