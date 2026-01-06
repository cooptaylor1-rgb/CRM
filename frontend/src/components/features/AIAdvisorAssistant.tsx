'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  PhoneIcon,
  EnvelopeIcon,
  XMarkIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  BellAlertIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

// ============================================
// Types
// ============================================

export type MessageRole = 'user' | 'assistant';
export type SuggestionType = 'query' | 'action' | 'insight' | 'alert';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  suggestions?: QuickSuggestion[];
  actions?: ActionCard[];
  data?: any;
}

export interface QuickSuggestion {
  id: string;
  type: SuggestionType;
  label: string;
  query: string;
  icon: React.ComponentType<any>;
}

export interface ActionCard {
  id: string;
  title: string;
  description: string;
  type: 'meeting' | 'call' | 'email' | 'task' | 'review';
  priority: 'low' | 'medium' | 'high';
  client?: string;
  dueDate?: Date;
}

export interface ClientResult {
  id: string;
  name: string;
  aum: number;
  lastContact: Date;
  status: string;
  riskScore: number;
}

export interface AIAdvisorAssistantProps {
  className?: string;
  onClientClick?: (clientId: string) => void;
  onScheduleMeeting?: (clientId: string) => void;
  onSendEmail?: (clientId: string) => void;
}

// ============================================
// Mock AI Response Generator
// ============================================

const SAMPLE_RESPONSES: Record<string, { content: string; data?: any; actions?: ActionCard[] }> = {
  'clients over 1m': {
    content: "I found **23 clients** with AUM over $1M. Here are the top 5 by assets:",
    data: {
      type: 'client_list',
      clients: [
        { id: '1', name: 'Johnson Family Trust', aum: 4500000, lastContact: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), status: 'Active', riskScore: 85 },
        { id: '2', name: 'Chen Family Office', aum: 3200000, lastContact: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), status: 'Active', riskScore: 72 },
        { id: '3', name: 'Williams Revocable Trust', aum: 2800000, lastContact: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), status: 'Active', riskScore: 90 },
        { id: '4', name: 'Davis 401k', aum: 2100000, lastContact: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), status: 'At Risk', riskScore: 45 },
        { id: '5', name: 'Martinez IRA', aum: 1850000, lastContact: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), status: 'Active', riskScore: 88 },
      ],
    },
  },
  'no contact 90 days': {
    content: "Found **8 clients** with no contact in the last 90 days. Here are those who need immediate attention:",
    data: {
      type: 'client_list',
      clients: [
        { id: '4', name: 'Davis 401k', aum: 2100000, lastContact: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000), status: 'At Risk', riskScore: 45 },
        { id: '6', name: 'Thompson Joint', aum: 890000, lastContact: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), status: 'At Risk', riskScore: 35 },
        { id: '7', name: 'Anderson Trust', aum: 1200000, lastContact: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), status: 'At Risk', riskScore: 52 },
      ],
    },
    actions: [
      { id: 'a1', title: 'Schedule check-in calls', description: 'Book 30-min calls with at-risk clients', type: 'call', priority: 'high' },
      { id: 'a2', title: 'Send re-engagement email', description: 'Personalized outreach to inactive clients', type: 'email', priority: 'medium' },
    ],
  },
  'meeting prep': {
    content: "Here's your **meeting prep brief** for tomorrow's appointments:",
    data: {
      type: 'meeting_prep',
      meetings: [
        { client: 'Johnson Family', time: '9:00 AM', type: 'Annual Review', notes: 'Discuss estate planning updates, review beneficiaries', aum: 4500000, sentiment: 'positive' },
        { client: 'Williams Trust', time: '2:00 PM', type: 'Portfolio Review', notes: 'Address concerns about tech allocation, discuss tax-loss harvesting', aum: 2800000, sentiment: 'neutral' },
      ],
    },
  },
  'default': {
    content: "I can help you with:\n\n• **Finding clients** - \"Show me clients with AUM over $1M\"\n• **Identifying at-risk accounts** - \"Who hasn't been contacted in 90 days?\"\n• **Meeting preparation** - \"Prepare me for tomorrow's meetings\"\n• **Next best actions** - \"What should I focus on today?\"\n\nWhat would you like to know?",
  },
};

const processQuery = (query: string): { content: string; data?: any; actions?: ActionCard[] } => {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('1m') || lowerQuery.includes('million') || lowerQuery.includes('over')) {
    return SAMPLE_RESPONSES['clients over 1m'];
  }
  if (lowerQuery.includes('90 days') || lowerQuery.includes('no contact') || lowerQuery.includes('inactive')) {
    return SAMPLE_RESPONSES['no contact 90 days'];
  }
  if (lowerQuery.includes('meeting') || lowerQuery.includes('prep') || lowerQuery.includes('tomorrow')) {
    return SAMPLE_RESPONSES['meeting prep'];
  }
  
  return SAMPLE_RESPONSES['default'];
};

// ============================================
// Sub-Components
// ============================================

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
};

