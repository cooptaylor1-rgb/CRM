'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, Settings, Edit2, Trash2, GripVertical,
  ToggleLeft, Hash, Calendar, User, Link, List,
  FileText, DollarSign, Phone, Mail, MapPin, Clock,
  AlertCircle, Check, ChevronDown, ChevronRight, Search
} from 'lucide-react';
import customizationService, { 
  CustomFieldDefinition, 
  FieldType,
  EntityTarget
} from '@/services/customization.service';

const fieldTypeConfig: Record<FieldType, { icon: React.ReactNode; label: string; description: string }> = {
  text: { icon: <FileText className="w-4 h-4" />, label: 'Short Text', description: 'Single line text input' },
  textarea: { icon: <FileText className="w-4 h-4" />, label: 'Long Text', description: 'Multi-line text area' },
  number: { icon: <Hash className="w-4 h-4" />, label: 'Number', description: 'Numeric value' },
  currency: { icon: <DollarSign className="w-4 h-4" />, label: 'Currency', description: 'Money amount' },
  percentage: { icon: <Hash className="w-4 h-4" />, label: 'Percentage', description: 'Percentage value' },
  date: { icon: <Calendar className="w-4 h-4" />, label: 'Date', description: 'Date picker' },
  datetime: { icon: <Clock className="w-4 h-4" />, label: 'Date & Time', description: 'Date and time picker' },
  boolean: { icon: <ToggleLeft className="w-4 h-4" />, label: 'Toggle', description: 'Yes/No switch' },
  select: { icon: <List className="w-4 h-4" />, label: 'Single Select', description: 'Dropdown selection' },
  multi_select: { icon: <List className="w-4 h-4" />, label: 'Multi Select', description: 'Multiple selections' },
  email: { icon: <Mail className="w-4 h-4" />, label: 'Email', description: 'Email address' },
  phone: { icon: <Phone className="w-4 h-4" />, label: 'Phone', description: 'Phone number' },
  url: { icon: <Link className="w-4 h-4" />, label: 'URL', description: 'Web link' },
  user: { icon: <User className="w-4 h-4" />, label: 'User', description: 'User reference' },
  household: { icon: <User className="w-4 h-4" />, label: 'Household', description: 'Household reference' },
  account: { icon: <DollarSign className="w-4 h-4" />, label: 'Account', description: 'Account reference' },
};

interface FieldEditorProps {
  field?: CustomFieldDefinition | null;
  entityType: string;
  onSave: (field: Partial<CustomFieldDefinition>) => void;
  onCancel: () => void;
}

