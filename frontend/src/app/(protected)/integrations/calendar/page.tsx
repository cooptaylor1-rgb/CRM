'use client';

import { useEffect, useState } from 'react';
import { 
  PageHeader, 
  PageContent,
} from '@/components/layout/AppShell';
import { 
  Button,
  Card,
  CardHeader,
  StatusBadge,
  Modal,
  Select,
} from '@/components/ui';
import { 
  PlusIcon,
  ArrowPathIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  TrashIcon,
  Cog6ToothIcon,
  ArrowTopRightOnSquareIcon,
  VideoCameraIcon,
  PhoneIcon,
  MapPinIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/components/ui/utils';
import { formatDistanceToNow, format, addDays, startOfDay } from 'date-fns';

interface CalendarConnection {
  id: string;
  provider: 'google' | 'outlook' | 'apple';
  email: string;
  status: 'active' | 'disconnected' | 'error';
  lastSyncAt?: string;
  calendars: {
    id: string;
    name: string;
    color: string;
    isEnabled: boolean;
  }[];
  syncSettings: {
    syncDirection: 'one-way' | 'two-way';
    autoCreateMeetings: boolean;
    defaultCalendarId?: string;
  };
}

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  locationUrl?: string;
  meetingType: 'in_person' | 'video' | 'phone';
  attendees: {
    name: string;
    email: string;
    status: 'accepted' | 'declined' | 'pending';
  }[];
  sourceCalendar: string;
  crmLinked: boolean;
  crmMeetingId?: string;
  householdName?: string;
}

const mockConnections: CalendarConnection[] = [
  {
    id: 'cal-001',
    provider: 'outlook',
    email: 'advisor@pinnaclewealth.com',
    status: 'active',
    lastSyncAt: '2024-01-15T10:45:00Z',
    calendars: [
      { id: 'c1', name: 'Client Meetings', color: '#0078d4', isEnabled: true },
      { id: 'c2', name: 'Personal', color: '#6264a7', isEnabled: false },
      { id: 'c3', name: 'Team Events', color: '#00a300', isEnabled: true },
    ],
    syncSettings: {
      syncDirection: 'two-way',
      autoCreateMeetings: true,
      defaultCalendarId: 'c1',
    },
  },
  {
    id: 'cal-002',
    provider: 'google',
    email: 'advisor.personal@gmail.com',
    status: 'active',
    lastSyncAt: '2024-01-15T09:30:00Z',
    calendars: [
      { id: 'g1', name: 'Primary', color: '#1a73e8', isEnabled: true },
    ],
    syncSettings: {
      syncDirection: 'one-way',
      autoCreateMeetings: false,
    },
  },
];

const mockEvents: CalendarEvent[] = [
  {
    id: 'evt-001',
    title: 'Quarterly Review - Chen Family',
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    location: 'Microsoft Teams',
    locationUrl: 'https://teams.microsoft.com/meet/123',
    meetingType: 'video',
    attendees: [
      { name: 'Sarah Chen', email: 'sarah@email.com', status: 'accepted' },
      { name: 'David Chen', email: 'david@email.com', status: 'pending' },
    ],
    sourceCalendar: 'Client Meetings',
    crmLinked: true,
    crmMeetingId: 'mtg-001',
    householdName: 'Chen Family',
  },
  {
    id: 'evt-002',
    title: 'New Client Introduction - Kim Family',
    startTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 27 * 60 * 60 * 1000).toISOString(),
    location: 'Office - Conference Room A',
    meetingType: 'in_person',
    attendees: [
      { name: 'David Kim', email: 'david.kim@email.com', status: 'accepted' },
      { name: 'Lisa Kim', email: 'lisa.kim@email.com', status: 'accepted' },
    ],
    sourceCalendar: 'Client Meetings',
    crmLinked: true,
    crmMeetingId: 'mtg-002',
    householdName: 'Kim Family',
  },
  {
    id: 'evt-003',
    title: 'Phone Call - Roberts Portfolio Update',
    startTime: new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 50.5 * 60 * 60 * 1000).toISOString(),
    meetingType: 'phone',
    attendees: [
      { name: 'Michael Roberts', email: 'michael@email.com', status: 'accepted' },
    ],
    sourceCalendar: 'Client Meetings',
    crmLinked: false,
    householdName: 'Roberts Family',
  },
  {
    id: 'evt-004',
    title: 'Team Standup',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 24.5 * 60 * 60 * 1000).toISOString(),
    location: 'Zoom',
    locationUrl: 'https://zoom.us/j/456',
    meetingType: 'video',
    attendees: [],
    sourceCalendar: 'Team Events',
    crmLinked: false,
  },
];

