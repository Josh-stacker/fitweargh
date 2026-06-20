# Learnings — FitwearGH Debugging Sessions

## Bug: Products with price > gh₵ 500 silently hidden on listing pages

### What was identified
A product (CITY GIRL SET) was correctly categorised as "Clothing" in Supabase but did not appear on the `/clothing` page. It was visible via search because the Search Results page has no price filter.

Debugging steps taken:
1. Verified category data in Supabase admin — correct.
2. Deleted and recreated the product — still missing.
3. Added a `console.log` in `Clothing.tsx` after `fetchProducts()` — product appeared in the raw fetch and passed the `hasCategory` filter.
4. Inspected the second filter (price range) — found `priceMax` was hardcoded at `500` and never updated from actual product data.

### Root cause
All listing pages (`Clothing`, `BodyShapers`, `Accessories`, `Sales`) initialised `priceMax` as a hardcoded constant:

```ts
const [priceMax, setPriceMax] = useState(500);
```

The price range slider also used `max={500}`. Any product priced above gh₵ 500 was silently excluded by the filter:

```ts
if (effectivePrice < priceMin || effectivePrice > priceMax) return false;
```

`NewArrivals` had already solved this correctly with a `maxAvailablePrice` state that updates after products load — the other pages were never updated to match.

### How it was fixed
Added `maxAvailablePrice` state to all four affected pages. After products load, compute the highest price and set both `maxAvailablePrice` and `priceMax`:

```ts
const highest = Math.max(500, ...docs.map((p) => Number(p.discountPrice ?? p.price) || 0));
setMaxAvailablePrice(highest);
setPriceMax(highest);
```

Updated slider `max` attribute from hardcoded `500` to `maxAvailablePrice` on all pages.

### Files changed
- `src/pages/Clothing.tsx`
- `src/pages/BodyShapers.tsx`
- `src/pages/Accessories.tsx`
- `src/pages/Sales.tsx`

### Prevention
When adding new products priced above gh₵ 500, always verify the price filter ceiling on the relevant listing page. The fix is now consistent across all pages — `priceMax` is always derived from actual product data, never a hardcoded guess.
