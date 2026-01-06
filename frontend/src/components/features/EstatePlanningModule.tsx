'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, FileText, Heart, Shield, Building, DollarSign, Calendar,
  ChevronRight, ChevronDown, Plus, Edit2, Trash2, Eye, Download,
  AlertCircle, CheckCircle, Clock, Mail, Phone, MapPin, Link2,
  User, UserPlus, Home, Briefcase, Scale, Crown, GitBranch
} from 'lucide-react';

// Types
interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  relationship: 'self' | 'spouse' | 'child' | 'grandchild' | 'parent' | 'sibling' | 'other';
  dateOfBirth: Date;
  dateOfDeath?: Date;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  spouseId?: string;
  parentIds?: string[];
  photoUrl?: string;
}

interface Beneficiary {
  id: string;
  memberId: string;
  memberName: string;
  accountId: string;
  accountName: string;
  beneficiaryType: 'primary' | 'contingent';
  percentage: number;
  relationship: string;
  perStirpes: boolean;
  lastVerified: Date;
  needsUpdate: boolean;
}

interface EstateDocument {
  id: string;
  name: string;
  type: 'will' | 'trust' | 'poa_financial' | 'poa_healthcare' | 'living_will' | 'insurance' | 'deed' | 'other';
  status: 'current' | 'needs_review' | 'expired' | 'draft';
  dateExecuted?: Date;
  expirationDate?: Date;
  attorney?: string;
  location: string;
  notes?: string;
  linkedMembers: string[];
}

interface InheritanceFlow {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  assetDescription: string;
  estimatedValue: number;
  conditions?: string;
  documentId?: string;
}

interface TrustInfo {
  id: string;
  name: string;
  type: 'revocable' | 'irrevocable' | 'charitable' | 'special_needs' | 'generation_skipping';
  grantor: string;
  trustees: string[];
  beneficiaries: string[];
  fundedAssets: number;
  creationDate: Date;
  status: 'active' | 'terminated' | 'pending';
}

// Mock Data
const mockFamilyMembers: FamilyMember[] = [
  { id: '1', firstName: 'Robert', lastName: 'Chen', relationship: 'self', dateOfBirth: new Date('1962-03-15'), email: 'robert@email.com', phone: '555-0101' },
  { id: '2', firstName: 'Sarah', lastName: 'Chen', relationship: 'spouse', dateOfBirth: new Date('1965-07-22'), email: 'sarah@email.com', phone: '555-0102', spouseId: '1' },
  { id: '3', firstName: 'Michael', lastName: 'Chen', relationship: 'child', dateOfBirth: new Date('1990-11-08'), email: 'michael@email.com', parentIds: ['1', '2'] },
  { id: '4', firstName: 'Emily', lastName: 'Chen-Martinez', relationship: 'child', dateOfBirth: new Date('1993-04-20'), email: 'emily@email.com', parentIds: ['1', '2'] },
  { id: '5', firstName: 'David', lastName: 'Martinez', relationship: 'other', dateOfBirth: new Date('1991-09-12'), spouseId: '4' },
  { id: '6', firstName: 'Sophia', lastName: 'Chen', relationship: 'grandchild', dateOfBirth: new Date('2018-06-30'), parentIds: ['3'] },
  { id: '7', firstName: 'Oliver', lastName: 'Martinez', relationship: 'grandchild', dateOfBirth: new Date('2020-12-15'), parentIds: ['4', '5'] },
  { id: '8', firstName: 'William', lastName: 'Chen', relationship: 'parent', dateOfBirth: new Date('1935-02-10'), dateOfDeath: new Date('2020-08-15') },
];

