

## Plan: Fix PER_PERSON service calculation bug

### Problem
`calculateOfferTotals()` uses `os.quantity` from DB for all service types, but for PER_PERSON services this value may be stale due to race conditions. The function already receives `peopleCount` as a parameter but doesn't use it for PER_PERSON services.

### Changes (2 files, 1 line each)

**1. `src/lib/calculations.ts`** — line ~115:
```
BYŁO:   const qty = os.quantity ?? 1;
JEST:   const qty = os.services.price_type === 'PER_PERSON' ? safePeopleCount : (os.quantity ?? 1);
```

**2. `src/components/public/calculation-section.tsx`** — service display in DETAILED mode:
```
BYŁO:   const qty = os.quantity ?? 1;
JEST:   const qty = os.services.price_type === 'PER_PERSON' ? debouncedCount : (os.quantity ?? 1);
```

Both variables (`safePeopleCount`, `debouncedCount`) already exist in their respective files.

### No other changes needed
- useEffect syncing quantity to DB remains (for PDF/export correctness)
- PER_EVENT, PER_PIECE, PER_BLOCK services unaffected

