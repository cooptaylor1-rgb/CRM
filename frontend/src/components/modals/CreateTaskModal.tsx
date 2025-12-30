'use client';

import * as React from 'react';
import {
  Modal,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  FormGroup,
  FormRow,
} from '@/components/ui';
import { tasksService, CreateTaskDto } from '@/services/tasks.service';
import { householdsService, Household } from '@/services/households.service';

export interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedHouseholdId?: string;
}

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const categoryOptions = [
  { value: 'client_onboarding', label: 'Client Onboarding' },
  { value: 'annual_review', label: 'Annual Review' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'document_request', label: 'Document Request' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'meeting_prep', label: 'Meeting Prep' },
  { value: 'trading', label: 'Trading' },
  { value: 'billing', label: 'Billing' },
  { value: 'kyc_verification', label: 'KYC Verification' },
  { value: 'other', label: 'Other' },
];

export function CreateTaskModal({ isOpen, onClose, onSuccess, preselectedHouseholdId }: CreateTaskModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [households, setHouseholds] = React.useState<Household[]>([]);
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'follow_up',
    householdId: preselectedHouseholdId || '',
    dueDate: '',
    estimatedMinutes: '',
  });

  React.useEffect(() => {
    if (isOpen) {
      householdsService.getHouseholds().then(setHouseholds).catch(console.error);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (preselectedHouseholdId) {
      setFormData(prev => ({ ...prev, householdId: preselectedHouseholdId }));
    }
  }, [preselectedHouseholdId]);

  const householdOptions = [
    { value: '', label: 'No household' },
    ...households.map(h => ({ value: h.id, label: h.name }))
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const taskData: CreateTaskDto = {
        title: formData.title,
        description: formData.description || undefined,
        priority: formData.priority,
        category: formData.category,
        householdId: formData.householdId || undefined,
        dueDate: formData.dueDate || undefined,
        estimatedMinutes: formData.estimatedMinutes ? parseInt(formData.estimatedMinutes) : undefined,
      };
      
      await tasksService.create(taskData);
      onSuccess?.();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      category: 'follow_up',
      householdId: preselectedHouseholdId || '',
      dueDate: '',
      estimatedMinutes: '',
    });
    setError(null);
    onClose();
  };

  // Calculate default due date (1 week from now)
  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Task"
      description="Add a task to track work items and follow-ups."
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Input
            label="Task Title"
            placeholder="e.g., Follow up with client"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <Textarea
            label="Description"
            placeholder="Add more details about this task..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />

          <FormRow>
            <Select
              label="Priority"
              options={priorityOptions}
              value={formData.priority}
              onChange={(value) => setFormData({ ...formData, priority: value })}
            />
            <Select
              label="Category"
              options={categoryOptions}
              value={formData.category}
              onChange={(value) => setFormData({ ...formData, category: value })}
            />
          </FormRow>

          <FormRow>
            <Select
              label="Related Household"
              options={householdOptions}
              value={formData.householdId}
              onChange={(value) => setFormData({ ...formData, householdId: value })}
            />
            <Input
              label="Due Date"
              type="date"
              value={formData.dueDate || getDefaultDueDate()}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </FormRow>

          <Input
            label="Estimated Time"
            type="number"
            placeholder="30"
            rightAddon="minutes"
            value={formData.estimatedMinutes}
            onChange={(e) => setFormData({ ...formData, estimatedMinutes: e.target.value })}
          />

          {error && (
            <p className="text-sm text-status-error-text">{error}</p>
          )}
        </FormGroup>

        <ModalFooter>
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Task
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
