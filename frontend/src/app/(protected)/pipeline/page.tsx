'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { pipelineService, Prospect, PipelineStage, PipelineStats, CreateProspectDto, ChangeStageDto, MarkLostDto } from '@/services/pipeline.service';

const stageConfig: Record<PipelineStage, { label: string; color: string; bgColor: string }> = {
  lead: { label: 'Lead', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  qualified: { label: 'Qualified', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  meeting_scheduled: { label: 'Meeting Scheduled', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  proposal_sent: { label: 'Proposal Sent', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  negotiation: { label: 'Negotiation', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  won: { label: 'Won', color: 'text-green-700', bgColor: 'bg-green-100' },
  lost: { label: 'Lost', color: 'text-red-700', bgColor: 'bg-red-100' },
};

const stages: PipelineStage[] = ['lead', 'qualified', 'meeting_scheduled', 'proposal_sent', 'negotiation', 'won', 'lost'];
const activeStages: PipelineStage[] = ['lead', 'qualified', 'meeting_scheduled', 'proposal_sent', 'negotiation'];

const formatCurrency = (value?: number) => {
  if (!value) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

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
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [showLostModal, setShowLostModal] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prospectsData, statsData] = await Promise.all([
        pipelineService.getAll(),
        pipelineService.getStats(),
      ]);
      setProspects(prospectsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch pipeline data:', error);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen bg-gray-50">
      <Header title="Pipeline" />
      
      <div className="p-6 lg:p-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-sm text-gray-500">Total Pipeline</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalPipeline)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-sm text-gray-500">Weighted Pipeline</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.weightedPipeline)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-sm text-gray-500">Avg Deal Size</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageDealSize)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-sm text-gray-500">Active Prospects</p>
              <p className="text-2xl font-bold text-purple-600">
                {prospects.filter(p => !['won', 'lost'].includes(p.stage)).length}
              </p>
            </div>
          </div>
        )}

        {/* View Toggle and Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🗂️ Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 List
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + Add Prospect
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : viewMode === 'kanban' ? (
          /* Kanban View */
          <div className="flex gap-4 overflow-x-auto pb-4">
            {activeStages.map((stage) => (
              <div key={stage} className="flex-shrink-0 w-72">
                <div className={`rounded-t-lg p-3 ${stageConfig[stage].bgColor}`}>
                  <div className="flex justify-between items-center">
                    <h3 className={`font-semibold ${stageConfig[stage].color}`}>
                      {stageConfig[stage].label}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {getProspectsByStage(stage).length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(getStageValue(stage))}
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-b-lg min-h-[400px] p-2 space-y-2">
                  {getProspectsByStage(stage).map((prospect) => (
                    <div
                      key={prospect.id}
                      onClick={() => setSelectedProspect(prospect)}
                      className="bg-white rounded-lg shadow-sm border p-3 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="font-medium text-gray-900">
                        {prospect.firstName} {prospect.lastName}
                      </div>
                      {prospect.company && (
                        <div className="text-sm text-gray-500">{prospect.company}</div>
                      )}
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-sm font-medium text-green-600">
                          {formatCurrency(prospect.expectedRevenue)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {prospect.probabilityPercent}%
                        </span>
                      </div>
                      {prospect.nextFollowUpDate && (
                        <div className={`text-xs mt-2 ${
                          new Date(prospect.nextFollowUpDate) < new Date() 
                            ? 'text-red-600' 
                            : 'text-gray-500'
                        }`}>
                          📅 Follow up: {formatDate(prospect.nextFollowUpDate)}
                        </div>
                      )}
                      <div className="mt-2 flex gap-1">
                        {stages.indexOf(stage) > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStageChange(prospect.id, stages[stages.indexOf(stage) - 1]);
                            }}
                            className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                          >
                            ← Back
                          </button>
                        )}
                        {stages.indexOf(stage) < activeStages.length - 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStageChange(prospect.id, stages[stages.indexOf(stage) + 1]);
                            }}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Next →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-xl shadow-sm border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Probability</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Follow Up</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {prospects.map((prospect) => (
                  <tr key={prospect.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {prospect.firstName} {prospect.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{prospect.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {prospect.company || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${stageConfig[prospect.stage].bgColor} ${stageConfig[prospect.stage].color}`}>
                        {stageConfig[prospect.stage].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(prospect.expectedRevenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {prospect.probabilityPercent}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(prospect.nextFollowUpDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedProspect(prospect)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        View
                      </button>
                      {!['won', 'lost'].includes(prospect.stage) && (
                        <button
                          onClick={() => setShowLostModal(prospect.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Mark Lost
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Prospect Modal */}
      {showCreateModal && (
        <CreateProspectModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchData();
          }}
        />
      )}

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
    </div>
  );
}

function CreateProspectModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [formData, setFormData] = useState<CreateProspectDto>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    leadSource: 'referral',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await pipelineService.create(formData);
      onCreated();
    } catch (error) {
      console.error('Failed to create prospect:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Add New Prospect</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full rounded-lg border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full rounded-lg border-gray-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-lg border-gray-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                type="text"
                value={formData.company || ''}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full rounded-lg border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lead Source</label>
              <select
                value={formData.leadSource}
                onChange={(e) => setFormData({ ...formData, leadSource: e.target.value as any })}
                className="w-full rounded-lg border-gray-300"
              >
                <option value="referral">Referral</option>
                <option value="website">Website</option>
                <option value="event">Event</option>
                <option value="cold_outreach">Cold Outreach</option>
                <option value="linkedin">LinkedIn</option>
                <option value="existing_client">Existing Client</option>
                <option value="center_of_influence">Center of Influence</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Revenue</label>
              <input
                type="number"
                value={formData.expectedRevenue || ''}
                onChange={(e) => setFormData({ ...formData, expectedRevenue: parseFloat(e.target.value) || undefined })}
                className="w-full rounded-lg border-gray-300"
                placeholder="$"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated AUM</label>
              <input
                type="number"
                value={formData.estimatedAum || ''}
                onChange={(e) => setFormData({ ...formData, estimatedAum: parseFloat(e.target.value) || undefined })}
                className="w-full rounded-lg border-gray-300"
                placeholder="$"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full rounded-lg border-gray-300"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Prospect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProspectDetailModal({ prospect, onClose, onUpdate }: { prospect: Prospect; onClose: () => void; onUpdate: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{prospect.firstName} {prospect.lastName}</h2>
              <p className="text-sm text-gray-500">{prospect.company}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Contact Info</h3>
              <p className="mt-1">{prospect.email || 'No email'}</p>
              <p>{prospect.phone || 'No phone'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Stage</h3>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${stageConfig[prospect.stage].bgColor} ${stageConfig[prospect.stage].color}`}>
                {stageConfig[prospect.stage].label}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Expected Revenue</h3>
              <p className="mt-1 text-lg font-semibold text-green-600">{formatCurrency(prospect.expectedRevenue)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Estimated AUM</h3>
              <p className="mt-1 text-lg">{formatCurrency(prospect.estimatedAum)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Probability</h3>
              <p className="mt-1 text-lg">{prospect.probabilityPercent}%</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Lead Source</h3>
              <p className="mt-1 capitalize">{prospect.leadSource.replace('_', ' ')}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Next Follow Up</h3>
              <p className="mt-1">{formatDate(prospect.nextFollowUpDate)}</p>
            </div>
          </div>

          {prospect.notes && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Notes</h3>
              <p className="mt-1 text-gray-700">{prospect.notes}</p>
            </div>
          )}

          {prospect.tags && prospect.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Tags</h3>
              <div className="mt-1 flex gap-2">
                {prospect.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-sm">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            Close
          </button>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-red-600">Mark as Lost</h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <select
              value={formData.lostReason}
              onChange={(e) => setFormData({ ...formData, lostReason: e.target.value as any })}
              className="w-full rounded-lg border-gray-300"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Lost to Competitor</label>
              <input
                type="text"
                value={formData.lostToCompetitor || ''}
                onChange={(e) => setFormData({ ...formData, lostToCompetitor: e.target.value })}
                className="w-full rounded-lg border-gray-300"
                placeholder="Competitor name"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.lostNotes || ''}
              onChange={(e) => setFormData({ ...formData, lostNotes: e.target.value })}
              rows={3}
              className="w-full rounded-lg border-gray-300"
              placeholder="Additional details..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={() => onConfirm(prospectId, formData)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Mark as Lost
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
