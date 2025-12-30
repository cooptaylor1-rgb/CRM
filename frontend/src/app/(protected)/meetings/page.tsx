'use client';

import { useEffect, useState } from 'react';
import { 
  PageHeader, 
  PageContent 
} from '@/components/layout/AppShell';
import { 
  Button,
  Card,
  StatusBadge,
} from '@/components/ui';
import { PlusIcon, CalendarIcon, VideoCameraIcon, BuildingOfficeIcon } from '@heroicons/react/20/solid';
import { meetingsService, Meeting, MeetingStats, MeetingType, CreateMeetingDto } from '@/services/meetings.service';
import { ScheduleMeetingModal } from '@/components/modals';

type StatusVariant = 'success' | 'info' | 'warning' | 'error' | 'default';

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

const statusConfig: Record<string, { label: string; variant: StatusVariant }> = {
  scheduled: { label: 'Scheduled', variant: 'info' },
  confirmed: { label: 'Confirmed', variant: 'success' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  completed: { label: 'Completed', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'error' },
  no_show: { label: 'No Show', variant: 'error' },
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

  useEffect(() => {
    fetchData();
  }, [viewMode]);

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
    <>
      <PageHeader
        title="Meetings"
        subtitle={stats ? `${stats.totalThisMonth} this month • ${stats.completedThisMonth} completed` : undefined}
        actions={
          <Button 
            leftIcon={<PlusIcon className="w-4 h-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Schedule Meeting
          </Button>
        }
      />

      <PageContent>
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">This Month</p>
              <p className="text-2xl font-semibold text-content-primary mt-1">{stats.totalThisMonth}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">Completed</p>
              <p className="text-2xl font-semibold text-status-success-text mt-1">{stats.completedThisMonth}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">Cancelled</p>
              <p className="text-2xl font-semibold text-status-error-text mt-1">{stats.cancelledThisMonth}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-medium text-content-secondary uppercase tracking-wider">Avg Duration</p>
              <p className="text-2xl font-semibold text-status-info-text mt-1">{stats.averageDuration} min</p>
            </Card>
          </div>
        )}

        {/* View Toggle */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-1 bg-surface-secondary rounded-lg p-1">
            {(['upcoming', 'week', 'all'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === mode ? 'bg-surface-primary text-content-primary shadow-sm' : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                {mode === 'upcoming' ? 'Upcoming' : mode === 'week' ? 'This Week' : 'All Meetings'}
              </button>
            ))}
          </div>
        </div>

        {/* Today's Meetings Highlight */}
        {meetings.some(m => isToday(m.startTime)) && (
          <Card className="bg-status-info-bg border border-status-info-text/20 p-4 mb-6">
            <h2 className="text-lg font-semibold text-content-primary mb-3 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-status-info-text" />
              Today&apos;s Meetings
            </h2>
            <div className="space-y-2">
              {meetings.filter(m => isToday(m.startTime)).map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between bg-surface-primary rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="text-lg">
                      {meeting.isVirtual ? <VideoCameraIcon className="w-5 h-5 text-status-info-text" /> : <BuildingOfficeIcon className="w-5 h-5 text-content-secondary" />}
                    </div>
                    <div>
                      <p className="font-medium text-content-primary">{meeting.title}</p>
                      <p className="text-sm text-content-secondary">
                        {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                        {meeting.location && ` • ${meeting.location}`}
                      </p>
                    </div>
                  </div>
                  <StatusBadge 
                    status={statusConfig[meeting.status]?.variant || 'default'} 
                    label={statusConfig[meeting.status]?.label || meeting.status.replace('_', ' ')} 
                  />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Meetings List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
          </div>
        ) : meetings.length === 0 ? (
          <Card className="p-12 text-center">
            <CalendarIcon className="w-12 h-12 text-content-tertiary mx-auto" />
            <p className="mt-2 text-content-secondary">No meetings scheduled</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              leftIcon={<PlusIcon className="w-4 h-4" />}
              className="mt-4"
            >
              Schedule your first meeting
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((dateStr) => (
              <div key={dateStr}>
                <h3 className="text-sm font-semibold text-content-tertiary uppercase mb-3">
                  {formatFullDate(dateStr)}
                  {isToday(dateStr) && <span className="ml-2 text-accent-primary">(Today)</span>}
                </h3>
                <Card noPadding className="divide-y divide-border-default">
                  {groupedMeetings[dateStr].map((meeting) => (
                    <div
                      key={meeting.id}
                      className="p-4 hover:bg-surface-secondary cursor-pointer"
                      onClick={() => setSelectedMeeting(meeting)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center bg-surface-secondary rounded-lg px-3 py-2 min-w-[70px]">
                            <span className="text-sm font-semibold text-content-primary">
                              {formatTime(meeting.startTime)}
                            </span>
                            <span className="text-xs text-content-tertiary">{meeting.duration} min</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {meeting.isVirtual ? <VideoCameraIcon className="w-4 h-4 text-status-info-text" /> : <BuildingOfficeIcon className="w-4 h-4 text-content-secondary" />}
                              <h4 className="font-medium text-content-primary">{meeting.title}</h4>
                              <StatusBadge 
                                status={statusConfig[meeting.status]?.variant || 'default'} 
                                label={statusConfig[meeting.status]?.label || meeting.status.replace('_', ' ')} 
                              />
                            </div>
                            <p className="text-sm text-content-secondary mt-1">
                              {meetingTypeLabels[meeting.type]}
                              {meeting.location && ` • ${meeting.location}`}
                            </p>
                            {meeting.description && (
                              <p className="text-sm text-content-tertiary mt-1 line-clamp-1">{meeting.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {meeting.status === 'scheduled' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleComplete(meeting.id);
                                }}
                                className="text-status-success-text"
                              >
                                Complete
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancel(meeting.id);
                                }}
                                className="text-status-error-text"
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {meeting.virtualMeetingUrl && (
                            <a
                              href={meeting.virtualMeetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button variant="secondary" size="sm">
                                Join
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            ))}
          </div>
        )}
      </PageContent>

      {/* Create Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchData();
        }}
      />

      {/* Meeting Detail Modal */}
      {selectedMeeting && (
        <MeetingDetailModal
          meeting={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
          onUpdate={fetchData}
        />
      )}
    </>
  );
}

function MeetingDetailModal({ meeting, onClose, onUpdate }: { meeting: Meeting; onClose: () => void; onUpdate: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-primary rounded-xl shadow-elevated max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border-default">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {meeting.isVirtual ? <VideoCameraIcon className="w-6 h-6 text-status-info-text" /> : <BuildingOfficeIcon className="w-6 h-6 text-content-secondary" />}
              <div>
                <h2 className="text-xl font-semibold text-content-primary">{meeting.title}</h2>
                <p className="text-sm text-content-secondary">{meetingTypeLabels[meeting.type]}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-content-tertiary hover:text-content-secondary">✕</button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <StatusBadge 
              status={statusConfig[meeting.status]?.variant || 'default'} 
              label={statusConfig[meeting.status]?.label || meeting.status.replace('_', ' ')} 
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-content-tertiary">Date & Time</h3>
              <p className="mt-1 text-content-primary">{formatFullDate(meeting.startTime)}</p>
              <p className="text-content-secondary">{formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}</p>
              <p className="text-sm text-content-tertiary">{meeting.duration} minutes</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-content-tertiary">Location</h3>
              {meeting.isVirtual ? (
                <>
                  <p className="mt-1 text-content-primary">Virtual Meeting</p>
                  {meeting.virtualMeetingUrl && (
                    <a
                      href={meeting.virtualMeetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-primary hover:underline text-sm"
                    >
                      Join Meeting →
                    </a>
                  )}
                </>
              ) : (
                <p className="mt-1 text-content-primary">{meeting.location || 'No location specified'}</p>
              )}
            </div>
          </div>

          {meeting.description && (
            <div>
              <h3 className="text-sm font-medium text-content-tertiary">Description</h3>
              <p className="mt-1 text-content-secondary">{meeting.description}</p>
            </div>
          )}

          {meeting.agenda && (
            <div>
              <h3 className="text-sm font-medium text-content-tertiary">Agenda</h3>
              <p className="mt-1 text-content-secondary whitespace-pre-wrap">{meeting.agenda}</p>
            </div>
          )}

          {meeting.prepNotes && (
            <div>
              <h3 className="text-sm font-medium text-content-tertiary">Prep Notes</h3>
              <p className="mt-1 text-content-secondary">{meeting.prepNotes}</p>
            </div>
          )}

          {meeting.outcome && (
            <div className="bg-status-success-bg border border-status-success-text/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-status-success-text">Outcome</h3>
              <p className="mt-1 text-content-primary">{meeting.outcome}</p>
              {meeting.nextSteps && (
                <>
                  <h4 className="text-sm font-medium text-status-success-text mt-3">Next Steps</h4>
                  <p className="text-content-primary">{meeting.nextSteps}</p>
                </>
              )}
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
