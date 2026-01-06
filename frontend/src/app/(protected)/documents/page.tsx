'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  PageHeader, 
  PageContent 
} from '@/components/layout/AppShell';
import { 
  Button,
  Card,
  StatusBadge,
  Input,
  Select,
  Modal,
  ModalFooter,
  Checkbox,
  Tooltip,
} from '@/components/ui';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentIcon,
  DocumentTextIcon,
  DocumentChartBarIcon,
  FolderIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  TagIcon,
  CalendarIcon,
  UserIcon,
  LinkIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import documentsService, { 
  Document, 
  DocumentType, 
  DocumentCategory, 
  DocumentStatus,
  DocumentFilter,
  DocumentStats,
  CreateDocumentDto,
} from '@/services/documents.service';

type StatusVariant = 'success' | 'info' | 'warning' | 'error' | 'default';

const documentTypeConfig: Record<DocumentType, { label: string; icon: any; color: string }> = {
  ima: { label: 'IMA', icon: DocumentTextIcon, color: 'text-blue-600' },
  ips: { label: 'IPS', icon: DocumentTextIcon, color: 'text-purple-600' },
  financial_plan: { label: 'Financial Plan', icon: DocumentChartBarIcon, color: 'text-green-600' },
  account_statement: { label: 'Statement', icon: DocumentIcon, color: 'text-gray-600' },
  tax_document: { label: 'Tax Document', icon: DocumentIcon, color: 'text-amber-600' },
  estate_document: { label: 'Estate', icon: DocumentIcon, color: 'text-indigo-600' },
  trust_document: { label: 'Trust', icon: DocumentIcon, color: 'text-violet-600' },
  compliance: { label: 'Compliance', icon: DocumentIcon, color: 'text-red-600' },
  correspondence: { label: 'Correspondence', icon: DocumentIcon, color: 'text-cyan-600' },
  contract: { label: 'Contract', icon: DocumentTextIcon, color: 'text-orange-600' },
  identity: { label: 'Identity', icon: DocumentIcon, color: 'text-pink-600' },
  performance_report: { label: 'Performance', icon: DocumentChartBarIcon, color: 'text-emerald-600' },
  invoice: { label: 'Invoice', icon: DocumentIcon, color: 'text-teal-600' },
  other: { label: 'Other', icon: DocumentIcon, color: 'text-gray-500' },
};

const categoryConfig: Record<DocumentCategory, { label: string }> = {
  client_agreement: { label: 'Client Agreement' },
  regulatory: { label: 'Regulatory' },
  financial: { label: 'Financial' },
  legal: { label: 'Legal' },
  correspondence: { label: 'Correspondence' },
  internal: { label: 'Internal' },
  marketing: { label: 'Marketing' },
  compliance: { label: 'Compliance' },
};

