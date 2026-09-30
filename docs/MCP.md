# Aajori Cuisine - Model Context Protocol (MCP) Guide

The platform provides a first-class **Model Context Protocol (MCP)** server, allowing AI agents (such as Claude Desktop, ChatGPT plugins, Gemini Advanced, and local agents) to query local commerce data and safely execute authenticated food orders.

Endpoint: `POST /api/v1/mcp/execute`
Tools Definition: `GET /api/v1/mcp/tools`

---

## 1. Safety Architecture: Read-Only vs State-Changing Tools

All tools are strictly decoupled:

### Read-Only Tools (Unrestricted Querying)
1. `search_restaurants`: Discovers district kitchens by keyword or cuisine filter.
2. `get_restaurant_menu`: Retrieves menu categories, dishes, prices, and availability.
3. `calculate_order_price`: Computes exact authoritative pricing without placing an order.
4. `get_order_status`: Queries live delivery timeline and tracking status.

### State-Changing Tools (Requires Authenticated Customer Session)
1. `create_food_order`: Places an order against real kitchen inventory with snapshot pricing.

---

## 2. Tool Definitions Schema

```json
{
  "tools": [
    {
      "name": "search_restaurants",
      "description": "Search active hyperlocal restaurants in the district by cuisine or keyword.",
      "readOnly": true,
      "parameters": {
        "type": "object",
        "properties": {
          "search": { "type": "string" },
          "cuisine": { "type": "string" }
        }
      }
    },
    {
      "name": "calculate_order_price",
      "description": "Authoritatively calculate exact pricing breakdown for items and delivery coordinates.",
      "readOnly": true,
      "parameters": {
        "type": "object",
        "required": ["restaurantId", "items", "customerLatitude", "customerLongitude"],
        "properties": {
          "restaurantId": { "type": "string" },
          "items": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "menuItemId": { "type": "string" },
                "quantity": { "type": "number" }
              }
            }
          },
          "customerLatitude": { "type": "number" },
          "customerLongitude": { "type": "number" },
          "couponCode": { "type": "string" }
        }
      }
    }
  ]
}
```

---

## 3. Invocation Example

```bash
curl -X POST http://localhost:4000/api/v1/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "search_restaurants",
    "arguments": {
      "cuisine": "Assamese"
    }
  }'
```

Returns:
```json
{
  "success": true,
  "data": [
    {
      "id": "d0000000-0000-0000-0000-000000000001",
      "name": "Khorikaa Ethnic Kitchen",
      "cuisineTypes": ["Assamese Ethnic", "Charcoal Grill"],
      "avgPrepTimeMinutes": 25,
      "rating": 4.8
    }
  ]
}
```
