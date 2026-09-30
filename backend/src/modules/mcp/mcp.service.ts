import { db } from '../../data/mock-db';
import { restaurantService } from '../restaurants/restaurant.service';
import { pricingEngineService } from '../pricing/pricing.service';
import { orderService } from '../orders/order.service';
import { User } from '../../common/types';
import { BadRequestError, UnauthorizedError } from '../../common/errors';

export interface McpToolDefinition {
  name: string;
  description: string;
  readOnly: boolean;
  parameters: Record<string, any>;
}

export class McpServerService {
  /**
   * Manifest of available MCP tools for AI agents (Claude, ChatGPT, Gemini, etc.)
   */
  public getToolDefinitions(): McpToolDefinition[] {
    return [
      {
        name: 'search_restaurants',
        description: 'Search active hyperlocal restaurants in the district by cuisine or keyword.',
        readOnly: true,
        parameters: {
          type: 'object',
          properties: {
            search: { type: 'string', description: 'Keyword query e.g. "thali", "smoked"' },
            cuisine: { type: 'string', description: 'Cuisine filter e.g. "Assamese Ethnic"' },
          },
        },
      },
      {
        name: 'get_restaurant_menu',
        description: 'Get menu categories and items for a restaurant.',
        readOnly: true,
        parameters: {
          type: 'object',
          required: ['restaurantId'],
          properties: {
            restaurantId: { type: 'string', description: 'The unique UUID of the restaurant' },
          },
        },
      },
      {
        name: 'calculate_order_price',
        description:
          'Authoritatively calculate exact pricing breakdown (subtotal, delivery fee, taxes, packaging, discount) for a set of items and delivery coordinates.',
        readOnly: true,
        parameters: {
          type: 'object',
          required: ['restaurantId', 'items', 'customerLatitude', 'customerLongitude'],
          properties: {
            restaurantId: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['menuItemId', 'quantity'],
                properties: {
                  menuItemId: { type: 'string' },
                  quantity: { type: 'number' },
                },
              },
            },
            customerLatitude: { type: 'number' },
            customerLongitude: { type: 'number' },
            couponCode: { type: 'string' },
          },
        },
      },
      {
        name: 'create_food_order',
        description:
          'State-changing tool: Place an authenticated food order. Requires verified customer credentials.',
        readOnly: false,
        parameters: {
          type: 'object',
          required: ['restaurantId', 'items', 'deliveryAddressId', 'paymentMethod'],
          properties: {
            restaurantId: { type: 'string' },
            items: { type: 'array' },
            deliveryAddressId: { type: 'string' },
            paymentMethod: { type: 'string', enum: ['UPI', 'CASH_ON_DELIVERY'] },
            customerInstructions: { type: 'string' },
            couponCode: { type: 'string' },
          },
        },
      },
      {
        name: 'get_order_status',
        description: 'Retrieve real-time tracking status and timeline history for an order.',
        readOnly: true,
        parameters: {
          type: 'object',
          required: ['orderId'],
          properties: {
            orderId: { type: 'string' },
          },
        },
      },
    ];
  }

  /**
   * Dispatches MCP Tool calls safely through core business services.
   */
  public async executeTool(toolName: string, args: any, authenticatedUser?: User): Promise<any> {
    switch (toolName) {
      case 'search_restaurants': {
        return restaurantService.listRestaurants({
          search: args.search,
          cuisine: args.cuisine,
        });
      }

      case 'get_restaurant_menu': {
        return restaurantService.getRestaurantMenu(args.restaurantId);
      }

      case 'calculate_order_price': {
        return pricingEngineService.calculateOrderPricing({
          restaurantId: args.restaurantId,
          customerLocation: {
            latitude: args.customerLatitude,
            longitude: args.customerLongitude,
          },
          items: args.items,
          couponCode: args.couponCode,
        });
      }

      case 'create_food_order': {
        if (!authenticatedUser) {
          throw new UnauthorizedError('create_food_order requires authenticated customer session');
        }
        return await orderService.createOrder(authenticatedUser, {
          restaurantId: args.restaurantId,
          items: args.items,
          deliveryAddressId: args.deliveryAddressId,
          paymentMethod: args.paymentMethod || 'UPI',
          customerInstructions: args.customerInstructions,
          couponCode: args.couponCode,
        });
      }

      case 'get_order_status': {
        return await orderService.getOrderById(args.orderId, authenticatedUser);
      }

      default:
        throw new BadRequestError(`Unknown MCP tool: ${toolName}`);
    }
  }
}

export const mcpServerService = new McpServerService();
