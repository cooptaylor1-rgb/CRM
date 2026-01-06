'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button, formatDate } from '../ui';
import {
  MicrophoneIcon,
  StopIcon,
  PauseIcon,
  PlayIcon,
  SparklesIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  BookmarkIcon,
  TagIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  LightBulbIcon,
  ChatBubbleLeftRightIcon,
  ListBulletIcon,
  FlagIcon,
  XMarkIcon,
  PlusIcon,
  CheckIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import { MicrophoneIcon as MicrophoneIconSolid } from '@heroicons/react/24/solid';
import { cn } from '../ui/utils';

/**
 * MeetingNotesAI - Smart Meeting Notes with AI
 * 
 * Never miss a detail from client meetings:
 * - Real-time note capture
 * - AI-powered summaries
 * - Auto-extract action items
 * - Link to client timeline
 * - Generate follow-up emails
 */

// ============================================
// Types
// ============================================

export interface MeetingNote {
  id: string;
  meetingId?: string;
  householdId?: string;
  householdName?: string;
  title: string;
  date: string;
  duration: number; // in minutes
  attendees: Attendee[];
  rawNotes: string;
  aiSummary?: AISummary;
  actionItems: ActionItem[];
  keyTopics: string[];
  sentiment?: 'positive' | 'neutral' | 'concerned';
  isRecording: boolean;
  status: 'draft' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Attendee {
  id: string;
  name: string;
  role: 'client' | 'advisor' | 'staff' | 'external';
  email?: string;
}

export interface AISummary {
  overview: string;
  keyPoints: string[];
  clientConcerns: string[];
  opportunities: string[];
  nextSteps: string[];
}

export interface ActionItem {
  id: string;
  description: string;
  assignee?: string;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed';
  createdFromNote: boolean;
}

export type NoteCategory = 
  | 'all'
  | 'this_week'
  | 'this_month'
  | 'has_actions'
  | 'needs_follow_up';

// ============================================
// Constants
// ============================================

const SAMPLE_NOTES: MeetingNote[] = [
  {
    id: '1',
    meetingId: 'm1',
    householdId: 'h1',
    householdName: 'Smith Family',
    title: 'Q4 Portfolio Review',
    date: '2025-01-10T14:00:00',
    duration: 45,
    attendees: [
      { id: 'a1', name: 'John Smith', role: 'client', email: 'john@email.com' },
      { id: 'a2', name: 'Jane Wilson', role: 'advisor' },
    ],
    rawNotes: `Discussed Q4 performance - portfolio up 8.3% vs benchmark 7.1%
    
John expressed concern about market volatility heading into 2025. Wants to maintain current allocation but consider adding some defensive positions.

Reviewed retirement timeline - still on track for planned 2027 retirement. Current savings rate sufficient.

Sarah mentioned they may be purchasing a vacation property in Arizona. Estimated $400k-$500k range. Would likely need $100k-$150k down payment.

Discussed estate planning - need to update beneficiaries on IRA accounts. Will schedule meeting with estate attorney.

Next review scheduled for April.`,
    aiSummary: {
      overview: 'Positive quarterly review with the Smiths. Portfolio outperformed benchmark. Client expressed some market concerns but remains committed to current strategy. New liquidity need identified for potential real estate purchase.',
      keyPoints: [
        'Portfolio returned 8.3% in Q4, beating benchmark by 1.2%',
        'Retirement timeline on track for 2027',
        'Potential real estate purchase requiring $100-150k liquidity',
        'Estate planning documents need updating',
      ],
      clientConcerns: [
        'Market volatility concerns for 2025',
        'Timing of liquidity for real estate down payment',
      ],
      opportunities: [
        'Review portfolio for defensive positioning options',
        'Coordinate with estate attorney on beneficiary updates',
        'Explore mortgage options for vacation property',
      ],
      nextSteps: [
        'Send market outlook summary',
        'Schedule estate planning review',
        'Prepare liquidity analysis for real estate purchase',
      ],
    },
    actionItems: [
      { id: 'ai1', description: 'Send Q4 performance summary and 2025 market outlook', assignee: 'Jane Wilson', dueDate: '2025-01-15', priority: 'high', status: 'pending', createdFromNote: true },
      { id: 'ai2', description: 'Schedule estate planning review with attorney', assignee: 'Jane Wilson', dueDate: '2025-01-20', priority: 'medium', status: 'pending', createdFromNote: true },
      { id: 'ai3', description: 'Prepare liquidity analysis for vacation property purchase', assignee: 'Jane Wilson', dueDate: '2025-01-25', priority: 'medium', status: 'pending', createdFromNote: true },
      { id: 'ai4', description: 'Update IRA beneficiary designations', assignee: 'John Smith', dueDate: '2025-02-01', priority: 'medium', status: 'pending', createdFromNote: true },
    ],
    keyTopics: ['Portfolio Review', 'Retirement Planning', 'Real Estate', 'Estate Planning'],
    sentiment: 'positive',
    isRecording: false,
    status: 'completed',
    createdAt: '2025-01-10T14:00:00',
    updatedAt: '2025-01-10T15:00:00',
  },
  {
    id: '2',
    meetingId: 'm2',
    householdId: 'h2',
    householdName: 'Johnson Trust',
    title: 'Tax Planning Discussion',
    date: '2025-01-08T10:00:00',
    duration: 30,
    attendees: [
      { id: 'a3', name: 'Sarah Johnson', role: 'client', email: 'sarah@email.com' },
      { id: 'a4', name: 'Michael Chen', role: 'advisor' },
      { id: 'a5', name: 'Robert Davis', role: 'external', email: 'robert@cpa.com' },
    ],
    rawNotes: `Met with Sarah and her CPA Robert to discuss year-end tax planning.

Key items:
- Large capital gain from business sale ($2.3M)
- Need to maximize charitable giving strategies
- Discussed QCD from IRA ($100k max)
- Donor Advised Fund contribution of $500k recommended
- Consider bunching deductions in 2025

Sarah wants to support education causes - mentioned scholarship fund idea.

Robert will prepare estimated tax impact analysis by next week.`,
    aiSummary: {
      overview: 'Tax planning meeting focused on significant capital gain from business sale. Discussed charitable giving strategies to offset tax impact.',
      keyPoints: [
        '$2.3M capital gain from business sale',
        'QCD of $100k from IRA recommended',
        'DAF contribution of $500k to offset gains',
        'Client interested in scholarship fund',
      ],
      clientConcerns: [
        'Tax liability from business sale',
        'Making meaningful charitable impact',
      ],
      opportunities: [
        'Establish scholarship fund aligned with client values',
        'Multi-year charitable giving strategy',
      ],
      nextSteps: [
        'Wait for CPA tax impact analysis',
        'Research scholarship fund options',
        'Prepare DAF funding recommendations',
      ],
    },
    actionItems: [
      { id: 'ai5', description: 'Follow up with Robert on tax impact analysis', assignee: 'Michael Chen', dueDate: '2025-01-15', priority: 'high', status: 'pending', createdFromNote: true },
      { id: 'ai6', description: 'Research scholarship fund options', assignee: 'Michael Chen', dueDate: '2025-01-20', priority: 'medium', status: 'pending', createdFromNote: true },
    ],
    keyTopics: ['Tax Planning', 'Charitable Giving', 'Estate Planning'],
    sentiment: 'neutral',
    isRecording: false,
    status: 'completed',
    createdAt: '2025-01-08T10:00:00',
    updatedAt: '2025-01-08T10:45:00',
  },
];

const AI_INSIGHT_PROMPTS = [
  { icon: '📋', label: 'Generate summary', action: 'summarize' },
  { icon: '✅', label: 'Extract action items', action: 'actions' },
  { icon: '💡', label: 'Identify opportunities', action: 'opportunities' },
  { icon: '📧', label: 'Draft follow-up email', action: 'email' },
  { icon: '⚠️', label: 'Flag concerns', action: 'concerns' },
];

// ============================================
// Components
// ============================================

interface RecordingIndicatorProps {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

function RecordingIndicator({ isRecording, isPaused, duration, onStart, onPause, onResume, onStop }: RecordingIndicatorProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isRecording) {
    return (
      <button
        onClick={onStart}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
      >
        <MicrophoneIconSolid className="w-5 h-5" />
        Start Recording
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30">
        <motion.div
          animate={{ scale: isPaused ? 1 : [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-3 h-3 rounded-full bg-red-500"
        />
        <span className="text-red-500 font-medium">{formatDuration(duration)}</span>
      </div>
      
      {isPaused ? (
        <button
          onClick={onResume}
          className="p-2 rounded-full bg-surface-secondary hover:bg-surface-tertiary text-content-primary"
        >
          <PlayIcon className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={onPause}
          className="p-2 rounded-full bg-surface-secondary hover:bg-surface-tertiary text-content-primary"
        >
          <PauseIcon className="w-5 h-5" />
        </button>
      )}
      
      <button
        onClick={onStop}
        className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
      >
        <StopIcon className="w-5 h-5" />
      </button>
    </div>
  );
}

interface ActionItemCardProps {
  item: ActionItem;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ActionItemCard({ item, onToggle, onEdit, onDelete }: ActionItemCardProps) {
  const priorityColors = {
    high: 'text-red-500 bg-red-500/10',
    medium: 'text-amber-500 bg-amber-500/10',
    low: 'text-green-500 bg-green-500/10',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-all',
        item.status === 'completed'
          ? 'bg-surface-secondary border-border opacity-60'
          : 'bg-surface border-border hover:border-accent-primary/50'
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
          item.status === 'completed'
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-content-tertiary hover:border-accent-primary'
        )}
      >
        {item.status === 'completed' && <CheckIcon className="w-3 h-3" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-content-primary',
          item.status === 'completed' && 'line-through text-content-tertiary'
        )}>
          {item.description}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          {item.assignee && (
            <span className="text-xs text-content-secondary flex items-center gap-1">
              <UserGroupIcon className="w-3 h-3" />
              {item.assignee}
            </span>
          )}
          {item.dueDate && (
            <span className="text-xs text-content-secondary flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              {formatDate(item.dueDate)}
            </span>
          )}
          <span className={cn('text-xs px-2 py-0.5 rounded-full', priorityColors[item.priority])}>
            {item.priority}
          </span>
          {item.createdFromNote && (
            <span className="text-xs text-purple-500 flex items-center gap-1">
              <SparklesIcon className="w-3 h-3" />
              AI
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onEdit}
          className="p-1 rounded hover:bg-surface-secondary text-content-tertiary"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded hover:bg-red-500/10 text-content-tertiary hover:text-red-500"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

interface AISummaryCardProps {
  summary: AISummary;
  isGenerating: boolean;
}

function AISummaryCard({ summary, isGenerating }: AISummaryCardProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['overview']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const sections = [
    { id: 'overview', label: 'Overview', icon: <DocumentTextIcon className="w-4 h-4" />, content: summary.overview, type: 'text' },
    { id: 'keyPoints', label: 'Key Points', icon: <ListBulletIcon className="w-4 h-4" />, content: summary.keyPoints, type: 'list' },
    { id: 'concerns', label: 'Client Concerns', icon: <ExclamationCircleIcon className="w-4 h-4" />, content: summary.clientConcerns, type: 'list' },
    { id: 'opportunities', label: 'Opportunities', icon: <LightBulbIcon className="w-4 h-4" />, content: summary.opportunities, type: 'list' },
    { id: 'nextSteps', label: 'Next Steps', icon: <FlagIcon className="w-4 h-4" />, content: summary.nextSteps, type: 'list' },
  ];

  if (isGenerating) {
    return (
      <Card className="p-4 border-purple-500/30 bg-purple-500/5">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          >
            <SparklesIcon className="w-5 h-5 text-purple-500" />
          </motion.div>
          <div>
            <p className="font-medium text-content-primary">AI is analyzing your notes...</p>
            <p className="text-sm text-content-secondary">Generating summary and extracting insights</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-4 bg-purple-500/10 rounded animate-pulse" style={{ width: `${100 - i * 15}%` }} />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-purple-500/30">
      <div className="p-4 bg-purple-500/5 border-b border-border flex items-center gap-2">
        <SparklesIcon className="w-5 h-5 text-purple-500" />
        <h3 className="font-medium text-content-primary">AI Summary</h3>
      </div>
      <div className="divide-y divide-border">
        {sections.map(section => {
          const isExpanded = expandedSections.includes(section.id);
          const hasContent = section.type === 'list' 
            ? (section.content as string[]).length > 0 
            : !!section.content;

          if (!hasContent) return null;

          return (
            <div key={section.id}>
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full p-3 flex items-center justify-between hover:bg-surface-secondary transition-colors"
              >
                <div className="flex items-center gap-2">
                  {section.icon}
                  <span className="font-medium text-content-primary text-sm">{section.label}</span>
                </div>
                {isExpanded ? (
                  <ChevronDownIcon className="w-4 h-4 text-content-tertiary" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 text-content-tertiary" />
                )}
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-3"
                  >
                    {section.type === 'text' ? (
                      <p className="text-sm text-content-secondary">{section.content as string}</p>
                    ) : (
                      <ul className="space-y-1">
                        {(section.content as string[]).map((item, i) => (
                          <li key={i} className="text-sm text-content-secondary flex items-start gap-2">
                            <span className="text-purple-500 mt-1">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

interface NoteCardProps {
  note: MeetingNote;
  onSelect: () => void;
  isSelected: boolean;
}

function NoteCard({ note, onSelect, isSelected }: NoteCardProps) {
  const sentimentColors = {
    positive: 'bg-green-500',
    neutral: 'bg-blue-500',
    concerned: 'bg-amber-500',
  };

  return (
    <motion.div
      layout
      onClick={onSelect}
      className={cn(
        'p-4 rounded-lg border cursor-pointer transition-all',
        isSelected
          ? 'border-accent-primary bg-accent-primary/5 ring-1 ring-accent-primary'
          : 'border-border bg-surface hover:border-accent-primary/50'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-content-primary">{note.title}</h3>
            {note.sentiment && (
              <div className={cn('w-2 h-2 rounded-full', sentimentColors[note.sentiment])} title={note.sentiment} />
            )}
          </div>
          <p className="text-sm text-content-secondary mt-0.5">{note.householdName}</p>
        </div>
        <Badge variant={note.status === 'completed' ? 'success' : 'default'} size="sm">
          {note.status}
        </Badge>
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-content-tertiary">
        <span className="flex items-center gap-1">
          <CalendarIcon className="w-3 h-3" />
          {formatDate(note.date)}
        </span>
        <span className="flex items-center gap-1">
          <ClockIcon className="w-3 h-3" />
          {note.duration} min
        </span>
        <span className="flex items-center gap-1">
          <UserGroupIcon className="w-3 h-3" />
          {note.attendees.length}
        </span>
        {note.actionItems.filter(a => a.status === 'pending').length > 0 && (
          <span className="flex items-center gap-1 text-amber-500">
            <CheckCircleIcon className="w-3 h-3" />
            {note.actionItems.filter(a => a.status === 'pending').length} pending
          </span>
        )}
      </div>

      {note.keyTopics.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {note.keyTopics.slice(0, 3).map(topic => (
            <span key={topic} className="px-2 py-0.5 rounded-full bg-surface-secondary text-xs text-content-tertiary">
              {topic}
            </span>
          ))}
          {note.keyTopics.length > 3 && (
            <span className="px-2 py-0.5 rounded-full bg-surface-secondary text-xs text-content-tertiary">
              +{note.keyTopics.length - 3}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

export interface MeetingNotesAIProps {
  notes?: MeetingNote[];
  householdId?: string;
  householdName?: string;
  onSaveNote?: (note: MeetingNote) => void;
  onDeleteNote?: (noteId: string) => void;
  onCreateTask?: (actionItem: ActionItem, noteId: string) => void;
  className?: string;
}

export function MeetingNotesAI({
  notes: initialNotes = SAMPLE_NOTES,
  householdId,
  householdName,
  onSaveNote,
  onDeleteNote,
  onCreateTask,
  className,
}: MeetingNotesAIProps) {
  const [notes, setNotes] = useState<MeetingNote[]>(initialNotes);
  const [selectedNote, setSelectedNote] = useState<MeetingNote | null>(null);
  const [view, setView] = useState<'list' | 'detail' | 'new'>('list');
  const [filter, setFilter] = useState<NoteCategory>('all');

  // New note state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteAttendees, setNewNoteAttendees] = useState<Attendee[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<AISummary | null>(null);
  const [generatedActions, setGeneratedActions] = useState<ActionItem[]>([]);

  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Recording timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      recordingInterval.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
    } else if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
    }
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, [isRecording, isPaused]);

  // Filter notes
  const filteredNotes = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return notes.filter(note => {
      if (householdId && note.householdId !== householdId) return false;
      
      const noteDate = new Date(note.date);
      switch (filter) {
        case 'this_week':
          return noteDate >= weekAgo;
        case 'this_month':
          return noteDate >= monthAgo;
        case 'has_actions':
          return note.actionItems.some(a => a.status === 'pending');
        case 'needs_follow_up':
          return note.sentiment === 'concerned' || note.actionItems.some(a => a.status === 'pending' && a.priority === 'high');
        default:
          return true;
      }
    });
  }, [notes, filter, householdId]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
    setRecordingDuration(0);
  };

  const handlePauseRecording = () => {
    setIsPaused(true);
  };

  const handleResumeRecording = () => {
    setIsPaused(false);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
  };

  const handleGenerateAISummary = async () => {
    if (!newNoteContent.trim()) return;

    setIsGeneratingAI(true);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Mock AI-generated summary
    const mockSummary: AISummary = {
      overview: 'Meeting covered key financial planning topics with focus on portfolio review and upcoming milestones.',
      keyPoints: [
        'Discussed current portfolio allocation and performance',
        'Reviewed progress toward financial goals',
        'Identified upcoming liquidity needs',
      ],
      clientConcerns: [
        'Market volatility and its impact on portfolio',
        'Timeline for achieving retirement goals',
      ],
      opportunities: [
        'Consider rebalancing to align with risk tolerance',
        'Explore tax-efficient withdrawal strategies',
      ],
      nextSteps: [
        'Send meeting follow-up summary',
        'Schedule next quarterly review',
        'Prepare analysis of recommended changes',
      ],
    };

    const mockActions: ActionItem[] = [
      {
        id: `ai-${Date.now()}-1`,
        description: 'Send meeting summary and next steps',
        assignee: 'Current User',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'high',
        status: 'pending',
        createdFromNote: true,
      },
      {
        id: `ai-${Date.now()}-2`,
        description: 'Schedule follow-up call to discuss recommendations',
        assignee: 'Current User',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'medium',
        status: 'pending',
        createdFromNote: true,
      },
    ];

    setGeneratedSummary(mockSummary);
    setGeneratedActions(mockActions);
    setIsGeneratingAI(false);
  };

  const handleSaveNote = () => {
    const newNote: MeetingNote = {
      id: `note-${Date.now()}`,
      householdId,
      householdName,
      title: newNoteTitle || 'Meeting Notes',
      date: new Date().toISOString(),
      duration: Math.ceil(recordingDuration / 60) || 30,
      attendees: newNoteAttendees,
      rawNotes: newNoteContent,
      aiSummary: generatedSummary || undefined,
      actionItems: generatedActions,
      keyTopics: ['General'],
      isRecording: false,
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotes([newNote, ...notes]);
    onSaveNote?.(newNote);
    
    // Reset
    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNoteAttendees([]);
    setGeneratedSummary(null);
    setGeneratedActions([]);
    setRecordingDuration(0);
    setView('list');
  };

  const handleToggleActionItem = (noteId: string, actionId: string) => {
    setNotes(notes.map(n => {
      if (n.id === noteId) {
        return {
          ...n,
          actionItems: n.actionItems.map(a => 
            a.id === actionId ? { ...a, status: a.status === 'pending' ? 'completed' : 'pending' } : a
          ),
        };
      }
      return n;
    }));

    if (selectedNote?.id === noteId) {
      setSelectedNote({
        ...selectedNote,
        actionItems: selectedNote.actionItems.map(a => 
          a.id === actionId ? { ...a, status: a.status === 'pending' ? 'completed' : 'pending' } : a
        ),
      });
    }
  };

  const totalPendingActions = notes.reduce((sum, n) => sum + n.actionItems.filter(a => a.status === 'pending').length, 0);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="w-6 h-6 text-cyan-500" />
            <h2 className="text-xl font-semibold text-content-primary">
              {householdName ? `${householdName} Notes` : 'Meeting Notes'}
            </h2>
          </div>
          <p className="text-sm text-content-secondary mt-1">
            {filteredNotes.length} notes • {totalPendingActions} pending actions
          </p>
        </div>

        {view === 'list' && (
          <Button onClick={() => setView('new')}>
            <PlusIcon className="w-4 h-4 mr-1" />
            New Note
          </Button>
        )}

        {(view === 'detail' || view === 'new') && (
          <Button variant="secondary" onClick={() => { setView('list'); setSelectedNote(null); }}>
            ← Back to Notes
          </Button>
        )}
      </div>

      {/* List View */}
      {view === 'list' && (
        <div className="grid grid-cols-3 gap-6">
          {/* Notes list */}
          <div className="col-span-2 space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'this_week', label: 'This Week' },
                { value: 'this_month', label: 'This Month' },
                { value: 'has_actions', label: 'Has Actions' },
                { value: 'needs_follow_up', label: 'Needs Follow-up' },
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value as NoteCategory)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm transition-colors',
                    filter === f.value
                      ? 'bg-accent-primary text-white'
                      : 'bg-surface-secondary text-content-secondary hover:bg-surface-tertiary'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Notes */}
            <div className="space-y-3">
              {filteredNotes.length === 0 ? (
                <Card className="p-12 text-center">
                  <DocumentTextIcon className="w-12 h-12 mx-auto text-content-tertiary opacity-50 mb-4" />
                  <h3 className="text-lg font-medium text-content-primary mb-2">No meeting notes yet</h3>
                  <p className="text-content-secondary mb-4">
                    Capture your next client meeting with AI-powered notes
                  </p>
                  <Button onClick={() => setView('new')}>
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Create First Note
                  </Button>
                </Card>
              ) : (
                filteredNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    isSelected={selectedNote?.id === note.id}
                    onSelect={() => { setSelectedNote(note); setView('detail'); }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick stats */}
            <Card className="p-4">
              <h3 className="font-medium text-content-primary mb-3">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-content-secondary">Notes this month</span>
                  <span className="font-medium text-content-primary">
                    {notes.filter(n => new Date(n.date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-content-secondary">Pending actions</span>
                  <span className="font-medium text-amber-500">{totalPendingActions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-content-secondary">AI summaries</span>
                  <span className="font-medium text-purple-500">
                    {notes.filter(n => n.aiSummary).length}
                  </span>
                </div>
              </div>
            </Card>

            {/* Recent action items */}
            <Card className="p-4">
              <h3 className="font-medium text-content-primary mb-3">Pending Actions</h3>
              <div className="space-y-2">
                {notes
                  .flatMap(n => n.actionItems.filter(a => a.status === 'pending').map(a => ({ ...a, noteTitle: n.title })))
                  .slice(0, 5)
                  .map(action => (
                    <div key={action.id} className="p-2 rounded bg-surface-secondary">
                      <p className="text-sm text-content-primary line-clamp-1">{action.description}</p>
                      <p className="text-xs text-content-tertiary mt-1">{action.noteTitle}</p>
                    </div>
                  ))
                }
                {totalPendingActions === 0 && (
                  <p className="text-sm text-content-tertiary text-center py-4">No pending actions</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Detail View */}
      {view === 'detail' && selectedNote && (
        <div className="grid grid-cols-3 gap-6">
          {/* Main content */}
          <div className="col-span-2 space-y-4">
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-content-primary">{selectedNote.title}</h2>
                  <p className="text-content-secondary mt-1">{selectedNote.householdName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm">
                    <ShareIcon className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                  <Button variant="secondary" size="sm">
                    <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-6 mb-6 pb-6 border-b border-border">
                <div className="flex items-center gap-2 text-sm text-content-secondary">
                  <CalendarIcon className="w-4 h-4" />
                  {formatDate(selectedNote.date)}
                </div>
                <div className="flex items-center gap-2 text-sm text-content-secondary">
                  <ClockIcon className="w-4 h-4" />
                  {selectedNote.duration} minutes
                </div>
                <div className="flex items-center gap-2 text-sm text-content-secondary">
                  <UserGroupIcon className="w-4 h-4" />
                  {selectedNote.attendees.map(a => a.name).join(', ')}
                </div>
              </div>

              <h3 className="font-medium text-content-primary mb-2">Notes</h3>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-content-primary bg-transparent p-0 m-0">
                  {selectedNote.rawNotes}
                </pre>
              </div>
            </Card>

            {/* Action Items */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-content-primary">Action Items</h3>
                <Badge variant="warning" size="sm">
                  {selectedNote.actionItems.filter(a => a.status === 'pending').length} pending
                </Badge>
              </div>
              <div className="space-y-2">
                {selectedNote.actionItems.map(item => (
                  <ActionItemCard
                    key={item.id}
                    item={item}
                    onToggle={() => handleToggleActionItem(selectedNote.id, item.id)}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar - AI Summary */}
          <div className="space-y-4">
            {selectedNote.aiSummary && (
              <AISummaryCard summary={selectedNote.aiSummary} isGenerating={false} />
            )}

            {/* Topics */}
            <Card className="p-4">
              <h4 className="font-medium text-content-primary mb-3">Topics Discussed</h4>
              <div className="flex flex-wrap gap-2">
                {selectedNote.keyTopics.map(topic => (
                  <span key={topic} className="px-3 py-1 rounded-full bg-surface-secondary text-sm text-content-secondary">
                    {topic}
                  </span>
                ))}
              </div>
            </Card>

            {/* Generate email */}
            <Card className="p-4 border-cyan-500/30 bg-cyan-500/5">
              <div className="flex items-center gap-2 mb-3">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-cyan-500" />
                <h4 className="font-medium text-content-primary">Follow-up Email</h4>
              </div>
              <p className="text-sm text-content-secondary mb-3">
                Generate a professional follow-up email based on this meeting
              </p>
              <Button variant="secondary" className="w-full">
                <SparklesIcon className="w-4 h-4 mr-1" />
                Draft Email
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* New Note View */}
      {view === 'new' && (
        <div className="grid grid-cols-3 gap-6">
          {/* Main editor */}
          <div className="col-span-2 space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Meeting title..."
                  className="text-xl font-semibold text-content-primary bg-transparent border-none outline-none w-full"
                />
                <RecordingIndicator
                  isRecording={isRecording}
                  isPaused={isPaused}
                  duration={recordingDuration}
                  onStart={handleStartRecording}
                  onPause={handlePauseRecording}
                  onResume={handleResumeRecording}
                  onStop={handleStopRecording}
                />
              </div>

              <textarea
                ref={textareaRef}
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Start typing your meeting notes...

Tips:
• Note key discussion points
• Capture client concerns and questions
• Record any decisions made
• List action items and who's responsible"
                rows={20}
                className="w-full px-0 py-4 bg-transparent border-none outline-none resize-none text-content-primary placeholder:text-content-tertiary"
              />
            </Card>

            {/* Save actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={handleGenerateAISummary}
                  disabled={!newNoteContent.trim() || isGeneratingAI}
                >
                  {isGeneratingAI ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-4 h-4 mr-1" />
                      Generate AI Summary
                    </>
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setView('list')}>
                  Cancel
                </Button>
                <Button onClick={handleSaveNote} disabled={!newNoteContent.trim()}>
                  Save Note
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* AI Insights */}
            {(isGeneratingAI || generatedSummary) && (
              <AISummaryCard
                summary={generatedSummary || {
                  overview: '',
                  keyPoints: [],
                  clientConcerns: [],
                  opportunities: [],
                  nextSteps: [],
                }}
                isGenerating={isGeneratingAI}
              />
            )}

            {/* Generated Actions */}
            {generatedActions.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircleIcon className="w-5 h-5 text-amber-500" />
                  <h4 className="font-medium text-content-primary">Extracted Actions</h4>
                </div>
                <div className="space-y-2">
                  {generatedActions.map(action => (
                    <div key={action.id} className="p-2 rounded bg-surface-secondary">
                      <p className="text-sm text-content-primary">{action.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-content-tertiary">Due: {formatDate(action.dueDate!)}</span>
                        <Badge variant={action.priority === 'high' ? 'warning' : 'default'} size="sm">
                          {action.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* AI prompts */}
            {!generatedSummary && !isGeneratingAI && (
              <Card className="p-4 border-purple-500/30 bg-purple-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <SparklesIcon className="w-5 h-5 text-purple-500" />
                  <h4 className="font-medium text-content-primary">AI Assistant</h4>
                </div>
                <p className="text-sm text-content-secondary mb-4">
                  After writing your notes, AI can help you:
                </p>
                <div className="space-y-2">
                  {AI_INSIGHT_PROMPTS.map((prompt, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-content-secondary">
                      <span>{prompt.icon}</span>
                      {prompt.label}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Attendees */}
            <Card className="p-4">
              <h4 className="font-medium text-content-primary mb-3">Attendees</h4>
              <div className="space-y-2">
                {newNoteAttendees.map(attendee => (
                  <div key={attendee.id} className="flex items-center justify-between p-2 rounded bg-surface-secondary">
                    <span className="text-sm text-content-primary">{attendee.name}</span>
                    <Badge variant="default" size="sm">{attendee.role}</Badge>
                  </div>
                ))}
                <button className="w-full p-2 rounded border border-dashed border-border text-sm text-content-tertiary hover:border-accent-primary hover:text-accent-primary transition-colors">
                  <PlusIcon className="w-4 h-4 inline mr-1" />
                  Add attendee
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export { SAMPLE_NOTES as EXAMPLE_MEETING_NOTES };
