# Orders module implementation plan

## Dashboard workflow

One queue groups orders from Website, Mobile App, Self-Service Kiosk, Tablet, and Walk-in / Counter. Existing QR table and food-truck counter orders keep their source labels. Each order has a fulfillment location independent of its source. Payment and fulfillment are displayed separately.

| Capability | Super Admin | Assigned Staff | Unassigned account |
| --- | --- | --- | --- |
| View queue, details, counts and filters | All locations or selected location | Assigned location and all its channels | No orders |
| Create a counter order | Yes, choose fulfillment location | Yes, assigned location | No |
| Start prep, mark ready and complete | Yes | Yes, assigned location | No |
| Cancel an active order | Yes, with Yes/No confirmation | No | No |

Order states progress from Incoming to In prep, Ready, and Completed. Cancelling keeps the order in history. A payment refund needs a separate authorized action and a confirmed provider result. Customer-facing website and app users should only see their own orders through their respective apps. Kiosks and tablets should be assigned to their fulfillment location when provisioned.

## Implementation and rollout

1. **Dashboard prototype · implemented.** Replace the kiosk-only feed with location-scoped status counts, channel filters, order search, list and card layouts, details, and a counter order form. Use the repository’s current demo account assignments and keep existing orders readable from browser storage. Confirm which locations should accept each channel before configuring live routing.
2. **Shared order store and access.** Evolve the existing Supabase order schema with stable channel IDs, a required fulfillment location, an external order ID, money in minor units, independent payment and fulfillment states, and an order event log. Preserve existing IDs and history during migration. Bind staff membership to authenticated user IDs and locations. Replace permissive policies on orders and staff profiles before enabling live traffic. Enforce access and valid state transitions server-side, and check both reads and writes across locations.
3. **Connect channels.** Route website, mobile app, kiosk and tablet orders through one server-side intake contract. Resolve fulfillment location from the selected store or registered device. Enforce a unique source and external order ID so retries create one order. Confirm payments through verified provider events. Replace browser-only counter entry with the same order store.
4. **Live updates and offline recovery.** Subscribe the dashboard to authorized order changes and refresh on reconnect. If counter devices must work during an internet outage, persist queued submissions on the device, show Pending sync, and retry with the same client-generated ID. Test reconnects, duplicate events, stale status changes, and simultaneous updates.
5. **Pilot and release.** Validate website, app, kiosk, tablet and counter orders at a pilot location. Sign off on the role matrix, order routing, counts, payment outcomes, cancellation history, and tablet usability. Reconcile order and payment counts before expanding to additional locations.

The prototype stores orders in the current browser. Automatic intake, payment reconciliation, production authorization, and cross-device synchronization are covered by phases 2–5.