const statusConfig: Record<DocumentStatus, { label: string; variant: StatusVariant }> = {
  active: { label: 'Active', variant: 'success' },
  superseded: { label: 'Superseded', variant: 'warning' },
  archived: { label: 'Archived', variant: 'default' },
  pending_review: { label: 'Pending Review', variant: 'info' },
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<DocumentFilter>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState<Document | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [dragActive, setDragActive] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadMetadata, setUploadMetadata] = useState<Partial<CreateDocumentDto>>({
    documentType: 'other',
    category: 'client_agreement',
    isConfidential: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docsData, statsData] = await Promise.all([
        documentsService.getAll({ ...filter, search: searchQuery }),
        documentsService.getStats(),
      ]);
      setDocuments(docsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter, searchQuery]);

  const filteredDocuments = useMemo(() => {
    if (activeCategory === 'all') return documents;
    return documents.filter(d => d.category === activeCategory);
  }, [documents, activeCategory]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadFile(e.dataTransfer.files[0]);
      setShowUploadModal(true);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      setShowUploadModal(true);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    
    try {
      await documentsService.upload(uploadFile, {
        title: uploadMetadata.title || uploadFile.name,
        documentType: uploadMetadata.documentType as DocumentType,
        category: uploadMetadata.category as DocumentCategory,
        householdId: uploadMetadata.householdId,
        isConfidential: uploadMetadata.isConfidential,
        tags: uploadMetadata.tags,
      });
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadMetadata({
        documentType: 'other',
        category: 'client_agreement',
        isConfidential: true,
      });
      fetchData();
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const blob = await documentsService.download(doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      a.click();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleBulkDownload = async () => {
    try {
      const blob = await documentsService.bulkDownload(Array.from(selectedIds));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documents-${new Date().toISOString().split('T')[0]}.zip`;
      a.click();
    } catch (error) {
      console.error('Bulk download failed:', error);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredDocuments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDocuments.map(d => d.id)));
    }
  };

  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  return (
    <>
      <PageHeader
        title="Documents"
        subtitle={stats ? `${stats.total} documents • ${documentsService.formatFileSize(stats.totalStorageUsed)} used` : undefined}
        actions={
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary"
              leftIcon={<ArrowUpTrayIcon className="w-4 h-4" />}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              Upload
            </Button>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
            />
          </div>
        }
      />

      <PageContent>
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">Total Documents</p>
              <p className="text-2xl font-semibold text-content-primary mt-1">{stats.total}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">Active</p>
              <p className="text-2xl font-semibold text-status-success-text mt-1">{stats.byStatus.active}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">Pending Signatures</p>
              <p className="text-2xl font-semibold text-status-warning-text mt-1">{stats.pendingSignatures}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">Expiring</p>
              <p className="text-2xl font-semibold text-status-error-text mt-1">{stats.expiringDocuments}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">Recent Uploads</p>
              <p className="text-2xl font-semibold text-accent-primary mt-1">{stats.recentUploads}</p>
            </Card>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex overflow-x-auto space-x-1 bg-surface-secondary rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-surface-primary text-content-primary shadow-sm'
                : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            All Documents
          </button>
          {Object.entries(categoryConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeCategory === key
                  ? 'bg-surface-primary text-content-primary shadow-sm'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-tertiary" />
            <Input
              placeholder="Search documents by name, type, or household..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={filter.documentType || ''}
              onChange={(val) => setFilter({ ...filter, documentType: val as DocumentType || undefined })}
              options={[
                { value: '', label: 'All Types' },
                ...Object.entries(documentTypeConfig).map(([key, config]) => ({
                  value: key,
                  label: config.label,
                })),
              ]}
            />
            <Select
              value={filter.status || ''}
              onChange={(val) => setFilter({ ...filter, status: val as DocumentStatus || undefined })}
              options={[
                { value: '', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'superseded', label: 'Superseded' },
                { value: 'archived', label: 'Archived' },
                { value: 'pending_review', label: 'Pending Review' },
              ]}
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-4 mb-4 p-3 bg-accent-50 rounded-lg border border-accent-200">
            <span className="text-sm font-medium text-accent-700">
              {selectedIds.size} document{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={handleBulkDownload}>
                <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                Download
              </Button>
              <Button size="sm" variant="secondary">
                <ShareIcon className="w-4 h-4 mr-1" />
                Share
              </Button>
              <Button size="sm" variant="secondary">
                <FolderIcon className="w-4 h-4 mr-1" />
                Move
              </Button>
            </div>
            <button 
              className="ml-auto text-sm text-accent-600 hover:text-accent-800"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear selection
            </button>
          </div>
        )}

        {/* Drop Zone / Document List */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative ${dragActive ? 'ring-2 ring-accent-500 ring-offset-2' : ''}`}
        >
          {/* Drag Overlay */}
          <AnimatePresence>
            {dragActive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-accent-500/10 border-2 border-dashed border-accent-500 rounded-lg z-10 flex items-center justify-center"
              >
                <div className="text-center">
                  <ArrowUpTrayIcon className="w-12 h-12 text-accent-600 mx-auto mb-2" />
                  <p className="text-lg font-medium text-accent-700">Drop files to upload</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Card>
            {/* Header Row */}
            <div className="flex items-center px-4 py-3 border-b border-border bg-surface-secondary text-xs font-medium text-content-secondary uppercase tracking-wider">
              <div className="w-8">
                <Checkbox
                  checked={selectedIds.size === filteredDocuments.length && filteredDocuments.length > 0}
                  onChange={handleSelectAll}
                />
              </div>
              <div className="flex-1 min-w-0">Document</div>
              <div className="w-32 hidden md:block">Type</div>
              <div className="w-32 hidden lg:block">Household</div>
              <div className="w-24 hidden md:block">Status</div>
              <div className="w-24 hidden lg:block">Size</div>
              <div className="w-28 hidden xl:block">Date</div>
              <div className="w-24">Actions</div>
            </div>

            {/* Document Rows */}
            <div className="divide-y divide-border">
              {loading ? (
                <div className="p-8 text-center text-content-secondary">Loading documents...</div>
              ) : filteredDocuments.length === 0 ? (
                <div className="p-12 text-center">
                  <FolderIcon className="w-16 h-16 mx-auto mb-4 text-content-tertiary" />
                  <p className="font-medium text-content-primary">No documents found</p>
                  <p className="text-sm text-content-secondary mt-1 mb-4">
                    {searchQuery ? 'Try adjusting your search or filters' : 'Upload your first document to get started'}
                  </p>
                  <Button
                    leftIcon={<ArrowUpTrayIcon className="w-4 h-4" />}
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    Upload Document
                  </Button>
                </div>
              ) : (
                filteredDocuments.map((doc) => {
                  const TypeIcon = documentTypeConfig[doc.documentType]?.icon || DocumentIcon;
                  const typeColor = documentTypeConfig[doc.documentType]?.color || 'text-gray-500';
                  
                  return (
                    <div 
                      key={doc.id}
                      className="flex items-center px-4 py-3 hover:bg-surface-secondary transition-colors"
                    >
                      <div className="w-8" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(doc.id)}
                          onChange={() => handleSelect(doc.id)}
                        />
                      </div>
                      
                      {/* Document Info */}
                      <div className="flex-1 min-w-0 flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-surface-secondary ${typeColor}`}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setShowPreviewModal(doc)}
                              className="font-medium text-content-primary hover:text-accent-primary truncate text-left"
                            >
                              {doc.title}
                            </button>
                            {doc.isConfidential && (
                              <Tooltip content="Confidential">
                                <LockClosedIcon className="w-4 h-4 text-status-warning-text" />
                              </Tooltip>
                            )}
                            {doc.version > 1 && (
                              <span className="px-1.5 py-0.5 text-2xs font-medium bg-surface-tertiary text-content-secondary rounded">
                                v{doc.version}
                              </span>
                            )}
                            {doc.requiresSignature && doc.signatureStatus === 'pending' && (
                              <Tooltip content="Signature Required">
                                <PencilIcon className="w-4 h-4 text-status-warning-text" />
                              </Tooltip>
                            )}
                            {doc.signatureStatus === 'signed' && (
                              <Tooltip content={`Signed by ${doc.signedBy} on ${formatDate(doc.signedDate)}`}>
                                <CheckCircleIcon className="w-4 h-4 text-status-success-text" />
                              </Tooltip>
                            )}
                          </div>
                          <div className="text-sm text-content-secondary truncate">
                            {doc.fileName}
                          </div>
                        </div>
                      </div>

                      {/* Type */}
                      <div className="w-32 hidden md:block">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface-secondary ${typeColor}`}>
                          {documentTypeConfig[doc.documentType]?.label || doc.documentType}
                        </span>
                      </div>

                      {/* Household */}
                      <div className="w-32 hidden lg:block">
                        {doc.householdName ? (
                          <span className="text-sm text-content-primary truncate">{doc.householdName}</span>
                        ) : (
                          <span className="text-sm text-content-tertiary">Firm</span>
                        )}
                      </div>

                      {/* Status */}
                      <div className="w-24 hidden md:block">
                        <StatusBadge
                          status={
                            doc.status === 'superseded' ? 'warning' : 
                            doc.status === 'pending_review' ? 'pending' : 
                            doc.status === 'archived' ? 'default' :
                            doc.status
                          }
                          label={statusConfig[doc.status].label}
                        />
                      </div>

                      {/* Size */}
                      <div className="w-24 hidden lg:block">
                        <span className="text-sm text-content-secondary">
                          {documentsService.formatFileSize(doc.fileSize)}
                        </span>
                      </div>

                      {/* Date */}
                      <div className="w-28 hidden xl:block">
                        <span className="text-sm text-content-secondary">
                          {formatDate(doc.documentDate || doc.createdAt)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="w-24 flex items-center gap-1">
                        <Tooltip content="Preview">
                          <button
                            onClick={() => setShowPreviewModal(doc)}
                            className="p-1.5 rounded hover:bg-surface-tertiary text-content-secondary hover:text-content-primary transition-colors"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                        </Tooltip>
                        <Tooltip content="Download">
                          <button
                            onClick={() => handleDownload(doc)}
                            className="p-1.5 rounded hover:bg-surface-tertiary text-content-secondary hover:text-content-primary transition-colors"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                          </button>
                        </Tooltip>
                        <Tooltip content="Share">
                          <button
                            className="p-1.5 rounded hover:bg-surface-tertiary text-content-secondary hover:text-content-primary transition-colors"
                          >
                            <ShareIcon className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </PageContent>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setUploadFile(null);
        }}
        title="Upload Document"
        size="lg"
      >
        <div className="space-y-4">
          {uploadFile && (
            <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg">
              <DocumentIcon className="w-8 h-8 text-accent-600" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-content-primary truncate">{uploadFile.name}</p>
                <p className="text-sm text-content-secondary">{documentsService.formatFileSize(uploadFile.size)}</p>
              </div>
              <button
                onClick={() => setUploadFile(null)}
                className="p-1 rounded hover:bg-surface-tertiary"
              >
                <XMarkIcon className="w-5 h-5 text-content-tertiary" />
              </button>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Document Title</label>
            <Input
              placeholder={uploadFile?.name || 'Enter document title'}
              value={uploadMetadata.title || ''}
              onChange={(e) => setUploadMetadata({ ...uploadMetadata, title: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Document Type</label>
              <Select
                value={uploadMetadata.documentType || 'other'}
                onChange={(val) => setUploadMetadata({ ...uploadMetadata, documentType: val as DocumentType })}
                options={Object.entries(documentTypeConfig).map(([key, config]) => ({
                  value: key,
                  label: config.label,
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-1">Category</label>
              <Select
                value={uploadMetadata.category || 'client_agreement'}
                onChange={(val) => setUploadMetadata({ ...uploadMetadata, category: val as DocumentCategory })}
                options={Object.entries(categoryConfig).map(([key, config]) => ({
                  value: key,
                  label: config.label,
                }))}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">Associate with Household</label>
            <Select
              value={uploadMetadata.householdId || ''}
              onChange={(val) => setUploadMetadata({ ...uploadMetadata, householdId: val || undefined })}
              options={[
                { value: '', label: 'Firm-level document (no household)' },
                { value: 'h1', label: 'Anderson Family' },
                { value: 'h2', label: 'Chen Family Trust' },
                { value: 'h3', label: 'Williams Household' },
              ]}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="confidential"
                checked={uploadMetadata.isConfidential}
                onChange={(e) => setUploadMetadata({ ...uploadMetadata, isConfidential: e.target.checked })}
              />
              <label htmlFor="confidential" className="text-sm text-content-secondary">
                Mark as confidential
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="requiresSignature"
                checked={uploadMetadata.requiresSignature}
                onChange={(e) => setUploadMetadata({ ...uploadMetadata, requiresSignature: e.target.checked })}
              />
              <label htmlFor="requiresSignature" className="text-sm text-content-secondary">
                Requires signature
              </label>
            </div>
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => {
            setShowUploadModal(false);
            setUploadFile(null);
          }}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!uploadFile}>
            Upload Document
          </Button>
        </ModalFooter>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={!!showPreviewModal}
        onClose={() => setShowPreviewModal(null)}
        title={showPreviewModal?.title || 'Document Preview'}
        size="xl"
      >
        {showPreviewModal && (
          <div className="space-y-4">
            {/* Document Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-surface-secondary rounded-lg">
              <div>
                <p className="text-xs text-content-tertiary uppercase tracking-wider">Type</p>
                <p className="text-sm font-medium text-content-primary">
                  {documentTypeConfig[showPreviewModal.documentType]?.label}
                </p>
              </div>
              <div>
                <p className="text-xs text-content-tertiary uppercase tracking-wider">Category</p>
                <p className="text-sm font-medium text-content-primary">
                  {categoryConfig[showPreviewModal.category]?.label}
                </p>
              </div>
              <div>
                <p className="text-xs text-content-tertiary uppercase tracking-wider">File Size</p>
                <p className="text-sm font-medium text-content-primary">
                  {documentsService.formatFileSize(showPreviewModal.fileSize)}
                </p>
              </div>
              <div>
                <p className="text-xs text-content-tertiary uppercase tracking-wider">Uploaded</p>
                <p className="text-sm font-medium text-content-primary">
                  {formatDate(showPreviewModal.createdAt)} by {showPreviewModal.uploadedByName}
                </p>
              </div>
              {showPreviewModal.householdName && (
                <div>
                  <p className="text-xs text-content-tertiary uppercase tracking-wider">Household</p>
                  <p className="text-sm font-medium text-content-primary">{showPreviewModal.householdName}</p>
                </div>
              )}
              {showPreviewModal.expirationDate && (
                <div>
                  <p className="text-xs text-content-tertiary uppercase tracking-wider">Expires</p>
                  <p className="text-sm font-medium text-content-primary">
                    {formatDate(showPreviewModal.expirationDate)}
                  </p>
                </div>
              )}
            </div>

            {/* Tags */}
            {showPreviewModal.tags && showPreviewModal.tags.length > 0 && (
              <div>
                <p className="text-xs text-content-tertiary uppercase tracking-wider mb-2">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {showPreviewModal.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-surface-tertiary text-content-secondary text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {showPreviewModal.description && (
              <div>
                <p className="text-xs text-content-tertiary uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm text-content-primary">{showPreviewModal.description}</p>
              </div>
            )}

            {/* Version History */}
            {showPreviewModal.version > 1 && (
              <div>
                <p className="text-xs text-content-tertiary uppercase tracking-wider mb-2">Version Info</p>
                <div className="p-3 bg-surface-secondary rounded-lg">
                  <p className="text-sm text-content-primary">Version {showPreviewModal.version}</p>
                  {showPreviewModal.supersessionReason && (
                    <p className="text-sm text-content-secondary mt-1">
                      Reason: {showPreviewModal.supersessionReason}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Preview placeholder */}
            <div className="h-96 bg-surface-secondary rounded-lg flex items-center justify-center border border-border">
              <div className="text-center">
                <DocumentIcon className="w-16 h-16 mx-auto mb-4 text-content-tertiary" />
                <p className="text-content-secondary">Preview not available</p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-4"
                  onClick={() => handleDownload(showPreviewModal)}
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  Download to View
                </Button>
              </div>
            </div>
          </div>
        )}
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowPreviewModal(null)}>Close</Button>
          {showPreviewModal && (
            <>
              <Button variant="secondary" onClick={() => handleDownload(showPreviewModal)}>
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button>
                <ShareIcon className="w-4 h-4 mr-2" />
                Share
              </Button>
            </>
          )}
        </ModalFooter>
      </Modal>
    </>
  );
}
