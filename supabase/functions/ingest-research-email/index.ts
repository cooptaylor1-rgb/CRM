import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PostmarkInboundMessage {
  From: string;
  FromName: string;
  FromFull: { Email: string; Name: string };
  To: string;
  ToFull: { Email: string; Name: string }[];
  Cc: string;
  Subject: string;
  MessageID: string;
  Date: string;
  TextBody: string;
  HtmlBody: string;
  StrippedTextReply: string;
  Tag: string;
  Headers: { Name: string; Value: string }[];
  Attachments: {
    Name: string;
    Content: string; // base64-encoded
    ContentType: string;
    ContentLength: number;
  }[];
}

interface ProcessingResult {
  researchItemId: string;
  attachmentCount: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALLOWED_DOMAINS = (Deno.env.get('ALLOWED_SENDER_DOMAINS') ?? '')
  .split(',')
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

const POSTMARK_WEBHOOK_SECRET = Deno.env.get('POSTMARK_WEBHOOK_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Verify the X-Postmark-Signature header against our shared secret.
 * Postmark sends the raw body HMAC-SHA256 signed with the webhook secret.
 */
async function verifyPostmarkSignature(
  body: string,
  signature: string | null,
  secret: string,
): Promise<boolean> {
  if (!signature || !secret) return false;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const bodyData = encoder.encode(body);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, bodyData);
  const signatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Base64-encode to match Postmark's format
  const expectedBase64 = btoa(
    String.fromCharCode(...new Uint8Array(signatureBuffer)),
  );

  return expectedBase64 === signature;
}

function extractDomain(email: string): string {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : '';
}

function isSenderAllowed(email: string): boolean {
  if (ALLOWED_DOMAINS.length === 0) return true; // open if not configured
  const domain = extractDomain(email);
  return ALLOWED_DOMAINS.includes(domain);
}

/**
 * Decode base64 attachment content to Uint8Array.
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req: Request) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rawBody = await req.text();

  // ---------------------------------------------------------------------------
  // 1. Verify Postmark webhook signature
  // ---------------------------------------------------------------------------
  const signature = req.headers.get('X-Postmark-Signature');
  if (POSTMARK_WEBHOOK_SECRET) {
    const valid = await verifyPostmarkSignature(rawBody, signature, POSTMARK_WEBHOOK_SECRET);
    if (!valid) {
      console.error('Invalid Postmark webhook signature');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Parse payload
  // ---------------------------------------------------------------------------
  let message: PostmarkInboundMessage;
  try {
    message = JSON.parse(rawBody) as PostmarkInboundMessage;
  } catch (err) {
    console.error('Failed to parse Postmark payload:', err);
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ---------------------------------------------------------------------------
  // 3. Validate sender domain
  // ---------------------------------------------------------------------------
  const senderEmail = message.FromFull?.Email ?? message.From ?? '';
  if (!isSenderAllowed(senderEmail)) {
    console.warn(`Rejected email from disallowed sender: ${senderEmail}`);
    // Return 200 to prevent Postmark retries for intentionally blocked senders
    return new Response(JSON.stringify({ message: 'Sender not allowed' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ---------------------------------------------------------------------------
  // 4. Initialize Supabase client (service role — bypasses RLS)
  // ---------------------------------------------------------------------------
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // ---------------------------------------------------------------------------
  // 5. Store raw email JSON in Supabase Storage
  // ---------------------------------------------------------------------------
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const rawEmailKey = `raw-emails/${timestamp}_${message.MessageID ?? 'unknown'}.json`;

  const { error: storageError } = await supabase.storage
    .from('research-attachments')
    .upload(rawEmailKey, JSON.stringify(message, null, 2), {
      contentType: 'application/json',
      upsert: false,
    });

  if (storageError) {
    console.error('Failed to store raw email:', storageError);
    // Non-fatal — continue processing
  }

  // ---------------------------------------------------------------------------
  // 6. Resolve or create the research_source record for this sender
  // ---------------------------------------------------------------------------
  let sourceId: string | null = null;
  {
    const { data: existingSource } = await supabase
      .from('research_sources')
      .select('id')
      .eq('email_address', senderEmail)
      .maybeSingle();

    if (existingSource) {
      sourceId = existingSource.id;
    } else {
      const { data: newSource, error: sourceErr } = await supabase
        .from('research_sources')
        .insert({
          name: message.FromName || senderEmail,
          source_type: 'email',
          email_address: senderEmail,
          is_active: true,
        })
        .select('id')
        .single();

      if (sourceErr) {
        console.error('Failed to create research_source:', sourceErr);
      } else {
        sourceId = newSource?.id ?? null;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 7. Create research_item record (status: pending)
  // ---------------------------------------------------------------------------
  const contentText = message.TextBody ?? message.StrippedTextReply ?? '';
  const contentHtml = message.HtmlBody ?? '';

  const { data: researchItem, error: insertError } = await supabase
    .from('research_items')
    .insert({
      source_id: sourceId,
      title: message.Subject || '(No Subject)',
      content_text: contentText,
      content_html: contentHtml,
      author: message.FromName || senderEmail,
      published_at: message.Date ? new Date(message.Date).toISOString() : new Date().toISOString(),
      ingested_at: new Date().toISOString(),
      status: 'pending',
      raw_storage_path: rawEmailKey,
      metadata: {
        message_id: message.MessageID,
        from: message.From,
        to: message.To,
        cc: message.Cc,
        headers: message.Headers,
      },
    })
    .select('id')
    .single();

  if (insertError || !researchItem) {
    console.error('Failed to create research_item:', insertError);
    return new Response(
      JSON.stringify({ error: 'Failed to create research item', details: insertError }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const researchItemId = researchItem.id as string;

  // ---------------------------------------------------------------------------
  // 8. Process attachments
  // ---------------------------------------------------------------------------
  const attachments = message.Attachments ?? [];
  let attachmentCount = 0;

  for (const attachment of attachments) {
    try {
      // Decode base64 content
      const fileBytes = base64ToUint8Array(attachment.Content);

      // Build storage path
      const safeFilename = attachment.Name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `attachments/${researchItemId}/${timestamp}_${safeFilename}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('research-attachments')
        .upload(storagePath, fileBytes, {
          contentType: attachment.ContentType,
          upsert: false,
        });

      if (uploadError) {
        console.error(`Failed to upload attachment ${attachment.Name}:`, uploadError);
        continue;
      }

      // Create research_attachment record
      const { error: attachmentError } = await supabase.from('research_attachments').insert({
        research_item_id: researchItemId,
        filename: attachment.Name,
        content_type: attachment.ContentType,
        file_size: attachment.ContentLength,
        storage_path: storagePath,
        processing_status: 'pending',
      });

      if (attachmentError) {
        console.error(`Failed to create attachment record for ${attachment.Name}:`, attachmentError);
      } else {
        attachmentCount++;
      }
    } catch (err) {
      console.error(`Error processing attachment ${attachment.Name}:`, err);
    }
  }

  // ---------------------------------------------------------------------------
  // 9. Trigger async AI processing via Supabase Edge Function invocation
  //    (fire-and-forget — do not await, Postmark expects fast 200 response)
  // ---------------------------------------------------------------------------
  const processUrl = `${SUPABASE_URL}/functions/v1/process-research-item`;
  fetch(processUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ researchItemId }),
  }).catch((err) => console.error('Failed to trigger processing:', err));

  // ---------------------------------------------------------------------------
  // 10. Return 200 OK to Postmark
  // ---------------------------------------------------------------------------
  const result: ProcessingResult = { researchItemId, attachmentCount };
  console.log(`Successfully ingested email: ${researchItemId} (${attachmentCount} attachments)`);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
