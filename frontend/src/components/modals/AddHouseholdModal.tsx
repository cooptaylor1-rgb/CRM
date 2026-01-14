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
import { householdsService } from '@/services/households.service';
import { parseApiError } from '@/services/api';

export interface AddHouseholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// =============================================================================
// Options
// =============================================================================

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

// =============================================================================
// Validation Types
// =============================================================================

interface ValidationErrors {
  name?: string;
  totalAum?: string;
}

interface FormData {
  name: string;
  status: string;
  riskTolerance: string;
  investmentObjective: string;
  totalAum: string;
}

const initialFormData: FormData = {
  name: '',
  status: 'prospect',
  riskTolerance: '',
  investmentObjective: '',
  totalAum: '',
};

// =============================================================================
// Component
// =============================================================================

export function AddHouseholdModal({ isOpen, onClose, onSuccess }: AddHouseholdModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<FormData>(initialFormData);
  const [validationErrors, setValidationErrors] = React.useState<ValidationErrors>({});
  const [showUnsavedWarning, setShowUnsavedWarning] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);

  // Track if form has been modified
  const initialDataRef = React.useRef<FormData>(initialFormData);

  // Reset when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      initialDataRef.current = initialFormData;
      setValidationErrors({});
      setError(null);
      setIsDirty(false);
    }
  }, [isOpen]);

  // Track dirty state
  React.useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialDataRef.current);
    setIsDirty(hasChanges);
  }, [formData]);

  // =============================================================================
  // Validation
  // =============================================================================

  const validateField = (field: keyof FormData, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Household name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        if (value.length > 200) return 'Name cannot exceed 200 characters';
        break;
      case 'totalAum':
        if (value && isNaN(parseFloat(value))) return 'Please enter a valid number';
        if (value && parseFloat(value) < 0) return 'AUM cannot be negative';
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    errors.name = validateField('name', formData.name);
    errors.totalAum = validateField('totalAum', formData.totalAum);

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
      await householdsService.createHousehold({
        name: formData.name.trim(),
        status: formData.status,
        riskTolerance: formData.riskTolerance || undefined,
        investmentObjective: formData.investmentObjective || undefined,
        totalAum: formData.totalAum ? parseFloat(formData.totalAum) : 0,
      });

      toast.success(`Household "${formData.name}" created successfully`);
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
    setFormData(initialFormData);
    initialDataRef.current = initialFormData;
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
        title="Add New Household"
        description="Create a new household to manage client relationships."
        size="lg"
      >
        <form onSubmit={handleSubmit} noValidate>
          <FormGroup>
            <Input
              label="Household Name"
              placeholder="e.g., Smith Family Trust"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              onBlur={() => handleFieldBlur('name')}
              error={validationErrors.name}
              required
              aria-required="true"
              aria-invalid={!!validationErrors.name}
              autoFocus
            />

            <FormRow>
              <Select
                label="Status"
                options={statusOptions}
                value={formData.status}
                onChange={(value) => handleFieldChange('status', value)}
                aria-label="Household status selection"
              />
              <Input
                label="Total AUM"
                type="number"
                placeholder="0.00"
                leftAddon="$"
                value={formData.totalAum}
                onChange={(e) => handleFieldChange('totalAum', e.target.value)}
                onBlur={() => handleFieldBlur('totalAum')}
                error={validationErrors.totalAum}
                min={0}
                step="0.01"
                aria-label="Total assets under management in dollars"
              />
            </FormRow>

            <FormRow>
              <Select
                label="Risk Tolerance"
                options={riskToleranceOptions}
                value={formData.riskTolerance}
                onChange={(value) => handleFieldChange('riskTolerance', value)}
                placeholder="Select risk tolerance"
                aria-label="Risk tolerance selection"
              />
              <Select
                label="Investment Objective"
                options={investmentObjectiveOptions}
                value={formData.investmentObjective}
                onChange={(value) => handleFieldChange('investmentObjective', value)}
                placeholder="Select objective"
                aria-label="Investment objective selection"
              />
            </FormRow>

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
              Create Household
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
