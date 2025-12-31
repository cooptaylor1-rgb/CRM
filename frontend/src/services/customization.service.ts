// Customization Service - Custom Fields, Tags, Saved Views, User Preferences
import api from './api';

// Types
export type FieldType = 
  | 'text' | 'textarea' | 'number' | 'currency' | 'percentage' 
  | 'date' | 'datetime' | 'boolean' | 'select' | 'multi_select' 
  | 'email' | 'phone' | 'url' | 'user' | 'household' | 'account';

export type EntityTarget = 
  | 'household' | 'person' | 'account' | 'entity' 
  | 'meeting' | 'task' | 'document' | 'prospect';

export type ViewType = 'table' | 'card' | 'kanban' | 'timeline' | 'calendar';

export interface FieldOption {
  value: string;
  label: string;
  color?: string;
}

export interface CustomFieldDefinition {
  id: string;
  firmId: string;
  fieldName: string;
  fieldKey: string;
  fieldType: FieldType;
  entityTarget: EntityTarget;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  isRequired: boolean;
  isActive: boolean;
  showInList: boolean;
  showInDetail: boolean;
  isSearchable: boolean;
  isFilterable: boolean;
  displayOrder: number;
  fieldGroup?: string;
  options?: {
    choices?: FieldOption[];
    min?: number;
    max?: number;
    precision?: number;
    maxLength?: number;
    pattern?: string;
    validationMessage?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CustomFieldValue {
  id: string;
  fieldDefinitionId: string;
  entityType: string;
  entityId: string;
  textValue?: string;
  numberValue?: number;
  booleanValue?: boolean;
  dateValue?: string;
  jsonValue?: any;
  fieldDefinition?: CustomFieldDefinition;
}

export interface Tag {
  id: string;
  firmId: string;
  name: string;
  category?: string;
  color: string;
  icon?: string;
  description?: string;
  parentId?: string;
  usageCount: number;
  isActive: boolean;
  children?: Tag[];
  parent?: Tag;
}

export interface SavedView {
  id: string;
  userId: string;
  firmId: string;
  name: string;
  description?: string;
  entityType: string;
  viewType: ViewType;
  isShared: boolean;
  isDefault: boolean;
  isPinned: boolean;
  columns?: Array<{
    key: string;
    label: string;
    width?: number;
    visible: boolean;
    sortable?: boolean;
    filterable?: boolean;
  }>;
  filters?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  sorting?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  grouping?: {
    enabled: boolean;
    field?: string;
    collapsed?: boolean;
  };
  display?: {
    density?: 'compact' | 'normal' | 'comfortable';
    showGridLines?: boolean;
    alternateRowColors?: boolean;
    pageSize?: number;
  };
  icon?: string;
  color?: string;
  usageCount: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreference {
  id: string;
  userId: string;
  firmId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  dashboardLayout?: any;
  tablePreferences?: Record<string, any>;
  sidebarState?: {
    collapsed: boolean;
    width: number;
  };
  recentItems: Array<{
    type: string;
    id: string;
    name: string;
    accessedAt: string;
  }>;
  favorites: Array<{
    type: string;
    id: string;
    name: string;
  }>;
  shortcuts: Array<{
    key: string;
    action: string;
  }>;
}

// Custom Fields API
export const customizationService = {
  // Custom Field Definitions
  getCustomFields: async (options?: {
    entityTarget?: EntityTarget;
    includeInactive?: boolean;
    fieldGroup?: string;
  }): Promise<CustomFieldDefinition[]> => {
    const response = await api.get('/customization/fields', { params: options });
    return response.data;
  },

  getCustomField: async (id: string): Promise<CustomFieldDefinition> => {
    const response = await api.get(`/customization/fields/${id}`);
    return response.data;
  },

  createCustomField: async (data: {
    fieldName: string;
    fieldKey: string;
    fieldType: FieldType;
    entityTarget: EntityTarget;
    description?: string;
    placeholder?: string;
    defaultValue?: string;
    isRequired?: boolean;
    showInList?: boolean;
    showInDetail?: boolean;
    isSearchable?: boolean;
    isFilterable?: boolean;
    displayOrder?: number;
    fieldGroup?: string;
    options?: CustomFieldDefinition['options'];
  }): Promise<CustomFieldDefinition> => {
    const response = await api.post('/customization/fields', data);
    return response.data;
  },

  updateCustomField: async (id: string, data: Partial<{
    fieldName: string;
    description: string;
    placeholder: string;
    defaultValue: string;
    isRequired: boolean;
    isActive: boolean;
    showInList: boolean;
    showInDetail: boolean;
    displayOrder: number;
    fieldGroup: string;
    options: CustomFieldDefinition['options'];
  }>): Promise<CustomFieldDefinition> => {
    const response = await api.put(`/customization/fields/${id}`, data);
    return response.data;
  },

  deleteCustomField: async (id: string): Promise<void> => {
    await api.delete(`/customization/fields/${id}`);
  },

  reorderCustomFields: async (entityTarget: EntityTarget, orderedIds: string[]): Promise<CustomFieldDefinition[]> => {
    const response = await api.patch(`/customization/fields/reorder/${entityTarget}`, { orderedIds });
    return response.data;
  },

  // Field Values
  setFieldValues: async (entityType: string, entityId: string, values: Array<{
    fieldDefinitionId: string;
    value: any;
  }>): Promise<CustomFieldValue[]> => {
    const response = await api.post('/customization/field-values', {
      entityType,
      entityId,
      values,
    });
    return response.data;
  },

  getFieldValues: async (entityType: string, entityId: string): Promise<Record<string, any>> => {
    const response = await api.get(`/customization/field-values/${entityType}/${entityId}`);
    return response.data;
  },

  getBulkFieldValues: async (entityType: string, entityIds: string[]): Promise<Record<string, Record<string, any>>> => {
    const response = await api.post('/customization/field-values/bulk', { entityType, entityIds });
    return response.data;
  },

  // Tags
  getTags: async (options?: {
    category?: string;
    includeInactive?: boolean;
    search?: string;
  }): Promise<Tag[]> => {
    const response = await api.get('/customization/tags', { params: options });
    return response.data;
  },

  getTag: async (id: string): Promise<Tag> => {
    const response = await api.get(`/customization/tags/${id}`);
    return response.data;
  },

  createTag: async (data: {
    name: string;
    category?: string;
    color?: string;
    icon?: string;
    description?: string;
    parentId?: string;
  }): Promise<Tag> => {
    const response = await api.post('/customization/tags', data);
    return response.data;
  },

  updateTag: async (id: string, data: Partial<{
    name: string;
    category: string;
    color: string;
    icon: string;
    description: string;
    isActive: boolean;
  }>): Promise<Tag> => {
    const response = await api.put(`/customization/tags/${id}`, data);
    return response.data;
  },

  deleteTag: async (id: string): Promise<void> => {
    await api.delete(`/customization/tags/${id}`);
  },

  // Entity Tags
  setEntityTags: async (entityType: string, entityId: string, tagIds: string[]): Promise<void> => {
    await api.post('/customization/tags/entity', { entityType, entityId, tagIds });
  },

  addTagToEntity: async (tagId: string, entityType: string, entityId: string): Promise<void> => {
    await api.post(`/customization/tags/${tagId}/entity/${entityType}/${entityId}`);
  },

  removeTagFromEntity: async (tagId: string, entityType: string, entityId: string): Promise<void> => {
    await api.delete(`/customization/tags/${tagId}/entity/${entityType}/${entityId}`);
  },

  getEntityTags: async (entityType: string, entityId: string): Promise<Tag[]> => {
    const response = await api.get(`/customization/entity-tags/${entityType}/${entityId}`);
    return response.data;
  },

  getEntitiesByTag: async (tagId: string, entityType?: string): Promise<Array<{
    entityType: string;
    entityId: string;
  }>> => {
    const response = await api.get(`/customization/tags/${tagId}/entities`, { 
      params: entityType ? { entityType } : {} 
    });
    return response.data;
  },

  // Saved Views
  getSavedViews: async (entityType?: string): Promise<SavedView[]> => {
    const response = await api.get('/customization/views', { 
      params: entityType ? { entityType } : {} 
    });
    return response.data;
  },

  getDefaultView: async (entityType: string): Promise<SavedView | null> => {
    const response = await api.get(`/customization/views/default/${entityType}`);
    return response.data;
  },

  getSavedView: async (id: string): Promise<SavedView> => {
    const response = await api.get(`/customization/views/${id}`);
    return response.data;
  },

  createSavedView: async (data: {
    name: string;
    description?: string;
    entityType: string;
    viewType?: ViewType;
    isShared?: boolean;
    isDefault?: boolean;
    columns?: SavedView['columns'];
    filters?: SavedView['filters'];
    sorting?: SavedView['sorting'];
    grouping?: SavedView['grouping'];
    display?: SavedView['display'];
    icon?: string;
    color?: string;
  }): Promise<SavedView> => {
    const response = await api.post('/customization/views', data);
    return response.data;
  },

  updateSavedView: async (id: string, data: Partial<{
    name: string;
    description: string;
    viewType: ViewType;
    isShared: boolean;
    isDefault: boolean;
    isPinned: boolean;
    columns: SavedView['columns'];
    filters: SavedView['filters'];
    sorting: SavedView['sorting'];
    grouping: SavedView['grouping'];
    display: SavedView['display'];
    icon: string;
    color: string;
  }>): Promise<SavedView> => {
    const response = await api.put(`/customization/views/${id}`, data);
    return response.data;
  },

  deleteSavedView: async (id: string): Promise<void> => {
    await api.delete(`/customization/views/${id}`);
  },

  // User Preferences
  getUserPreferences: async (): Promise<UserPreference> => {
    const response = await api.get('/customization/preferences');
    return response.data;
  },

  updateUserPreferences: async (data: Partial<{
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    dateFormat: string;
    currency: string;
    dashboardLayout: any;
    tablePreferences: Record<string, any>;
    sidebarState: UserPreference['sidebarState'];
    favorites: UserPreference['favorites'];
    shortcuts: UserPreference['shortcuts'];
  }>): Promise<UserPreference> => {
    const response = await api.put('/customization/preferences', data);
    return response.data;
  },

  addRecentItem: async (item: {
    type: string;
    id: string;
    name: string;
  }): Promise<UserPreference> => {
    const response = await api.post('/customization/preferences/recent', item);
    return response.data;
  },

  toggleFavorite: async (item: {
    type: string;
    id: string;
    name: string;
  }): Promise<{ isFavorite: boolean; preferences: UserPreference }> => {
    const response = await api.post('/customization/preferences/favorites', item);
    return response.data;
  },

  updateTablePreference: async (tableName: string, preferences: any): Promise<UserPreference> => {
    const response = await api.put(`/customization/preferences/table/${tableName}`, preferences);
    return response.data;
  },
};

export default customizationService;