const formatTimeAgo = (date: Date): string => {
  const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
};

const QuickSuggestions: React.FC<{ onSelect: (query: string) => void }> = ({ onSelect }) => {
  const suggestions: QuickSuggestion[] = [
    { id: '1', type: 'query', label: 'Clients over $1M AUM', query: 'Show me clients with AUM over $1M', icon: UserGroupIcon },
    { id: '2', type: 'alert', label: 'At-risk clients', query: 'Who hasn\'t been contacted in 90 days?', icon: ExclamationTriangleIcon },
    { id: '3', type: 'action', label: 'Tomorrow\'s meetings', query: 'Prepare me for tomorrow\'s meetings', icon: CalendarIcon },
    { id: '4', type: 'insight', label: 'Today\'s priorities', query: 'What should I focus on today?', icon: LightBulbIcon },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((s) => {
        const Icon = s.icon;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.query)}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-2 transition-colors"
          >
            <Icon className="w-4 h-4" />
            {s.label}
          </button>
        );
      })}
    </div>
  );
};

const ClientListResult: React.FC<{ clients: ClientResult[]; onClientClick?: (id: string) => void }> = ({ clients, onClientClick }) => (
  <div className="space-y-2 mt-3">
    {clients.map((client) => (
      <button
        key={client.id}
        onClick={() => onClientClick?.(client.id)}
        className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors text-left"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-gray-900 dark:text-white">{client.name}</span>
          <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(client.aum)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Last contact: {formatTimeAgo(client.lastContact)}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            client.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {client.status}
          </span>
        </div>
      </button>
    ))}
  </div>
);

const MeetingPrepResult: React.FC<{ meetings: any[] }> = ({ meetings }) => (
  <div className="space-y-3 mt-3">
    {meetings.map((meeting, i) => (
      <div key={i} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-gray-900 dark:text-white">{meeting.client}</span>
          </div>
          <span className="text-sm text-gray-500">{meeting.time}</span>
        </div>
        <p className="text-sm text-blue-600 mb-2">{meeting.type}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300">{meeting.notes}</p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <span className="text-sm text-gray-500">AUM: {formatCurrency(meeting.aum)}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            meeting.sentiment === 'positive' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {meeting.sentiment} sentiment
          </span>
        </div>
      </div>
    ))}
  </div>
);

const ActionCards: React.FC<{ actions: ActionCard[] }> = ({ actions }) => (
  <div className="flex gap-2 mt-3 flex-wrap">
    {actions.map((action) => (
      <button
        key={action.id}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
      >
        {action.type === 'call' && <PhoneIcon className="w-4 h-4" />}
        {action.type === 'email' && <EnvelopeIcon className="w-4 h-4" />}
        {action.title}
      </button>
    ))}
  </div>
);

const MessageBubble: React.FC<{ message: ChatMessage; onClientClick?: (id: string) => void }> = ({ message, onClientClick }) => {
  const isUser = message.role === 'user';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Assistant</span>
          </div>
        )}
        <div className={`px-4 py-3 rounded-2xl ${
          isUser 
            ? 'bg-blue-600 text-white rounded-br-md' 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
        }`}>
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        </div>
        
        {message.data?.type === 'client_list' && (
          <ClientListResult clients={message.data.clients} onClientClick={onClientClick} />
        )}
        
        {message.data?.type === 'meeting_prep' && (
          <MeetingPrepResult meetings={message.data.meetings} />
        )}
        
        {message.actions && <ActionCards actions={message.actions} />}
        
        <p className="text-xs text-gray-400 mt-1 px-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
};

// ============================================
// Main Component
// ============================================

export const AIAdvisorAssistant: React.FC<AIAdvisorAssistantProps> = ({
  className = '',
  onClientClick,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));

    const response = processQuery(query);
    
    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      data: response.data,
      actions: response.actions,
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  }, []);

  const handleVoice = useCallback(() => {
    setIsRecording(!isRecording);
    // In a real app, this would integrate with speech recognition
    if (isRecording) {
      setInput('Show me clients with AUM over $1M');
    }
  }, [isRecording]);

  return (
    <div className={`flex flex-col h-[600px] bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-white">AI Advisor Assistant</h2>
            <p className="text-sm text-white/70">Ask me anything about your clients</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              How can I help you today?
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Ask me about your clients, upcoming meetings, or what you should prioritize today.
            </p>
            <QuickSuggestions onSelect={handleSend} />
          </div>
        ) : (
          <>
            {messages.map(message => (
              <MessageBubble
                key={message.id}
                message={message}
                onClientClick={onClientClick}
              />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <ArrowPathIcon className="w-4 h-4 text-white animate-spin" />
                </div>
                <span className="text-sm">Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={handleVoice}
            className={`p-3 rounded-xl transition-colors ${
              isRecording 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <MicrophoneIcon className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend(input)}
              placeholder="Ask about clients, meetings, or tasks..."
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600 transition-colors"
            />
          </div>
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAdvisorAssistant;
