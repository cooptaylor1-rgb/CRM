'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { meetingsService, Meeting, MeetingStats, MeetingType, CreateMeetingDto } from '@/services/meetings.service';

const meetingTypeLabels: Record<MeetingType, string> = {
  initial_consultation: 'Initial Consultation',
  quarterly_review: 'Quarterly Review',
  annual_review: 'Annual Review',
  financial_planning: 'Financial Planning',
  tax_planning: 'Tax Planning',
  estate_planning: 'Estate Planning',
  insurance_review: 'Insurance Review',
  portfolio_review: 'Portfolio Review',
  retirement_planning: 'Retirement Planning',
  education_planning: 'Education Planning',
  business_planning: 'Business Planning',
  other: 'Other',
};

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-600',
  no_show: 'bg-orange-100 text-orange-800',
};

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const formatFullDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const isSameDay = (date1: Date, date2: Date) => {
  return date1.toDateString() === date2.toDateString();
};

const isToday = (dateString: string) => {
  return isSameDay(new Date(dateString), new Date());
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [stats, setStats] = useState<MeetingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'upcoming' | 'week' | 'all'>('upcoming');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  useEffect(() => {
    fetchData();
  }, [viewMode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let meetingsData: Meeting[];
      
      switch (viewMode) {
        case 'upcoming':
          meetingsData = await meetingsService.getUpcoming(7);
          break;
        case 'week':
          meetingsData = await meetingsService.getUpcoming(7);
          break;
        default:
          meetingsData = await meetingsService.getAll();
      }
      
      setMeetings(meetingsData);
      const statsData = await meetingsService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (meetingId: string) => {
    try {
      await meetingsService.complete(meetingId, {
        outcome: 'Meeting completed successfully',
        createFollowUpTask: false,
      });
      fetchData();
    } catch (error) {
      console.error('Failed to complete meeting:', error);
    }
  };

  const handleCancel = async (meetingId: string) => {
    try {
      await meetingsService.cancel(meetingId);
      fetchData();
    } catch (error) {
      console.error('Failed to cancel meeting:', error);
    }
  };

  // Group meetings by date
  const groupedMeetings = meetings.reduce((groups, meeting) => {
    const date = new Date(meeting.startTime).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(meeting);
    return groups;
  }, {} as Record<string, Meeting[]>);

  const sortedDates = Object.keys(groupedMeetings).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Meetings" />
      
      <div className="p-6 lg:p-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalThisMonth}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completedThisMonth}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-sm text-gray-500">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">{stats.cancelledThisMonth}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <p className="text-sm text-gray-500">Avg Duration</p>
              <p className="text-2xl font-bold text-blue-600">{stats.averageDuration} min</p>
            </div>
          </div>
        )}

        {/* View Toggle and Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {(['upcoming', 'week', 'all'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === mode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {mode === 'upcoming' ? 'Upcoming' : mode === 'week' ? 'This Week' : 'All Meetings'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + Schedule Meeting
          </button>
        </div>

        {/* Today's Meetings Highlight */}
        {meetings.some(m => isToday(m.startTime)) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">📅 Today&apos;s Meetings</h2>
            <div className="space-y-2">
              {meetings.filter(m => isToday(m.startTime)).map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="text-lg">
                      {meeting.isVirtual ? '💻' : '🏢'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{meeting.title}</p>
                      <p className="text-sm text-gray-500">
                        {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                        {meeting.location && ` • ${meeting.location}`}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[meeting.status]}`}>
                    {meeting.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meetings List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : meetings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <span className="text-4xl">📅</span>
            <p className="mt-2 text-gray-600">No meetings scheduled</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Schedule your first meeting
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((dateStr) => (
              <div key={dateStr}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  {formatFullDate(dateStr)}
                  {isToday(dateStr) && <span className="ml-2 text-blue-600">(Today)</span>}
                </h3>
                <div className="bg-white rounded-xl shadow-sm border divide-y divide-gray-100">
                  {groupedMeetings[dateStr].map((meeting) => (
                    <div
                      key={meeting.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedMeeting(meeting)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center bg-gray-100 rounded-lg px-3 py-2 min-w-[70px]">
                            <span className="text-sm font-semibold text-gray-900">
                              {formatTime(meeting.startTime)}
                            </span>
                            <span className="text-xs text-gray-500">{meeting.duration} min</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{meeting.isVirtual ? '💻' : '🏢'}</span>
                              <h4 className="font-medium text-gray-900">{meeting.title}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[meeting.status]}`}>
                                {meeting.status.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {meetingTypeLabels[meeting.type]}
                              {meeting.location && ` • ${meeting.location}`}
                            </p>
                            {meeting.description && (
                              <p className="text-sm text-gray-400 mt-1 line-clamp-1">{meeting.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {meeting.status === 'scheduled' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleComplete(meeting.id);
                                }}
                                className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                              >
                                Complete
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancel(meeting.id);
                                }}
                                className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {meeting.virtualMeetingUrl && (
                            <a
                              href={meeting.virtualMeetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                            >
                              Join
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Meeting Modal */}
      {showCreateModal && (
        <CreateMeetingModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchData();
          }}
        />
      )}

      {/* Meeting Detail Modal */}
      {selectedMeeting && (
        <MeetingDetailModal
          meeting={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
          onUpdate={fetchData}
        />
      )}
    </div>
  );
}

function CreateMeetingModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [formData, setFormData] = useState<CreateMeetingDto>({
    title: '',
    type: 'other',
    startTime: '',
    endTime: '',
    isVirtual: false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await meetingsService.create(formData);
      onCreated();
    } catch (error) {
      console.error('Failed to create meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTimeChange = (value: string) => {
    setFormData({ ...formData, startTime: value });
    // Auto-set end time to 1 hour after start
    if (value) {
      const startDate = new Date(value);
      startDate.setHours(startDate.getHours() + 1);
      const endTime = startDate.toISOString().slice(0, 16);
      setFormData((prev) => ({ ...prev, startTime: value, endTime }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Schedule Meeting</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border-gray-300"
              placeholder="Meeting title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as MeetingType })}
              className="w-full rounded-lg border-gray-300"
            >
              {Object.entries(meetingTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
              <input
                type="datetime-local"
                required
                value={formData.startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full rounded-lg border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
              <input
                type="datetime-local"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full rounded-lg border-gray-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isVirtual}
                onChange={(e) => setFormData({ ...formData, isVirtual: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Virtual Meeting</span>
            </label>
          </div>

          {formData.isVirtual ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting URL</label>
              <input
                type="url"
                value={formData.virtualMeetingUrl || ''}
                onChange={(e) => setFormData({ ...formData, virtualMeetingUrl: e.target.value })}
                className="w-full rounded-lg border-gray-300"
                placeholder="https://zoom.us/..."
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full rounded-lg border-gray-300"
                placeholder="Office, Conference Room, etc."
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agenda</label>
            <textarea
              value={formData.agenda || ''}
              onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
              rows={3}
              className="w-full rounded-lg border-gray-300"
              placeholder="Meeting agenda items..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Creating...' : 'Schedule Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MeetingDetailModal({ meeting, onClose, onUpdate }: { meeting: Meeting; onClose: () => void; onUpdate: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{meeting.isVirtual ? '💻' : '🏢'}</span>
              <div>
                <h2 className="text-xl font-semibold">{meeting.title}</h2>
                <p className="text-sm text-gray-500">{meetingTypeLabels[meeting.type]}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[meeting.status]}`}>
              {meeting.status.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
              <p className="mt-1">{formatFullDate(meeting.startTime)}</p>
              <p className="text-gray-600">{formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}</p>
              <p className="text-sm text-gray-500">{meeting.duration} minutes</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Location</h3>
              {meeting.isVirtual ? (
                <>
                  <p className="mt-1">Virtual Meeting</p>
                  {meeting.virtualMeetingUrl && (
                    <a
                      href={meeting.virtualMeetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Join Meeting →
                    </a>
                  )}
                </>
              ) : (
                <p className="mt-1">{meeting.location || 'No location specified'}</p>
              )}
            </div>
          </div>

          {meeting.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1 text-gray-700">{meeting.description}</p>
            </div>
          )}

          {meeting.agenda && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Agenda</h3>
              <p className="mt-1 text-gray-700 whitespace-pre-wrap">{meeting.agenda}</p>
            </div>
          )}

          {meeting.prepNotes && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Prep Notes</h3>
              <p className="mt-1 text-gray-700">{meeting.prepNotes}</p>
            </div>
          )}

          {meeting.outcome && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-700">Outcome</h3>
              <p className="mt-1 text-green-900">{meeting.outcome}</p>
              {meeting.nextSteps && (
                <>
                  <h4 className="text-sm font-medium text-green-700 mt-3">Next Steps</h4>
                  <p className="text-green-900">{meeting.nextSteps}</p>
                </>
              )}
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
