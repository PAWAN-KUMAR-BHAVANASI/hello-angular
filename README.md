# Hello Angular Store

A small Angular storefront with role-based access, product management, comparison, cart persistence, and quotation handling.

## Run the app

1. Install dependencies:

```bash
npm install
```

2. Start the JSON server used for products and users:

```bash
npm run server
```

3. Start the Angular app:

```bash
npm start
```

4. Open the app at:

```text
http://localhost:4201/
```

## Demo users

- Admin: admin@shop.com / Admin@123
- Customer: any user who signs up and logs in with their own account details is treated as a customer

## Feature checklist

- Product form adds products with validation
- Product price cannot be negative
- Category-specific price caps are enforced
- Up to 2 products can be compared
- Product comparison shows category, price, and date
- Cart persists after refresh using localStorage
- Admin-only routes for product creation and editing
- Customer access to cart and shopping flow
- Customer shopping flow is restricted from admin-only actions

## Test commands

```bash
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

## Notes

- Product comparison is persisted in localStorage.
- Cart items are stored under `cart-items`.
- Quotations are stored under `app-quotations`.
- Demo tag suggestion: `v1.0-demo` or `demo-role-flow-2026-10-01`.
