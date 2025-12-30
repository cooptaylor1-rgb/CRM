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
import { pipelineService, CreateProspectDto, LeadSource } from '@/services/pipeline.service';

export interface AddProspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const leadSourceOptions: { value: LeadSource; label: string }[] = [
  { value: 'referral', label: 'Referral' },
  { value: 'website', label: 'Website' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'event', label: 'Event/Conference' },
  { value: 'cold_outreach', label: 'Cold Outreach' },
  { value: 'existing_client', label: 'Existing Client' },
  { value: 'center_of_influence', label: 'Center of Influence' },
  { value: 'other', label: 'Other' },
];

export function AddProspectModal({ isOpen, onClose, onSuccess }: AddProspectModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    leadSource: 'referral' as LeadSource,
    estimatedAum: '',
    expectedRevenue: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const prospectData: CreateProspectDto = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        company: formData.company || undefined,
        jobTitle: formData.jobTitle || undefined,
        leadSource: formData.leadSource,
        estimatedAum: formData.estimatedAum ? parseFloat(formData.estimatedAum) : undefined,
        expectedRevenue: formData.expectedRevenue ? parseFloat(formData.expectedRevenue) : undefined,
        notes: formData.notes || undefined,
      };
      
      await pipelineService.create(prospectData);
      onSuccess?.();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add prospect');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      jobTitle: '',
      leadSource: 'referral',
      estimatedAum: '',
      expectedRevenue: '',
      notes: '',
    });
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Prospect"
      description="Add a new prospect to your sales pipeline."
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <FormRow>
            <Input
              label="First Name"
              placeholder="John"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              placeholder="Smith"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </FormRow>

          <FormRow>
            <Input
              label="Email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </FormRow>

          <FormRow>
            <Input
              label="Company"
              placeholder="Company name"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
            <Input
              label="Job Title"
              placeholder="CEO, CFO, etc."
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
            />
          </FormRow>

          <Select
            label="Lead Source"
            options={leadSourceOptions}
            value={formData.leadSource}
            onChange={(value) => setFormData({ ...formData, leadSource: value as LeadSource })}
          />

          <FormRow>
            <Input
              label="Estimated AUM"
              type="number"
              placeholder="1000000"
              leftAddon="$"
              value={formData.estimatedAum}
              onChange={(e) => setFormData({ ...formData, estimatedAum: e.target.value })}
              description="Estimated assets under management"
            />
            <Input
              label="Expected Revenue"
              type="number"
              placeholder="10000"
              leftAddon="$"
              value={formData.expectedRevenue}
              onChange={(e) => setFormData({ ...formData, expectedRevenue: e.target.value })}
              description="Estimated annual revenue"
            />
          </FormRow>

          <Textarea
            label="Notes"
            placeholder="Initial notes about this prospect..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
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
            Add Prospect
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
