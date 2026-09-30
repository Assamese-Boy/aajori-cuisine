# Aajori Cuisine - WhatsApp Business Ordering Guide

The platform integrates directly with **Meta WhatsApp Cloud API v20.0** to provide conversational food ordering as a seamless fallback for customers who do not install the mobile application.

Webhook URL: `/api/v1/whatsapp/webhook`

---

## 1. Architectural Principle
WhatsApp uses the **exact same centralized business services** as the Flutter app and MCP clients:
- Discovery via `restaurantService.listRestaurants()`
- Natural language intent parsing via `aiFoodAssistantService.recommendMealCombos()`
- Order placement via `orderService.createOrder()`
- Tracking via `orderService.listOrders()`

No separate WhatsApp-specific database is used.

---

## 2. Conversational Capabilities

| Customer Input | Backend Resolution | WhatsApp Response |
| :--- | :--- | :--- |
| `"Hi"` / `"Menu"` | Lists active district kitchens | Interactive list of restaurants with numbers and cuisines |
| `"1"` (Selects Khorikaa) | Fetches top menu items | Dish names, prices, and direct add instructions |
| `"I want duck curry under ₹400"` | AI Food Assistant intent resolver | Grounded suggestion: Duck curry with Til from Khorikaa Kitchen |
| `"Track my order"` | Queries active orders for caller phone | Live status, rider assignment, and ETA |

---

## 3. Webhook Setup with Meta Cloud API

1. Register a Meta Developer App with the **WhatsApp Business Platform** product.
2. In the WhatsApp Configuration panel:
   - **Callback URL**: `https://<your-domain>/api/v1/whatsapp/webhook`
   - **Verify Token**: `aajori_whatsapp_verify_token_2026` (Configurable in `backend/.env`)
3. Subscribe to the `messages` webhook field.
4. Set `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN` in your environment.