const FieldEditor: React.FC<FieldEditorProps> = ({ field, entityType, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    fieldName: field?.fieldName || '',
    fieldKey: field?.fieldKey || '',
    fieldType: field?.fieldType || 'text' as FieldType,
    description: field?.description || '',
    isRequired: field?.isRequired || false,
    defaultValue: field?.defaultValue || '',
    placeholder: field?.placeholder || '',
    fieldGroup: field?.fieldGroup || 'general',
    showInList: field?.showInList ?? true,
    showInDetail: field?.showInDetail ?? true,
    isSearchable: field?.isSearchable ?? true,
    isFilterable: field?.isFilterable ?? true,
    options: field?.options?.choices || [] as Array<{ value: string; label: string; color?: string }>,
  });
  const [newOption, setNewOption] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const addOption = () => {
    if (newOption.trim()) {
      const newOpt = { value: newOption.trim().toLowerCase().replace(/\s+/g, '_'), label: newOption.trim() };
      if (!formData.options.some(o => o.value === newOpt.value)) {
        setFormData(prev => ({ ...prev, options: [...prev.options, newOpt] }));
        setNewOption('');
      }
    }
  };

  const removeOption = (option: { value: string; label: string }) => {
    setFormData(prev => ({ ...prev, options: prev.options.filter(o => o.value !== option.value) }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fieldName.trim()) newErrors.fieldName = 'Field name is required';
    if (!formData.fieldKey.trim()) newErrors.fieldKey = 'Field key is required';
    if (['select', 'multi_select'].includes(formData.fieldType) && formData.options.length === 0) {
      newErrors.options = 'At least one option is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSave({
        fieldName: formData.fieldName,
        fieldKey: formData.fieldKey.toLowerCase().replace(/\s+/g, '_'),
        fieldType: formData.fieldType,
        entityTarget: entityType as EntityTarget,
        description: formData.description,
        placeholder: formData.placeholder,
        defaultValue: formData.defaultValue,
        isRequired: formData.isRequired,
        showInList: formData.showInList,
        showInDetail: formData.showInDetail,
        isSearchable: formData.isSearchable,
        isFilterable: formData.isFilterable,
        fieldGroup: formData.fieldGroup,
        options: formData.options.length > 0 ? { choices: formData.options } : undefined,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {field ? 'Edit Custom Field' : 'Create Custom Field'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Field Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Field Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(fieldTypeConfig).map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => handleChange('fieldType', type)}
                  className={`p-3 flex flex-col items-center gap-1 rounded-xl border-2 transition-all ${
                    formData.fieldType === type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className={formData.fieldType === type ? 'text-blue-600' : 'text-gray-400'}>
                    {config.icon}
                  </span>
                  <span className={`text-xs font-medium ${
                    formData.fieldType === type ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {config.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Name *
              </label>
              <input
                type="text"
                value={formData.fieldName}
                onChange={(e) => handleChange('fieldName', e.target.value)}
                placeholder="e.g., Risk Tolerance"
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.fieldName ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                }`}
              />
              {errors.fieldName && <p className="text-red-500 text-xs mt-1">{errors.fieldName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Field Key *
              </label>
              <input
                type="text"
                value={formData.fieldKey}
                onChange={(e) => handleChange('fieldKey', e.target.value)}
                placeholder="e.g., risk_tolerance"
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.fieldKey ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                }`}
              />
              {errors.fieldKey && <p className="text-red-500 text-xs mt-1">{errors.fieldKey}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Help text shown to users"
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Options for select fields */}
          {['select', 'multi_select'].includes(formData.fieldType) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Options
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                  placeholder="Add option..."
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addOption}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {errors.options && <p className="text-red-500 text-xs mb-2">{errors.options}</p>}
              <div className="flex flex-wrap gap-2">
                {formData.options.map((option, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
                  >
                    {option.label}
                    <button
                      onClick={() => removeOption(option)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Additional settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Value
              </label>
              <input
                type="text"
                value={formData.defaultValue}
                onChange={(e) => handleChange('defaultValue', e.target.value)}
                placeholder="Default value (optional)"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Placeholder
              </label>
              <input
                type="text"
                value={formData.placeholder}
                onChange={(e) => handleChange('placeholder', e.target.value)}
                placeholder="Placeholder text (optional)"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl"
              />
            </div>
          </div>

          {/* Required toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleChange('isRequired', !formData.isRequired)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                formData.isRequired ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                formData.isRequired ? 'translate-x-6' : ''
              }`} />
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">Required field</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            {field ? 'Update Field' : 'Create Field'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

interface CustomFieldManagerProps {
  entityType: string;
}

export const CustomFieldManager: React.FC<CustomFieldManagerProps> = ({ entityType }) => {
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['general']));

  useEffect(() => {
    loadFields();
  }, [entityType]);

  const loadFields = async () => {
    try {
      setLoading(true);
      const data = await customizationService.getCustomFields({ 
        entityTarget: entityType as EntityTarget 
      });
      setFields(data);
    } catch (error) {
      console.error('Failed to load fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (fieldData: Partial<CustomFieldDefinition>) => {
    try {
      if (editingField) {
        await customizationService.updateCustomField(editingField.id, fieldData);
      } else {
        await customizationService.createCustomField(fieldData as any);
      }
      setShowEditor(false);
      setEditingField(null);
      await loadFields();
    } catch (error) {
      console.error('Failed to save field:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this field? All data will be lost.')) {
      try {
        await customizationService.deleteCustomField(id);
        await loadFields();
      } catch (error) {
        console.error('Failed to delete field:', error);
      }
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Group fields by fieldGroup
  const groupedFields = fields.reduce((acc, field) => {
    const group = field.fieldGroup || 'general';
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {} as Record<string, CustomFieldDefinition[]>);

  // Filter by search
  const filteredFields = search
    ? fields.filter(f => 
        f.fieldName.toLowerCase().includes(search.toLowerCase()) ||
        f.fieldKey.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Custom Fields
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Add custom fields to capture unique data for your {entityType}s
            </p>
          </div>
          <button
            onClick={() => { setEditingField(null); setShowEditor(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Field
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fields..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Fields List */}
      <div className="p-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : fields.length === 0 ? (
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No custom fields defined</p>
            <p className="text-gray-400 text-sm mt-1">Create your first field to get started</p>
          </div>
        ) : filteredFields ? (
          // Search results
          <div className="space-y-2">
            {filteredFields.map(field => (
              <FieldRow
                key={field.id}
                field={field}
                onEdit={() => { setEditingField(field); setShowEditor(true); }}
                onDelete={() => handleDelete(field.id)}
              />
            ))}
          </div>
        ) : (
          // Grouped view
          <div className="space-y-4">
            {Object.entries(groupedFields).map(([category, categoryFields]) => (
              <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-2">
                    {expandedCategories.has(category) ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {category}
                    </span>
                    <span className="text-sm text-gray-500">({categoryFields.length})</span>
                  </div>
                </button>
                
                <AnimatePresence>
                  {expandedCategories.has(category) && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 space-y-2">
                        {categoryFields.map(field => (
                          <FieldRow
                            key={field.id}
                            field={field}
                            onEdit={() => { setEditingField(field); setShowEditor(true); }}
                            onDelete={() => handleDelete(field.id)}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Field Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <FieldEditor
            field={editingField}
            entityType={entityType}
            onSave={handleSave}
            onCancel={() => { setShowEditor(false); setEditingField(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

interface FieldRowProps {
  field: CustomFieldDefinition;
  onEdit: () => void;
  onDelete: () => void;
}

const FieldRow: React.FC<FieldRowProps> = ({ field, onEdit, onDelete }) => {
  const config = fieldTypeConfig[field.fieldType];

  return (
    <div className="group flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
      <div className="p-2 bg-white dark:bg-gray-700 rounded-lg text-gray-400">
        {config?.icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white">{field.fieldName}</span>
          {field.isRequired && (
            <span className="text-xs text-red-500">Required</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{config?.label}</span>
          <span>•</span>
          <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">{field.fieldKey}</code>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CustomFieldManager;
