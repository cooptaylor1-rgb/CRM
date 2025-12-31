'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Plus, Search, MoreVertical, Mail, Phone, Crown,
  Shield, UserCheck, Settings, ChevronDown, X, Check
} from 'lucide-react';
import collaborationService, { 
  HouseholdTeam, 
  TeamRole 
} from '@/services/collaboration.service';

const roleConfig: Record<TeamRole, { label: string; color: string; icon: React.ReactNode }> = {
  primary_advisor: { 
    label: 'Primary Advisor', 
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    icon: <Crown className="w-3.5 h-3.5" />
  },
  secondary_advisor: { 
    label: 'Secondary Advisor', 
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    icon: <UserCheck className="w-3.5 h-3.5" />
  },
  service_team: { 
    label: 'Service Team', 
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    icon: <Users className="w-3.5 h-3.5" />
  },
  specialist: { 
    label: 'Specialist', 
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    icon: <Shield className="w-3.5 h-3.5" />
  },
  support: { 
    label: 'Support', 
    color: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    icon: <Settings className="w-3.5 h-3.5" />
  },
};

interface TeamMemberCardProps {
  member: HouseholdTeam;
  onEdit: () => void;
  onRemove: () => void;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member, onEdit, onRemove }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const config = roleConfig[member.role];

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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 transition-all duration-200"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          {member.user?.avatar ? (
            <img 
              src={member.user.avatar} 
              alt={`${member.user.firstName} ${member.user.lastName}`}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {member.user?.firstName?.[0]}{member.user?.lastName?.[0]}
            </div>
          )}
          {member.isPrimary && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
              <Crown className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {member.user?.firstName} {member.user?.lastName}
            </h3>
          </div>
          <p className="text-sm text-gray-500 truncate">
            {member.user?.email}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${config.color}`}>
              {config.icon}
              {config.label}
            </span>
          </div>
        </div>

        {/* Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-10"
              >
                <button
                  onClick={() => { onEdit(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Settings className="w-4 h-4" />
                  Edit Role
                </button>
                <button
                  onClick={() => { onRemove(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <X className="w-4 h-4" />
                  Remove
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Responsibilities */}
      {member.responsibilities && (
        <p className="mt-3 text-sm text-gray-500 line-clamp-2">
          {member.responsibilities}
        </p>
      )}

      {/* Permissions */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        <span className={`text-xs ${member.canEdit ? 'text-emerald-600' : 'text-gray-400'}`}>
          {member.canEdit ? '✓' : '✗'} Edit
        </span>
        <span className={`text-xs ${member.canDelete ? 'text-emerald-600' : 'text-gray-400'}`}>
          {member.canDelete ? '✓' : '✗'} Delete
        </span>
        <span className={`text-xs ${member.canShare ? 'text-emerald-600' : 'text-gray-400'}`}>
          {member.canShare ? '✓' : '✗'} Share
        </span>
      </div>
    </motion.div>
  );
};

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: any) => void;
  householdId: string;
}

const AddTeamMemberModal: React.FC<AddTeamMemberModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  householdId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [role, setRole] = useState<TeamRole>('service_team');
  const [isPrimary, setIsPrimary] = useState(false);
  const [permissions, setPermissions] = useState({
    canEdit: true,
    canDelete: false,
    canShare: true,
  });
  const [responsibilities, setResponsibilities] = useState('');

  const handleSubmit = () => {
    if (!selectedUser) return;
    onAdd({
      userId: selectedUser.id,
      role,
      isPrimary,
      ...permissions,
      responsibilities,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Add Team Member
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* User Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Team Member
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(roleConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setRole(key as TeamRole)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                    role === key
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  {config.icon}
                  <span className="text-sm font-medium">{config.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Permissions
            </label>
            <div className="space-y-2">
              {[
                { key: 'canEdit', label: 'Can edit household data' },
                { key: 'canDelete', label: 'Can delete records' },
                { key: 'canShare', label: 'Can share with others' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions[key as keyof typeof permissions]}
                    onChange={(e) => setPermissions(p => ({ ...p, [key]: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Primary Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Set as primary team member
            </span>
          </label>

          {/* Responsibilities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Responsibilities (optional)
            </label>
            <textarea
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
              placeholder="Describe specific responsibilities..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
          >
            Add Member
          </button>
        </div>
      </motion.div>
    </div>
  );
};

interface TeamManagementProps {
  householdId: string;
  householdName?: string;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ 
  householdId, 
  householdName = 'Household' 
}) => {
  const [teamMembers, setTeamMembers] = useState<HouseholdTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterRole, setFilterRole] = useState<TeamRole | 'all'>('all');

  useEffect(() => {
    loadTeamMembers();
  }, [householdId]);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      const data = await collaborationService.getTeamMembers(householdId);
      setTeamMembers(data);
    } catch (error) {
      console.error('Failed to load team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (data: any) => {
    try {
      await collaborationService.addTeamMember(householdId, data);
      await loadTeamMembers();
    } catch (error) {
      console.error('Failed to add team member:', error);
    }
  };

  const handleRemoveMember = async (teamId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    try {
      await collaborationService.removeTeamMember(teamId);
      await loadTeamMembers();
    } catch (error) {
      console.error('Failed to remove team member:', error);
    }
  };

  const filteredMembers = filterRole === 'all' 
    ? teamMembers 
    : teamMembers.filter(m => m.role === filterRole);

  // Group by role
  const primaryAdvisors = filteredMembers.filter(m => m.role === 'primary_advisor');
  const secondaryAdvisors = filteredMembers.filter(m => m.role === 'secondary_advisor');
  const serviceTeam = filteredMembers.filter(m => m.role === 'service_team');
  const specialists = filteredMembers.filter(m => m.role === 'specialist');
  const support = filteredMembers.filter(m => m.role === 'support');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Team Members
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {teamMembers.length} members assigned to {householdName}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Member
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilterRole('all')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filterRole === 'all'
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
          }`}
        >
          All ({teamMembers.length})
        </button>
        {Object.entries(roleConfig).map(([key, config]) => {
          const count = teamMembers.filter(m => m.role === key).length;
          return (
            <button
              key={key}
              onClick={() => setFilterRole(key as TeamRole)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filterRole === key
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              {config.icon}
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Team Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl h-40" />
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No team members assigned</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Add your first team member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredMembers.map(member => (
              <TeamMemberCard
                key={member.id}
                member={member}
                onEdit={() => {/* TODO */}}
                onRemove={() => handleRemoveMember(member.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddTeamMemberModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddMember}
            householdId={householdId}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamManagement;
