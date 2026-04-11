

## Plan: Refactor Offer Wizard from 7 Steps to 4 Steps

This is a major structural refactor that consolidates 7 wizard steps into 4, creating two new composite components and rewiring the wizard navigation.

### Overview of Changes

```text
OLD (7 steps)                    NEW (4 steps)
─────────────                    ─────────────
1. Klient i wydarzenie     →     1. Klient i wydarzenie (same)
2. Menu                    →     2. Menu (same)
3. Usługi dodatkowe        ─┐
4. Ustawienia oferty       ─┤→   3. Wycena (StepPricing)
5. Kalkulacja i rabaty     ─┘
6. Motyw graficzny         ─┐
7. Podgląd oferty          ─┤→   4. Podgląd i wysyłka (StepPreviewSend)
                            └─   + text fields moved here
```

### Step-by-step Implementation

**1. Update WIZARD_STEPS constant** (`src/lib/offer-constants.ts`)
- Replace 7-step array with 4-step array
- Remove Wrench, Settings, Palette icons from steps

**2. Update WizardStepper** (`src/components/features/offers/wizard-stepper.tsx`)
- Remove unused icon imports (Wrench, Settings, Palette)
- Icon map only needs: ClipboardList, UtensilsCrossed, Calculator, Eye

**3. Create StepPricing** (`src/components/features/offers/steps/step-pricing.tsx`)
- Combines: services (from step-services), discount/delivery (from step-calculation), summary
- 3 collapsible sections: Services, Discount & Delivery, Summary (sticky bottom)
- Uses existing hooks: `useServices`, `useOfferServices`, `useOfferVariants`, calculation mutations
- ~300-350 lines

**4. Create StepPreviewSend** (`src/components/features/offers/steps/step-preview-send.tsx`)
- Combines: settings (step-settings), theme (step-theme), preview (step-preview), text fields (from step-calculation)
- 2-column layout on desktop (3+2 grid), single column on mobile
- Left: collapsible settings, collapsible theme, full preview
- Right (sticky): text fields with auto-save, validation panel, action buttons
- ~500-600 lines

**5. Create InternalNotesDrawer** (`src/components/features/offers/internal-notes-drawer.tsx`)
- Sheet component with auto-save (800ms debounce) for `notes_internal`
- Available from wizard header on all steps

**6. Rewire offer-wizard.tsx**
- Replace imports: remove StepServices, StepSettings, StepCalculation, StepTheme, StepPreview
- Add imports: StepPricing, StepPreviewSend, InternalNotesDrawer
- Update renderStep switch: 4 cases instead of 7
- Update navigation: max step = 4, hide nav buttons on step 4
- isLocked forces step 4 (not 7)
- Add InternalNotesDrawer next to "Zapisz szkic" button
- Add save feedback indicator (2s "Zapisano" text)

**7. Update use-offer-wizard.ts reducer**
- LOAD_OFFER: `completedSteps: [1, 2, 3, 4]`
- SET_STEP action: accept 1-4 range

**8. Update step-event-data.tsx**
- Remove greeting_text textarea from the form UI
- Keep greeting_text in schema with `.default('')`
- Keep auto-generation logic (DEFAULT_GREETINGS)

**9. Cleanup verification**
- Verify no active imports of old step components remain
- Old files kept for rollback safety

### Files Created (4)
- `src/components/features/offers/steps/step-pricing.tsx`
- `src/components/features/offers/steps/step-preview-send.tsx`
- `src/components/features/offers/internal-notes-drawer.tsx`

### Files Modified (5)
- `src/lib/offer-constants.ts` — new WIZARD_STEPS
- `src/components/features/offers/wizard-stepper.tsx` — updated icon map
- `src/components/features/offers/offer-wizard.tsx` — new step routing + drawer + feedback
- `src/hooks/use-offer-wizard.ts` — reducer updates for 4 steps
- `src/components/features/offers/steps/step-event-data.tsx` — remove greeting UI

### Files Kept (not deleted, for rollback)
- step-services.tsx, step-settings.tsx, step-calculation.tsx, step-theme.tsx, step-preview.tsx

