# Postmark Inbound Email Setup Guide

This guide configures Postmark to receive forwarded research emails and deliver them to the CRM's ingestion pipeline via webhook.

---

## Prerequisites

- Access to your firm's DNS provider (to set MX records)
- A deployed Supabase project (the Edge Function must be deployed first)
- A Postmark account (free tier works for testing)

---

## Step 1 — Create a Postmark Account

1. Go to [postmarkapp.com](https://postmarkapp.com) and sign up.
2. Verify your email address.

---

## Step 2 — Create a New Server

1. In the Postmark dashboard, click **Servers → Add New Server**.
2. Name it something like `CRM Research Inbound`.
3. Select **Transactional** mode (or **Broadcasts** if you also plan to send bulk emails from this server).
4. Copy your **Server API Token** — you will need it as `POSTMARK_SERVER_TOKEN`.

---

## Step 3 — Enable Inbound Processing

1. Open your server in the Postmark dashboard.
2. Click **Settings → Inbound**.
3. Enable **Inbound Processing**.
4. Note the auto-generated **inbound email address** (e.g., `abc123def@inbound.postmarkapp.com`) — you can use this address immediately for testing before setting up a custom domain.

---

## Step 4 — Configure a Custom Inbound Domain (Recommended for Production)

Using a branded domain (e.g., `research@inbound.yourfirm.com`) looks more professional and avoids the random Postmark address.

### 4a. Add your inbound domain in Postmark

1. Go to **Settings → Inbound → Set Up Inbound Domain**.
2. Enter your subdomain, e.g., `inbound.yourfirm.com`.
3. Postmark will show you the required MX record.

### 4b. Create the MX DNS record

At your DNS provider, add:

| Type | Host / Name | Value | Priority |
|------|-------------|-------|----------|
| MX | `inbound.yourfirm.com` | `inbound.postmarkapp.com` | `10` |

> DNS propagation can take up to 48 hours. Postmark will verify the record automatically.

### 4c. Create an inbound address

1. Once the domain is verified, go to **Settings → Inbound → Inbound Addresses**.
2. Create an address like `research@inbound.yourfirm.com`.
3. This is the address your team will forward research emails to.

---

## Step 5 — Deploy the Supabase Edge Function

If not already deployed:

```bash
# From the project root
npx supabase functions deploy ingest-research-email --project-ref <your-project-ref>
```

The deployed URL will be:
```
https://<your-project-ref>.supabase.co/functions/v1/ingest-research-email
```

---

## Step 6 — Set the Webhook URL in Postmark

1. Go to **Settings → Inbound → Webhook**.
2. Set the **Webhook URL** to your Edge Function URL:
   ```
   https://<your-project-ref>.supabase.co/functions/v1/ingest-research-email
   ```
3. Click **Check** to verify Postmark can reach the endpoint (it sends a test POST).
4. Save.

> **Alternative:** If you prefer to use the NestJS webhook endpoint instead of the Edge Function, point the webhook to:
> ```
> https://api.yourfirm.com/api/research/ingest/email
> ```
> Ensure your NestJS API is publicly reachable and protected by the `JwtAuthGuard` bypass for this specific route.

---

## Step 7 — Configure Environment Variables

### Supabase Edge Function secrets

Set these via the Supabase dashboard (**Settings → Edge Functions → Secrets**) or with the CLI:

```bash
npx supabase secrets set POSTMARK_WEBHOOK_SECRET=your-webhook-secret
npx supabase secrets set POSTMARK_SERVER_TOKEN=your-server-token
npx supabase secrets set ALLOWED_SENDER_DOMAINS=yourfirm.com,partnerbroker.com
npx supabase secrets set OPENAI_API_KEY=your-openai-api-key
```

### NestJS backend `.env`

```env
# Postmark
POSTMARK_SERVER_TOKEN=your-server-token
POSTMARK_WEBHOOK_SECRET=your-webhook-secret
POSTMARK_INBOUND_ADDRESS=research@inbound.yourfirm.com

# AI Processing
OPENAI_API_KEY=your-openai-api-key

# Supabase
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Redis (Bull queue)
REDIS_HOST=localhost
REDIS_PORT=6379

# Allowed sender domains (comma-separated; leave empty to allow all)
ALLOWED_SENDER_DOMAINS=yourfirm.com,partnerbroker.com
```

> **Security:** Never commit real secrets to version control. Use `.env.local` locally and a secrets manager (Doppler, AWS Secrets Manager, etc.) in production.

---

## Step 8 — Configure the Webhook Signature Secret

Postmark can sign inbound webhook payloads with an HMAC-SHA256 signature:

1. In Postmark, go to **Settings → Webhooks → Security Token**.
2. Generate a new token and copy it.
3. Set it as `POSTMARK_WEBHOOK_SECRET` in your Supabase Edge Function secrets.

The Edge Function (`ingest-research-email/index.ts`) verifies the `X-Postmark-Signature` header on every request and rejects unsigned or incorrectly signed payloads.

---

## Step 9 — Configure Allowed Sender Domains

To prevent unauthorized senders from injecting fake research, set `ALLOWED_SENDER_DOMAINS` to a comma-separated list of trusted email domains:

```
ALLOWED_SENDER_DOMAINS=yourfirm.com,trustedbrokerage.com,morganstanley.com
```

Emails from any other domain will receive a `200 OK` response (to prevent Postmark retries) but will **not** be ingested.

Leave the variable empty or unset to allow all senders (useful during initial development only).

---

## Step 10 — Test the Integration

### Send a test email

1. Forward any research email to `research@inbound.yourfirm.com` (or the Postmark auto-address).
2. Postmark will POST the parsed email to your webhook within seconds.

### Monitor in Postmark

1. Go to **Activity → Inbound** in the Postmark dashboard.
2. You should see the incoming message listed with a `200` delivery status.
3. Click the message to inspect the full JSON payload that was sent to your webhook.

### Verify in Supabase

```sql
-- Check that the research item was created
SELECT id, title, status, ingested_at
FROM research_items
ORDER BY ingested_at DESC
LIMIT 5;

-- Check raw email storage
SELECT name, created_at
FROM storage.objects
WHERE bucket_id = 'research-attachments'
  AND name LIKE 'raw-emails/%'
ORDER BY created_at DESC
LIMIT 5;
```

---

## Step 11 — Monitor the AI Processing Pipeline

After ingestion, the `process-research-item` Edge Function (or Bull queue job) runs asynchronously.

```sql
-- Check processing status
SELECT id, title, status, processed_at,
       jsonb_array_length(extracted_tickers) AS ticker_count
FROM research_items
ORDER BY ingested_at DESC
LIMIT 10;

-- Items stuck in processing > 10 minutes
SELECT id, title, ingested_at
FROM research_items
WHERE status = 'processing'
  AND ingested_at < NOW() - INTERVAL '10 minutes';
```

---

## Troubleshooting

| Issue | Likely cause | Resolution |
|-------|-------------|------------|
| Postmark shows `5xx` delivery error | Edge Function is not deployed or URL is wrong | Re-deploy with `supabase functions deploy` and verify the URL |
| Emails arrive but items not created | Supabase DB connection error | Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets |
| `401 Unauthorized` in Postmark logs | Webhook secret mismatch | Regenerate and re-set `POSTMARK_WEBHOOK_SECRET` in both Postmark and Supabase |
| Sender rejected silently | Domain not in `ALLOWED_SENDER_DOMAINS` | Add sender domain to the env var |
| AI processing fails | OpenAI quota exceeded or invalid key | Check OpenAI dashboard; rotate `OPENAI_API_KEY` if needed |
| MX record not verified | DNS propagation still pending | Wait up to 48 hours; use `dig MX inbound.yourfirm.com` to check |

---

## Reference Architecture

```
Team member
  │
  │  forwards email to
  ▼
research@inbound.yourfirm.com
  │
  │  Postmark receives, parses, POSTs JSON
  ▼
Supabase Edge Function: ingest-research-email
  │
  ├── Verifies HMAC signature
  ├── Validates sender domain
  ├── Stores raw email JSON → Supabase Storage (research-attachments)
  ├── Creates research_items record (status: pending)
  ├── Uploads attachments → Supabase Storage
  ├── Creates research_attachments records
  └── Fire-and-forget → process-research-item Edge Function
                            │
                            ├── Extracts text from attachments
                            ├── GPT-4o-mini: summarize
                            ├── GPT-4o-mini: extract securities
                            ├── GPT-4o-mini: sentiment per security
                            ├── GPT-4o-mini: auto-tag
                            ├── Persists tags & securities
                            └── Updates research_items (status: processed)
```

---

## Required Supabase Storage Buckets

Create these buckets in your Supabase project (**Storage → New Bucket**):

| Bucket name | Access | Purpose |
|-------------|--------|---------|
| `research-attachments` | Private | Stores raw email JSON and file attachments |

```sql
-- Or create via SQL
INSERT INTO storage.buckets (id, name, public)
VALUES ('research-attachments', 'research-attachments', false);

-- RLS policy: allow service role full access
CREATE POLICY "Service role full access"
  ON storage.objects FOR ALL
  USING (auth.role() = 'service_role');

-- RLS policy: allow authenticated users to read attachments for their own items
CREATE POLICY "Authenticated read research attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'research-attachments');
```
