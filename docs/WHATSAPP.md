# Aajori Cuisine - Meta WhatsApp Cloud API v20.0 Commerce & Notification Guide

The Aajori Cuisine platform integrates directly with **Meta WhatsApp Cloud API v20.0** to provide conversational food ordering as a seamless fallback for customers who do not install the mobile application, as well as proactive transactional delivery alerts.

Webhook Endpoint: `/api/v1/whatsapp/webhook`

---

## 1. Architectural Principles & Commerce Interoperability

WhatsApp uses the **exact same centralized business services** as the Flutter Customer/Delivery apps, Admin Panel, and MCP AI agent clients:
- **Discovery**: `restaurantService.listRestaurants()`
- **Natural Language Intent**: `aiFoodAssistantService.recommendMealCombos()`
- **Authoritative Pricing**: `pricingEngineService.calculateOrderPricing()`
- **Order Lifecycle**: `orderService.createOrder()` & `orderService.transitionOrderStatus()`
- **Tracking**: `orderService.listOrders()`
- **Notifications**: `notificationService.dispatch()` with channel `WHATSAPP`
- **Outbound Dispatch**: `whatsAppClientService` with Meta Cloud API v20.0 and sandbox emulation

No separate WhatsApp silo is used. All orders placed via WhatsApp appear in real-time in the Super Admin dashboard and restaurant kitchen order queues.

---

## 2. Complete Conversational Lifecycle

```
[Customer] "Hi" / "Menu"
   │
   ▼
[Bot] Lists active restaurants with numbers & cuisine tags
   │
[Customer] "1" (Selects Khorikaa)
   │
   ▼
[Bot] Displays popular dishes with prices and buttons
   │
[Customer] "1" (Adds Duck Curry with Til)
   │
   ▼
[Bot] "Added 1x Duck Curry to cart! Reply Cart to review or Checkout to proceed."
   │
[Customer] "Checkout"
   │
   ▼
[Bot] "Please reply with your address or share your 📍 WhatsApp Location Pin!"
   │
[Customer] Sends GPS Location Pin (or types "Zoo Road Tiniali, Guwahati")
   │
   ▼
[Bot] "Address Confirmed. Choose Payment: 1. Cash on Delivery (COD) 2. Online UPI"
   │
[Customer] "1" (Selects COD)
   │
   ▼
[Bot] "🎉 Order Confirmed! #AJR-202610-0005. Estimated Delivery: 25-35 mins. Reply Track anytime!"
```

---

## 3. Conversational Commands & State Machine

| Command / Input | Stage | Bot Action & Response |
| :--- | :---: | :--- |
| `"Hi"`, `"Menu"`, `"Start"` | `IDLE` | Lists active district kitchens, rating, and quick action buttons |
| `"1"`, `"2"`, ... | `IDLE` | Selects restaurant and lists top items with prices |
| `"Duck curry under ₹400"` | `IDLE` | AI intent resolver suggests grounded combo. Reply `"Order Combo"` adds to cart |
| `"1"`, `"2"` or dish name | `RESTAURANT_SELECTED` | Adds item to cart, increments quantity, and updates subtotal |
| `"Cart"`, `"View Cart"` | Any | Displays items, taxes, packaging, delivery fee, and estimated total |
| `"Clear"`, `"Empty Cart"` | `CART_REVIEW` | Clears active cart |
| `"Checkout"` | `CART_REVIEW` | Prompts for address or WhatsApp GPS location pin |
| GPS Pin / Street Address | `AWAITING_ADDRESS` | Saves `CustomerAddress` in DB and displays payment method options |
| `"1"` or `"COD"` | `AWAITING_PAYMENT` | Creates `CASH_ON_DELIVERY` order (`PAYMENT_CONFIRMED`) and sends confirmation |
| `"2"` or `"UPI"` / `"Online"` | `AWAITING_PAYMENT` | Creates online order (`PAYMENT_PENDING`) and generates Razorpay UPI payment link |
| `"Track"` | Any | Queries caller phone's latest orders, returning live status, items, and ETA |
| `"Reset"`, `"Restart"` | Any | Resets active cart and state back to `IDLE` |
| `"Help"` | Any | Displays command guide and navigation buttons |

---

## 4. Meta Webhook Specifications

### 4.1 Verification Handshake (`GET /api/v1/whatsapp/webhook`)
Meta Cloud API verifies the webhook by sending:
- `hub.mode`: `"subscribe"`
- `hub.verify_token`: Matches `WHATSAPP_VERIFY_TOKEN` (default: `aajori_whatsapp_verify_token_2026`)
- `hub.challenge`: Echoed back with HTTP 200

### 4.2 Inbound Messages (`POST /api/v1/whatsapp/webhook`)
The endpoint supports dual payloads:
1. **Official Meta Cloud API JSON**: Nested structure (`entry[0].changes[0].value.messages[0]`) supporting:
   - `type: "text"` (`msg.text.body`)
   - `type: "interactive"` (`msg.interactive.button_reply.id`)
   - `type: "location"` (`msg.location.latitude`, `msg.location.longitude`, `msg.location.address`)
2. **Admin Simulator JSON**: Direct payload (`{ from, message, location, replyId }`) used by the Admin Portal sandbox.

---

## 5. Proactive Order Status Notifications

Whenever an order changes status in the system, `notificationService.dispatch` automatically dispatches proactive WhatsApp alerts to the customer's phone:

- **Order Accepted**: *"👨‍🍳 Kitchen Update: Order #AJR-... has been accepted by {Restaurant} and is being prepared!"*
- **Order Ready**: *"🍱 Order Ready: Order #AJR-... is freshly packed and waiting for delivery pickup."*
- **Rider Assigned**: *"🛵 Rider Assigned: A delivery partner has been assigned to pick up Order #AJR-..."*
- **Out for Delivery**: *"🚀 Out for Delivery: Order #AJR-... is on its way to your address! Expected in ~15 mins."*
- **Order Delivered**: *"✅ Delivered: Order #AJR-... has been delivered! Enjoy your authentic meal."*
- **Order Cancelled**: *"❌ Order Cancelled: Order #AJR-... was cancelled. Any online payment has been refunded."*

---

## 6. Admin Panel Simulator

Access the live sandbox at **Super Admin Panel -> AI & WhatsApp Hub (`/ai-whatsapp`)**:
- Live chat bubble simulator with interactive button pills.
- **"Share GPS Pin"** button to simulate sending live GPS coordinates (`26.1550, 91.7690`).
- **Active State Badge**: Real-time display of stage (`IDLE`, `RESTAURANT_SELECTED`, `CART_REVIEW`, `AWAITING_ADDRESS`, `AWAITING_PAYMENT`) and item count.
- **Reset Session**: Clears the sandbox state with one click.

---

## 7. Environment Variables Reference

```env
# Meta WhatsApp Cloud API v20.0
WHATSAPP_PHONE_NUMBER_ID=your_meta_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_meta_system_user_access_token
WHATSAPP_VERIFY_TOKEN=aajori_whatsapp_verify_token_2026
WHATSAPP_APP_SECRET=your_meta_app_secret
```

*(If `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN` are not provided, the platform automatically runs in Sandbox Emulation mode, safely logging simulated payloads without network errors).*
