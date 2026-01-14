'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { IntelligenceDashboard, MeetingBriefViewer, MeetingBriefGenerator } from '@/components/intelligence';
import { MeetingBrief } from '@/services/intelligence.service';

export default function IntelligencePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get('view');
  const briefId = searchParams.get('briefId');

  const [showGenerator, setShowGenerator] = React.useState(false);
  const [generatedBrief, setGeneratedBrief] = React.useState<MeetingBrief | null>(null);

  const handleBriefGenerated = (brief: MeetingBrief) => {
    setGeneratedBrief(brief);
    setShowGenerator(false);
  };

  // If viewing a specific brief
  if (view === 'brief' && (briefId || generatedBrief)) {
    return (
      <div className="p-6">
        <MeetingBriefViewer
          briefId={briefId || undefined}
          brief={generatedBrief || undefined}
          onClose={() => {
            setGeneratedBrief(null);
            router.push('/intelligence');
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <IntelligenceDashboard />

      {/* Meeting Brief Generator Modal */}
      <MeetingBriefGenerator
        asModal
        isOpen={showGenerator}
        onClose={() => setShowGenerator(false)}
        onGenerated={handleBriefGenerated}
      />
    </div>
  );
}
