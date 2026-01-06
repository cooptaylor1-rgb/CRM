'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  PageHeader, 
  PageContent 
} from '@/components/layout/AppShell';
import { 
  Button,
  Card,
  StatusBadge,
  formatCurrency,
  SkeletonPipeline,
  ErrorState,
  DataFreshness,
  EmptyState,
} from '@/components/ui';
import { PlusIcon, ViewColumnsIcon, ListBulletIcon, CalendarIcon, UserPlusIcon } from '@heroicons/react/20/solid';
import { pipelineService, Prospect, PipelineStage, PipelineStats, CreateProspectDto, MarkLostDto } from '@/services/pipeline.service';
import { AddProspectModal } from '@/components/modals';

type StatusVariant = 'success' | 'info' | 'warning' | 'error' | 'default';

const stageConfig: Record<PipelineStage, { label: string; variant: StatusVariant }> = {
  lead: { label: 'Lead', variant: 'default' },
  qualified: { label: 'Qualified', variant: 'info' },
  meeting_scheduled: { label: 'Meeting Scheduled', variant: 'info' },
  proposal_sent: { label: 'Proposal Sent', variant: 'warning' },
  negotiation: { label: 'Negotiation', variant: 'warning' },
  won: { label: 'Won', variant: 'success' },
  lost: { label: 'Lost', variant: 'error' },
};

