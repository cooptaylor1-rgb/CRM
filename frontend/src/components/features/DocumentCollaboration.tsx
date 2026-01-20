'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentTextIcon,
  FolderIcon,
  CloudArrowUpIcon,
  ShareIcon,
  PencilSquareIcon,
  ClockIcon,
  CheckCircleIcon,
  LockClosedIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentDuplicateIcon,
  UserGroupIcon,
  LinkIcon,
  TableCellsIcon,
  PhotoIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';

// ============================================
// Types
// ============================================

export type DocumentType = 'pdf' | 'docx' | 'xlsx' | 'image' | 'other';
export type DocumentStatus = 'draft' | 'pending_review' | 'approved' | 'signed' | 'expired';
export type SharePermission = 'view' | 'comment' | 'edit';

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  size: number;
  status: DocumentStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  folderId?: string;
  clientId?: string;
  clientName?: string;
  versions: DocumentVersion[];
  shares: DocumentShare[];
  signatureRequired?: boolean;
  signedAt?: Date;
  signedBy?: string;
}

export interface DocumentVersion {
  id: string;
  version: number;
  createdAt: Date;
  createdBy: string;
  changes: string;
  size: number;
}

export interface DocumentShare {
  id: string;
  email: string;
  name: string;
  permission: SharePermission;
  sharedAt: Date;
  expiresAt?: Date;
  accessed?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  documentCount: number;
  color: string;
}

export interface DocumentCollaborationProps {
  className?: string;
  onDocumentClick?: (doc: Document) => void;
  onUpload?: () => void;
}

// ============================================
// Constants & Mock Data
// ============================================

const TYPE_ICONS: Record<DocumentType, { icon: React.ReactNode; color: string }> = {
  pdf: { icon: <DocumentTextIcon className="w-5 h-5" />, color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  docx: { icon: <DocumentTextIcon className="w-5 h-5" />, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  xlsx: { icon: <TableCellsIcon className="w-5 h-5" />, color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
  image: { icon: <PhotoIcon className="w-5 h-5" />, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  other: { icon: <PaperClipIcon className="w-5 h-5" />, color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
};

const STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600' },
  pending_review: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700' },
  signed: { label: 'Signed', color: 'bg-blue-100 text-blue-700' },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-700' },
};

const generateMockData = (): { documents: Document[]; folders: Folder[] } => {
  const documents: Document[] = [
    {
      id: 'd1', name: 'Investment Policy Statement - Johnson Family.pdf', type: 'pdf', size: 245000, status: 'signed',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      createdBy: 'John Advisor', clientId: 'c1', clientName: 'Johnson Family', signatureRequired: true,
      signedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), signedBy: 'Robert Johnson',
      versions: [
        { id: 'v1', version: 1, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), createdBy: 'John Advisor', changes: 'Initial draft', size: 230000 },
        { id: 'v2', version: 2, createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), createdBy: 'John Advisor', changes: 'Updated risk tolerance', size: 245000 },
      ],
      shares: [
        { id: 's1', email: 'robert@johnson.com', name: 'Robert Johnson', permission: 'edit', sharedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), accessed: true },
      ],
    },
    {
      id: 'd2', name: 'Q4 2025 Portfolio Review.pdf', type: 'pdf', size: 1250000, status: 'approved',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdBy: 'Sarah Analyst', clientId: 'c2', clientName: 'Williams Trust',
      versions: [{ id: 'v3', version: 1, createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), createdBy: 'Sarah Analyst', changes: 'Initial report', size: 1250000 }],
      shares: [{ id: 's2', email: 'mike@williams.com', name: 'Michael Williams', permission: 'view', sharedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), accessed: false }],
    },
    {
      id: 'd3', name: 'Financial Planning Spreadsheet.xlsx', type: 'xlsx', size: 85000, status: 'draft',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      createdBy: 'John Advisor', versions: [], shares: [],
    },
    {
      id: 'd4', name: 'Account Transfer Form - Chen.pdf', type: 'pdf', size: 156000, status: 'pending_review',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      createdBy: 'Operations', clientId: 'c3', clientName: 'Chen Family', signatureRequired: true,
      versions: [{ id: 'v4', version: 1, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), createdBy: 'Operations', changes: 'New transfer request', size: 156000 }],
      shares: [],
    },
    {
      id: 'd5', name: 'Estate Planning Notes.docx', type: 'docx', size: 45000, status: 'draft',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      createdBy: 'John Advisor', clientId: 'c1', clientName: 'Johnson Family',
      versions: [], shares: [],
    },
  ];

  const folders: Folder[] = [
    { id: 'f1', name: 'Client Documents', documentCount: 45, color: 'bg-blue-500' },
    { id: 'f2', name: 'Templates', documentCount: 12, color: 'bg-green-500' },
    { id: 'f3', name: 'Compliance', documentCount: 8, color: 'bg-purple-500' },
    { id: 'f4', name: 'Reports', documentCount: 23, color: 'bg-amber-500' },
  ];

  return { documents, folders };
};

// ============================================
// Helper Functions
// ============================================

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatTimeAgo = (date: Date): string => {
  const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
};

// ============================================
// Sub-Components
// ============================================

