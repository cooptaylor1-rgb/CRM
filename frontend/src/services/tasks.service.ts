import api from './api';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  assignedTo?: string;
  assignedBy?: string;
  householdId?: string;
  personId?: string;
  accountId?: string;
  dueDate?: string;
  completedAt?: string;
  completedBy?: string;
  parentTaskId?: string;
  tags: string[];
  reminderAt?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilter {
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string;
  householdId?: string;
  dueBefore?: string;
  dueAfter?: string;
  overdue?: boolean;
}

export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: string;
  category?: string;
  assignedTo?: string;
  householdId?: string;
  personId?: string;
  accountId?: string;
  dueDate?: string;
  parentTaskId?: string;
  tags?: string[];
  reminderAt?: string;
  estimatedMinutes?: number;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string;
  dueDate?: string;
  tags?: string[];
  reminderAt?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
}

// Helper to ensure array response
const ensureArray = <T>(data: unknown): T[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.tasks)) return obj.tasks as T[];
    if (Array.isArray(obj.items)) return obj.items as T[];
  }
  return [];
};

export const tasksService = {
  async getAll(filter?: TaskFilter): Promise<Task[]> {
    const response = await api.get('/api/tasks', { params: filter });
    return ensureArray<Task>(response.data);
  },

  async getMyTasks(): Promise<Task[]> {
    const response = await api.get('/api/tasks/my-tasks');
    return ensureArray<Task>(response.data);
  },

  async getOverdue(): Promise<Task[]> {
    const response = await api.get('/api/tasks/overdue');
    return ensureArray<Task>(response.data);
  },

  async getDueSoon(days: number = 7): Promise<Task[]> {
    const response = await api.get('/api/tasks/due-soon', { params: { days } });
    return ensureArray<Task>(response.data);
  },

  async getStats(userId?: string): Promise<TaskStats> {
    const response = await api.get('/api/tasks/stats', { params: userId ? { userId } : {} });
    return response.data;
  },

  async getByHousehold(householdId: string): Promise<Task[]> {
    const response = await api.get(`/api/tasks/household/${householdId}`);
    return response.data;
  },

  async getById(id: string): Promise<Task> {
    const response = await api.get(`/api/tasks/${id}`);
    return response.data;
  },

  async getSubtasks(parentId: string): Promise<Task[]> {
    const response = await api.get(`/api/tasks/${parentId}/subtasks`);
    return response.data;
  },

  async create(task: CreateTaskDto): Promise<Task> {
    const response = await api.post('/api/tasks', task);
    return response.data;
  },

  async update(id: string, task: UpdateTaskDto): Promise<Task> {
    const response = await api.put(`/api/tasks/${id}`, task);
    return response.data;
  },

  async complete(id: string, actualMinutes?: number): Promise<Task> {
    const response = await api.put(`/api/tasks/${id}/complete`, { actualMinutes });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/tasks/${id}`);
  },

  async createBulk(tasks: CreateTaskDto[]): Promise<Task[]> {
    const response = await api.post('/api/tasks/bulk', tasks);
    return response.data;
  },
};

export default tasksService;