const stages: PipelineStage[] = ['lead', 'qualified', 'meeting_scheduled', 'proposal_sent', 'negotiation', 'won', 'lost'];
const activeStages: PipelineStage[] = ['lead', 'qualified', 'meeting_scheduled', 'proposal_sent', 'negotiation'];

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export default function PipelinePage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [showLostModal, setShowLostModal] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prospectsData, statsData] = await Promise.all([
        pipelineService.getAll(),
        pipelineService.getStats(),
      ]);
      setProspects(prospectsData);
      setStats(statsData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch pipeline data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pipeline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStageChange = async (prospectId: string, newStage: PipelineStage) => {
    if (newStage === 'lost') {
      setShowLostModal(prospectId);
      return;
    }
    
    try {
      await pipelineService.changeStage(prospectId, { newStage });
      fetchData();
    } catch (error) {
      console.error('Failed to change stage:', error);
    }
  };

  const handleMarkLost = async (prospectId: string, dto: MarkLostDto) => {
    try {
      await pipelineService.markLost(prospectId, dto);
      setShowLostModal(null);
      fetchData();
    } catch (error) {
      console.error('Failed to mark as lost:', error);
    }
  };

  const getProspectsByStage = (stage: PipelineStage) => {
    return prospects.filter(p => p.stage === stage);
  };

  const getStageValue = (stage: PipelineStage) => {
    return getProspectsByStage(stage).reduce((sum, p) => sum + (p.expectedRevenue || 0), 0);
  };

  return (
    <>
      <PageHeader
        title="Pipeline"
        subtitle={stats ? `${formatCurrency(stats.totalPipeline)} total • ${prospects.filter(p => !['won', 'lost'].includes(p.stage)).length} active prospects` : undefined}
        actions={
          <Button 
            leftIcon={<PlusIcon className="w-4 h-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Add Prospect
          </Button>
        }
      />

      <PageContent>
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">Total Pipeline</p>
              <p className="text-2xl font-semibold text-content-primary mt-1">{formatCurrency(stats.totalPipeline)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">Weighted Pipeline</p>
              <p className="text-2xl font-semibold text-status-info-text mt-1">{formatCurrency(stats.weightedPipeline)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">Avg Deal Size</p>
              <p className="text-2xl font-semibold text-content-primary mt-1">{formatCurrency(stats.averageDealSize)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">Active Prospects</p>
              <p className="text-2xl font-semibold text-accent-primary mt-1">
                {prospects.filter(p => !['won', 'lost'].includes(p.stage)).length}
              </p>
            </Card>
          </div>
        )}

        {/* View Toggle */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-1 bg-surface-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'kanban' ? 'bg-surface-primary text-content-primary shadow-sm' : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              <ViewColumnsIcon className="w-4 h-4" /> Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'list' ? 'bg-surface-primary text-content-primary shadow-sm' : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              <ListBulletIcon className="w-4 h-4" /> List
            </button>
          </div>

          <DataFreshness 
            lastUpdated={lastUpdated} 
            onRefresh={fetchData}
            isRefreshing={loading}
          />
        </div>

        {error ? (
          <ErrorState
            title="Couldn't load pipeline"
            message={error}
            onRetry={fetchData}
          />
        ) : loading ? (
          <SkeletonPipeline columns={5} />
        ) : prospects.length === 0 ? (
          <EmptyState
            icon={<UserPlusIcon className="w-6 h-6" />}
            title="No prospects yet"
            description="Add your first prospect to start building your pipeline."
            action={
              <Button 
                leftIcon={<PlusIcon className="w-4 h-4" />}
                onClick={() => setShowCreateModal(true)}
              >
                Add Prospect
              </Button>
            }
          />
        ) : viewMode === 'kanban' ? (
          /* Kanban View */
          <div className="flex gap-4 overflow-x-auto pb-4">
            {activeStages.map((stage) => (
              <div key={stage} className="flex-shrink-0 w-72">
                <div className="rounded-t-lg p-3 bg-surface-secondary border-t border-l border-r border-border-default">
                  <div className="flex justify-between items-center">
                    <StatusBadge 
                      status={stageConfig[stage].variant} 
                      label={stageConfig[stage].label} 
                    />
                    <span className="text-sm text-content-tertiary">
                      {getProspectsByStage(stage).length}
                    </span>
                  </div>
                  <p className="text-xs text-content-tertiary mt-1">
                    {formatCurrency(getStageValue(stage))}
                  </p>
                </div>
                
                <div className="bg-surface-secondary/50 rounded-b-lg min-h-[400px] p-2 space-y-2 border-l border-r border-b border-border-default">
                  {getProspectsByStage(stage).map((prospect) => (
                    <Card
                      key={prospect.id}
                      onClick={() => setSelectedProspect(prospect)}
                      className="p-3 cursor-pointer hover:shadow-lg transition-shadow"
                    >
                      <div className="font-medium text-content-primary">
                        {prospect.firstName} {prospect.lastName}
                      </div>
                      {prospect.company && (
                        <div className="text-sm text-content-secondary">{prospect.company}</div>
                      )}
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-sm font-medium text-status-success-text">
                          {prospect.expectedRevenue ? formatCurrency(prospect.expectedRevenue) : '-'}
                        </span>
                        <span className="text-xs text-content-tertiary">
                          {prospect.probabilityPercent}%
                        </span>
                      </div>
                      {prospect.nextFollowUpDate && (
                        <div className={`text-xs mt-2 flex items-center gap-1 ${
                          new Date(prospect.nextFollowUpDate) < new Date() 
                            ? 'text-status-error-text' 
                            : 'text-content-tertiary'
                        }`}>
                          <CalendarIcon className="w-3 h-3" /> Follow up: {formatDate(prospect.nextFollowUpDate)}
                        </div>
                      )}
                      <div className="mt-2 flex gap-1">
                        {stages.indexOf(stage) > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStageChange(prospect.id, stages[stages.indexOf(stage) - 1]);
                            }}
                          >
                            ← Back
                          </Button>
                        )}
                        {stages.indexOf(stage) < activeStages.length - 1 && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStageChange(prospect.id, stages[stages.indexOf(stage) + 1]);
                            }}
                          >
                            Next →
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <Card noPadding>
            <table className="min-w-full divide-y divide-border-default">
              <thead className="bg-surface-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-tertiary uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-tertiary uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-tertiary uppercase">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-tertiary uppercase">Expected Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-tertiary uppercase">Probability</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-tertiary uppercase">Next Follow Up</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-tertiary uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-surface-primary divide-y divide-border-default">
                {prospects.map((prospect) => (
                  <tr key={prospect.id} className="hover:bg-surface-secondary">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-content-primary">
                        {prospect.firstName} {prospect.lastName}
                      </div>
                      <div className="text-sm text-content-secondary">{prospect.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary">
                      {prospect.company || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge 
                        status={stageConfig[prospect.stage].variant} 
                        label={stageConfig[prospect.stage].label} 
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-content-primary">
                      {prospect.expectedRevenue ? formatCurrency(prospect.expectedRevenue) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary">
                      {prospect.probabilityPercent}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary">
                      {formatDate(prospect.nextFollowUpDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedProspect(prospect)}
                      >
                        View
                      </Button>
                      {!['won', 'lost'].includes(prospect.stage) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowLostModal(prospect.id)}
                          className="text-status-error-text"
                        >
                          Mark Lost
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </PageContent>

      {/* Create Prospect Modal */}
      <AddProspectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchData();
        }}
      />

      {/* Prospect Detail Modal */}
      {selectedProspect && (
        <ProspectDetailModal
          prospect={selectedProspect}
          onClose={() => setSelectedProspect(null)}
          onUpdate={fetchData}
        />
      )}

      {/* Mark Lost Modal */}
      {showLostModal && (
        <MarkLostModal
          prospectId={showLostModal}
          onClose={() => setShowLostModal(null)}
          onConfirm={handleMarkLost}
        />
      )}
    </>
  );
}

function ProspectDetailModal({ prospect, onClose, onUpdate }: { prospect: Prospect; onClose: () => void; onUpdate: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-primary rounded-xl shadow-elevated max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border-default">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-content-primary">{prospect.firstName} {prospect.lastName}</h2>
              <p className="text-sm text-content-secondary">{prospect.company}</p>
            </div>
            <button onClick={onClose} className="text-content-tertiary hover:text-content-secondary">✕</button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-content-tertiary">Contact Info</h3>
              <p className="mt-1 text-content-primary">{prospect.email || 'No email'}</p>
              <p className="text-content-secondary">{prospect.phone || 'No phone'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-content-tertiary">Stage</h3>
              <div className="mt-1">
                <StatusBadge 
                  status={stageConfig[prospect.stage].variant} 
                  label={stageConfig[prospect.stage].label} 
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-content-tertiary">Expected Revenue</h3>
              <p className="mt-1 text-lg font-semibold text-status-success-text">{prospect.expectedRevenue ? formatCurrency(prospect.expectedRevenue) : '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-content-tertiary">Estimated AUM</h3>
              <p className="mt-1 text-lg text-content-primary">{prospect.estimatedAum ? formatCurrency(prospect.estimatedAum) : '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-content-tertiary">Probability</h3>
              <p className="mt-1 text-lg text-content-primary">{prospect.probabilityPercent ?? 0}%</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-content-tertiary">Lead Source</h3>
              <p className="mt-1 capitalize text-content-primary">{prospect.leadSource.replace('_', ' ')}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-content-tertiary">Next Follow Up</h3>
              <p className="mt-1 text-content-primary">{formatDate(prospect.nextFollowUpDate)}</p>
            </div>
          </div>

          {prospect.notes && (
            <div>
              <h3 className="text-sm font-medium text-content-tertiary">Notes</h3>
              <p className="mt-1 text-content-secondary">{prospect.notes}</p>
            </div>
          )}

          {prospect.tags && prospect.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-content-tertiary">Tags</h3>
              <div className="mt-1 flex gap-2">
                {prospect.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 bg-surface-secondary rounded text-sm text-content-secondary">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border-default flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function MarkLostModal({ prospectId, onClose, onConfirm }: { prospectId: string; onClose: () => void; onConfirm: (id: string, dto: MarkLostDto) => void }) {
  const [formData, setFormData] = useState<MarkLostDto>({
    lostReason: 'other',
    lostNotes: '',
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-primary rounded-xl shadow-elevated max-w-md w-full mx-4">
        <div className="p-6 border-b border-border-default">
          <h2 className="text-xl font-semibold text-status-error-text">Mark as Lost</h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-content-primary mb-1">Reason</label>
            <select
              value={formData.lostReason}
              onChange={(e) => setFormData({ ...formData, lostReason: e.target.value as any })}
              className="w-full rounded-lg border-border-default bg-surface-primary text-content-primary"
            >
              <option value="price">Price</option>
              <option value="competitor">Competitor</option>
              <option value="timing">Timing</option>
              <option value="no_response">No Response</option>
              <option value="not_qualified">Not Qualified</option>
              <option value="service_fit">Service Fit</option>
              <option value="other">Other</option>
            </select>
          </div>

          {formData.lostReason === 'competitor' && (
            <div>
              <label className="block text-sm font-medium text-content-primary mb-1">Lost to Competitor</label>
              <input
                type="text"
                value={formData.lostToCompetitor || ''}
                onChange={(e) => setFormData({ ...formData, lostToCompetitor: e.target.value })}
                className="w-full rounded-lg border-border-default bg-surface-primary text-content-primary"
                placeholder="Competitor name"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-content-primary mb-1">Notes</label>
            <textarea
              value={formData.lostNotes || ''}
              onChange={(e) => setFormData({ ...formData, lostNotes: e.target.value })}
              rows={3}
              className="w-full rounded-lg border-border-default bg-surface-primary text-content-primary"
              placeholder="Additional details..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => onConfirm(prospectId, formData)}
              className="bg-status-error-text hover:bg-red-700"
            >
              Mark as Lost
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
