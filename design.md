# FitwearGH Design System

## Colors
| Token | Hex | Usage |
|---|---|---|
| `brand-brown` | `#533113` | Primary text, borders, buttons, icons |
| `brand-cream` | `#FDF1E1` | Navbar background |
| `brand-page` | `#FFFBF6` | Page background |
| `brand-sand` | `#F5EDE0` | Product image placeholder background |
| `brand-muted` | `#E5D8C7` | Mobile nav pill, subtle fills |
| `border` | `#DEDEDE` | All dividers and input borders |

## Typography
Font: **Raleway** (Google Fonts). Use CSS utility classes:

| Class | Weight | Use |
|---|---|---|
| `raleway-regular` | 400 | Body text, nav links, labels |
| `regular-semibold` | 600 | Subheadings, emphasized labels |
| `raleway-bold` | 700 | Product names, section headings, active nav |
| `raleway-extrabold` | 800 | Hero headings |
| `raleway-black` | 900 | Display / marketing copy |

## Inputs
Use `.input-base` class for all text inputs:
- Border: `1px solid #DEDEDE`, focus → `#533113`
- Padding: `0.625rem 1rem`
- Font: Raleway 300, 0.875rem
- Color: `#533113`

## Buttons
Use `<Button>` from `./ui/Button`. Props: `text`, `width`, `icon`, `onClick`.

Secondary link-style button pattern:
```tsx
<Link className="flex items-center justify-center gap-2 border border-[#533113] text-[#533113] py-2.5 px-3 raleway-bold text-xs uppercase tracking-widest hover:bg-[#533113] hover:text-white transition-colors">
```

## Icons
Library: `@phosphor-icons/react`. Size 24 for nav/UI, 14–16 for inline button icons.

## Layout
- Max width: `max-w-[1440px] 2xl:max-w-[1620px] mx-auto`
- Horizontal padding: `px-4 md:px-10`
- Product grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5`
- Gap: `gap-4 md:gap-6`

## Components
- **ProductCard** — `src/components/ProductCard.tsx`. Props: `id`, `image`, `name`, `price`, `discountPrice`, `colors`, `category`, `categories`.
- **Navbar** — sticky, height `h-20`, cream background.
- **Footer** — full-width, always at bottom.
- **PageHero** — `src/components/PageHero.tsx` — banner with title at top of content pages.

## Currency
Always format as `gh₵ {amount.toFixed(2)}`.

## Spacing rhythm
- Section vertical margin: `mt-8 mb-16`
- Card/list inner padding: `p-3 md:p-4`

## Data
- Supabase. Use `fetchProducts()` from `src/lib/products.ts` for product lists.
- Supabase full-text / ilike search: `.ilike("name", "%query%")` on `products` table.
