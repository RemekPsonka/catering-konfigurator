

# Unified Chat View for Offer Communication

## Problem
Currently, offer communication is scattered across three separate views:
- `/admin/offers/:id/messages` — questions and corrections (flat list of cards)
- `/admin/offers/:id/proposals/:proposalId` — proposal diff (separate page per proposal)
- `/admin/notifications` — all notifications mixed together across all offers

When a manager clicks a notification, they land on the messages page but lose context of proposals. Proposals live on yet another page. It's fragmented.

## Solution
Rebuild `offer-messages.tsx` into a single **chat-like timeline** that shows ALL communication for one offer: questions, corrections, AND proposals — chronologically, with inline statuses and inline actions.

## Design

```text
┌─────────────────────────────────────────────┐
│  ← Wróć   💬 Komunikacja — CS-2026-0001    │
│            Małgorzata Nogieć · 150 os.      │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─ 📝 Korekta ──────────── 10.04, 09:15 ─┐│
│  │ Małgorzata: "chce dodatkowo pizzę."     ││
│  │                                          ││
│  │  [Textarea: Twoja odpowiedź...]         ││
│  │  [Odpowiedz]                            ││
│  └──────────────────────────────────────────┘│
│                                             │
│  ┌─ 🔄 Propozycja zmian ──── 10.04, 08:30 ─┐
│  │ "Proszę o zamianę rosołu na pomidorową" ││
│  │                                          ││
│  │  Rosół → Pomidorowa    ⏳ Oczekuje      ││
│  │                                          ││
│  │  [Przejdź do diff]  lub  inline accept  ││
│  └──────────────────────────────────────────┘│
│                                             │
│  ┌─ 💬 Pytanie ──────────── 09.04, 14:00 ─┐│
│  │ "Czy jest opcja wegańska?"              ││
│  │                                          ││
│  │  ✅ Odpowiedź (09.04, 15:30):           ││
│  │  "Tak, możemy przygotować..."           ││
│  └──────────────────────────────────────────┘│
│                                             │
└─────────────────────────────────────────────┘
```

## Files to Change

### 1. `src/pages/admin/offer-messages.tsx` — full rewrite
- Fetch both `useAdminCorrections(id)` AND admin proposals (new query for `change_proposals` by offer_id)
- Merge into single timeline sorted by `created_at` descending
- Each item rendered as a chat bubble with:
  - Type badge (Pytanie / Korekta / Propozycja zmian)
  - Client message
  - Status badge
  - For questions/corrections: inline response textarea (if unresolved) or displayed response
  - For proposals: summary of items (original → proposed), status per item, link to full diff page
- Keep email modal for responses
- Add offer context header (client name, offer number, event type)

### 2. `src/hooks/use-offer-corrections.ts` — add admin proposals query
- Add `useAdminProposals(offerId)` hook that fetches `change_proposals` with `proposal_items` for the offer
- Reuse existing query pattern from `usePublicResolvedProposals` but include ALL statuses (pending, accepted, rejected, partially_accepted)

### 3. `src/pages/admin/notifications-list.tsx` — no structural changes
- Notification links already point to `/admin/offers/:id/messages` — they will now land on the unified view

### No routing changes needed
- Route `/admin/offers/:id/messages` stays the same
- Route `/admin/offers/:id/proposals/:proposalId` stays for detailed diff view (linked from the timeline)

## What stays the same
- Public client-side `CommunicationSection` — unchanged
- `ProposalDiffPage` — still accessible for detailed per-item accept/reject
- All hooks and mutations — reused as-is
- Email modal flow — unchanged