const mockBeneficiaries: Beneficiary[] = [
  { id: '1', memberId: '2', memberName: 'Sarah Chen', accountId: 'ira-1', accountName: 'Robert Traditional IRA', beneficiaryType: 'primary', percentage: 100, relationship: 'Spouse', perStirpes: false, lastVerified: new Date('2024-06-15'), needsUpdate: false },
  { id: '2', memberId: '3', memberName: 'Michael Chen', accountId: 'ira-1', accountName: 'Robert Traditional IRA', beneficiaryType: 'contingent', percentage: 50, relationship: 'Son', perStirpes: true, lastVerified: new Date('2024-06-15'), needsUpdate: false },
  { id: '3', memberId: '4', memberName: 'Emily Chen-Martinez', accountId: 'ira-1', accountName: 'Robert Traditional IRA', beneficiaryType: 'contingent', percentage: 50, relationship: 'Daughter', perStirpes: true, lastVerified: new Date('2024-06-15'), needsUpdate: false },
  { id: '4', memberId: '1', memberName: 'Robert Chen', accountId: 'roth-1', accountName: 'Sarah Roth IRA', beneficiaryType: 'primary', percentage: 100, relationship: 'Spouse', perStirpes: false, lastVerified: new Date('2023-01-10'), needsUpdate: true },
  { id: '5', memberId: '6', memberName: 'Sophia Chen', accountId: '529-1', accountName: 'Education Fund', beneficiaryType: 'primary', percentage: 50, relationship: 'Granddaughter', perStirpes: false, lastVerified: new Date('2024-09-01'), needsUpdate: false },
  { id: '6', memberId: '7', memberName: 'Oliver Martinez', accountId: '529-1', accountName: 'Education Fund', beneficiaryType: 'primary', percentage: 50, relationship: 'Grandson', perStirpes: false, lastVerified: new Date('2024-09-01'), needsUpdate: false },
];

const mockEstateDocuments: EstateDocument[] = [
  { id: '1', name: 'Robert Chen Last Will and Testament', type: 'will', status: 'current', dateExecuted: new Date('2023-03-15'), attorney: 'Johnson & Partners LLP', location: 'Safe deposit box - First National Bank', linkedMembers: ['1'], notes: 'Updated after grandchildren born' },
  { id: '2', name: 'Sarah Chen Last Will and Testament', type: 'will', status: 'current', dateExecuted: new Date('2023-03-15'), attorney: 'Johnson & Partners LLP', location: 'Safe deposit box - First National Bank', linkedMembers: ['2'] },
  { id: '3', name: 'Chen Family Revocable Trust', type: 'trust', status: 'current', dateExecuted: new Date('2020-06-01'), attorney: 'Johnson & Partners LLP', location: 'Attorney office', linkedMembers: ['1', '2', '3', '4'] },
  { id: '4', name: 'Robert Chen Durable Power of Attorney', type: 'poa_financial', status: 'current', dateExecuted: new Date('2023-03-15'), attorney: 'Johnson & Partners LLP', location: 'Home safe', linkedMembers: ['1', '2'] },
  { id: '5', name: 'Healthcare Directive - Robert', type: 'poa_healthcare', status: 'needs_review', dateExecuted: new Date('2018-05-20'), attorney: 'Johnson & Partners LLP', location: 'Home safe', linkedMembers: ['1'], notes: 'Review - over 5 years old' },
  { id: '6', name: 'Life Insurance Policy - Robert', type: 'insurance', status: 'current', dateExecuted: new Date('2015-01-01'), location: 'Home files', linkedMembers: ['1', '2', '3', '4'] },
];

const mockTrusts: TrustInfo[] = [
  { id: '1', name: 'Chen Family Revocable Trust', type: 'revocable', grantor: 'Robert & Sarah Chen', trustees: ['Robert Chen', 'Sarah Chen'], beneficiaries: ['Michael Chen', 'Emily Chen-Martinez'], fundedAssets: 2450000, creationDate: new Date('2020-06-01'), status: 'active' },
  { id: '2', name: 'Grandchildren Education Trust', type: 'irrevocable', grantor: 'Robert Chen', trustees: ['First National Bank Trust Dept'], beneficiaries: ['Sophia Chen', 'Oliver Martinez'], fundedAssets: 500000, creationDate: new Date('2022-01-15'), status: 'active' },
];

