'use client';

import * as React from 'react';
import {
  Modal,
  ModalFooter,
  Button,
  Input,
  Select,
  Textarea,
  FormGroup,
  FormRow,
} from '@/components/ui';
import { moneyMovementsService, CreateMoneyMovementDto, MoneyMovementType } from '@/services/money-movements.service';
import { useToastHelpers } from '@/components/notifications';

export interface CreateMoneyMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdId?: string) => void;
  preselectedHouseholdId?: string;
}

const typeOptions: Array<{ value: MoneyMovementType; label: string }> = [
  { value: 'wire', label: 'Wire' },
  { value: 'ach', label: 'ACH' },
  { value: 'journal', label: 'Journal' },
  { value: 'distribution', label: 'Distribution' },
  { value: 'other', label: 'Other' },
];

const currencyOptions = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
];

export function CreateMoneyMovementModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedHouseholdId,
}: CreateMoneyMovementModalProps) {
  const toast = useToastHelpers();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const initialFocusRef = React.useRef<HTMLInputElement>(null);

  const [formData, setFormData] = React.useState({
    type: 'wire' as MoneyMovementType,
    amount: '',
    currency: 'USD',
    title: '',
    notes: '',
    householdId: preselectedHouseholdId || '',
  });

  const reset = React.useCallback(() => {
    setFormData({
      type: 'wire',
      amount: '',
      currency: 'USD',
      title: '',
      notes: '',
      householdId: preselectedHouseholdId || '',
    });
    setError(null);
  }, [preselectedHouseholdId]);

  React.useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const amount = Number(formData.amount);
      const dto: CreateMoneyMovementDto = {
        type: formData.type,
        amount,
        currency: formData.currency,
        title: formData.title?.trim() ? formData.title.trim() : undefined,
        notes: formData.notes?.trim() ? formData.notes.trim() : undefined,
        householdId: formData.householdId?.trim() ? formData.householdId.trim() : undefined,
      };

      const created = await moneyMovementsService.create(dto);
      toast.success('Request created', `Money movement ${created.id} created.`);
      onSuccess?.(created.id);
      handleClose();
    } catch (err: any) {
      const message = err?.message || 'Failed to create request';
      setError(message);
      toast.error('Could not create request', message);
    } finally {
      setLoading(false);
    }
  };

  const amountIsValid = formData.amount !== '' && Number(formData.amount) > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New money movement"
      description="Create a new money movement request."
      size="lg"
      initialFocus={initialFocusRef as any}
    >
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <FormRow>
            <Select
              label="Type"
              options={typeOptions}
              value={formData.type}
              onChange={(value) => setFormData((prev) => ({ ...prev, type: value as MoneyMovementType }))}
            />
            <Select
              label="Currency"
              options={currencyOptions}
              value={formData.currency}
              onChange={(value) => setFormData((prev) => ({ ...prev, currency: value }))}
            />
          </FormRow>

          <Input
            ref={initialFocusRef}
            label="Amount"
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
            required
            min={0}
          />

          <Input
            label="Title (optional)"
            placeholder="e.g., Smith Family wire to Chase"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          />

          <Textarea
            label="Notes (optional)"
            placeholder="Notes for ops/compliance"
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            rows={3}
          />

          {error && <p className="text-sm text-status-error-text">{error}</p>}
        </FormGroup>

        <ModalFooter>
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!amountIsValid}>
            Create request
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
