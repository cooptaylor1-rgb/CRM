/**
 * Global Search Service
 * Unified search across all entities with intelligent ranking
 */
import api from './api';

// Types
export type SearchEntityType = 
  | 'household' | 'account' | 'person' | 'entity' 
  | 'document' | 'task' | 'meeting' | 'invoice' 
  | 'prospect' | 'workflow';

export interface SearchResult {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  icon?: string;
  score: number;
  highlights?: {
    field: string;
    snippet: string;
  }[];
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  totalCount: number;
  facets?: {
    type: Record<SearchEntityType, number>;
    status?: Record<string, number>;
  };
  timing: number;
}

export interface SearchOptions {
  types?: SearchEntityType[];
  limit?: number;
  offset?: number;
  dateFrom?: string;
  dateTo?: string;
  status?: string[];
  sortBy?: 'relevance' | 'recent' | 'alphabetical';
}

export interface RecentSearch {
  id: string;
  query: string;
  resultCount: number;
  timestamp: string;
}

export interface QuickAction {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  icon: string;
  url?: string;
  action?: () => void;
  category: 'navigation' | 'action' | 'create';
}

// Mock data
const mockResults: Record<string, SearchResult[]> = {
  anderson: [
    {
      id: 'h1',
      type: 'household',
      title: 'Anderson Family',
      subtitle: 'Platinum • $12.5M AUM',
      description: 'Primary: James Anderson, Sarah Anderson',
      url: '/households/h1',
      icon: 'users',
      score: 0.98,
      highlights: [{ field: 'name', snippet: '<mark>Anderson</mark> Family' }],
      metadata: { status: 'active', tier: 'platinum', aum: 12500000 },
    },
    {
      id: 'p1',
      type: 'person',
      title: 'James Anderson',
      subtitle: 'Primary Contact',
      description: 'Anderson Family • james.anderson@email.com',
      url: '/clients/p1',
      icon: 'user',
      score: 0.95,
      highlights: [{ field: 'lastName', snippet: '<mark>Anderson</mark>' }],
      metadata: { householdId: 'h1', isPrimaryContact: true },
    },
    {
      id: 'p2',
      type: 'person',
      title: 'Sarah Anderson',
      subtitle: 'Spouse',
      description: 'Anderson Family • sarah.anderson@email.com',
      url: '/clients/p2',
      icon: 'user',
      score: 0.95,
      highlights: [{ field: 'lastName', snippet: '<mark>Anderson</mark>' }],
      metadata: { householdId: 'h1', isPrimaryContact: false },
    },
    {
      id: 'acc1',
      type: 'account',
      title: 'Anderson Family Trust',
      subtitle: 'Revocable Trust • $8.5M',
      description: 'Schwab ***4567',
      url: '/accounts/acc1',
      icon: 'briefcase',
      score: 0.90,
      highlights: [{ field: 'name', snippet: '<mark>Anderson</mark> Family Trust' }],
      metadata: { householdId: 'h1', custodian: 'schwab' },
    },
    {
      id: 'd1',
      type: 'document',
      title: 'Investment Management Agreement - Anderson Family',
      subtitle: 'Signed • Jan 15, 2024',
      description: 'IMA for discretionary portfolio management',
      url: '/documents/d1',
      icon: 'document',
      score: 0.85,
      highlights: [{ field: 'title', snippet: 'IMA - <mark>Anderson</mark> Family' }],
    },
  ],
  chen: [
    {
      id: 'h2',
      type: 'household',
      title: 'Chen Family Trust',
      subtitle: 'Platinum • $45M AUM',
      description: 'Primary: Michael Chen',
      url: '/households/h2',
      icon: 'users',
      score: 0.98,
      metadata: { status: 'active', tier: 'platinum', aum: 45000000 },
    },
    {
      id: 'p3',
      type: 'person',
      title: 'Michael Chen',
      subtitle: 'Primary Contact',
      description: 'Chen Family Trust • michael.chen@email.com',
      url: '/clients/p3',
      icon: 'user',
      score: 0.95,
    },
  ],
  meeting: [
    {
      id: 'm1',
      type: 'meeting',
      title: 'Portfolio Review - Chen Family',
      subtitle: 'Today at 2:00 PM',
      description: 'Quarterly portfolio review and rebalancing discussion',
      url: '/meetings/m1',
      icon: 'calendar',
      score: 0.90,
    },
    {
      id: 'm2',
      type: 'meeting',
      title: 'Annual Review - Anderson Family',
      subtitle: 'Jan 15, 2025 at 10:00 AM',
      description: 'Annual financial plan review',
      url: '/meetings/m2',
      icon: 'calendar',
      score: 0.88,
    },
  ],
  invoice: [
    {
      id: 'inv1',
      type: 'invoice',
      title: 'INV-2024-001 - Anderson Family',
      subtitle: 'Paid • $31,250',
      description: 'Q4 2024 Management Fees',
      url: '/billing/inv1',
      icon: 'receipt',
      score: 0.92,
    },
    {
      id: 'inv3',
      type: 'invoice',
      title: 'INV-2024-003 - Williams Household',
      subtitle: 'Overdue • $1,875',
      description: 'Q4 2024 Management Fees',
      url: '/billing/inv3',
      icon: 'receipt',
      score: 0.88,
    },
  ],
};