// Utility Functions
const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const formatDate = (date: Date) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
const getAge = (dob: Date, dod?: Date) => {
  const endDate = dod || new Date();
  return Math.floor((endDate.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};

// Sub-components
const FamilyTreeNode: React.FC<{
  member: FamilyMember;
  allMembers: FamilyMember[];
  isSelected: boolean;
  onSelect: () => void;
}> = ({ member, allMembers, isSelected, onSelect }) => {
  const spouse = member.spouseId ? allMembers.find(m => m.id === member.spouseId) : null;
  const children = allMembers.filter(m => m.parentIds?.includes(member.id));
  
  const relationshipColors: Record<FamilyMember['relationship'], string> = {
    self: 'bg-blue-500',
    spouse: 'bg-pink-500',
    child: 'bg-green-500',
    grandchild: 'bg-purple-500',
    parent: 'bg-orange-500',
    sibling: 'bg-cyan-500',
    other: 'bg-gray-500'
  };
  
  return (
    <div className="flex flex-col items-center">
      <motion.div
        whileHover={{ scale: 1.05 }}
        onClick={onSelect}
        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
          isSelected ? 'border-blue-500 shadow-lg bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
        } ${member.dateOfDeath ? 'opacity-60' : ''}`}
      >
        <div className={`absolute -top-2 -right-2 w-4 h-4 rounded-full ${relationshipColors[member.relationship]}`} />
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center mb-2 mx-auto">
          <User className="w-8 h-8 text-gray-500 dark:text-gray-400" />
        </div>
        <p className="font-medium text-gray-900 dark:text-white text-center text-sm">{member.firstName}</p>
        <p className="text-xs text-gray-500 text-center">{member.lastName}</p>
        <p className="text-xs text-gray-400 text-center mt-1">
          {member.dateOfDeath ? `${getAge(member.dateOfBirth, member.dateOfDeath)}y (deceased)` : `${getAge(member.dateOfBirth)}y`}
        </p>
      </motion.div>
      
      {/* Show spouse inline */}
      {spouse && member.relationship === 'self' && (
        <div className="flex items-center gap-4 mt-2">
          <div className="w-8 h-0.5 bg-pink-400" />
          <Heart className="w-4 h-4 text-pink-500" />
          <div className="w-8 h-0.5 bg-pink-400" />
        </div>
      )}
    </div>
  );
};

const FamilyTree: React.FC<{
  members: FamilyMember[];
  selectedMemberId: string | null;
  onSelectMember: (id: string) => void;
}> = ({ members, selectedMemberId, onSelectMember }) => {
  // Organize by generation
  const self = members.find(m => m.relationship === 'self');
  const spouse = members.find(m => m.relationship === 'spouse');
  const parents = members.filter(m => m.relationship === 'parent');
  const children = members.filter(m => m.relationship === 'child');
  const grandchildren = members.filter(m => m.relationship === 'grandchild');
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 overflow-x-auto">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <GitBranch className="w-5 h-5" /> Family Tree
      </h3>
      
      <div className="min-w-[600px] space-y-8">
        {/* Parents Generation */}
        {parents.length > 0 && (
          <div className="flex justify-center gap-8">
            {parents.map(parent => (
              <FamilyTreeNode
                key={parent.id}
                member={parent}
                allMembers={members}
                isSelected={selectedMemberId === parent.id}
                onSelect={() => onSelectMember(parent.id)}
              />
            ))}
          </div>
        )}
        
        {parents.length > 0 && (self || spouse) && (
          <div className="flex justify-center">
            <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600" />
          </div>
        )}
        
        {/* Self & Spouse */}
        {(self || spouse) && (
          <div className="flex justify-center items-center gap-4">
            {self && (
              <FamilyTreeNode
                member={self}
                allMembers={members}
                isSelected={selectedMemberId === self.id}
                onSelect={() => onSelectMember(self.id)}
              />
            )}
            {self && spouse && (
              <>
                <div className="w-8 h-0.5 bg-pink-400" />
                <Heart className="w-5 h-5 text-pink-500" />
                <div className="w-8 h-0.5 bg-pink-400" />
              </>
            )}
            {spouse && (
              <FamilyTreeNode
                member={spouse}
                allMembers={members}
                isSelected={selectedMemberId === spouse.id}
                onSelect={() => onSelectMember(spouse.id)}
              />
            )}
          </div>
        )}
        
        {/* Children */}
        {children.length > 0 && (
          <>
            <div className="flex justify-center">
              <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600" />
            </div>
            <div className="flex justify-center gap-8">
              {children.map(child => (
                <FamilyTreeNode
                  key={child.id}
                  member={child}
                  allMembers={members}
                  isSelected={selectedMemberId === child.id}
                  onSelect={() => onSelectMember(child.id)}
                />
              ))}
            </div>
          </>
        )}
        
        {/* Grandchildren */}
        {grandchildren.length > 0 && (
          <>
            <div className="flex justify-center">
              <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600" />
            </div>
            <div className="flex justify-center gap-8">
              {grandchildren.map(gc => (
                <FamilyTreeNode
                  key={gc.id}
                  member={gc}
                  allMembers={members}
                  isSelected={selectedMemberId === gc.id}
                  onSelect={() => onSelectMember(gc.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        {[
          { label: 'Self', color: 'bg-blue-500' },
          { label: 'Spouse', color: 'bg-pink-500' },
          { label: 'Children', color: 'bg-green-500' },
          { label: 'Grandchildren', color: 'bg-purple-500' },
          { label: 'Parents', color: 'bg-orange-500' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${item.color}`} />
            <span className="text-xs text-gray-500">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const BeneficiaryManager: React.FC<{ beneficiaries: Beneficiary[] }> = ({ beneficiaries }) => {
  const [groupBy, setGroupBy] = useState<'account' | 'member'>('account');
  
  const needsUpdateCount = beneficiaries.filter(b => b.needsUpdate).length;
  
  const groupedBeneficiaries = useMemo(() => {
    if (groupBy === 'account') {
      return beneficiaries.reduce((acc, b) => {
        if (!acc[b.accountName]) acc[b.accountName] = [];
        acc[b.accountName].push(b);
        return acc;
      }, {} as Record<string, Beneficiary[]>);
    } else {
      return beneficiaries.reduce((acc, b) => {
        if (!acc[b.memberName]) acc[b.memberName] = [];
        acc[b.memberName].push(b);
        return acc;
      }, {} as Record<string, Beneficiary[]>);
    }
  }, [beneficiaries, groupBy]);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-900 dark:text-white">Beneficiary Designations</span>
          {needsUpdateCount > 0 && (
            <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded-full">
              {needsUpdateCount} need review
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700"
          >
            <option value="account">Group by Account</option>
            <option value="member">Group by Person</option>
          </select>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Object.entries(groupedBeneficiaries).map(([group, items]) => (
          <div key={group} className="p-4">
            <p className="font-medium text-gray-900 dark:text-white mb-3">{group}</p>
            <div className="space-y-2">
              {items.map(b => (
                <div
                  key={b.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    b.needsUpdate ? 'bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800' : 'bg-gray-50 dark:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      b.beneficiaryType === 'primary' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {b.beneficiaryType === 'primary' ? <Crown className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {groupBy === 'account' ? b.memberName : b.accountName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {b.beneficiaryType} • {b.relationship} • {b.percentage}%
                        {b.perStirpes && ' (per stirpes)'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {b.needsUpdate && (
                      <span className="flex items-center gap-1 text-yellow-600 text-xs">
                        <AlertCircle className="w-3 h-3" /> Review
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      Verified: {formatDate(b.lastVerified)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DocumentVault: React.FC<{ documents: EstateDocument[] }> = ({ documents }) => {
  const [filter, setFilter] = useState<EstateDocument['type'] | 'all'>('all');
  
  const filteredDocs = filter === 'all' ? documents : documents.filter(d => d.type === filter);
  
  const typeLabels: Record<EstateDocument['type'], string> = {
    will: 'Will',
    trust: 'Trust',
    poa_financial: 'POA (Financial)',
    poa_healthcare: 'POA (Healthcare)',
    living_will: 'Living Will',
    insurance: 'Insurance',
    deed: 'Deed',
    other: 'Other'
  };
  
  const statusColors = {
    current: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    needs_review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  };
  
  const needsReviewCount = documents.filter(d => d.status === 'needs_review' || d.status === 'expired').length;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-gray-900 dark:text-white">Estate Documents</span>
          {needsReviewCount > 0 && (
            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">
              {needsReviewCount} need attention
            </span>
          )}
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
          <Plus className="w-4 h-4" /> Add Document
        </button>
      </div>
      
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          {['all', 'will', 'trust', 'poa_financial', 'poa_healthcare', 'insurance'].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type as typeof filter)}
              className={`px-3 py-1.5 rounded-full text-sm ${
                filter === type
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              {type === 'all' ? 'All' : typeLabels[type as EstateDocument['type']]}
            </button>
          ))}
        </div>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
        {filteredDocs.map(doc => (
          <div key={doc.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{typeLabels[doc.type]}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${statusColors[doc.status]}`}>
                      {doc.status.replace('_', ' ')}
                    </span>
                  </div>
                  {doc.dateExecuted && (
                    <p className="text-xs text-gray-500 mt-1">
                      Executed: {formatDate(doc.dateExecuted)}
                      {doc.attorney && ` • ${doc.attorney}`}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {doc.location}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <Eye className="w-4 h-4 text-gray-400" />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <Download className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TrustOverview: React.FC<{ trusts: TrustInfo[] }> = ({ trusts }) => {
  const totalFunded = trusts.reduce((sum, t) => sum + t.fundedAssets, 0);
  
  const typeColors = {
    revocable: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    irrevocable: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    charitable: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    special_needs: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    generation_skipping: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-gray-900 dark:text-white">Trust Structures</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Total Funded</p>
            <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(totalFunded)}</p>
          </div>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {trusts.map(trust => (
          <div key={trust.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{trust.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${typeColors[trust.type]}`}>
                    {trust.type.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    trust.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {trust.status}
                  </span>
                </div>
              </div>
              <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(trust.fundedAssets)}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-500 mb-1">Grantor</p>
                <p className="text-gray-900 dark:text-white">{trust.grantor}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Created</p>
                <p className="text-gray-900 dark:text-white">{formatDate(trust.creationDate)}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Trustees</p>
                <p className="text-gray-900 dark:text-white">{trust.trustees.join(', ')}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Beneficiaries</p>
                <p className="text-gray-900 dark:text-white">{trust.beneficiaries.join(', ')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Component
export const EstatePlanningModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'family' | 'beneficiaries' | 'documents' | 'trusts'>('family');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  
  const selectedMember = selectedMemberId ? mockFamilyMembers.find(m => m.id === selectedMemberId) : null;
  
  const tabs = [
    { id: 'family', label: 'Family Tree', icon: GitBranch },
    { id: 'beneficiaries', label: 'Beneficiaries', icon: Users },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'trusts', label: 'Trusts', icon: Shield },
  ];
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            Estate Planning
          </h1>
          <p className="text-gray-500 mt-1">Family tree, beneficiaries, and estate documents</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
            <Download className="w-4 h-4" /> Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
            <Plus className="w-4 h-4" /> Add Family Member
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'family' && (
          <motion.div
            key="family"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-3 gap-6"
          >
            <div className="col-span-2">
              <FamilyTree
                members={mockFamilyMembers}
                selectedMemberId={selectedMemberId}
                onSelectMember={setSelectedMemberId}
              />
            </div>
            <div>
              {selectedMember ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Member Details</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {selectedMember.firstName} {selectedMember.lastName}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">{selectedMember.relationship}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {formatDate(selectedMember.dateOfBirth)} ({getAge(selectedMember.dateOfBirth)} years)
                        </span>
                      </div>
                      {selectedMember.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">{selectedMember.email}</span>
                        </div>
                      )}
                      {selectedMember.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">{selectedMember.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 mb-2">Linked Documents</p>
                      {mockEstateDocuments.filter(d => d.linkedMembers.includes(selectedMember.id)).map(doc => (
                        <div key={doc.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-1">
                          <FileText className="w-4 h-4 text-purple-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{doc.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select a family member to view details</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
        
        {activeTab === 'beneficiaries' && (
          <motion.div key="beneficiaries" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <BeneficiaryManager beneficiaries={mockBeneficiaries} />
          </motion.div>
        )}
        
        {activeTab === 'documents' && (
          <motion.div key="documents" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <DocumentVault documents={mockEstateDocuments} />
          </motion.div>
        )}
        
        {activeTab === 'trusts' && (
          <motion.div key="trusts" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <TrustOverview trusts={mockTrusts} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EstatePlanningModule;
