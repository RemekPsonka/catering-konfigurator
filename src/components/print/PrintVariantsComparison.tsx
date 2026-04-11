import type { PublicOffer } from '@/hooks/use-public-offer';
import { formatCurrency } from '@/lib/calculations';

interface PrintVariantsComparisonProps {
  offer: PublicOffer;
}

interface CategoryGroup {
  categoryName: string;
  categoryIcon: string | null;
  items: Map<string, { dishName: string; variants: Map<string, { price: number; qty: number; notes: string | null }> }>;
}

export const PrintVariantsComparison = ({ offer }: PrintVariantsComparisonProps) => {
  const variants = [...(offer.offer_variants ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  if (variants.length === 0) return null;

  // Build category groups across all variants
  const categoryMap = new Map<string, CategoryGroup>();
  const dishOrder = new Map<string, number>();
  let orderCounter = 0;

  for (const variant of variants) {
    const sortedItems = [...variant.variant_items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    for (const item of sortedItems) {
      const dish = item.dishes;
      if (!dish) continue;
      const cat = dish.dish_categories;
      const catId = cat?.id ?? 'uncategorized';
      const catName = cat?.name ?? 'Inne';
      const catIcon = cat?.icon ?? null;

      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, { categoryName: catName, categoryIcon: catIcon, items: new Map() });
      }

      const group = categoryMap.get(catId)!;
      const dishKey = dish.id;

      if (!group.items.has(dishKey)) {
        group.items.set(dishKey, { dishName: item.custom_name || dish.display_name, variants: new Map() });
      }

      const price = item.custom_price ?? dish.price_per_person ?? dish.price_per_piece ?? dish.price_per_kg ?? dish.price_per_set ?? 0;
      group.items.get(dishKey)!.variants.set(variant.id, {
        price: Number(price),
        qty: item.quantity ?? 1,
        notes: item.notes,
      });

      if (!dishOrder.has(`${catId}-${dishKey}`)) {
        dishOrder.set(`${catId}-${dishKey}`, orderCounter++);
      }
    }
  }

  const isPP = offer.pricing_mode === 'PER_PERSON';
  const colCount = variants.length + 1; // category/dish + N variants

  return (
    <div className="print-section print-page-break">
      <h2 style={{ fontSize: '14pt', marginBottom: '12pt' }}>Menu — porównanie wariantów</h2>
      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: `${100 / colCount}%` }}>Pozycja</th>
            {variants.map((v) => (
              <th key={v.id} style={{ width: `${100 / colCount}%`, textAlign: 'center' }}>
                {v.name}
                {v.is_recommended && <span className="print-recommended">⭐ Rekomendowany</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from(categoryMap.entries()).map(([catId, group]) => (
            <>
              <tr key={`cat-${catId}`} className="print-category-row">
                <td colSpan={colCount}>
                  {group.categoryIcon && `${group.categoryIcon} `}{group.categoryName}
                </td>
              </tr>
              {Array.from(group.items.entries()).map(([dishId, dishData]) => (
                <tr key={dishId}>
                  <td>{dishData.dishName}</td>
                  {variants.map((v) => {
                    const entry = dishData.variants.get(v.id);
                    if (!entry) return <td key={v.id} style={{ textAlign: 'center', color: '#999' }}>—</td>;
                    return (
                      <td key={v.id} style={{ textAlign: 'center' }}>
                        {formatCurrency(entry.price)}
                        {!isPP && entry.qty > 1 && ` × ${entry.qty}`}
                        {entry.notes && (
                          <div style={{ fontSize: '8pt', color: '#666', marginTop: '2pt' }}>{entry.notes}</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
      {isPP && (
        <div style={{ fontSize: '9pt', color: '#666', marginTop: '6pt', textAlign: 'right' }}>
          * Ceny za 1 osobę. Łączna wartość menu × {offer.people_count ?? 1} osób.
        </div>
      )}
    </div>
  );
};
