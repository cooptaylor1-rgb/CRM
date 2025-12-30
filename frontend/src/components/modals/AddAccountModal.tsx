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
import { accountsService } from '@/services/accounts.service';
import { householdsService, Household } from '@/services/households.service';

export interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedHouseholdId?: string;
}

const accountTypeOptions = [
  { value: 'individual', label: 'Individual' },
  { value: 'joint', label: 'Joint' },
  { value: 'ira', label: 'IRA' },
  { value: 'roth_ira', label: 'Roth IRA' },
  { value: '401k', label: '401(k)' },
  { value: 'trust', label: 'Trust' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'custodial', label: 'Custodial' },
];

const custodianOptions = [
  { value: 'schwab', label: 'Charles Schwab' },
  { value: 'fidelity', label: 'Fidelity' },
  { value: 'pershing', label: 'Pershing' },
  { value: 'td_ameritrade', label: 'TD Ameritrade' },
  { value: 'vanguard', label: 'Vanguard' },
  { value: 'other', label: 'Other' },
];

const statusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'pending', label: 'Pending' },
  { value: 'restricted', label: 'Restricted' },
];

const managementStyleOptions = [
  { value: 'discretionary', label: 'Discretionary' },
  { value: 'non_discretionary', label: 'Non-Discretionary' },
  { value: 'advisory', label: 'Advisory' },
];

export function AddAccountModal({ isOpen, onClose, onSuccess, preselectedHouseholdId }: AddAccountModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [households, setHouseholds] = React.useState<Household[]>([]);
  const [formData, setFormData] = React.useState({
    accountNumber: '',
    accountName: '',
    householdId: preselectedHouseholdId || '',
    accountType: 'individual',
    custodian: '',
    status: 'open',
    currentValue: '',
    managementStyle: '',
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

  const householdOptions = households.map(h => ({ value: h.id, label: h.name }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await accountsService.createAccount({
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
        householdId: formData.householdId,
        accountType: formData.accountType,
        custodian: formData.custodian || undefined,
        status: formData.status,
        currentValue: formData.currentValue ? parseFloat(formData.currentValue) : 0,
        managementStyle: formData.managementStyle || undefined,
      });
      
      onSuccess?.();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      accountNumber: '',
      accountName: '',
      householdId: preselectedHouseholdId || '',
      accountType: 'individual',
      custodian: '',
      status: 'open',
      currentValue: '',
      managementStyle: '',
    });
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Account"
      description="Create a new investment account."
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <FormRow>
            <Input
              label="Account Number"
              placeholder="e.g., 12345678"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              required
            />
            <Input
              label="Account Name"
              placeholder="e.g., John Smith IRA"
              value={formData.accountName}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              required
            />
          </FormRow>

          <Select
            label="Household"
            options={householdOptions}
            value={formData.householdId}
            onChange={(value) => setFormData({ ...formData, householdId: value })}
            placeholder="Select household"
            description="The household this account belongs to"
          />

          <FormRow>
            <Select
              label="Account Type"
              options={accountTypeOptions}
              value={formData.accountType}
              onChange={(value) => setFormData({ ...formData, accountType: value })}
            />
            <Select
              label="Custodian"
              options={custodianOptions}
              value={formData.custodian}
              onChange={(value) => setFormData({ ...formData, custodian: value })}
              placeholder="Select custodian"
            />
          </FormRow>

          <FormRow>
            <Select
              label="Status"
              options={statusOptions}
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value })}
            />
            <Select
              label="Management Style"
              options={managementStyleOptions}
              value={formData.managementStyle}
              onChange={(value) => setFormData({ ...formData, managementStyle: value })}
              placeholder="Select style"
            />
          </FormRow>

          <Input
            label="Current Value"
            type="number"
            placeholder="0.00"
            leftAddon="$"
            value={formData.currentValue}
            onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
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
            Create Account
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
