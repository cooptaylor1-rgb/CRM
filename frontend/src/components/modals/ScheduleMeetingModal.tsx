'use client';

import * as React from 'react';
import {
  Modal,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  FormGroup,
  FormRow,
} from '@/components/ui';
import { meetingsService, CreateMeetingDto, MeetingType } from '@/services/meetings.service';
import { householdsService, Household } from '@/services/households.service';

export interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedHouseholdId?: string;
}

const meetingTypeOptions: { value: MeetingType; label: string }[] = [
  { value: 'initial_consultation', label: 'Initial Consultation' },
  { value: 'quarterly_review', label: 'Quarterly Review' },
  { value: 'annual_review', label: 'Annual Review' },
  { value: 'financial_planning', label: 'Financial Planning' },
  { value: 'tax_planning', label: 'Tax Planning' },
  { value: 'estate_planning', label: 'Estate Planning' },
  { value: 'insurance_review', label: 'Insurance Review' },
  { value: 'portfolio_review', label: 'Portfolio Review' },
  { value: 'retirement_planning', label: 'Retirement Planning' },
  { value: 'education_planning', label: 'Education Planning' },
  { value: 'business_planning', label: 'Business Planning' },
  { value: 'other', label: 'Other' },
];

const durationOptions = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
];

export function ScheduleMeetingModal({ isOpen, onClose, onSuccess, preselectedHouseholdId }: ScheduleMeetingModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [households, setHouseholds] = React.useState<Household[]>([]);
  const [formData, setFormData] = React.useState({
    title: '',
    meetingType: 'quarterly_review' as MeetingType,
    householdId: preselectedHouseholdId || '',
    date: '',
    time: '09:00',
    duration: '60',
    location: '',
    isVirtual: false,
    virtualMeetingUrl: '',
    description: '',
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
      // Calculate start and end times
      const startTime = new Date(`${formData.date}T${formData.time}:00`);
      const endTime = new Date(startTime.getTime() + parseInt(formData.duration) * 60000);

      const meetingData: CreateMeetingDto = {
        title: formData.title,
        type: formData.meetingType,
        householdId: formData.householdId || undefined,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        location: formData.isVirtual ? undefined : formData.location,
        isVirtual: formData.isVirtual,
        virtualMeetingUrl: formData.isVirtual ? formData.virtualMeetingUrl : undefined,
        description: formData.description || undefined,
      };
      
      await meetingsService.create(meetingData);
      onSuccess?.();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      meetingType: 'quarterly_review',
      householdId: preselectedHouseholdId || '',
      date: '',
      time: '09:00',
      duration: '60',
      location: '',
      isVirtual: false,
      virtualMeetingUrl: '',
      description: '',
    });
    setError(null);
    onClose();
  };

  // Get tomorrow's date as default
  const getDefaultDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Schedule Meeting"
      description="Set up a meeting with a client."
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Input
            label="Meeting Title"
            placeholder="e.g., Q4 Portfolio Review - Smith Family"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <FormRow>
            <Select
              label="Meeting Type"
              options={meetingTypeOptions}
              value={formData.meetingType}
              onChange={(value) => setFormData({ ...formData, meetingType: value as MeetingType })}
            />
            <Select
              label="Related Household"
              options={householdOptions}
              value={formData.householdId}
              onChange={(value) => setFormData({ ...formData, householdId: value })}
            />
          </FormRow>

          <FormRow>
            <Input
              label="Date"
              type="date"
              value={formData.date || getDefaultDate()}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <Input
              label="Time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
            />
          </FormRow>

          <Select
            label="Duration"
            options={durationOptions}
            value={formData.duration}
            onChange={(value) => setFormData({ ...formData, duration: value })}
          />

          <Checkbox
            label="Virtual Meeting"
            description="This meeting will be held online"
            checked={formData.isVirtual}
            onChange={(e) => setFormData({ ...formData, isVirtual: e.target.checked })}
          />

          {formData.isVirtual ? (
            <Input
              label="Meeting URL"
              type="url"
              placeholder="https://zoom.us/j/..."
              value={formData.virtualMeetingUrl}
              onChange={(e) => setFormData({ ...formData, virtualMeetingUrl: e.target.value })}
            />
          ) : (
            <Input
              label="Location"
              placeholder="e.g., Conference Room A, Client Office"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          )}

          <Textarea
            label="Notes/Agenda"
            placeholder="Meeting agenda or preparation notes..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
            Schedule Meeting
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
