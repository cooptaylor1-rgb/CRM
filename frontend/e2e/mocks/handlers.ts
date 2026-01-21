/**
 * MSW (Mock Service Worker) handlers for E2E testing
 * These mocks allow tests to run without a real backend
 */
import { http, HttpResponse } from 'msw';

// Mock user data
const mockUser = {
  id: '1',
  email: 'admin@example.com',
  name: 'Test Admin',
  role: 'admin',
};

// Mock JWT token (not cryptographically secure - for testing only)
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxODAwMDAwMDAwfQ.mock-signature';

// Mock dashboard data
const mockDashboard = {
  overview: {
    totalAUM: 125000000,
    totalClients: 150,
    activeHouseholds: 75,
    monthlyRevenue: 125000,
    aumGrowth: 8.5,
    clientGrowth: 12,
    revenueGrowth: 15.2,
  },
  recentActivity: [
    { id: '1', type: 'meeting', description: 'Client meeting scheduled', timestamp: new Date().toISOString() },
    { id: '2', type: 'task', description: 'Review portfolio allocations', timestamp: new Date().toISOString() },
    { id: '3', type: 'document', description: 'New document uploaded', timestamp: new Date().toISOString() },
  ],
  goals: [
    { id: '1', name: 'AUM Growth', target: 150000000, current: 125000000, progress: 83 },
    { id: '2', name: 'New Clients', target: 200, current: 150, progress: 75 },
  ],
  topClients: [
    { id: '1', name: 'Johnson Family Trust', aum: 5000000 },
    { id: '2', name: 'Smith Investment Holdings', aum: 3500000 },
  ],
  upcomingMeetings: [
    { id: '1', title: 'Quarterly Review', startTime: new Date(Date.now() + 86400000).toISOString(), householdName: 'Johnson Family' },
  ],
  alerts: [
    { id: '1', message: 'Compliance review required', severity: 'warning', count: 3 },
    { id: '2', message: 'Client documents expiring', severity: 'info', count: 5 },
  ],
};

// Mock households data
const mockHouseholds = [
  { id: '1', name: 'Johnson Family Trust', totalValue: 5000000, members: 4, status: 'active' },
  { id: '2', name: 'Smith Investment Holdings', totalValue: 3500000, members: 2, status: 'active' },
  { id: '3', name: 'Williams Retirement Fund', totalValue: 2000000, members: 1, status: 'active' },
];

// Mock tasks data
const mockTasks = [
  { id: '1', title: 'Review Q4 Reports', dueDate: new Date(Date.now() + 86400000).toISOString(), status: 'pending', priority: 'high' },
  { id: '2', title: 'Client follow-up call', dueDate: new Date(Date.now() + 172800000).toISOString(), status: 'pending', priority: 'medium' },
  { id: '3', title: 'Update compliance documentation', dueDate: new Date(Date.now() + 259200000).toISOString(), status: 'in_progress', priority: 'high' },
];

export const handlers = [
  // Auth endpoints
  http.post('*/api/auth/login', async () => {
    return HttpResponse.json({
      access_token: mockToken,
      user: mockUser,
    });
  }),

  http.post('*/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  http.get('*/api/auth/me', () => {
    return HttpResponse.json(mockUser);
  }),

  // Dashboard endpoints
  http.get('*/api/analytics/dashboard', () => {
    return HttpResponse.json(mockDashboard);
  }),

  // Households endpoints
  http.get('*/api/households', () => {
    return HttpResponse.json(mockHouseholds);
  }),

  http.get('*/api/households/:id', ({ params }) => {
    const household = mockHouseholds.find(h => h.id === params.id);
    if (!household) {
      return HttpResponse.json({ message: 'Household not found' }, { status: 404 });
    }
    return HttpResponse.json(household);
  }),

  // Tasks endpoints
  http.get('*/api/tasks', () => {
    return HttpResponse.json(mockTasks);
  }),

  http.post('*/api/tasks', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: crypto.randomUUID(), ...body }, { status: 201 });
  }),

  // Documents endpoints
  http.get('*/api/documents', () => {
    return HttpResponse.json([
      { id: '1', name: 'Q4 Report.pdf', type: 'report', uploadedAt: new Date().toISOString() },
      { id: '2', name: 'Client Agreement.pdf', type: 'agreement', uploadedAt: new Date().toISOString() },
    ]);
  }),

  // Notifications endpoints
  http.get('*/api/notifications', () => {
    return HttpResponse.json([
      { id: '1', title: 'New task assigned', read: false, createdAt: new Date().toISOString() },
      { id: '2', title: 'Meeting reminder', read: false, createdAt: new Date().toISOString() },
    ]);
  }),

  // Analytics endpoints
  http.get('*/api/analytics/*', () => {
    return HttpResponse.json({ data: [], total: 0 });
  }),

  // Catch-all for other API requests
  http.all('*/api/*', () => {
    return HttpResponse.json({ data: [] });
  }),
];
