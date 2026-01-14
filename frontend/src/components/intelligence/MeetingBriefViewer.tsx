'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FileTextIcon,
  UserIcon,
  WalletIcon,
  MessageSquareIcon,
  CheckSquareIcon,
  AlertTriangleIcon,
  SparklesIcon,
  PlusIcon,
  PrinterIcon,
  DownloadIcon,
  EditIcon,
  CalendarIcon,
  ClockIcon,
  PieChartIcon,
} from 'lucide-react';
import { Card, Badge, Button, Input, Skeleton } from '@/components/ui';
import {
  intelligenceService,
  MeetingBrief,
  TalkingPoint,
  ActionItem,
} from '@/services/intelligence.service';

// =============================================================================
// Types
// =============================================================================

interface MeetingBriefViewerProps {
  briefId?: string;
  brief?: MeetingBrief;
  onClose?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function MeetingBriefViewer({ briefId, brief: providedBrief, onClose }: MeetingBriefViewerProps) {
  const [loading, setLoading] = React.useState(!providedBrief);
  const [brief, setBrief] = React.useState<MeetingBrief | null>(providedBrief || null);
  const [newNote, setNewNote] = React.useState('');
  const [addingNote, setAddingNote] = React.useState(false);

  React.useEffect(() => {
    if (briefId && !providedBrief) {
      loadBrief();
    }
  }, [briefId]);

  const loadBrief = async () => {
    if (!briefId) return;
    try {
      const data = await intelligenceService.getMeetingBrief(briefId, true);
      setBrief(data);
    } catch {
      toast.error('Failed to load meeting brief');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!brief || !newNote.trim()) return;
    setAddingNote(true);
    try {
      const updated = await intelligenceService.updateMeetingBrief(brief.id, {
        advisorNote: { note: newNote.trim() },
      });
      setBrief(updated);
      setNewNote('');
      toast.success('Note added');
    } catch {
      toast.error('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleUpdateActionItem = async (index: number, status: ActionItem['status']) => {
    if (!brief) return;
    const updatedItems = [...brief.actionItems];
    updatedItems[index] = { ...updatedItems[index], status };
    try {
      const updated = await intelligenceService.updateMeetingBrief(brief.id, {
        actionItems: updatedItems,
      });
      setBrief(updated);
      toast.success('Action item updated');
    } catch {
      toast.error('Failed to update action item');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <MeetingBriefSkeleton />;
  }

  if (!brief) {
    return (
      <Card className="p-8 text-center">
        <FileTextIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium text-foreground mb-2">Brief Not Found</h3>
        <p className="text-muted-foreground">The requested meeting brief could not be loaded.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileTextIcon className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Meeting Brief</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {brief.clientProfile.householdName} • {new Date(brief.meetingDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <PrinterIcon className="w-4 h-4" />
            Print
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold">{brief.clientProfile.householdName}</h1>
        <p className="text-gray-600">Meeting Brief • {new Date(brief.meetingDate).toLocaleDateString()}</p>
      </div>

      {/* Executive Summary */}
      {brief.executiveSummary && (
        <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-primary" />
            Executive Summary
          </h2>
          <p className="text-sm text-foreground/80">{brief.executiveSummary}</p>
        </Card>
      )}

      {/* Warnings */}
      {brief.warnings && brief.warnings.length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800">
          <h2 className="font-semibold text-red-800 dark:text-red-400 mb-2 flex items-center gap-2">
            <AlertTriangleIcon className="w-4 h-4" />
            Warnings
          </h2>
          <ul className="space-y-1">
            {brief.warnings.map((warning, i) => (
              <li key={i} className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {warning}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-1">
        {/* Left Column - Client & Portfolio */}
        <div className="space-y-6">
          {/* Client Profile */}
          <Card>
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-primary" />
                Client Profile
              </h2>
            </div>
            <div className="p-4 space-y-3">
              <ProfileRow label="Primary Contact" value={brief.clientProfile.primaryContact} />
              <ProfileRow label="Relationship" value={brief.clientProfile.relationshipLength} />
              <ProfileRow label="Risk Tolerance" value={brief.clientProfile.riskTolerance} />
              <ProfileRow label="Objective" value={brief.clientProfile.investmentObjective} />
              <ProfileRow
                label="Last Meeting"
                value={brief.clientProfile.lastMeetingDate
                  ? new Date(brief.clientProfile.lastMeetingDate).toLocaleDateString()
                  : 'N/A'
                }
              />
              <ProfileRow label="Preference" value={brief.clientProfile.communicationPreference} />
            </div>
          </Card>

          {/* Portfolio Snapshot */}
          <Card>
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <WalletIcon className="w-4 h-4 text-primary" />
                Portfolio Snapshot
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total AUM</p>
                  <p className="text-lg font-bold text-foreground">
                    ${brief.portfolioSnapshot.totalAum.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">YTD Return</p>
                  <p className={`text-lg font-bold ${
                    brief.portfolioSnapshot.ytdReturn >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {brief.portfolioSnapshot.ytdReturn >= 0 ? '+' : ''}
                    {brief.portfolioSnapshot.ytdReturn.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Asset Allocation */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Asset Allocation</p>
                <div className="space-y-2">
                  {brief.portfolioSnapshot.assetAllocation.map((asset, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{asset.name}</span>
                      <span className="text-muted-foreground">{asset.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Holdings */}
              {brief.portfolioSnapshot.topHoldings.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Top Holdings</p>
                  <div className="space-y-2">
                    {brief.portfolioSnapshot.topHoldings.map((holding, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium text-foreground">{holding.symbol}</span>
                          <span className="text-muted-foreground ml-2">{holding.name}</span>
                        </div>
                        <span className="text-muted-foreground">{holding.weight}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Middle Column - Talking Points */}
        <div className="lg:col-span-2 space-y-6">
          {/* Talking Points */}
          <Card>
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <MessageSquareIcon className="w-4 h-4 text-primary" />
                Talking Points
              </h2>
            </div>
            <div className="divide-y divide-border">
              {brief.talkingPoints.map((point, i) => (
                <TalkingPointRow key={i} point={point} />
              ))}
            </div>
          </Card>

          {/* Opportunities */}
          {brief.opportunities && brief.opportunities.length > 0 && (
            <Card className="p-4 bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800">
              <h2 className="font-semibold text-green-800 dark:text-green-400 mb-2 flex items-center gap-2">
                <SparklesIcon className="w-4 h-4" />
                Opportunities
              </h2>
              <ul className="space-y-1">
                {brief.opportunities.map((opp, i) => (
                  <li key={i} className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {opp}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Action Items */}
          <Card>
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <CheckSquareIcon className="w-4 h-4 text-primary" />
                Action Items
              </h2>
            </div>
            <div className="divide-y divide-border">
              {brief.actionItems.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No action items
                </div>
              ) : (
                brief.actionItems.map((item, i) => (
                  <ActionItemRow
                    key={i}
                    item={item}
                    onStatusChange={(status) => handleUpdateActionItem(i, status)}
                  />
                ))
              )}
            </div>
          </Card>

          {/* Advisor Notes */}
          <Card className="print:hidden">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <EditIcon className="w-4 h-4 text-primary" />
                Advisor Notes
              </h2>
            </div>
            <div className="p-4 space-y-4">
              {brief.advisorNotes && brief.advisorNotes.length > 0 && (
                <div className="space-y-3">
                  {brief.advisorNotes.map((note, i) => (
                    <div key={i} className="p-3 rounded-lg bg-background-secondary">
                      <p className="text-sm text-foreground">{note.note}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(note.addedAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                />
                <Button onClick={handleAddNote} disabled={!newNote.trim() || addingNote}>
                  <PlusIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <p className="text-xs text-muted-foreground text-center print:mt-8">
        Brief generated on {new Date(brief.generatedAt).toLocaleString()}
      </p>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function TalkingPointRow({ point }: { point: TalkingPoint }) {
  const priorityColors = {
    must_discuss: 'bg-red-100 text-red-800 border-red-200',
    should_discuss: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    optional: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-4 mb-2">
        <h3 className="font-medium text-foreground">{point.topic}</h3>
        <Badge className={priorityColors[point.priority]}>
          {point.priority.replace('_', ' ')}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-2">{point.context}</p>
      <p className="text-sm text-primary">
        <strong>Approach:</strong> {point.suggestedApproach}
      </p>
    </div>
  );
}

function ActionItemRow({
  item,
  onStatusChange,
}: {
  item: ActionItem;
  onStatusChange: (status: ActionItem['status']) => void;
}) {
  const statusColors = {
    pending: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
  };

  return (
    <div className="p-4 flex items-center justify-between">
      <div className="flex-1">
        <p className={`text-sm ${item.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {item.item}
        </p>
        {item.dueDate && (
          <p className="text-xs text-muted-foreground mt-1">
            Due: {new Date(item.dueDate).toLocaleDateString()}
          </p>
        )}
      </div>
      <select
        value={item.status}
        onChange={(e) => onStatusChange(e.target.value as ActionItem['status'])}
        className={`text-xs px-2 py-1 rounded border-0 ${statusColors[item.status]} cursor-pointer print:hidden`}
      >
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
    </div>
  );
}

function MeetingBriefSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-9 w-24" />
      </div>
      <Skeleton className="h-20" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-80" />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </div>
  );
}

export default MeetingBriefViewer;
