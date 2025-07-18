// src/tools/woocommerceTools.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  // TODO: Add these imports as you implement the functions in wordpress/api.js
  createProduct,
  getProduct,
  listProducts,
  getOrder,
  listOrders,
  updateOrderStatus
} from "../wordpress/api.js";

/**
 * Register basic WooCommerce tools with the MCP server
 */
export function registerWooCommerceTools(server: McpServer) {

  // ============================================
  // BASIC PRODUCT TOOLS
  // ============================================

  // Create Simple Product Tool
  server.tool(
    "create-wc-product",
    "Create a simple WooCommerce product",
    {
      name: z.string().describe("Product name"),
      price: z.string().describe("Product price (e.g., '29.99')"),
      description: z.string().optional().describe("Product description"),
      shortDescription: z.string().optional().describe("Short product description"),
      status: z.enum(["draft", "publish", "pending", "private"]).default("draft").describe("Product status"),
      manageStock: z.boolean().default(false).describe("Enable stock management"),
      stockQuantity: z.number().optional().describe("Stock quantity (if managing stock)")
    },
    async ({ name, price, description, shortDescription, status, manageStock, stockQuantity }) => {
      try {
        // TODO: Implement createProduct in wordpress/api.js
        const result = await createProduct({
          name,
          regular_price: price,
          description: description || '',
          short_description: shortDescription || '',
          status,
          manage_stock: manageStock,
          stock_quantity: stockQuantity || 0
        });

        return {
          content: [{
            type: "text",
            text: "⚠️ create-wc-product tool not yet implemented. Please add createProduct function to wordpress/api.js"
          }],
          isError: true
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Error creating product:", error);
        return {
          content: [{
            type: "text",
            text: `Error creating product: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  // Get Product Tool
  server.tool(
    "get-wc-product",
    "Get WooCommerce product details",
    {
      productId: z.number().describe("Product ID")
    },
    async ({ productId }) => {
      try {
        // TODO: Implement getProduct in wordpress/api.js
        const result = await getProduct(productId);

        return {
          content: [{
            type: "text",
            text: "⚠️ get-wc-product tool not yet implemented. Please add getProduct function to wordpress/api.js"
          }],
          isError: true
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: "text",
            text: `Error getting product: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  // List Products Tool
  server.tool(
    "list-wc-products",
    "List WooCommerce products",
    {
      page: z.number().default(1).describe("Page number"),
      perPage: z.number().max(100).default(10).describe("Products per page"),
      status: z.enum(["any", "draft", "pending", "private", "publish"]).default("any").describe("Product status filter"),
      search: z.string().optional().describe("Search products by name")
    },
    async ({ page, perPage, status, search }) => {
      try {
        // TODO: Implement listProducts in wordpress/api.js
        const result = await listProducts({ page, per_page: perPage, status, search });

        return {
          content: [{
            type: "text",
            text: "⚠️ list-wc-products tool not yet implemented. Please add listProducts function to wordpress/api.js"
          }],
          isError: true
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: "text",
            text: `Error listing products: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  // ============================================
  // BASIC ORDER TOOLS
  // ============================================

  // Get Order Tool
  server.tool(
    "get-wc-order",
    "Get WooCommerce order details",
    {
      orderId: z.number().describe("Order ID")
    },
    async ({ orderId }) => {
      try {
        // TODO: Implement getOrder in wordpress/api.js
        const result = await getOrder(orderId);

        return {
          content: [{
            type: "text",
            text: "⚠️ get-wc-order tool not yet implemented. Please add getOrder function to wordpress/api.js"
          }],
          isError: true
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: "text",
            text: `Error getting order: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  // List Orders Tool
  server.tool(
    "list-wc-orders",
    "List WooCommerce orders",
    {
      page: z.number().default(1).describe("Page number"),
      perPage: z.number().max(100).default(10).describe("Orders per page"),
      status: z.enum(["any", "pending", "processing", "on-hold", "completed", "cancelled", "refunded", "failed"]).default("any").describe("Order status filter"),
      customer: z.number().optional().describe("Filter by customer ID")
    },
    async ({ page, perPage, status, customer }) => {
      try {
        // TODO: Implement listOrders in wordpress/api.js
        const result = await listOrders({ page, per_page: perPage, status, customer });

        return {
          content: [{
            type: "text",
            text: "⚠️ list-wc-orders tool not yet implemented. Please add listOrders function to wordpress/api.js"
          }],
          isError: true
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: "text",
            text: `Error listing orders: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  // Update Order Status Tool
  server.tool(
    "update-wc-order-status",
    "Update WooCommerce order status",
    {
      orderId: z.number().describe("Order ID"),
      status: z.enum(["pending", "processing", "on-hold", "completed", "cancelled", "refunded", "failed"]).describe("New order status")
    },
    async ({ orderId, status }) => {
      try {
        // TODO: Implement updateOrderStatus in wordpress/api.js
        const result = await updateOrderStatus(orderId, status);

        return {
          content: [{
            type: "text",
            text: "⚠️ update-wc-order-status tool not yet implemented. Please add updateOrderStatus function to wordpress/api.js"
          }],
          isError: true
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: "text",
            text: `Error updating order status: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );
}