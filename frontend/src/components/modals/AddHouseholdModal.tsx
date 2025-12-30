'use client';

import * as React from 'react';
import {
  Modal,
  ModalFooter,
  Button,
  Input,
  Select,
  FormGroup,
  FormRow,
} from '@/components/ui';
import { householdsService } from '@/services/households.service';

export interface AddHouseholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const riskToleranceOptions = [
  { value: 'conservative', label: 'Conservative' },
  { value: 'moderate_conservative', label: 'Moderate Conservative' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'moderate_aggressive', label: 'Moderate Aggressive' },
  { value: 'aggressive', label: 'Aggressive' },
];

const statusOptions = [
  { value: 'prospect', label: 'Prospect' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const investmentObjectiveOptions = [
  { value: 'growth', label: 'Growth' },
  { value: 'income', label: 'Income' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'preservation', label: 'Capital Preservation' },
  { value: 'speculation', label: 'Speculation' },
];

export function AddHouseholdModal({ isOpen, onClose, onSuccess }: AddHouseholdModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    status: 'prospect',
    riskTolerance: '',
    investmentObjective: '',
    totalAum: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await householdsService.createHousehold({
        name: formData.name,
        status: formData.status,
        riskTolerance: formData.riskTolerance || undefined,
        investmentObjective: formData.investmentObjective || undefined,
        totalAum: formData.totalAum ? parseFloat(formData.totalAum) : 0,
      });
      
      onSuccess?.();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create household');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      status: 'prospect',
      riskTolerance: '',
      investmentObjective: '',
      totalAum: '',
    });
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Household"
      description="Create a new household to manage client relationships."
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Input
            label="Household Name"
            placeholder="e.g., Smith Family Trust"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            error={error && !formData.name ? 'Name is required' : undefined}
          />

          <FormRow>
            <Select
              label="Status"
              options={statusOptions}
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value })}
            />
            <Input
              label="Total AUM"
              type="number"
              placeholder="0.00"
              leftAddon="$"
              value={formData.totalAum}
              onChange={(e) => setFormData({ ...formData, totalAum: e.target.value })}
            />
          </FormRow>

          <FormRow>
            <Select
              label="Risk Tolerance"
              options={riskToleranceOptions}
              value={formData.riskTolerance}
              onChange={(value) => setFormData({ ...formData, riskTolerance: value })}
              placeholder="Select risk tolerance"
            />
            <Select
              label="Investment Objective"
              options={investmentObjectiveOptions}
              value={formData.investmentObjective}
              onChange={(value) => setFormData({ ...formData, investmentObjective: value })}
              placeholder="Select objective"
            />
          </FormRow>

          {error && (
            <p className="text-sm text-status-error-text">{error}</p>
          )}
        </FormGroup>

        <ModalFooter>
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Household
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
