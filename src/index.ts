// src/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Import tool registration functions
import { registerPostTools } from "./tools/postTools.js";
import { registerTaxonomyTools } from "./tools/taxonomyTools.js"; 
import { registerMediaTools } from "./tools/mediaTools.js";
import { registerUserTools } from "./tools/userTools.js";
import { registerSystemTools } from "./tools/systemTools.js";

// Import WordPress API functions for authentication
import { 
  setWordPressConfig, 
  testSiteConnection,
  testAuthentication,
} from "./wordpress/api.js";

// Create the MCP server instance with metadata
const server = new McpServer({
  name: "AutoWP",
  version: "1.0.0",
  description: "WordPress Site Management via LLM example - Claude Desktop",
  capabilities: {
    resources: {},
    tools: {}
  }
});

// ============================================
// AUTHENTICATION & SYSTEM TOOLS
// ============================================

server.tool(
  "authenticate-wp",
  "Connect to a WordPress site with credentials",
  {
    siteUrl: z.string().url().describe("The URL of the WordPress site"),
    username: z.string().describe("WordPress username"),
    password: z.string().optional().describe("WordPress password (use app password for better security)"),
    appPassword: z.string().optional().describe("WordPress application password (preferred over regular password)")
  },
  async ({ siteUrl, username, password, appPassword }) => {
    try {
      // Validate credentials
      if (!password && !appPassword) {
        return {
          content: [{
            type: "text",
            text: "Either password or appPassword must be provided"
          }],
          isError: true
        };
      }

      // Update config
      setWordPressConfig({ siteUrl, username, password, appPassword });
      
      // Test authentication
      const authResult = await testAuthentication();
      
      // Type-safe success check
      if (!authResult.success || !authResult.userInfo) {
        return {
          content: [{
            type: "text",
            text: `Authentication failed: ${authResult.error || 'No user info returned'}`
          }],
          isError: true
        };
      }

      // Safe role formatting
      const roles = authResult.userInfo.roles.join(', ') || 'no roles assigned';
      
      return {
        content: [{
          type: "text",
          text: `Successfully authenticated to ${siteUrl}\n\n` +
                `User: ${authResult.userInfo.name}\n` +
                `Roles: ${roles}`
        }]
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Authentication error:", error);
      return {
        content: [{
          type: "text",
          text: `Error authenticating: ${errorMessage}`
        }],
        isError: true
      };
    }
  }
);

server.tool(
  "test-wp-connection",
  "Test if a WordPress site is reachable",
  {
    siteUrl: z.string().url().describe("WordPress site URL")
  },
  async ({ siteUrl }) => {
    const isReachable = await testSiteConnection(siteUrl);
    return {
      content: [{
        type: "text",
        text: isReachable 
          ? `✅ WordPress REST API is reachable at ${siteUrl}`
          : `❌ Could not connect to WordPress at ${siteUrl}`
      }]
    };
  }
);
// ============================================
// REGISTER MODULAR TOOL SETS
// ============================================

  // Register all post-related tools
  registerPostTools(server);

  // Register media-related tools
  registerMediaTools(server);

  // Register Taxonomy tools
  registerTaxonomyTools(server);

  // Register user and role management tools
   registerUserTools(server);

  // Register system and security tools
  registerSystemTools(server);

// ============================================
// SERVER STARTUP
// ============================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AutoWP MCP Server running on stdio");
}

// Error handling for the main function
main().catch((error) => {
  console.error("Fatal error in AutoWP MCP Server:", error);
  process.exit(1);
});