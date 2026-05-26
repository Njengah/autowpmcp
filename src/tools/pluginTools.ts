// src/tools/pluginTools.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { listPlugins } from "../wordpress/api.js";
import { WPPlugin } from "../types/interfaces.js";

/**
 * Register plugin management tools with the MCP server
 */
export function registerPluginTools(server: McpServer) {
  server.tool(
    "list-plugins",
    "List installed WordPress plugins with activation status",
    {
      page: z.number().default(1).describe("Page number (default: 1)"),
      perPage: z.number().max(100).default(20).describe("Plugins per page (max: 100)"),
      search: z.string().optional().describe("Search plugins by name or plugin file"),
      status: z.enum(["inactive", "active"]).optional().describe("Filter by plugin status"),
      context: z.enum(["view", "embed", "edit"]).default("view").describe("Response context")
    },
    async ({ page, perPage, search, status, context }) => {
      try {
        const result = await listPlugins({ page, perPage, search, status, context });

        if (!result.success) {
          return {
            content: [{
              type: "text",
              text: `Failed to list plugins: ${JSON.stringify(result.error)}`
            }],
            isError: true
          };
        }

        const plugins = result.plugins?.map((plugin: WPPlugin) =>
          `- ${plugin.name} (${plugin.plugin})\n  Status: ${plugin.status}\n  Version: ${plugin.version}\n  Author: ${plugin.author}\n  Description: ${plugin.description}`
        ).join("\n") || "No plugins found.";

        return {
          content: [{
            type: "text",
            text: `WordPress plugins:\n\n${plugins}\n\nTotal plugins: ${result.totalPlugins ?? 0}\nTotal pages: ${result.totalPages ?? 1}`
          }]
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Error listing plugins:", error);
        return {
          content: [{
            type: "text",
            text: `Error listing plugins: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );
}