const recentSearches: RecentSearch[] = [
  { id: 'rs1', query: 'Anderson', resultCount: 5, timestamp: new Date(Date.now() - 60000).toISOString() },
  { id: 'rs2', query: 'Q4 invoices', resultCount: 3, timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'rs3', query: 'expiring KYC', resultCount: 2, timestamp: new Date(Date.now() - 86400000).toISOString() },
];

const quickActions: QuickAction[] = [
  // Navigation
  { id: 'nav-dashboard', label: 'Go to Dashboard', shortcut: 'G D', icon: 'home', url: '/dashboard', category: 'navigation' },
  { id: 'nav-households', label: 'Go to Households', shortcut: 'G H', icon: 'users', url: '/households', category: 'navigation' },
  { id: 'nav-accounts', label: 'Go to Accounts', shortcut: 'G A', icon: 'briefcase', url: '/accounts', category: 'navigation' },
  { id: 'nav-clients', label: 'Go to Clients', shortcut: 'G C', icon: 'user', url: '/clients', category: 'navigation' },
  { id: 'nav-tasks', label: 'Go to Tasks', shortcut: 'G T', icon: 'check-square', url: '/tasks', category: 'navigation' },
  { id: 'nav-pipeline', label: 'Go to Pipeline', shortcut: 'G P', icon: 'trending-up', url: '/pipeline', category: 'navigation' },
  { id: 'nav-documents', label: 'Go to Documents', shortcut: 'G O', icon: 'folder', url: '/documents', category: 'navigation' },
  { id: 'nav-billing', label: 'Go to Billing', shortcut: 'G B', icon: 'credit-card', url: '/billing', category: 'navigation' },
  { id: 'nav-analytics', label: 'Go to Analytics', shortcut: 'G Y', icon: 'bar-chart', url: '/analytics', category: 'navigation' },
  
  // Create actions
  { id: 'create-household', label: 'New Household', shortcut: 'N H', icon: 'plus', url: '/households?create=true', category: 'create' },
  { id: 'create-account', label: 'New Account', shortcut: 'N A', icon: 'plus', url: '/accounts?create=true', category: 'create' },
  { id: 'create-task', label: 'New Task', shortcut: 'N T', icon: 'plus', url: '/tasks?create=true', category: 'create' },
  { id: 'create-meeting', label: 'Schedule Meeting', shortcut: 'N M', icon: 'calendar', url: '/meetings?create=true', category: 'create' },
  { id: 'create-prospect', label: 'Add Prospect', shortcut: 'N P', icon: 'user-plus', url: '/pipeline?create=true', category: 'create' },
  { id: 'upload-document', label: 'Upload Document', shortcut: 'N D', icon: 'upload', url: '/documents?upload=true', category: 'create' },
  
  // Actions
  { id: 'action-search', label: 'Search', shortcut: '/', icon: 'search', category: 'action' },
  { id: 'action-notifications', label: 'View Notifications', shortcut: 'N O', icon: 'bell', category: 'action' },
  { id: 'action-settings', label: 'Settings', shortcut: ',', icon: 'settings', url: '/settings', category: 'action' },
  { id: 'action-help', label: 'Help & Support', shortcut: '?', icon: 'help-circle', category: 'action' },
];