const StatusBadge: React.FC<{ status: DocumentStatus }> = ({ status }) => {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

const FolderCard: React.FC<{ folder: Folder; onClick: () => void }> = ({ folder, onClick }) => (
  <button
    onClick={onClick}
    className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 hover:shadow-md transition-all text-left"
  >
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 ${folder.color} rounded-lg flex items-center justify-center`}>
        <FolderIcon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white">{folder.name}</h4>
        <p className="text-sm text-gray-500">{folder.documentCount} documents</p>
      </div>
    </div>
  </button>
);

const DocumentRow: React.FC<{ document: Document; onView: () => void; onShare: () => void }> = ({ document, onView, onShare }) => {
  const typeConfig = TYPE_ICONS[document.type];
  
  return (
    <div className="px-4 py-3 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${typeConfig.color}`}>
        {typeConfig.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="font-medium text-gray-900 dark:text-white truncate">{document.name}</h4>
          {document.signatureRequired && (
            <span className="flex items-center gap-1 text-xs text-blue-600">
              <PencilSquareIcon className="w-3 h-3" />
              {document.signedAt ? 'Signed' : 'Signature needed'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{formatFileSize(document.size)}</span>
          <span>•</span>
          <span>{formatTimeAgo(document.updatedAt)}</span>
          {document.clientName && (
            <>
              <span>•</span>
              <span>{document.clientName}</span>
            </>
          )}
        </div>
      </div>
      <StatusBadge status={document.status} />
      <div className="flex items-center gap-1">
        {document.shares.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-gray-500 mr-2">
            <UserGroupIcon className="w-4 h-4" />
            {document.shares.length}
          </span>
        )}
        <button onClick={onShare} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
          <ShareIcon className="w-4 h-4" />
        </button>
        <button onClick={onView} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <EyeIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const ShareModal: React.FC<{ isOpen: boolean; onClose: () => void; document: Document | null }> = ({ isOpen, onClose, document }) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<SharePermission>('view');

  if (!document) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <ShareIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Share Document</h2>
            </div>
            
            <p className="text-sm text-gray-500 mb-4 truncate">{document.name}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="client@email.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Permission</label>
                <select
                  value={permission}
                  onChange={e => setPermission(e.target.value as SharePermission)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="view">Can view</option>
                  <option value="comment">Can comment</option>
                  <option value="edit">Can edit</option>
                </select>
              </div>

              {document.shares.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Shared with</p>
                  <div className="space-y-2">
                    {document.shares.map(share => (
                      <div key={share.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{share.name}</p>
                          <p className="text-xs text-gray-500">{share.email}</p>
                        </div>
                        <span className="text-xs text-gray-500 capitalize">{share.permission}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Share
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================
// Main Component
// ============================================

export const DocumentCollaboration: React.FC<DocumentCollaborationProps> = ({
  className = '',
  onDocumentClick,
  onUpload,
}) => {
  const [data] = useState(() => generateMockData());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [shareDoc, setShareDoc] = useState<Document | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const filteredDocs = useMemo(() => {
    return data.documents.filter(doc => {
      if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
      if (searchQuery && !doc.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedFolder && doc.folderId !== selectedFolder) return false;
      return true;
    });
  }, [data.documents, statusFilter, searchQuery, selectedFolder]);

  const stats = useMemo(() => ({
    total: data.documents.length,
    pendingSignature: data.documents.filter(d => d.signatureRequired && !d.signedAt).length,
    shared: data.documents.filter(d => d.shares.length > 0).length,
  }), [data.documents]);

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Document Collaboration</h1>
          <p className="text-gray-500 mt-1">Manage, share, and track client documents</p>
        </div>
        <button
          onClick={onUpload}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <CloudArrowUpIcon className="w-5 h-5" />
          Upload
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <DocumentTextIcon className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Documents</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <PencilSquareIcon className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingSignature}</p>
              <p className="text-sm text-gray-500">Pending Signature</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <ShareIcon className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.shared}</p>
              <p className="text-sm text-gray-500">Shared with Clients</p>
            </div>
          </div>
        </div>
      </div>

      {/* Folders */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {data.folders.map(folder => (
          <FolderCard 
            key={folder.id} 
            folder={folder} 
            onClick={() => setSelectedFolder(selectedFolder === folder.id ? null : folder.id)} 
          />
        ))}
      </div>

      {/* Selected Folder Indicator */}
      {selectedFolder && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>Filtering by folder:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {data.folders.find(f => f.id === selectedFolder)?.name}
          </span>
          <button 
            onClick={() => setSelectedFolder(null)}
            className="text-blue-600 hover:text-blue-700"
          >
            Clear
          </button>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
        >
          <option value="all">All Status</option>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>

      {/* Document List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredDocs.map(doc => (
          <DocumentRow
            key={doc.id}
            document={doc}
            onView={() => onDocumentClick?.(doc)}
            onShare={() => setShareDoc(doc)}
          />
        ))}
        {filteredDocs.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-500">No documents found</div>
        )}
      </div>

      {/* Share Modal */}
      <ShareModal isOpen={!!shareDoc} onClose={() => setShareDoc(null)} document={shareDoc} />
    </div>
  );
};

export default DocumentCollaboration;
