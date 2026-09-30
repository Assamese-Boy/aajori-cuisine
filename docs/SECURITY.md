# Aajori Cuisine - Security & Integrity Guide

## 1. Core Security Principles
1. **The Backend is the Single Source of Truth**: Clients never calculate prices, enforce discounts, or perform state transitions directly.
2. **Zero Client Privileges**: Privileged secrets (Supabase `service_role` key, payment secret keys, webhook secrets, AI API keys) are **never** bundled or exposed to Flutter mobile apps or web frontends.
3. **Strict RBAC & Tenant Isolation**:
   - `CUSTOMER`: Can only view and mutate their own cart, orders, and addresses.
   - `RESTAURANT_OWNER / MANAGER`: Can only view tickets and edit menu items for their own restaurant.
   - `DELIVERY_PARTNER`: Can only view assigned deliveries and push GPS updates when actively online.
   - `SUPER_ADMIN`: Operational overview with audit trail recording for every manual override.
4. **Authoritative Pricing Enforcement**:
   - Client sends item IDs, quantities, and delivery coordinates.
   - Backend recalculates: `Item Subtotal + Packaging + PostGIS Delivery Tier + Platform Fee + 5% GST - Validated Coupon`.
   - Immutable snapshot persisted with the order; future menu price changes never mutate historical receipts.
5. **Order State Machine Guard**:
   - Every transition checks `OrderStateMachine.validateTransition(fromStatus, toStatus, actorRole)`.
   - Out-of-order jumps (e.g. `CREATED` -> `DELIVERED`) are unconditionally blocked with `400 Bad Request`.
6. **Payment Webhook Idempotency**:
   - Payment webhooks are verified server-side with digital signatures and cached idempotency keys. Duplicate deliveries cannot cause double accounting.
7. **Battery-Conscious Fleet Privacy**:
   - Riders can toggle between `ONLINE_IDLE` and `OFFLINE`.
   - Location pings are rejected when the rider is `OFFLINE` to respect battery life and privacy.
8. **AI & MCP Sandboxing**:
   - AI queries are translated into structured parameters and queried against the real database.
   - AI is never given raw SQL execution capability and cannot fabricate nonexistent menu items or fake prices.
