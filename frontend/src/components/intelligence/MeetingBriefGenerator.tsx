'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FileTextIcon,
  SparklesIcon,
  CalendarIcon,
  PlusIcon,
  XIcon,
  Loader2Icon,
} from 'lucide-react';
import {
  Card,
  Button,
  Input,
  Select,
  FormGroup,
  FormRow,
  Modal,
  ModalFooter,
} from '@/components/ui';
import { intelligenceService, MeetingBrief } from '@/services/intelligence.service';
import { householdsService, Household } from '@/services/households.service';

// =============================================================================
// Types
// =============================================================================

interface MeetingBriefGeneratorProps {
  householdId?: string;
  meetingId?: string;
  onGenerated?: (brief: MeetingBrief) => void;
  asModal?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function MeetingBriefGenerator({
  householdId: propHouseholdId,
  meetingId,
  onGenerated,
  asModal = false,
  isOpen = true,
  onClose,
}: MeetingBriefGeneratorProps) {
  const [generating, setGenerating] = React.useState(false);
  const [households, setHouseholds] = React.useState<Household[]>([]);
  const [loadingHouseholds, setLoadingHouseholds] = React.useState(!propHouseholdId);
  const [formData, setFormData] = React.useState({
    householdId: propHouseholdId || '',
    meetingDate: new Date().toISOString().split('T')[0],
    meetingType: 'review',
    purpose: '',
  });
  const [customTopics, setCustomTopics] = React.useState<string[]>([]);
  const [newTopic, setNewTopic] = React.useState('');

  React.useEffect(() => {
    if (!propHouseholdId) {
      loadHouseholds();
    }
  }, [propHouseholdId]);

  const loadHouseholds = async () => {
    try {
      const data = await householdsService.getHouseholds();
      setHouseholds(data);
    } catch {
      toast.error('Failed to load households');
    } finally {
      setLoadingHouseholds(false);
    }
  };

  const handleAddTopic = () => {
    if (newTopic.trim() && !customTopics.includes(newTopic.trim())) {
      setCustomTopics([...customTopics, newTopic.trim()]);
      setNewTopic('');
    }
  };

  const handleRemoveTopic = (topic: string) => {
    setCustomTopics(customTopics.filter((t) => t !== topic));
  };

  const handleGenerate = async () => {
    if (!formData.householdId) {
      toast.error('Please select a household');
      return;
    }

    setGenerating(true);
    try {
      const brief = await intelligenceService.generateMeetingBrief({
        householdId: formData.householdId,
        meetingId,
        meetingDate: new Date(formData.meetingDate).toISOString(),
        meetingType: formData.meetingType,
        purpose: formData.purpose || undefined,
        additionalTopics: customTopics.length > 0 ? customTopics : undefined,
      });

      toast.success('Meeting brief generated successfully');
      onGenerated?.(brief);
      onClose?.();
    } catch {
      toast.error('Failed to generate meeting brief');
    } finally {
      setGenerating(false);
    }
  };

  const content = (
    <div className="space-y-4">
      {/* Description */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
        <SparklesIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-foreground font-medium">AI-Powered Brief Generation</p>
          <p className="text-xs text-muted-foreground mt-1">
            Generate a comprehensive meeting preparation brief including client profile,
            portfolio snapshot, talking points, and recommended actions.
          </p>
        </div>
      </div>

      <FormGroup>
        {/* Household Selection */}
        {!propHouseholdId && (
          <Select
            label="Household"
            value={formData.householdId}
            onChange={(value) => setFormData({ ...formData, householdId: value })}
            options={households.map((h) => ({ value: h.id, label: h.name }))}
            placeholder={loadingHouseholds ? 'Loading...' : 'Select household'}
            disabled={loadingHouseholds}
            required
          />
        )}

        <FormRow>
          {/* Meeting Date */}
          <Input
            label="Meeting Date"
            type="date"
            value={formData.meetingDate}
            onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
            required
          />

          {/* Meeting Type */}
          <Select
            label="Meeting Type"
            value={formData.meetingType}
            onChange={(value) => setFormData({ ...formData, meetingType: value })}
            options={[
              { value: 'review', label: 'Annual Review' },
              { value: 'quarterly', label: 'Quarterly Review' },
              { value: 'onboarding', label: 'Onboarding' },
              { value: 'planning', label: 'Financial Planning' },
              { value: 'estate', label: 'Estate Planning' },
              { value: 'tax', label: 'Tax Planning' },
              { value: 'adhoc', label: 'Ad-hoc Meeting' },
            ]}
          />
        </FormRow>

        {/* Purpose */}
        <Input
          label="Meeting Purpose"
          placeholder="e.g., Review Q4 performance and discuss retirement timeline"
          value={formData.purpose}
          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
        />

        {/* Custom Topics */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Additional Talking Points
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Add a custom topic..."
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddTopic}
              disabled={!newTopic.trim()}
            >
              <PlusIcon className="w-4 h-4" />
            </Button>
          </div>
          {customTopics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {customTopics.map((topic) => (
                <motion.span
                  key={topic}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                >
                  {topic}
                  <button
                    type="button"
                    onClick={() => handleRemoveTopic(topic)}
                    className="hover:text-primary/70"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </motion.span>
              ))}
            </div>
          )}
        </div>
      </FormGroup>
    </div>
  );

  if (asModal) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose || (() => {})}
        title="Generate Meeting Brief"
        description="Create an AI-powered preparation brief for your upcoming meeting."
        size="lg"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
          {content}
          <ModalFooter>
            <Button variant="ghost" onClick={onClose} type="button" disabled={generating}>
              Cancel
            </Button>
            <Button type="submit" disabled={generating || !formData.householdId} className="gap-2">
              {generating ? (
                <>
                  <Loader2Icon className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4" />
                  Generate Brief
                </>
              )}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    );
  }

  return (
    <Card>
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <FileTextIcon className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Generate Meeting Brief</h2>
        </div>
      </div>
      <div className="p-4">
        {content}
        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleGenerate}
            disabled={generating || !formData.householdId}
            className="gap-2"
          >
            {generating ? (
              <>
                <Loader2Icon className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4" />
                Generate Brief
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default MeetingBriefGenerator;
