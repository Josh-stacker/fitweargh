# FitwearGH — Email Templates & Admin Features Plan

## Status Legend
- [ ] Not started
- [x] Done

---

## Phase 1 — Email Templates

### Existing (all working via Firestore `mail` collection)
- [x] **Welcome email** — `src/emails/welcomeEmail.ts` — triggered on register in `AuthContext.tsx`
- [x] **Order confirmation (customer)** — `src/emails/orderConfirmEmail.ts` — triggered on order place in `CartPage.tsx`
- [x] **Order alert (admin)** — `src/emails/orderAdminEmail.ts` — triggered on order place in `CartPage.tsx`

### To Build
- [x] **Order status update email** — `src/emails/orderStatusEmail.ts` — triggers on `processing` / `delivered` in `Orders.tsx:updateStatus()`
- [x] **Shipping notification email** — `src/emails/shippingEmail.ts` — triggers on `shipped`, includes full item table + address
- [x] **Order cancellation email** — `src/emails/cancellationEmail.ts` — triggers on `cancelled`, includes cancelled items list

---

## Phase 2 — Admin Panel Features

### Admin User Management
- [x] **Admin Users page** — `/admin/admins` — `src/pages/admin/AdminUsers.tsx`
  - Lists `admins` Firestore collection; add by customer email (looks up UID from `customers` collection); remove with guard against self-removal

### Shipping Methods
- [x] **Shipping Methods page** — `/admin/shipping` — `src/pages/admin/ShippingMethods.tsx`
  - Firestore collection `shippingMethods` — `{ name, description, price, enabled }`
  - Toggle enable/disable, inline edit, delete
  - `CartPage.tsx` now fetches enabled methods; shows radio selector when >1 method; falls back to GH₵15 if collection is empty
  - `orderConfirmEmail.ts` and `orderAdminEmail.ts` now use dynamic `deliveryFee` + `shippingMethod` name

---

## Key Files Reference

| File | Purpose |
|---|---|
| `src/emails/` | All email HTML templates |
| `src/pages/admin/Orders.tsx` | `updateStatus()` at line 66 — where to hook status emails |
| `src/pages/admin/AdminLayout.tsx` | Sidebar nav array `NAV` — add new pages here |
| `src/App.tsx` | Route declarations — add new admin routes here |
| `src/context/AuthContext.tsx` | `checkAdmin()` uses `admins` Firestore collection |
| `src/pages/CartPage.tsx` | `DELIVERY_FEE = 15` hardcoded — needs to be dynamic for shipping methods |

---

## Build Order
1. Order status update email (covers all status changes)
2. Shipping notification email (specialised "shipped" template)
3. Order cancellation email (specialised "cancelled" template)
4. Admin Users management page
5. Shipping Methods page + CartPage integration
