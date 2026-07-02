# Bricly Lead Capture and Routing Flow

End-to-end flow for how a stranger becomes a structured lead inside the Bricly CRM: captured from any channel, parsed, enriched, deduplicated, qualified, attributed to a project, and handed off to the routing engine ready for first contact.

This flow sits between Go-to-Market (which creates the stranger's interest) and Sales Process (which works the lead toward a deal). It picks up at the moment a stranger expresses interest via any channel and ends at the moment the Contact and Opportunity exist in the CRM, fully attributed, scored, and queued for routing.

This is the ideal-product flow. MVP scoping is a separate exercise.

---

## Scope and boundary

**Start state.** A person who is not yet in the workspace expresses interest via any channel: a Bricly-hosted form, a Meta/Google/LinkedIn lead ad, an inbound WhatsApp message, an email enquiry, a phone call (where CTI integration exists), a social DM, a walk-in to the sales office, a partner referral, or an MCP-native call from an external AI agent.

**End state.** A Contact exists in the workspace (state = Lead), an Opportunity exists in the sales Pipeline (stage = Waitlist or New Lead depending on capture context), source attribution is permanent, qualification score is computed, dedup is resolved, and the routing engine is queued to fire. The Sales Process flow's Stage 2 (Routing and assignment) picks up from here.

**Out of scope.** Routing logic itself (Sales Process flow, Stage 2). Notification fan-out to the assigned rep (Sales Process flow, Stage 3). Automated first touch and conversational qualifying (Sales Process flow, Stage 4 and 5). Anything that happens after a rep is assigned.

---

## Operating principles for this flow

1. **A lead is anyone showing buyer-side interest.** Anyone who submits any form, requests information, registers for a waitlist, walks in, or otherwise expresses interest in being a buyer becomes a Contact (state = Lead) and an Opportunity in the sales Pipeline. No qualification gate at capture beyond the minimum identity rule.
2. **Minimum viable Contact = phone OR email.** No Contact is created without at least one of those two identifiers. Social handles, names, and walk-in records without phone or email live in the Conversations tab as UnresolvedConversation entities until phone or email is obtained.
3. **Speed matters. Capture is autonomous wherever possible.** The capture flow is one of the strongest candidates for full agent autonomy in Bricly. Parsing, enrichment, dedup, scoring, project attribution, and the Contact + Opportunity write all run without human input across Tiers 1, 2, 3 (after parser), and 5. Tier 4 (manual entry) and Tier 3 phone calls with CTI require rep approval.
4. **Source attribution is captured at the moment of creation and never lost.** Channel, campaign, project of interest, original message content, capture context, qualification score, dedupe candidates considered, conversion event timestamp. All sit on the Contact's capture cluster and on the Opportunity's source fields permanently.
5. **One developer = one workspace, many projects.** Dedup runs per-workspace. A Contact who enquires on multiple projects in the same workspace is one Contact with one Opportunity carrying multiple attached Projects. Cross-workspace dedup is by design not supported.
6. **No duplicate Contacts.** Strict phone uniqueness is enforced. Dedup also runs on email with appropriate flagging. The dedup decision tree determines whether a capture appends to an existing Opportunity, creates a new Opportunity on an existing Contact, or creates a fresh Contact.
7. **Visibility-aware capture.** The MCP server and all external-facing surfaces respect what the developer has chosen to publish on the canonical project_public_site Microsite. Held-back content (private floor plans, unpublished pricing, undisclosed units) stays held back. Captures that ask for held-back content carry a `request_private_info` flag so the rep can decide whether to disclose during first contact.
8. **Studio is not invoked at capture.** Exception: form-gated brochure download, which uses the standard project brochure template (already generated during launch package generation) and delivers it via T27 `share_asset` with a tracked link. No render compute at capture time. Personalised buyer pack generation waits until after first contact when the rep has more context.
9. **Capture writes are atomic.** Contact + Opportunity + capture Activity + queued Notification + SyncEvent + AuditEvent all happen as one transaction. Either the whole capture succeeds or it fails cleanly with a structured error.
10. **Outbound timing respects developer-configured business hours.** Email always fires immediately. WhatsApp and SMS hold until the next business hours window. Inbound replies always get an immediate acknowledgment regardless of hours; substantive conversation either resumes during business hours (default) or runs 24/7 if the developer has opted in.

---

## Roles in this flow

| Role | Default permissions in this flow | Bypass capability |
|------|----------------------------------|--------------------|
| Sales Rep | View captures routed to them. Manually create captures (walk-in, partner referral keyed in, repeat client). Approve proposed captures from CTI-transcribed phone calls and walk-in conversational input. View Conversations tab. Manually upgrade UnresolvedConversation to Contact. Manually split dedup-blocked phone matches. | None by default. |
| Senior Sales Rep | Same as Sales Rep. Receives weighted-preference high-score lead allocation when routing fires. | None by default. |
| Sales Manager | All Sales Rep permissions. Review unassigned queue. Review spam-filtered inbox. Override partner attribution disputes. Approve country-restricted captures or auto-decline. Manage workspace suppression list. Configure routing rules including the consultation booking pool. Re-engage stale Opportunities on dedup match. | Implicit. |
| Marketing | View capture analytics, channel attribution, campaign performance. No client data access, no capture creation, no dedup decisions. | N/A. |
| Admin / Developer | Configure workspace business hours, enrichment tier, conversational agent 24/7 setting, country restriction rules, partner visibility defaults, consultation booking pool, scoring weightings, spam filter aggressiveness, on-call rotation. Approve Partner MCP credentials. Toggle Sunday outbound. | Implicit. |
| Partner (external) | Submit captures via Partner portal, email, or authenticated MCP. View status of their submitted leads. View their commission accrual. No access to Contact data beyond what they submitted. | N/A. Not a workspace User. |
| Buyer-side AI agent (external) | Anonymous MCP access to `capture_lead` and public Resources scoped to canonical project_public_site Microsite visibility. Rate-limited. | N/A. |

---

# Part 1: The capture flow stage by stage

## Stage 1. Channel intake

Trigger: a person expresses interest via any supported channel. Each channel has its own intake mechanism, payload structure, and transport. All five tiers feed into a common normalisation step at Stage 2.

The five tiers and their constituent channels:

### Tier 1: Bricly-hosted forms

Bricly owns the form, the surface, the fields, the validation, and the transport. Cleanest data quality.

| Surface | Form | Stage of Opportunity created |
|---------|------|------------------------------|
| Project microsite (post-launch) | Form A: Register Interest | New Lead |
| Project microsite (post-launch) | Form B: Request Information / Viewing on specific unit(s), up to 3 selected | New Lead |
| Project microsite (post-launch) | Form-gated brochure download | New Lead, brochure delivered via T27 |
| Teaser microsite (pre-launch) | Waitlist registration | Waitlist |
| Project microsite thank-you page | Consultation booking (offered to all Form A and Form B submitters) | Viewing Booked |

**Form A (Register Interest) fields:**
- Required: first name, last name, phone (with country code), email, buyer type (investment / home / undecided), property type interest
- Optional: budget band, country of residence, preferred contact method, preferred contact time, free-text message
- Hidden (server-side): Project ID (from microsite context), microsite session ID, pre-submission engagement signals (pages viewed, time on site), UTM/campaign attribution, capture timestamp, IP-derived geo, user agent

**Form B (Request Information / Viewing) fields:**
- Same identity and preference fields as Form A
- Additional: 1–3 selected Units (from Unit detail page or availability list)
- Same hidden fields as Form A

**Form-gated brochure download fields:**
- Required: first name, last name, phone, email, buyer type
- Optional: stated unit interest (lighter intent capture)
- Same hidden fields

**Waitlist form fields (teaser microsite):**
- Required: name, email, phone, buyer type, property type interest
- Optional: country of residence
- Same hidden fields. No stated unit interest by design (pre-launch buyers don't know specific units yet)

**Consultation booking surface:**
- Reached from Form A or Form B thank-you page (not from waitlist or brochure download)
- Shows union of all eligible reps' availability
- Eligible reps = reps assigned to the project, falling back to all sales reps in the workspace if no project assignment exists
- Capacity-aware (reps over their lead cap don't appear)
- OOO-aware (reps flagged unavailable don't appear)
- Developer can override the default pool with a specific named list of reps eligible for consultation booking on a given project
- Buyer picks slot; the rep who owns that slot becomes the assigned User on the Opportunity
- Single atomic write creates Contact + Opportunity + Appointment, Opportunity goes straight to stage Viewing Booked, skipping New Lead and Qualified
- If buyer is offered consultation booking but doesn't book, a `consultation_offered_not_booked` Activity is logged on the Opportunity for rep context on first contact

**Submission behaviour across all Tier 1 surfaces:**
- Client-side validation (format only, no required-field bypass)
- Server-side validation with dedup-aware response
- Honeypot field for bot protection
- Rate limiting per IP and per phone
- Confirmation surface (thank-you page + retargeting pixel fire + optional consultation booking offer)
- Contact + Opportunity are written immediately on form submission, before any redirect or booking action

### Tier 2: External structured ad forms

Webhook from Meta / Google / LinkedIn Ads APIs. Backup reconciliation via daily API pull to catch dropped webhook events.

**Meta Lead Ads (Facebook + Instagram):**
- Pre-filled fields: full name, email, phone, city, country (from Meta profile)
- Custom questions configured by Bricly: buyer type, property type interest, budget band, country of residence (if not pre-filled), preferred contact method, optional free text
- Transport: webhook from Meta Lead Ads API + daily reconciliation pull
- Project attribution: Meta campaign ID maps to Bricly Project via the campaign-to-project mapping (configured automatically when Bricly orchestrates the campaign in Go-to-Market, or manually for externally-launched campaigns)

**Google Lead Form Ads:**
- Pre-fill: name, email, phone, postcode, work email, job title, company name
- Custom questions: buyer type, property type interest, budget band, country of residence
- Transport: Google Ads API webhook + reconciliation pull
- Project attribution: same campaign-to-project mapping pattern as Meta

**LinkedIn Lead Gen Forms:**
- Pre-fill: name, email, phone, job title, company, seniority, industry
- Custom questions: buyer type, property type interest, budget band
- Transport: LinkedIn API webhook + reconciliation pull
- Project attribution: campaign-to-project mapping
- Higher-LTV signal density due to professional context in pre-fill data; particularly valuable for premium enrichment scoring

**Accidental submission signal:** Tier 2 captures with form completion under 2 seconds and Meta pre-fill carry an `accidental_submission_signal` flag. Behaviour: auto-deprioritise within pipeline (templated auto-touch only, no rep notification unless buyer responds). Not auto-disqualified. The buyer can still respond to the auto-touch and get bumped to rep priority.

**Project-agnostic ads:** developer-level ads not tied to a specific Project (e.g., "Discover our upcoming developments") create project_agnostic Opportunities. Routing goes round-robin across all reps in the workspace.

### Tier 3: Unstructured conversational channels

All Tier 3 captures route through the single-capability parser. One parser, multi-channel input, structured output with confidence per field.

**WhatsApp inbound:**
- Transport: WhatsApp Business API via Cloud API or a BSP. Bricly owns the developer's WhatsApp Business number as the system of record.
- Sub-case T3.A.1 (reply to Bricly-initiated outbound): not a new capture. Routed to existing Opportunity. Owner notified.
- Sub-case T3.A.2 (cold inbound): new capture flow fires. Phone is the identifier. Parser extracts project mention, unit reference, buyer type signal, budget signal, name, timeline.
- Voice notes: transcribed via Whisper, then parsed.
- Images: parsed via Claude vision, then context fed to parser.
- Failure fallback: empty parser output. Contact + Opportunity still created at New Lead with project_agnostic. Conversational agent's first acknowledgment asks for context.

**Email inbound:**
- Transport: OAuth into developer's Google Workspace / Microsoft 365 mailbox, or Bricly-hosted unique address per workspace.
- Identifier: sender email address. Dedup on email.
- Parser extracts project mention, unit reference, buyer type, budget, name, signature block contact details, timeline.
- Reply-all chains: parser considers only the most recent message in the thread.
- Out-of-office auto-replies: detected and discarded, no capture.
- Spam, vendor pitches, automated newsletters: parser classifies; below confidence threshold discarded.
- Attachments (CV, financial statements, passport, etc.): stored as Documents on the Contact, status unverified, flagged for rep review. Not parsed for capture data.

**Phone call (CTI-transcribed):**
- Transport: CTI integration (Aircall, Dialpad, JustCall, Twilio Voice, or equivalent) delivers transcript + caller ID + duration + outcome after call ends.
- Sub-case T3.C.1 (answered call): proposed Contact + Opportunity surfaced to rep for approval before write. Rep approves or edits in one click.
- Sub-case T3.C.2 (missed call or voicemail): auto-create capture stub. Contact created with phone, Opportunity at New Lead, capture context = "missed call at HH:MM" or voicemail transcript. Urgent notification to assigned rep at start of next business hours window (or immediately if within hours).
- Without CTI: no automated capture. Rep manually creates if they want to track. Missed calls without CTI are invisible to Bricly.

**Social DM (Instagram, Facebook, LinkedIn):**
- Transport: Meta Business Inbox API (Instagram and Facebook), LinkedIn API.
- Identifier: social handle.
- Same parser pattern as WhatsApp.
- If the DM contains a phone or email in the message text, that becomes the identity. If not, the conversation lives in the Conversations tab as an UnresolvedConversation until phone or email is obtained.
- Same conversational agent behaviour as WhatsApp (paced responses, human tendencies, 24/7 toggle, acknowledgment-only outside business hours by default).
- Public comments on social media posts are out of scope. DMs only.

### Tier 4: Manual entry

**Walk-in:**
- Surface: rep at sales office types or speaks the capture into the CRM.
- Two interaction modes:
  - Conversational input (default): rep summarises in free text, parser proposes Contact + Opportunity, rep approves.
  - Form-based input (fallback): rep fills the same field structure as Tier 1 Form A.
- If buyer didn't share phone or email: capture is recorded as UnresolvedConversation in the Conversations tab, upgradeable when contact details are obtained.
- Owner = the rep entering the capture. No routing engine fires (rep is implicit owner).

**Partner / agency referral:**
- Channel T4.B.1: authenticated MCP submission (covered in Tier 5.B).
- Channel T4.B.2: Partner portal. Bricly-hosted partner-facing portal where partner reps log in, submit leads, see status and commission accrual.
- Channel T4.B.3: partner emails the developer. Parsed via Tier 3 email logic. Parser recognises sender as a known Partner and applies attribution.
- Channel T4.B.4: developer's rep keys it in. Walk-in mechanics with Partner manually selected as source attribution.
- All four paths carry Partner attribution for commission tracking.
- Partner attribution rule on dedup conflict: **first touch wins by default**. If the buyer was already in the system before the Partner submission, the Partner does not receive attribution on the existing Opportunity. Manager can override on specific Opportunities if they judge the Partner caused the deal.

**Repeat client:**
- Surface: rep opens existing Contact (state = past_client or similar), creates new Opportunity on the Contact, selects Project.
- No dedup needed (Contact exists).
- Opportunity at New Lead, source channel = `repeat_client`, owner = the rep.

### Tier 5: MCP-native captures

External AI agents call Bricly's MCP server directly. Two distinct authentication patterns.

**Tier 5.A — Buyer-side AI agent:**
- Anonymous MCP access to `capture_lead` (no buyer authentication required).
- Rate-limited and bot-protected, same as public web forms.
- Payload identifies the calling agent platform (`caller_agent_id`: claude, chatgpt, perplexity, etc.) where available.
- Identifier of the buyer comes from the agent's payload (phone or email, plus name).
- Minimum-identity rule applies: capture rejected with structured error if phone and email are both missing. Agent can ask the buyer for missing data and retry.
- MCP server only exposes content the developer has published on the canonical project_public_site Microsite. Buyer agent calls to look up unit details return only published units with published data.
- If buyer agent requests held-back content, the MCP server returns "this detail is held back, submit capture to request" and the agent submits a capture with `request_private_info` flag set.

**Tier 5.B — Partner-side AI agent:**
- Authenticated MCP via Partner credential issued at Partner onboarding.
- Partner attribution applied automatically at write time.
- Higher rate limit than anonymous T5.A.
- Visibility scope developer-configured per Partner: default = public view (same as buyers), optional = full view (held-back assets accessible).

**Common Tier 5 behaviour:**
- Idempotency token on every capture request. Bricly deduplicates retries within a 5-minute window.
- Structured error responses for validation failures, dedup blocks, suppression list hits, missing minimum identity.
- Response payload (default conservative): `status`, `contact_id`, `opportunity_id`, dedup outcome (new vs existing Contact), Opportunity stage assigned, status URL for polling. Workspace can opt in to enriched response with assigned rep name, time-to-contact SLA, and project context.

---

## Stage 2. Content parsing (Tier 3 only)

| Field | Description |
|-------|-------------|
| Trigger | Tier 3 inbound message captured at Stage 1 |
| Actor | Agent |
| Capability | (Gap) `parse_inbound_content`. Optionally preceded by (Gap) `transcribe_voice_note` for voice notes or (Gap) `parse_image_context` for images. |
| Entity affected | None yet. Structured prediction held in memory for use in subsequent stages. |
| Output | Structured prediction with confidence per field: name, phone (if in message body, not just channel handle), email (if in message body), project_mention, unit_mention, buyer_type, budget_signal, timeline_signal, opt_out_signal, spam_signal, urgent_signal, request_private_info_signal |
| Decision points | Confidence per field determines whether the field populates directly or stays empty for rep clarification. Opt-out signal at high confidence triggers Do_Not_Contact path at Stage 6. Spam signal at high confidence triggers spam filter path at Stage 6. |
| Agent role | Pattern 1: parsing is autonomous. Pattern 4: if parser fails to extract sufficient context, the conversational agent takes over to gather context through reply. |

The parser is owned middleware (prompts, workspace context, confidence handling, fallback logic) over an orchestrated LLM (Claude or GPT). One parser handles all four Tier 3 channels. Channel-specific behaviour lives in pre-parser normalisation (voice transcription, email body extraction, image parsing) and post-parser handling (different first-touch templates per channel).

For Tier 1, Tier 2, Tier 4 form-based, and Tier 5, this stage is skipped because the structured payload is already explicit.

For Tier 4 conversational input (rep free-text walk-in summary), the same parser is invoked via T14 `log_contact_communication`.

---

## Stage 3. Identity normalisation

| Field | Description |
|-------|-------------|
| Trigger | Stage 1 complete (Tier 1, 2, 4-form, 5) or Stage 2 complete (Tier 3) |
| Actor | Agent |
| Capability | Internal to T11 `capture_lead`. Normalises raw payload into Bricly's canonical Contact and Opportunity field schema. |
| Entity affected | None yet. Normalised payload held for subsequent stages. |
| Output | Canonical field set: identity fields (name, phone, email, additional contact details), preference fields (buyer type, property type, budget, country, contact preferences), capture context (channel, source campaign, partner attribution, original payload, capture timestamp, microsite session, engagement signals). |
| Decision points | Minimum-identity check: phone OR email present. Fail = capture rejected with structured error (Tier 5) or recorded as UnresolvedConversation (Tier 3 social DM, Tier 4 walk-in without details). |
| Agent role | Pattern 1: autonomous. |

If minimum identity not met:
- Tier 1 forms: blocked at server-side validation (form rejects submission).
- Tier 2 ads: blocked at webhook processor (logged for reconciliation review).
- Tier 3 social DM without phone/email in message: recorded as UnresolvedConversation in Conversations tab. Conversational agent attempts to gather identity through reply. Upgrades to Contact + Opportunity when phone or email obtained.
- Tier 4 walk-in without phone/email: same UnresolvedConversation pattern.
- Tier 5 MCP: structured error response, agent can retry with complete data.

---

## Stage 4. Enrichment

| Field | Description |
|-------|-------------|
| Trigger | Stage 3 complete |
| Actor | Agent |
| Capability | Internal to T11 `capture_lead`. Default tier: (Gap) basic phone format check. Premium tier: (Gap) `validate_phone`, (Gap) `validate_email`, (Gap) `enrich_buyer_profile`. |
| Entity affected | None yet. Enrichment data merged into the Contact + Opportunity write at Stage 8. |
| Output | Default tier: phone format validation result (valid format yes/no, country code). Premium tier: phone deliverability and type (mobile/landline), email deliverability and risk score, demographic enrichment (job title, company, seniority, public real estate activity), buyer profile classification (investor / end-user / family office / institutional). |
| Decision points | Workspace enrichment tier setting. Premium enrichment is a paid add-on and only fires when the workspace is on the premium tier. Default workspaces get format-only validation. |
| Agent role | Pattern 1: autonomous. Premium enrichment is orchestrated to external providers (Twilio Lookup, Hunter, Clearbit, Apollo, or equivalents). |

Default workspaces still proceed through capture cleanly; the sales rep takes responsibility for verifying identity and qualifying intent during first contact. Premium workspaces get richer scoring inputs at Stage 5 and richer rep context at handoff.

---

## Stage 5. Dedup

| Field | Description |
|-------|-------------|
| Trigger | Stage 4 complete |
| Actor | Agent |
| Capability | Internal to T11 `capture_lead`. Includes (Gap) `check_suppression_list`. |
| Entity affected | Potentially the existing Contact (if match found, may receive Activity append, additional_emails update, or flag). Otherwise no entity affected yet. |
| Output | Dedup decision: new Contact, match-and-append-to-existing-Opportunity, match-and-create-new-Opportunity-on-existing-Contact, blocked (suppression list or Do_Not_Contact), or strict-block-and-flag (phone uniqueness conflict). |
| Decision points | See decision tree below. |
| Agent role | Pattern 1: autonomous for clear matches and clear new captures. Pattern 2: match-and-flag cases require human review. |

### Dedup decision tree

Run in order:

1. **Suppression list check.** Phone or email matches workspace suppression list → capture blocked, no Contact created. Manager notified.
2. **Do_Not_Contact check.** Phone or email matches existing Contact in state Do_Not_Contact → capture blocked, no Opportunity created. Compliance log entry written.
3. **Spam state check.** Phone or email matches existing Contact in state Spam → capture re-evaluated through spam filter. If still spam-classified, no Opportunity created. If looks legitimate, manager review surfaced.
4. **Strict phone match.** Phone matches existing Contact with active Opportunity. Two sub-cases:
   - Same name (or name not provided in new capture): match confirmed, append as Activity on existing Opportunity. Original rep keeps ownership. Notification fires to rep.
   - Different name: strict block, capture flagged with `phone_match_different_name`, rep sees the flag on first contact and manually splits if it's actually a different person sharing the phone.
5. **Strict phone match with stale Opportunity (>workspace threshold, 60–90 days configurable) or Cold lifecycle.** Routes through manager re-engagement decision (existing Sales Process flow Edge 5 logic).
6. **Cross-project capture on existing Contact.** Same Contact, new capture references a different Project than existing Opportunity's attached Project. Capture appends to existing Opportunity, new Project added as additional attached Project (multi-project Opportunity). Original rep keeps ownership.
7. **Email match, different phone.** New capture has same email as existing Contact but different phone. Match confirmed with flag `email_match_different_phone`. Existing Contact updated, new phone added to additional_phones. Rep reviews flag at first contact.
8. **New email on existing phone.** New capture has same phone as existing Contact but different email. Flag `secondary_email_added`. New email added to additional_emails. Could be a legitimate secondary email or a different person sharing the phone. Rep reviews.
9. **Name and location match alone, no phone or email overlap.** Not sufficient for match. Treated as a fresh Contact.
10. **No match found.** Proceed to Stage 6 with fresh Contact write.

---

## Stage 6. Spam and opt-out filtering

| Field | Description |
|-------|-------------|
| Trigger | Stage 5 complete with no block |
| Actor | Agent |
| Capability | Internal to T11 `capture_lead`. Uses parser output (Tier 3) or structured signals (other tiers). |
| Entity affected | Contact may be created in Spam or Do_Not_Contact state. No Opportunity created in either case. |
| Output | One of three paths: clean (proceed to Stage 7), spam-filtered (Contact created in Spam state, surfaced in manager spam inbox, no Opportunity), opt-out (Contact created in Do_Not_Contact state, identifiers added to suppression list, no Opportunity, manager notified). |
| Decision points | Spam signal sources: disposable email, fake phone pattern, keyboard-mash name, sub-1-second form completion (Tier 1), honeypot tripped, rate limit tripped, parser spam classification (Tier 3). Opt-out signal: parser detection of opt-out language at high confidence (Tier 3), explicit form field selection (Tier 1, if implemented), or message content. |
| Agent role | Pattern 1: autonomous filter and state assignment. Pattern 2: manager can recover false positives from the spam inbox. |

Workspace setting: `spam_filter_aggressiveness` (low | medium | high) tunes the confidence thresholds for spam classification.

---

## Stage 7. Qualification scoring

| Field | Description |
|-------|-------------|
| Trigger | Stage 6 complete with clean path |
| Actor | Agent |
| Capability | (Gap) `compute_qualification_score`. Input: normalised payload, enrichment output, workspace scoring config. Output: numeric score plus rationale. |
| Entity affected | Score will populate on the Opportunity at Stage 8. |
| Output | Qualification score (numeric), plus structured rationale (which signals drove the score). |
| Decision points | Workspace scoring config: Bricly default model, developer-configurable weightings. Scoring inputs include channel (Tier 1 form > Tier 2 ad > Tier 3 cold inbound by default), stated budget vs unit price match, country of residence vs workspace restrictions, premium enrichment signals (when available), engagement signals (Tier 1 pre-submission pages viewed, time on site), urgency signals, project-specific match signals. |
| Agent role | Pattern 1: autonomous scoring. |

The score drives four downstream behaviours, all in Sales Process Stage 2 and beyond:
1. **Routing weighted preference.** High-score leads are weighted toward senior reps within round-robin. Hard filter on seniority is opt-in, default is weighted preference. Configurable per workspace.
2. **Rep daily list prioritisation.** Rep's New Lead queue sorted by score, with recency as a tiebreaker.
3. **Automated first-touch variation.** High-score leads get a personalised template invoking the rep's name; low-score get a generic templated message.
4. **Auto-deprioritisation below threshold.** Default behaviour (option c from design): low-score leads stay in pipeline at New Lead but receive only templated auto-touch, no rep notification, no rep effort unless the buyer responds to the auto-touch. Workspace can opt in to alternatives: auto-route to a nurture pipeline (option b), or auto-disqualify with templated polite decline (option a).

---

## Stage 8. Project attribution

| Field | Description |
|-------|-------------|
| Trigger | Stage 7 complete |
| Actor | Agent |
| Capability | Internal to T11 `capture_lead`. Reads Microsite, Campaign, and ContentBackbone references to resolve attribution. |
| Entity affected | Will populate on the Opportunity at Stage 9. |
| Output | One or more attached Projects, or `project_agnostic` flag. |
| Decision points | See attribution decision tree below. |
| Agent role | Pattern 1: autonomous. |

### Project attribution decision tree

1. **Microsite-inferred (Tier 1).** Form submitted on a Microsite tied to a specific Project → Project locked from Microsite context, regardless of UTM presence. UTM is for campaign attribution only.
2. **Campaign-mapped (Tier 2).** Ad webhook payload carries campaign ID, mapped to a Bricly Project via the campaign-to-project mapping → Project locked.
3. **Parsed from content (Tier 3).** Parser extracts project mention from message → if high confidence, Project attached. Multiple projects mentioned → multi-project Opportunity.
4. **Manually specified (Tier 4).** Rep selects Project at entry, or Partner specifies in submission → Project attached.
5. **MCP payload (Tier 5).** Agent specifies Project ID in payload → Project attached.
6. **Project-agnostic fallback.** None of the above resolve → Opportunity created with `project_agnostic` flag. Routing defaults to round-robin across all reps in the workspace.

**Cross-project capture on existing Contact:** see Stage 5, Dedup decision tree #6. Single Opportunity, multi-project attachment. Original rep retains ownership.

**Project change after capture:** rep can edit the attached Project(s) on the Opportunity. Re-routing does not fire automatically. Current rep keeps the lead. Activity logged with the project change for audit. If the developer wants the project change to trigger re-routing, that's a workspace setting (not the default).

---

## Stage 9. Atomic write

| Field | Description |
|-------|-------------|
| Trigger | Stage 8 complete |
| Actor | Agent |
| Capability | T11 `capture_lead` final write step. |
| Entity affected | Contact created (or matched if dedup found one), Opportunity created (or appended to existing if dedup matched), Activity logged, Notification queued, SyncEvent fired, AuditEvent logged. |
| Output | All entities live in the workspace, capture flow complete, routing engine queued. |
| Decision points | Idempotency check (Tier 5): if idempotency token matches an in-flight or recently-completed capture, the write returns the existing Contact + Opportunity IDs instead of creating duplicates. |
| Agent role | Pattern 1: autonomous. |

### What's written

**Contact:**
- State = Lead (or Spam, or Do_Not_Contact, per Stage 6 path)
- Identity fields populated from normalised payload + enrichment
- Capture cluster: channel, source campaign, source partner, capture timestamp, capture context (microsite session, ad metadata, message thread, or other channel-specific context), capture channel, original message or enquiry content, qualification score, dedupe candidates identified at capture, conversion event timestamp (the moment of capture for lead state)
- Default preference profile from form fields or parser extraction
- Communication preferences inferred from channel (came via WhatsApp = WhatsApp opt-in, came via email = email opt-in, came via form with stated preference = that preference)
- Owner User = unset (set at routing in Sales Process Stage 2)

**Opportunity:**
- Pipeline = workspace sales Pipeline
- Stage = Waitlist (if capture is pre-launch waitlist), New Lead (default), or Viewing Booked (if consultation booking completed in same submission)
- Lifecycle state = Active
- Attached Project(s) per Stage 8
- Attached Unit(s) if Form B or message parser specified specific units
- Source attribution mirrored from Contact for permanence
- Qualification score (computed at Stage 7)
- Capture flags array (see below)
- Assigned User = unset (set at routing in Sales Process Stage 2)

**Capture flags array (populated as applicable):**
- `accidental_submission_signal` (Tier 2 sub-2-second submissions)
- `low_intent_signal` (other accidental-pattern signals)
- `low_identity_confidence` (Contact upgraded from UnresolvedConversation)
- `name_email_mismatch`
- `phone_country_mismatch`
- `budget_unit_mismatch`
- `phone_match_different_name` (strict phone block but rep should split)
- `email_match_different_phone`
- `secondary_email_added`
- `urgent_callback_requested`
- `country_restricted`
- `request_private_info` (with payload indicating what content was requested)
- `consultation_offered_not_booked`
- `partner_attribution_disputed`
- `project_change_logged` (post-capture project edit, used for audit only)

**Activity:**
- Type = `capture`
- Actor = the channel agent or rep (Tier 4)
- Content = full original payload + parser output + enrichment output
- Channel-specific metadata

**Notification:**
- Queued for delivery by Sales Process Stage 3. Timing rules applied: email immediate, WhatsApp/SMS held to business hours, urgent callback request elevates priority.

**SyncEvent:**
- Fired for downstream dashboards, reporting, attribution analytics.

**AuditEvent:**
- Captures the full capture lifecycle: who/what triggered, what data was received, what enrichment was applied, what dedup decision was made, what scoring result was produced, what attribution was resolved, what was written.

---

## Stage 10. Handoff to routing

| Field | Description |
|-------|-------------|
| Trigger | Stage 9 atomic write complete |
| Actor | Agent |
| Capability | Hands off to (Gap) `apply_routing_rule` in Sales Process flow Stage 2. |
| Entity affected | Opportunity is now eligible for routing. |
| Output | Routing engine receives the Opportunity with all capture context. |
| Decision points | None at this stage. Routing logic owns its own decisions. |
| Agent role | Pattern 1: autonomous handoff. |

**The seam.** This flow ends here. Everything that happens after, routing assignment, notification fan-out, automated first touch, conversational qualifying, falls under the Sales Process flow.

The Lead Capture and Routing flow guarantees to the Sales Process flow that:
- The Contact exists (or was matched and appended)
- The Opportunity exists with stage, lifecycle, attached projects, capture flags, and qualification score
- All capture context is permanently attributed
- The routing engine has everything it needs to apply project-based, capacity-aware, OOO-aware, score-weighted rules

---

# Part 2: Studio integration in this flow

Studio is not invoked at capture, with one exception.

| Capture trigger | Studio capability invoked | Trigger | Output | Logged where |
|-----------------|---------------------------|---------|--------|--------------|
| Form-gated brochure download (Tier 1) | T27 `share_asset` with the project's standard brochure Asset | Form submission | Branded brochure PDF emailed with tracked link, Asset access logged | Activity on Opportunity (capture + brochure_sent) |

All other Studio capabilities (personalised buyer pack generation, custom render variants, finish package previews) wait until after first contact in the Sales Process flow. This is by design: pre-generating personalised collateral based on form data alone risks wasted render compute on dead leads. The rep has more context after first contact and can invoke Studio capabilities appropriately.

The held-back content concept (visibility-aware capture) also applies here: if a buyer requests a held-back floor plan or held-back pricing via any channel, the `request_private_info` flag is set on the Opportunity but the held-back content is not auto-disclosed. The rep decides during first contact whether to send the held-back asset after qualifying the buyer.

---

# Part 3: Edge cases

## Edge 1: Junk data submissions

Deliberate noise: bots, competitors probing the form, testers, kids. Detection signals: disposable email, fake phone, keyboard-mash names, sub-1-second form completion on Tier 1, IP rate limit tripped, honeypot tripped.

Handling: Contact created in Spam state, no Opportunity, surfaced in manager spam inbox. Storage is cheap and the data is useful for adversarial analysis. Manager can manually un-spam if the filter misclassifies.

## Edge 2: Conflicting data within a single capture

- `name_email_mismatch`: form says "John Smith" but email is "maria.vella@gmail.com"
- `phone_country_mismatch`: phone is +44 but stated country is Saudi Arabia
- `budget_unit_mismatch`: budget band "under €200k" but selected unit is a penthouse

None of these block the capture. Each generates a flag on the Opportunity. Rep addresses in conversation. No automatic correction, no automatic disqualification.

## Edge 3: Conflicting data across captures

Already handled in the dedup decision tree (Stage 5). Summary:
- Same phone, different name: strict block, flag, rep manually splits if needed.
- Same email, different phone: match + flag, new phone added to additional_phones.
- Same phone, same name, different email: secondary email added to existing Contact.

## Edge 4: Lead requests immediate callback

Capture explicitly says "please call me now" or selects "preferred contact time = immediate". Flag `urgent_callback_requested`. Routing fires normally but assigned rep gets elevated-priority notification. Conversational agent acknowledgment changes tone.

Outside business hours: acknowledgment notes that the team will reach out at the start of business hours. The lead is not called at 11pm regardless of the urgency request. Workspace can opt in to an on-call rep rotation if 24/7 urgent callback is wanted.

## Edge 5: Lead opts out immediately

Parser detects opt-out language at high confidence. Contact created in Do_Not_Contact state. No Opportunity. Identifiers added to workspace suppression list. Manager notified.

Edge sub-case: opt-out from a buyer who already has an active Opportunity. The opt-out pauses first-touch on the new capture, flags the existing Opportunity for rep review, and lets the rep decide whether to honor the opt-out on the existing relationship.

## Edge 6: Lead from non-supported country

Workspace has configured country-of-residence rules. Capture comes in from a country on the restricted list. Flag `country_restricted`.

Default behaviour: Opportunity routed to manager's unassigned queue, not to a rep. Manager reviews and decides whether to proceed or politely decline.

Workspace option: auto-decline with templated polite decline email, no manager involvement. Opt-in only.

## Edge 7: Capture during waitlist activation window

Buyer is on Project A's waitlist (Opportunity at stage Waitlist) and during the 48–72 hour pre-launch private window submits a capture on Project B (currently in active selling state) in the same workspace.

Handling: standard cross-project dedup logic applies. Same Contact, same Opportunity, multi-project attachment. Opportunity stage advances to the more-advanced state of the two: New Lead (because Project B is in selling state). The waitlist context for Project A is preserved as a per-project attachment state on the Opportunity.

## Edge 8: Capture from a blocked Contact attempting circumvention

Existing Contact in Do_Not_Contact or Spam state submits a new capture (different channel, possibly different identifier).

Handling: dedup catches matches on phone or email and blocks the capture per Stage 5. If the buyer uses a fresh phone and fresh email that don't match the existing Contact, the new capture proceeds. The rep recognises during conversation and marks the new Contact Do_Not_Contact too. Bricly cannot defend against perfect identifier replacement without harder identity verification, which is out of scope for this flow.

## Edge 9: Malformed capture data

Server-side validation rejects the capture before any write. Caller gets a structured error. Tier 5 (MCP) agents handle the error in their feedback loop with the buyer. Tier 1 forms show generic validation errors to the buyer. Tier 2 webhook payloads with malformed data are logged for reconciliation review.

No Contact, no Opportunity, no audit trail of "almost happened". Just a logged error.

## Edge 10: Race condition on simultaneous captures

Two near-simultaneous captures of the same Contact (e.g., Tier 1 form and Tier 2 Meta ad within seconds of each other). Database-level uniqueness constraint on phone serialises the writes. Second write detects the just-created Contact, appends as Activity on the in-flight Opportunity. Both captures appear in the Activity log.

## Edge 11: WhatsApp inbound outside business hours

Buyer messages the developer's WhatsApp at 11pm. Conversational agent's default behaviour: send a holding acknowledgment immediately ("Thanks for your message, our team will respond first thing in the morning"). Substantive conversation resumes at start of next business hours window.

Workspace can opt in to 24/7 substantive agent. When enabled, the agent can confirm pricing, confirm availability, and book consultation appointments overnight. Hard stop at anything more committal (no holds, no reservations, no price negotiation).

Handoff to rep next morning: rep sees the full transcript of the overnight conversation as Activities on the Opportunity, with what the agent committed to clearly logged.

## Edge 12: Social DM with no phone or email

Buyer DMs the developer's Instagram. Message contains no phone, no email, just a question. Cannot create Contact (minimum identity rule). Conversation lives in the Conversations tab as UnresolvedConversation. Conversational agent attempts to gather phone or email through reply. Once obtained, the UnresolvedConversation upgrades to Contact + Opportunity with the full chat history attached as Activities.

If the buyer never shares phone or email but continues messaging, the conversation persists in the Conversations tab indefinitely. Workspace setting can auto-archive UnresolvedConversations after N days of no progress.

## Edge 13: Walk-in with no contact details

Same handling as Edge 12. UnresolvedConversation in the Conversations tab, with the rep's free-text summary stored as an Activity-like log entry. Rep can manually link the walk-in to a Contact later if the buyer returns or makes contact through another channel.

## Edge 14: Phone call without CTI integration

No automated capture. Rep manually creates Contact + Opportunity if they want to track the call. Missed calls without CTI are invisible to Bricly. This is a known degradation. Future roadmap includes AI receptionist for inbound calls.

## Edge 15: Partner attribution dispute

Partner submits a lead that's already in the workspace from another channel. Dedup match + Partner attribution flag (`partner_attribution_disputed`). Default rule: first touch wins, Partner does not receive attribution. Manager can override on the specific Opportunity if they judge the Partner caused the deal (e.g., re-engaged a Cold lead, brought a buyer to a new project they wouldn't have engaged otherwise).

The Partner's MCP response or portal view shows "this lead was already in the workspace, attribution not awarded" so the partner's system has clear feedback.

## Edge 16: MCP buyer agent hallucination

Buyer's AI agent submits a lead the buyer didn't actually authorise. The capture proceeds (Bricly cannot verify authorisation). Rep makes first contact. Buyer either confirms interest or says "I never asked for this". If the latter, rep marks Contact as Disqualified or Do_Not_Contact.

This is a higher-noise channel by design. The auto-deprioritise rule for low-quality signals applies the same way it does for accidental Meta submissions if patterns suggest hallucination (sub-confidence agent identification, buyer profile inconsistent with form data, etc.).

## Edge 17: Buyer agent submits to multiple developers simultaneously

Buyer's agent contacts five different developers' Bricly MCP endpoints with the same enquiry. Each developer captures the lead independently. Each workspace is isolated. No cross-workspace dedup. The buyer is now in five sales pipelines; managing that is the buyer's responsibility, not Bricly's.

## Edge 18: Idempotency retry on MCP capture

Agent's first capture call fails on network timeout. Agent retries with the same idempotency token. Bricly recognises the retry within a 5-minute window and returns the existing capture's Contact + Opportunity IDs instead of creating duplicates. Token expires after 5 minutes; subsequent retries with the same token after expiry are treated as new captures and may dedup-match the existing Contact.

## Edge 19: Held-back content request via any channel

Buyer asks for held-back floor plan, unpublished pricing, or undisclosed unit details via Tier 1 form ("please send me the floor plan for PH9" in the message field), Tier 3 message, or Tier 5 MCP call. Flag `request_private_info` set on the Opportunity with payload indicating what content was requested.

The conversational agent's 24/7 capabilities (confirm pricing, confirm availability, book consultation) do NOT include disclosing held-back content. Agent responds with "I'll have a member of our team review your request and get back to you with full details" and the rep decides whether to disclose during first contact.

The Tier 5 MCP server respects this rule too: requests for held-back content via MCP Resources return "this detail is held back, submit capture to request" and the agent's only path to that content is to submit a capture and wait for rep response.

---

# Part 4: Agent autonomy boundaries

## Pattern 1 (autonomous orchestration)

The capture flow is one of the strongest candidates for full agent autonomy in Bricly. The following all run without human input:

- **Tier 1 form submissions:** parse payload, validate, enrich (default tier), run dedup, compute qualification score, resolve project attribution, create Contact + Opportunity, log Activity, queue routing notification.
- **Tier 2 ad webhook captures:** same as Tier 1 plus campaign-to-project mapping resolution.
- **Tier 3 conversational message captures:** content parsing via the single-capability LLM parser, extraction of structured fields, dedup, project attribution, Contact + Opportunity write.
- **Tier 5 MCP captures (both buyer-agent and partner-agent):** validation, dedup, attribution, write.
- **Spam filtering and junk-data detection:** auto-filter to Spam state, no Opportunity created.
- **Opt-out detection and Do_Not_Contact transitions:** parser detects opt-out language, auto-applies state.
- **Cross-channel dedup with append-to-existing-Opportunity:** when dedup matches an active recent Opportunity, append as Activity, no new Opportunity.
- **Project attribution** from microsite surface, campaign mapping, or message parsing.
- **Premium enrichment (when enabled):** validation, demographic enrichment, buyer profile inference, scoring boost.
- **Qualification scoring** via Bricly default model with workspace-configured weightings.
- **Routing handoff:** queue the capture for the routing engine in Sales Process Stage 2.

## Pattern 2 (proposes, human decides)

- **Tier 3 phone call captures (answered, CTI-transcribed):** agent proposes Contact + Opportunity from the transcript. Rep approves or edits before write.
- **Tier 4 walk-in captures via conversational input:** agent parses the rep's free-text summary and proposes Contact + Opportunity. Rep accepts or edits before write.
- **Partner attribution override on dedup-matched existing Contact:** agent flags the attribution dispute to the manager. Manager decides whether to award attribution to the Partner or honor first-touch.
- **Country-restricted captures (default behaviour):** routed to manager's unassigned queue. Manager decides whether to proceed.
- **Dedup conflicts requiring manual split:** when a strict phone block triggers and the rep confirms during first contact that it's a different person, agent surfaces a "manual split" option. Rep splits.
- **Cross-development re-engagement after stale Opportunity:** when an existing Contact with an old or Cold Opportunity submits a new capture, manager reviews before assignment (existing Sales Process Stage 1a logic).
- **Spam filter false positive recovery:** spam inbox surfaces filtered captures; manager can manually un-spam and route to standard pipeline.

## Pattern 3 (alerts but never decides)

- **Accidental Meta submission signal:** flag on Opportunity, auto-deprioritise behaviour fires, rep sees the flag and decides.
- **Junk data signal that didn't fully trip the spam filter:** flag on Opportunity, rep sees and decides.
- **Conflicting data flags** (name/email, phone country, budget/unit): flagged on Opportunity, surfaced to rep on first contact.
- **Low identity confidence** (Contact upgraded from UnresolvedConversation): flag visible to rep.
- **Urgent callback signal:** elevated-priority notification to rep.
- **Hostile MCP probing patterns:** rate limit alerts, unusual capture velocity from a single IP or agent caller. Manager reviews.

## Pattern 4 (conversational)

- **24/7 conversational agent on WhatsApp and social DMs (when enabled):** runs the qualifying conversation with the buyer, confirms pricing, confirms availability, books consultation. Outputs: structured Activities on the Opportunity, possibly Appointment if booked.
- **Acknowledgment-only conversational agent outside business hours (default):** holds the conversation light, sets expectations, paces with human tendencies. Outputs: Activity log of the acknowledgment.
- **Rep-facing conversational input agent (T14 `log_contact_communication`):** parses rep free-text into structured records during walk-in capture, phone call summary, or any other manual entry. Outputs: proposed Contact + Opportunity for rep approval.

## Strictly forbidden

- **Auto-sending substantive messages on behalf of a rep without rep approval.** The conversational agent's outbound is bounded by developer-configured templates. No ad-hoc generation outside the approved framework.
- **Auto-disqualifying without configured threshold.** Auto-deprioritise is the default for low-score leads; full Disqualified state requires workspace toggle or manual rep/manager action.
- **Auto-merging dedup candidates that hit the "match + flag" rule.** Email match with different phone, new email on existing phone: both flag for human decision.
- **Auto-creating Contacts from inbound where minimum-identity rule fails.** Social DM with no phone/email, walk-in with no phone/email: no Contact creation until phone or email obtained.
- **Auto-creating Contacts from CTI-less phone calls.** Rep must manually create.
- **Auto-overriding business hours rules for outbound messaging.** Urgent callback requests respect business hours (unless workspace has on-call opt-in configured).
- **Auto-attributing Partner referrals on dedup conflicts.** First touch wins by default; manager has override authority.
- **Auto-disclosing held-back assets** (floor plans, pricing, etc.) to MCP callers or in conversational agent responses. Held-back content stays held back until rep discloses.

---

# Part 5: Approval gate inventory

For completeness, the human approval gates that exist within this flow (most of the flow is autonomous):

1. **Tier 3 phone call captures (CTI-transcribed, answered):** rep approves proposed Contact + Opportunity before write.
2. **Tier 4 walk-in captures via conversational input:** rep approves proposed Contact + Opportunity before write.
3. **Dedup conflict requiring manual split:** rep approves split when phone matches existing Contact but name differs.
4. **Partner attribution override:** manager approves attribution award on dedup-matched existing Contact.
5. **Country-restricted capture review:** manager approves proceed or decline (when default manager-queue routing is in effect).
6. **Stale Opportunity re-engagement:** manager approves assignment (existing Sales Process Stage 1a logic).
7. **Spam filter recovery:** manager approves un-spam and route to standard pipeline.
8. **UnresolvedConversation upgrade to Contact:** rep or agent action when phone or email obtained.

All other capture decisions are autonomous.

---

# Part 6: Capability surface and data model gaps

Items surfaced in this session that need to be applied to the data model and capability surface documents.

## Data model gaps

1. **Pipeline stage `Waitlist`** as a new first stage in the sales Pipeline. Hidden from the main pipeline view by default. Auto-transitions to New Lead on the `waitlist_activation` event fired by the Go-to-Market flow's Phase 3.

2. **New entity `UnresolvedConversation`.** Pre-Contact entity surfaced in the Conversations tab. Attributes: channel, channel handle, message thread, agent activity log, capture timestamp, last engagement timestamp. Relationships: BELONGS_TO Workspace, optionally LINKED_TO Project (if inferred), UPGRADES_TO Contact when phone or email is obtained. States: Active, Archived, Upgraded.

3. **Contact attribute additions:**
   - `additional_emails` (list of secondary emails associated with the Contact beyond primary)
   - `additional_phones` (list for completeness; rarely populated due to strict phone uniqueness)
   - `suppression_list_member` (boolean, set when identifiers are on workspace suppression list)

4. **Opportunity attribute addition:**
   - `capture_flags` (array of flag strings with optional payload; extensible). Flags include: `accidental_submission_signal`, `low_intent_signal`, `low_identity_confidence`, `name_email_mismatch`, `phone_country_mismatch`, `budget_unit_mismatch`, `phone_match_different_name`, `email_match_different_phone`, `secondary_email_added`, `urgent_callback_requested`, `country_restricted`, `request_private_info` (with payload), `consultation_offered_not_booked`, `partner_attribution_disputed`, `project_change_logged`.

5. **Microsite attribute addition:**
   - `is_canonical_for_mcp` (boolean on project_public_site type Microsites, identifies the Microsite whose section toggles and publication state drive MCP server visibility for the Project).

6. **Partner attribute additions:**
   - `mcp_credential` (issued at onboarding, authenticates Tier 5.B captures)
   - `visibility_scope` (public | full, governs what the Partner's MCP calls can read)
   - `rate_limit_tier` (higher than anonymous default)

7. **Workspace-level configuration additions:**
   - `business_hours` (start time, end time, days of week, timezone)
   - `sunday_outbound_enabled` (boolean)
   - `enrichment_tier` (default | premium)
   - `conversational_agent_24_7_enabled` (boolean, defaults off)
   - `consultation_booking_pool_override` (optional list of rep IDs per project)
   - `auto_disqualify_below_score_threshold` (boolean, opt-in)
   - `auto_disqualify_threshold_value` (numeric)
   - `country_restriction_rules` (list of restricted countries + action: manager-queue or auto-decline)
   - `on_call_rep_rotation` (optional, for urgent callbacks outside business hours)
   - `spam_filter_aggressiveness` (low | medium | high)
   - `partner_visibility_default` (public | full)
   - `unresolved_conversation_auto_archive_days` (numeric, default null = never)

8. **Workspace-level entity addition: SuppressionList.** A list of phone numbers and emails that block future captures. Populated by opt-out captures, manager manual additions, spam escalations, Do_Not_Contact transitions. Queried at Stage 5 dedup before any new Contact write.

9. **Idempotency token support** on MCP and webhook captures. Token attached to capture requests; Bricly deduplicates retries within a 5-minute window.

## Capability surface gaps

10. **T11 `capture_lead` expansion.** The current capability surface entry is general. This flow surfaces specific behaviours that should be documented in the capability surface:
    - Multi-channel input (Tier 1–5 transport variants)
    - Single-capability parser invoked for unstructured content
    - Idempotency token support
    - Visibility-aware response (held-back content not returned)
    - Capture-flags array population
    - Structured error responses for MCP callers
    - Stage-aware Opportunity creation (Waitlist vs New Lead vs Viewing Booked from consultation booking)

11. **(Gap) `apply_routing_rule` expansion** (also flagged in Sales Process flow). This flow adds requirements:
    - Reads workspace `business_hours` and applies notification timing
    - Reads workspace consultation booking pool override
    - Handles `urgent_callback_requested` priority elevation
    - Handles `country_restricted` manager-queue routing
    - Coordinates with capacity-aware and OOO-aware checks
    - Applies score-weighted preference for senior reps (default) or hard filter (opt-in)

12. **(Gap) `parse_inbound_content`.** Single-capability parser. Input: message_text, channel_metadata, workspace_context (projects, units, available content). Output: structured prediction with confidence per field. Used by Tier 3 channels, optionally by Tier 4 conversational input via T14, and by the conversational agent. Owned middleware over an orchestrated LLM.

13. **(Gap) `transcribe_voice_note`.** Orchestrated to Whisper or equivalent. Used by Tier 3 WhatsApp and DM voice notes. Output feeds `parse_inbound_content`.

14. **(Gap) `parse_image_context`.** Orchestrated to Claude vision API. Used for inbound images on Tier 3 channels. Output feeds the conversational agent's context.

15. **(Gap) `validate_phone`.** Premium enrichment tier. Orchestrated to Twilio Lookup or equivalent. Returns deliverability, line type, country.

16. **(Gap) `validate_email`.** Premium enrichment tier. Orchestrated to Hunter or equivalent. Returns deliverability and risk score.

17. **(Gap) `enrich_buyer_profile`.** Premium enrichment tier. Orchestrated to Clearbit, Apollo, or equivalent. Returns demographic and professional signals, buyer profile classification.

18. **(Gap) `compute_qualification_score`.** Owned. Inputs: captured payload + enrichment output + workspace scoring config. Returns numeric score plus structured rationale.

19. **(Gap) `check_suppression_list`.** Owned. Queries workspace SuppressionList at dedup step. Returns block decision plus reason.

20. **(Gap) `route_to_consultation_booking_pool`.** Owned. Returns the eligible rep pool for consultation booking on a given Project. Applies project-assigned reps OR workspace reps OR developer-configured override pool, with capacity-aware and OOO-aware filtering.

21. **(Gap) `provision_partner_mcp_credential`.** Owned. Issued at Partner onboarding. Authenticates Tier 5.B captures.

22. **(Gap) `upgrade_unresolved_conversation_to_contact`.** Owned. Transitions an UnresolvedConversation to a Contact + Opportunity when phone or email is obtained. Triggers full T11 `capture_lead` flow from Stage 4 onward with the conversation history attached.

23. **New Resource: `workspace_suppression_list`.** Returns the current suppression list for manager review.

24. **New Resource: `workspace_spam_inbox`.** Returns captures filtered to Spam state for manager review.

25. **New Resource: `conversations_inbox`.** Returns chat threads in the Conversations tab, both resolved (with Contact) and unresolved (UnresolvedConversation).

26. **New Resource: `pending_dedup_flags`.** Returns Opportunities with match-and-flag or recommend-merge dedup flags surfaced to rep for review.

27. **New Resource: `consultation_booking_availability`.** Returns the union of eligible reps' available slots for a given Project's consultation booking page.

---

# Part 7: Out of scope (deliberately not in this flow)

1. **Routing logic and assignment.** Belongs to Sales Process flow Stage 2. This flow ends at handoff.
2. **Notification fan-out.** Belongs to Sales Process flow Stage 3.
3. **Automated first touch and conversational qualifying.** Belongs to Sales Process flow Stage 4 and 5.
4. **Property portal integrations** (Idealista, Rightmove-equivalent, etc.). Future addition. Not designed in this flow.
5. **AI receptionist for inbound phone calls without CTI.** Future addition when voice AI quality reaches production-grade. Replaces the manual phone capture path for non-CTI workspaces.
6. **Cross-workspace dedup.** Each workspace is isolated by design. Buyers in multiple developer workspaces are independent Contacts in each.
7. **Batch import for in-person events and exhibitions** (OCR'd business cards, structured upload). Rolled into Tier 4 manual entry; events are handled by reps keying leads in one at a time.
8. **Buyer-side OAuth authentication on Tier 5 captures.** Anonymous MCP access is the current pattern. Authenticated buyer-side access waits for buyer-agent platform infrastructure to mature.
9. **Long-term marketing nurture sequence for auto-deprioritised or auto-disqualified leads.** Belongs to a separate marketing nurture flow when designed.
10. **The conversational agent's full conversation design** (templates, branching, qualification questions). This flow defines when the agent runs and what it's allowed to commit to. The conversation design itself is a separate piece of work.

---

End of document.
