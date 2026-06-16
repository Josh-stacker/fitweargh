# Actions Taken

## Product Sale Tagging

- Added shared sale detection in `src/lib/products.ts`.
  - Why: products should be considered on sale when they have a valid discount price or when they are tagged with `Sale`/`Sales`.

- Added `Sale` as an admin product category option while keeping the existing `Sales` category.
  - Why: admins can now use a clear sale tag on any product without removing that product from Clothing, Body Shapers, Accessories, Fast Selling, or other categories.

- Updated `ProductCard` to show a Sale badge for discounted products and products tagged `Sale`/`Sales`.
  - Why: the sale tag is now visible consistently anywhere the reusable card is used.

## Product Listing Pages

- Added desktop pagination with view-size options of 10, 20, and 100 products on Clothing, New Arrivals, Accessories, Body Shapers, Sales, and Fast Selling pages.
  - Why: desktop shoppers can browse large product lists in manageable pages.

- Kept mobile product loading as a Load More flow.
  - Why: this preserves the existing mobile browsing behavior.

- Updated listing pages to use discounted prices for sorting and filtering when a discount exists.
  - Why: sale products should sort and filter by the price the customer actually pays.

- Updated the Sales page to include products tagged `Sale`/`Sales`, not only products with a discount price.
  - Why: sale items can now be managed as a tag while still belonging to other categories.

## Shop By Category

- Replaced the custom category card rendering with the reusable `ProductCard`.
  - Why: the homepage Shop By Category section now matches the same product-card UI standard used across the storefront.

## Fast Selling

- Added Fast Selling to the main navigation.
  - Why: shoppers can reach the Fast Selling page from the storefront nav.

- Added Fast Selling to the admin Hero Slides page selector.
  - Why: admins can create and manage hero slides for the Fast Selling page.

- Added an admin toggle in Homepage Settings for enabling or disabling Fast Selling.
  - Why: admins can remove the public Fast Selling page and nav link without deleting products or hero configuration.

- Hid the homepage Fast Selling section when the Fast Selling page is disabled.
  - Why: disabled pages should not be promoted from the homepage.

## Admin Product Pagination

- Added a product-count selector to the admin Products table.
  - Why: admins can view more or fewer products per page as the catalog grows.

- Updated admin pagination buttons to include visible Previous and Next labels.
  - Why: the controls are clearer than icon-only buttons.

- Kept the admin pagination footer visible whenever products are shown.
  - Why: admins can always change the page size back after selecting a larger view.

## Toggle UI

- Fixed toggle knob positioning in Hero Slides, Shipping Methods, and the new Fast Selling setting.
  - Why: the inner circle now stays inside the pill when the toggle is turned on.

## Verification

- Ran `npm run build` successfully.
  - Why: this confirms TypeScript and the production build pass after the changes.
