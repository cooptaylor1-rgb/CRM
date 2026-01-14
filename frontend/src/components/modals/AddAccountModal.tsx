'use client';

import * as React from 'react';
import toast from 'react-hot-toast';
import {
  Modal,
  ModalFooter,
  Button,
  Input,
  Select,
  FormGroup,
  FormRow,
  ConfirmModal,
} from '@/components/ui';
import { accountsService } from '@/services/accounts.service';
import { householdsService, Household } from '@/services/households.service';
import { parseApiError } from '@/services/api';

export interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedHouseholdId?: string;
}

// =============================================================================
// Options
// =============================================================================

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

// =============================================================================
// Validation Types
// =============================================================================

interface ValidationErrors {
  accountNumber?: string;
  accountName?: string;
  householdId?: string;
  currentValue?: string;
}

interface FormData {
  accountNumber: string;
  accountName: string;
  householdId: string;
  accountType: string;
  custodian: string;
  status: string;
  currentValue: string;
  managementStyle: string;
}

const initialFormData: FormData = {
  accountNumber: '',
  accountName: '',
  householdId: '',
  accountType: 'individual',
  custodian: '',
  status: 'open',
  currentValue: '',
  managementStyle: '',
};

// =============================================================================
// Component
// =============================================================================

export function AddAccountModal({ isOpen, onClose, onSuccess, preselectedHouseholdId }: AddAccountModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [households, setHouseholds] = React.useState<Household[]>([]);
  const [formData, setFormData] = React.useState<FormData>({
    ...initialFormData,
    householdId: preselectedHouseholdId || '',
  });
  const [validationErrors, setValidationErrors] = React.useState<ValidationErrors>({});
  const [showUnsavedWarning, setShowUnsavedWarning] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);

  // Track if form has been modified
  const initialDataRef = React.useRef<FormData>({
    ...initialFormData,
    householdId: preselectedHouseholdId || '',
  });

  // Load households when modal opens
  React.useEffect(() => {
    if (isOpen) {
      householdsService.getHouseholds().then(setHouseholds).catch((err) => {
        const apiError = parseApiError(err);
        toast.error(`Failed to load households: ${apiError.message}`);
      });
    }
  }, [isOpen]);

  // Update household when preselected changes
  React.useEffect(() => {
    if (preselectedHouseholdId) {
      setFormData(prev => ({ ...prev, householdId: preselectedHouseholdId }));
      initialDataRef.current = { ...initialFormData, householdId: preselectedHouseholdId };
    }
  }, [preselectedHouseholdId]);

  // Track dirty state
  React.useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialDataRef.current);
    setIsDirty(hasChanges);
  }, [formData]);

  const householdOptions = households.map(h => ({ value: h.id, label: h.name }));

  // =============================================================================
  // Validation
  // =============================================================================

  const validateField = (field: keyof FormData, value: string): string | undefined => {
    switch (field) {
      case 'accountNumber':
        if (!value.trim()) return 'Account number is required';
        if (value.length > 50) return 'Account number cannot exceed 50 characters';
        if (!/^[A-Za-z0-9\-_]+$/.test(value)) return 'Account number can only contain letters, numbers, hyphens, and underscores';
        break;
      case 'accountName':
        if (!value.trim()) return 'Account name is required';
        if (value.length > 200) return 'Account name cannot exceed 200 characters';
        break;
      case 'householdId':
        if (!value) return 'Please select a household';
        break;
      case 'currentValue':
        if (value && isNaN(parseFloat(value))) return 'Please enter a valid number';
        if (value && parseFloat(value) < 0) return 'Value cannot be negative';
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    errors.accountNumber = validateField('accountNumber', formData.accountNumber);
    errors.accountName = validateField('accountName', formData.accountName);
    errors.householdId = validateField('householdId', formData.householdId);
    errors.currentValue = validateField('currentValue', formData.currentValue);

    // Remove undefined values
    Object.keys(errors).forEach(key => {
      if (errors[key as keyof ValidationErrors] === undefined) {
        delete errors[key as keyof ValidationErrors];
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // =============================================================================
  // Handlers
  // =============================================================================

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear validation error when user starts typing
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[field as keyof ValidationErrors];
        return updated;
      });
    }

    // Clear server error when user modifies form
    if (error) setError(null);
  };

  const handleFieldBlur = (field: keyof FormData) => {
    const fieldError = validateField(field, formData[field]);
    if (fieldError) {
      setValidationErrors(prev => ({ ...prev, [field]: fieldError }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields before submit
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await accountsService.createAccount({
        accountNumber: formData.accountNumber.trim(),
        accountName: formData.accountName.trim(),
        householdId: formData.householdId,
        accountType: formData.accountType,
        custodian: formData.custodian || undefined,
        status: formData.status,
        currentValue: formData.currentValue ? parseFloat(formData.currentValue) : 0,
        managementStyle: formData.managementStyle || undefined,
      });

      toast.success(`Account "${formData.accountName}" created successfully`);
      onSuccess?.();
      handleClose(true); // Force close without warning
    } catch (err: unknown) {
      const apiError = parseApiError(err);
      setError(apiError.message);
      toast.error(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (force = false) => {
    if (!force && isDirty) {
      setShowUnsavedWarning(true);
      return;
    }

    // Reset form state
    const initialData = { ...initialFormData, householdId: preselectedHouseholdId || '' };
    setFormData(initialData);
    initialDataRef.current = initialData;
    setValidationErrors({});
    setError(null);
    setIsDirty(false);
    onClose();
  };

  const handleConfirmDiscard = () => {
    setShowUnsavedWarning(false);
    handleClose(true);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => handleClose()}
        title="Add New Account"
        description="Create a new investment account."
        size="lg"
      >
        <form onSubmit={handleSubmit} noValidate>
          <FormGroup>
            <FormRow>
              <Input
                label="Account Number"
                placeholder="e.g., 12345678"
                value={formData.accountNumber}
                onChange={(e) => handleFieldChange('accountNumber', e.target.value)}
                onBlur={() => handleFieldBlur('accountNumber')}
                error={validationErrors.accountNumber}
                required
                aria-required="true"
                aria-invalid={!!validationErrors.accountNumber}
                autoComplete="off"
              />
              <Input
                label="Account Name"
                placeholder="e.g., John Smith IRA"
                value={formData.accountName}
                onChange={(e) => handleFieldChange('accountName', e.target.value)}
                onBlur={() => handleFieldBlur('accountName')}
                error={validationErrors.accountName}
                required
                aria-required="true"
                aria-invalid={!!validationErrors.accountName}
              />
            </FormRow>

            <Select
              label="Household"
              options={householdOptions}
              value={formData.householdId}
              onChange={(value) => handleFieldChange('householdId', value)}
              placeholder="Select household"
              description="The household this account belongs to"
              error={validationErrors.householdId}
              required
              aria-required="true"
            />

            <FormRow>
              <Select
                label="Account Type"
                options={accountTypeOptions}
                value={formData.accountType}
                onChange={(value) => handleFieldChange('accountType', value)}
                aria-label="Account type selection"
              />
              <Select
                label="Custodian"
                options={custodianOptions}
                value={formData.custodian}
                onChange={(value) => handleFieldChange('custodian', value)}
                placeholder="Select custodian"
                aria-label="Custodian selection"
              />
            </FormRow>

            <FormRow>
              <Select
                label="Status"
                options={statusOptions}
                value={formData.status}
                onChange={(value) => handleFieldChange('status', value)}
                aria-label="Account status selection"
              />
              <Select
                label="Management Style"
                options={managementStyleOptions}
                value={formData.managementStyle}
                onChange={(value) => handleFieldChange('managementStyle', value)}
                placeholder="Select style"
                aria-label="Management style selection"
              />
            </FormRow>

            <Input
              label="Current Value"
              type="number"
              placeholder="0.00"
              leftAddon="$"
              value={formData.currentValue}
              onChange={(e) => handleFieldChange('currentValue', e.target.value)}
              onBlur={() => handleFieldBlur('currentValue')}
              error={validationErrors.currentValue}
              min={0}
              step="0.01"
              aria-label="Current account value in dollars"
            />

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="p-3 rounded-md bg-status-error-bg border border-status-error-border"
              >
                <p className="text-sm text-status-error-text">{error}</p>
              </div>
            )}
          </FormGroup>

          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => handleClose()}
              disabled={loading}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create Account
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Unsaved Changes Warning */}
      <ConfirmModal
        isOpen={showUnsavedWarning}
        onClose={() => setShowUnsavedWarning(false)}
        onConfirm={handleConfirmDiscard}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to close this form? Your changes will be lost."
        confirmText="Discard"
        cancelText="Keep Editing"
        variant="warning"
      />
    </>
  );
}