const providerConfig: Record<string, { name: string; color: string; icon: string }> = {
  google: { name: 'Google Calendar', color: 'bg-red-100 text-red-700', icon: '🔴' },
  outlook: { name: 'Microsoft Outlook', color: 'bg-blue-100 text-blue-700', icon: '🔵' },
  apple: { name: 'Apple Calendar', color: 'bg-gray-100 text-gray-700', icon: '⚪' },
};

const meetingTypeIcons: Record<string, React.ReactNode> = {
  video: <VideoCameraIcon className="w-4 h-4" />,
  phone: <PhoneIcon className="w-4 h-4" />,
  in_person: <MapPinIcon className="w-4 h-4" />,
};

export default function CalendarSyncPage() {
  const [connections, setConnections] = useState<CalendarConnection[]>(mockConnections);
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'connections' | 'settings'>('upcoming');
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  const upcomingEvents = events
    .filter(e => new Date(e.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const unlinkedEvents = upcomingEvents.filter(e => !e.crmLinked && e.attendees.length > 0);

  const handleSync = async (connectionId: string) => {
    setSyncing(connectionId);
    await new Promise(r => setTimeout(r, 1500));
    setSyncing(null);
    
    setConnections(prev => prev.map(c => 
      c.id === connectionId 
        ? { ...c, lastSyncAt: new Date().toISOString() }
        : c
    ));
  };

  const handleLinkEvent = (eventId: string) => {
    setEvents(prev => prev.map(e => 
      e.id === eventId 
        ? { ...e, crmLinked: true, crmMeetingId: `mtg-${Date.now()}` }
        : e
    ));
  };

  return (
    <>
      <PageHeader
        title="Calendar Sync"
        subtitle="Manage calendar integrations and sync meetings"
        actions={
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              leftIcon={<ArrowPathIcon className={cn("w-4 h-4", syncing && "animate-spin")} />}
              onClick={() => connections.forEach(c => c.status === 'active' && handleSync(c.id))}
              disabled={!!syncing}
            >
              Sync All
            </Button>
            <Button 
              variant="primary" 
              leftIcon={<PlusIcon className="w-4 h-4" />}
              onClick={() => setShowAddModal(true)}
            >
              Add Calendar
            </Button>
          </div>
        }
      />

      <PageContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent-100 rounded-lg">
                <CalendarIcon className="w-5 h-5 text-accent-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-content-primary">{connections.length}</p>
                <p className="text-sm text-content-tertiary">Connected Calendars</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-status-success-bg rounded-lg">
                <ClockIcon className="w-5 h-5 text-status-success-text" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-content-primary">{upcomingEvents.length}</p>
                <p className="text-sm text-content-tertiary">Upcoming Events</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-status-warning-bg rounded-lg">
                <ExclamationCircleIcon className="w-5 h-5 text-status-warning-text" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-content-primary">{unlinkedEvents.length}</p>
                <p className="text-sm text-content-tertiary">Unlinked Meetings</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-status-info-bg rounded-lg">
                <CheckCircleIcon className="w-5 h-5 text-status-info-text" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-content-primary">
                  {connections[0]?.lastSyncAt 
                    ? formatDistanceToNow(new Date(connections[0].lastSyncAt), { addSuffix: false })
                    : '—'
                  }
                </p>
                <p className="text-sm text-content-tertiary">Last Sync</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-surface-secondary rounded-lg p-1 mb-6 w-fit">
          {[
            { id: 'upcoming', label: 'Upcoming Events' },
            { id: 'connections', label: 'Connections' },
            { id: 'settings', label: 'Settings' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-surface-primary text-content-primary shadow-sm' 
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'upcoming' && (
          <div className="space-y-4">
            {/* Unlinked Events Alert */}
            {unlinkedEvents.length > 0 && (
              <div className="p-4 bg-status-warning-bg border border-status-warning-text/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ExclamationCircleIcon className="w-5 h-5 text-status-warning-text" />
                    <div>
                      <p className="font-medium text-status-warning-text">
                        {unlinkedEvents.length} meeting{unlinkedEvents.length !== 1 ? 's' : ''} not linked to CRM
                      </p>
                      <p className="text-sm text-status-warning-text/80">
                        Link these events to track them in your CRM and associate with households
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="secondary">
                    Link All
                  </Button>
                </div>
              </div>
            )}

            {/* Events List */}
            <Card>
              <CardHeader title="Upcoming Events" subtitle="Synced from your calendars" />
              <div className="divide-y divide-border">
                {upcomingEvents.map(event => {
                  const startDate = new Date(event.startTime);
                  const endDate = new Date(event.endTime);
                  const isToday = startOfDay(startDate).getTime() === startOfDay(new Date()).getTime();
                  const isTomorrow = startOfDay(startDate).getTime() === startOfDay(addDays(new Date(), 1)).getTime();
                  
                  return (
                    <div key={event.id} className="p-4 hover:bg-surface-secondary transition-colors">
                      <div className="flex items-start gap-4">
                        {/* Time Column */}
                        <div className="w-20 flex-shrink-0 text-center">
                          <p className="text-xs font-medium text-content-tertiary uppercase">
                            {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : format(startDate, 'EEE, MMM d')}
                          </p>
                          <p className="text-lg font-semibold text-content-primary">
                            {format(startDate, 'h:mm')}
                          </p>
                          <p className="text-xs text-content-tertiary">
                            {format(startDate, 'a')}
                          </p>
                        </div>

                        {/* Event Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-medium text-content-primary">{event.title}</h3>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="inline-flex items-center gap-1 text-xs text-content-tertiary">
                                  {meetingTypeIcons[event.meetingType]}
                                  {event.meetingType === 'video' ? 'Video Call' : 
                                   event.meetingType === 'phone' ? 'Phone Call' : 'In Person'}
                                </span>
                                {event.location && (
                                  <span className="text-xs text-content-tertiary">
                                    {event.location}
                                  </span>
                                )}
                                <span className="text-xs text-content-tertiary">
                                  {Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))} min
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {event.crmLinked ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-status-success-bg text-status-success-text text-xs font-medium rounded-full">
                                  <CheckCircleIcon className="w-3 h-3" />
                                  Linked
                                </span>
                              ) : event.attendees.length > 0 ? (
                                <Button 
                                  size="sm" 
                                  variant="secondary"
                                  onClick={() => handleLinkEvent(event.id)}
                                >
                                  Link to CRM
                                </Button>
                              ) : null}
                            </div>
                          </div>

                          {/* Attendees */}
                          {event.attendees.length > 0 && (
                            <div className="mt-3 flex items-center gap-2">
                              <UserGroupIcon className="w-4 h-4 text-content-tertiary" />
                              <div className="flex -space-x-2">
                                {event.attendees.slice(0, 4).map((attendee, idx) => (
                                  <div 
                                    key={idx}
                                    className={cn(
                                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 border-surface-primary',
                                      attendee.status === 'accepted' ? 'bg-status-success-bg text-status-success-text' :
                                      attendee.status === 'declined' ? 'bg-status-error-bg text-status-error-text' :
                                      'bg-surface-secondary text-content-secondary'
                                    )}
                                    title={`${attendee.name} (${attendee.status})`}
                                  >
                                    {attendee.name.charAt(0)}
                                  </div>
                                ))}
                                {event.attendees.length > 4 && (
                                  <div className="w-6 h-6 rounded-full bg-surface-secondary flex items-center justify-center text-xs text-content-tertiary border-2 border-surface-primary">
                                    +{event.attendees.length - 4}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-content-tertiary">
                                {event.attendees.map(a => a.name).join(', ')}
                              </span>
                            </div>
                          )}

                          {/* Household Link */}
                          {event.householdName && (
                            <div className="mt-2">
                              <span className="text-xs text-accent-600">
                                {event.householdName}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Calendar Source */}
                        <div className="flex-shrink-0">
                          <span className="text-xs text-content-tertiary">
                            {event.sourceCalendar}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'connections' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {connections.map(connection => (
              <Card key={connection.id} className="overflow-hidden">
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-3 rounded-lg text-2xl',
                        providerConfig[connection.provider]?.color
                      )}>
                        {providerConfig[connection.provider]?.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-content-primary">
                          {providerConfig[connection.provider]?.name}
                        </h3>
                        <p className="text-sm text-content-tertiary">{connection.email}</p>
                      </div>
                    </div>
                    <StatusBadge
                      status={connection.status === 'active' ? 'success' : 'error'}
                      label={connection.status === 'active' ? 'Connected' : 'Disconnected'}
                    />
                  </div>

                  {/* Calendars */}
                  <div className="mb-4">
                    <p className="text-xs text-content-tertiary uppercase tracking-wider mb-2">Synced Calendars</p>
                    <div className="space-y-2">
                      {connection.calendars.map(cal => (
                        <div 
                          key={cal.id}
                          className={cn(
                            'flex items-center justify-between p-2 rounded-lg',
                            cal.isEnabled ? 'bg-surface-secondary' : 'bg-surface-secondary/50'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: cal.color }}
                            />
                            <span className={cn(
                              'text-sm',
                              cal.isEnabled ? 'text-content-primary' : 'text-content-tertiary'
                            )}>
                              {cal.name}
                            </span>
                          </div>
                          <span className={cn(
                            'text-xs',
                            cal.isEnabled ? 'text-status-success-text' : 'text-content-tertiary'
                          )}>
                            {cal.isEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sync Info */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-content-tertiary">
                      Last sync: {connection.lastSyncAt 
                        ? formatDistanceToNow(new Date(connection.lastSyncAt), { addSuffix: true })
                        : 'Never'
                      }
                    </span>
                    <span className="text-xs px-2 py-1 bg-surface-secondary rounded">
                      {connection.syncSettings.syncDirection === 'two-way' ? 'Two-way sync' : 'One-way sync'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-5 py-3 bg-surface-secondary border-t border-border flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<ArrowPathIcon className={cn("w-4 h-4", syncing === connection.id && "animate-spin")} />}
                    onClick={() => handleSync(connection.id)}
                    disabled={!!syncing}
                  >
                    {syncing === connection.id ? 'Syncing...' : 'Sync Now'}
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" leftIcon={<Cog6ToothIcon className="w-4 h-4" />}>
                      Settings
                    </Button>
                    <Button size="sm" variant="ghost" className="text-status-error-text">
                      Disconnect
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {/* Add Calendar Card */}
            <button
              onClick={() => setShowAddModal(true)}
              className={cn(
                'flex flex-col items-center justify-center p-8',
                'border-2 border-dashed border-border rounded-lg',
                'text-content-tertiary hover:text-content-secondary hover:border-border-focus',
                'transition-colors min-h-[200px]'
              )}
            >
              <PlusIcon className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Connect Calendar</span>
            </button>
          </div>
        )}

        {activeTab === 'settings' && (
          <Card>
            <CardHeader title="Sync Settings" subtitle="Configure how calendars sync with your CRM" />
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <p className="font-medium text-content-primary">Auto-create CRM meetings</p>
                  <p className="text-sm text-content-tertiary">
                    Automatically create CRM meeting records when calendar events are detected
                  </p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-accent-600">
                  <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                </button>
              </div>
              
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <p className="font-medium text-content-primary">Auto-link to households</p>
                  <p className="text-sm text-content-tertiary">
                    Automatically link meetings to households based on attendee email addresses
                  </p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-accent-600">
                  <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                </button>
              </div>

              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <p className="font-medium text-content-primary">Sync meeting notes</p>
                  <p className="text-sm text-content-tertiary">
                    Sync meeting notes between calendar events and CRM meeting records
                  </p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-surface-secondary">
                  <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white shadow transition" />
                </button>
              </div>

              <div>
                <p className="font-medium text-content-primary mb-2">Default meeting reminder</p>
                <Select
                  value="30"
                  options={[
                    { value: '15', label: '15 minutes before' },
                    { value: '30', label: '30 minutes before' },
                    { value: '60', label: '1 hour before' },
                    { value: '1440', label: '1 day before' },
                  ]}
                />
              </div>
            </div>
          </Card>
        )}
      </PageContent>

      {/* Add Calendar Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Connect Calendar"
        size="md"
      >
        <div className="p-6">
          <p className="text-sm text-content-secondary mb-6">
            Choose a calendar provider to connect.
          </p>
          
          <div className="space-y-3">
            {[
              { id: 'outlook', name: 'Microsoft Outlook', icon: '🔵', description: 'Connect your Outlook or Microsoft 365 calendar' },
              { id: 'google', name: 'Google Calendar', icon: '🔴', description: 'Connect your Google Calendar' },
              { id: 'apple', name: 'Apple Calendar', icon: '⚪', description: 'Connect your iCloud Calendar' },
            ].map(provider => (
              <button
                key={provider.id}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-lg border border-border',
                  'hover:border-accent-500 hover:bg-surface-secondary transition-colors text-left'
                )}
              >
                <span className="text-3xl">{provider.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-content-primary">{provider.name}</p>
                  <p className="text-sm text-content-tertiary">{provider.description}</p>
                </div>
                <ArrowTopRightOnSquareIcon className="w-5 h-5 text-content-tertiary" />
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}