export const searchService = {
  // Global search
  async search(query: string, options?: SearchOptions): Promise<SearchResponse> {
    const startTime = Date.now();
    
    try {
      const response = await api.get('/api/search', { 
        params: { query, ...options } 
      });
      return response.data;
    } catch {
      // Mock search implementation
      const normalizedQuery = query.toLowerCase().trim();
      let results: SearchResult[] = [];
      
      // Search across mock data
      Object.entries(mockResults).forEach(([key, items]) => {
        if (key.includes(normalizedQuery) || normalizedQuery.includes(key)) {
          results.push(...items);
        }
      });
      
      // Filter by types if specified
      if (options?.types && options.types.length > 0) {
        results = results.filter(r => options.types!.includes(r.type));
      }
      
      // Sort by score (relevance)
      results.sort((a, b) => b.score - a.score);
      
      // Apply limit
      const limit = options?.limit || 20;
      results = results.slice(0, limit);
      
      const timing = Date.now() - startTime;
      
      return {
        query,
        results,
        totalCount: results.length,
        facets: {
          type: results.reduce((acc, r) => {
            acc[r.type] = (acc[r.type] || 0) + 1;
            return acc;
          }, {} as Record<SearchEntityType, number>),
        },
        timing,
      };
    }
  },

  // Quick search (for command palette)
  async quickSearch(query: string): Promise<SearchResult[]> {
    const response = await this.search(query, { limit: 5 });
    return response.results;
  },

  // Search within a specific entity type
  async searchByType(
    type: SearchEntityType, 
    query: string, 
    options?: Omit<SearchOptions, 'types'>
  ): Promise<SearchResponse> {
    return this.search(query, { ...options, types: [type] });
  },

  // Get recent searches
  async getRecentSearches(limit: number = 5): Promise<RecentSearch[]> {
    try {
      const response = await api.get('/api/search/recent', { params: { limit } });
      return response.data;
    } catch {
      return recentSearches.slice(0, limit);
    }
  },

  // Save recent search
  async saveRecentSearch(query: string, resultCount: number): Promise<void> {
    try {
      await api.post('/api/search/recent', { query, resultCount });
    } catch {
      // Add to mock data
      recentSearches.unshift({
        id: `rs-${Date.now()}`,
        query,
        resultCount,
        timestamp: new Date().toISOString(),
      });
      // Keep only last 10
      if (recentSearches.length > 10) {
        recentSearches.pop();
      }
    }
  },

  // Clear recent searches
  async clearRecentSearches(): Promise<void> {
    try {
      await api.delete('/api/search/recent');
    } catch {
      recentSearches.length = 0;
    }
  },

  // Get quick actions
  getQuickActions(filter?: { category?: string; query?: string }): QuickAction[] {
    let actions = [...quickActions];
    
    if (filter?.category) {
      actions = actions.filter(a => a.category === filter.category);
    }
    
    if (filter?.query) {
      const query = filter.query.toLowerCase();
      actions = actions.filter(a => 
        a.label.toLowerCase().includes(query) ||
        a.description?.toLowerCase().includes(query)
      );
    }
    
    return actions;
  },

  // Get search suggestions
  async getSuggestions(query: string): Promise<string[]> {
    try {
      const response = await api.get('/api/search/suggestions', { params: { query } });
      return response.data;
    } catch {
      const suggestions: string[] = [];
      const q = query.toLowerCase();
      
      // Generate suggestions based on mock data
      if ('anderson'.includes(q)) suggestions.push('Anderson Family');
      if ('chen'.includes(q)) suggestions.push('Chen Family Trust');
      if ('williams'.includes(q)) suggestions.push('Williams Household');
      if ('martinez'.includes(q)) suggestions.push('Martinez Family');
      if ('invoice'.includes(q) || 'billing'.includes(q)) suggestions.push('Q4 invoices', 'Overdue invoices');
      if ('meeting'.includes(q)) suggestions.push('Upcoming meetings', 'Meeting this week');
      if ('kyc'.includes(q)) suggestions.push('Expiring KYC', 'KYC verification');
      if ('task'.includes(q)) suggestions.push('Overdue tasks', 'My tasks');
      
      return suggestions.slice(0, 5);
    }
  },

  // Get entity type display info
  getTypeInfo(type: SearchEntityType): { label: string; icon: string; color: string } {
    const typeMap: Record<SearchEntityType, { label: string; icon: string; color: string }> = {
      household: { label: 'Household', icon: 'users', color: 'blue' },
      account: { label: 'Account', icon: 'briefcase', color: 'green' },
      person: { label: 'Client', icon: 'user', color: 'purple' },
      entity: { label: 'Entity', icon: 'building', color: 'orange' },
      document: { label: 'Document', icon: 'file-text', color: 'gray' },
      task: { label: 'Task', icon: 'check-square', color: 'yellow' },
      meeting: { label: 'Meeting', icon: 'calendar', color: 'cyan' },
      invoice: { label: 'Invoice', icon: 'receipt', color: 'emerald' },
      prospect: { label: 'Prospect', icon: 'user-plus', color: 'pink' },
      workflow: { label: 'Workflow', icon: 'git-branch', color: 'indigo' },
    };
    
    return typeMap[type] || { label: type, icon: 'circle', color: 'gray' };
  },

  // Highlight search matches in text
  highlightMatches(text: string, query: string): string {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  },
};

export default searchService;
