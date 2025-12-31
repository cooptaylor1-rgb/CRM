'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, Phone, Mail, Calendar, FileText, CheckCircle,
  UserPlus, Tag, Star, Pin, Clock, MoreVertical, ChevronDown,
  Filter, Search, User, Activity
} from 'lucide-react';
import collaborationService, { 
  ActivityFeed as ActivityFeedType, 
  ActivityType 
} from '@/services/collaboration.service';
import { formatDistanceToNow } from 'date-fns';

const activityIcons: Record<ActivityType, React.ReactNode> = {
  note: <MessageCircle className="w-4 h-4" />,
  call: <Phone className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  meeting: <Calendar className="w-4 h-4" />,
  task_completed: <CheckCircle className="w-4 h-4" />,
  document_added: <FileText className="w-4 h-4" />,
  status_change: <Tag className="w-4 h-4" />,
  assignment_change: <UserPlus className="w-4 h-4" />,
  milestone: <Star className="w-4 h-4" />,
  system: <Activity className="w-4 h-4" />,
};

const activityColors: Record<ActivityType, string> = {
  note: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  call: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  email: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  meeting: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  task_completed: 'bg-green-500/10 text-green-600 border-green-500/20',
  document_added: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  status_change: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  assignment_change: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  milestone: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  system: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

interface ActivityItemProps {
  activity: ActivityFeedType;
  onToggleImportant: () => void;
  onTogglePinned: () => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ 
  activity, 
  onToggleImportant, 
  onTogglePinned 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const colorClass = activityColors[activity.activityType];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`
        group relative flex gap-4 p-4 rounded-xl transition-colors
        ${activity.isPinned ? 'bg-amber-50 dark:bg-amber-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}
      `}
    >
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorClass}`}>
          {activityIcons[activity.activityType]}
        </div>
        <div className="flex-1 w-px bg-gray-200 dark:bg-gray-700 mt-2" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {activity.title}
              </h4>
              {activity.isImportant && (
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              )}
              {activity.isPinned && (
                <Pin className="w-4 h-4 text-amber-600" />
              )}
            </div>
            
            {activity.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {activity.description}
              </p>
            )}

            {/* User & Time */}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              {activity.user && (
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {activity.user.firstName} {activity.user.lastName}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-10"
                >
                  <button
                    onClick={() => { onToggleImportant(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Star className={`w-4 h-4 ${activity.isImportant ? 'text-amber-500 fill-amber-500' : ''}`} />
                    {activity.isImportant ? 'Unmark important' : 'Mark important'}
                  </button>
                  <button
                    onClick={() => { onTogglePinned(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Pin className={`w-4 h-4 ${activity.isPinned ? 'text-amber-600' : ''}`} />
                    {activity.isPinned ? 'Unpin' : 'Pin to top'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface ActivityFeedProps {
  householdId?: string;
  entityType?: string;
  entityId?: string;
  showFilters?: boolean;
  maxItems?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  householdId,
  entityType,
  entityId,
  showFilters = true,
  maxItems,
}) => {
  const [activities, setActivities] = useState<ActivityFeedType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<ActivityType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  useEffect(() => {
    loadActivities();
  }, [householdId, entityType, entityId, filterType]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await collaborationService.getActivityFeed({
        householdId,
        entityType,
        entityId,
        activityType: filterType === 'all' ? undefined : filterType,
        limit: maxItems,
      });
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleImportant = async (activityId: string) => {
    try {
      await collaborationService.toggleActivityImportant(activityId);
      setActivities(prev => 
        prev.map(a => a.id === activityId ? { ...a, isImportant: !a.isImportant } : a)
      );
    } catch (error) {
      console.error('Failed to toggle important:', error);
    }
  };

  const handleTogglePinned = async (activityId: string) => {
    try {
      await collaborationService.toggleActivityPinned(activityId);
      await loadActivities();
    } catch (error) {
      console.error('Failed to toggle pinned:', error);
    }
  };

  // Sort: pinned first, then by date
  const sortedActivities = [...activities].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Filter by search
  const filteredActivities = searchQuery
    ? sortedActivities.filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sortedActivities;

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activities..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <button
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Filter className="w-4 h-4" />
              <span className="capitalize">
                {filterType === 'all' ? 'All types' : filterType.replace('_', ' ')}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showTypeDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-20"
                >
                  <button
                    onClick={() => { setFilterType('all'); setShowTypeDropdown(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      filterType === 'all' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    All types
                  </button>
                  {Object.keys(activityIcons).map((type) => (
                    <button
                      key={type}
                      onClick={() => { setFilterType(type as ActivityType); setShowTypeDropdown(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 capitalize ${
                        filterType === type ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {activityIcons[type as ActivityType]}
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Activity List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No activities found</p>
        </div>
      ) : (
        <div className="relative">
          <AnimatePresence>
            {filteredActivities.map((activity) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                onToggleImportant={() => handleToggleImportant(activity.id)}
                onTogglePinned={() => handleTogglePinned(activity.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
