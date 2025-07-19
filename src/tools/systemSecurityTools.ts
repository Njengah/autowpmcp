// src/tools/systemSecurityTools.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  // TODO: Add these imports as I implement the functions in wordpress/api.js
  testWpConnection,
  getSiteHealth,
  checkCoreUpdates,
  applyCoreUpdate,
  scanForMalware,
  lockSite,
  clearCache,
  backupDatabase,
  getAuditLogs
} from "../wordpress/api.js";

/**
 * Register all system and security-related tools with the MCP server
 */
export function registerSystemSecurityTools(server: McpServer) {

  // Test WordPress Connection Tool (existing)
  server.tool(
    "test-wp-connection",
    "Test connection to WordPress site and verify API access",
    {
      includeDetails: z.boolean().default(false).describe("Include detailed connection information")
    },
    async ({ includeDetails }) => {
      try {
        const result = await testWpConnection(includeDetails);

        if (!result.success) {
          return {
            content: [{
              type: "text",
              text: `Connection failed: ${JSON.stringify(result.error)}`
            }],
            isError: true
          };
        }

        return {
          content: [{
            type: "text",
            text: `WordPress connection successful!\n\nSite: ${result.siteInfo?.name}\nURL: ${result.siteInfo?.url}\nWP Version: ${result.siteInfo?.version}\nAPI Status: ${result.siteInfo?.apiStatus}`
          }]
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Error testing WordPress connection:", error);
        return {
          content: [{
            type: "text",
            text: `Error testing connection: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  // Get Site Health Tool
  server.tool(
    "get-site-health",
    "Retrieve WordPress site health status and core errors",
    {
      includeRecommendations: z.boolean().default(true).describe("Include health recommendations"),
      checkCriticalOnly: z.boolean().default(false).describe("Show only critical issues")
    },
    async ({ includeRecommendations, checkCriticalOnly }) => {
      try {
        // TODO: Implement getSiteHealth in wordpress/api.js
        const result = await getSiteHealth(includeRecommendations, checkCriticalOnly);

        return {
          content: [{
            type: "text",
            text: "⚠️ get-site-health tool not yet implemented. Please add getSiteHealth function to wordpress/api.js"
          }],
          isError: true
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: "text",
            text: `Error retrieving site health: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  // Check Core Updates Tool
  server.tool(
    "check-core-updates",
    "Check for available WordPress core updates",
    {
      includePrerelease: z.boolean().default(false).describe("Include beta/RC versions")
    },
    async ({ includePrerelease }) => {
      try {
        // TODO: Implement checkCoreUpdates in wordpress/api.js
        const result = await checkCoreUpdates(includePrerelease);

        return {
          content: [{
            type: "text",
            text: "⚠️ check-core-updates tool not yet implemented. Please add checkCoreUpdates function to wordpress/api.js"
          }],
          isError: true
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: "text",
            text: `Error checking core updates: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  // Apply Core Update Tool
  server.tool(
    "apply-core-update",
    "Install available WordPress core updates",
    {
      version: z.string().optional().describe("Specific version to update to (optional)"),
      createBackup: z.boolean().default(true).describe("Create backup before update"),
      forceUpdate: z.boolean().default(false).describe("Force update even if risky")
    },
    async ({ version, createBackup, forceUpdate }) => {
      try {
        // TODO: Implement applyCoreUpdate in wordpress/api.js
        const result = await applyCoreUpdate(version, createBackup, forceUpdate);

        return {
          content: [{
            type: "text",
            text: "⚠️ apply-core-update tool not yet implemented. Please add applyCoreUpdate function to wordpress/api.js"
          }],
          isError: true
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: "text",
            text: `Error applying core update: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  // Scan for Malware Tool
  server.tool(
    "scan-for-malware",
    "Scan WordPress site for malware and security threats",
    {
      scanType: z.enum(["quick", "full", "files", "database"]).default("quick").describe("Type of security scan"),
      quarantineThreats: z.boolean().default(false).describe("Automatically quarantine found threats"),
      securityPlugin: z.enum(["wordfence", "sucuri", "ithemes", "auto"]).default("auto").describe("Security plugin to use")
    },
    async ({ scanType, quarantineThreats, securityPlugin }) => {
      try {
        // TODO: Implement scanForMalware in wordpress/api.js
        const result = await scanForMalware(scanType, quarantineThreats, securityPlugin);

        return {
          content: [{
            type: "text",
            text: "⚠️ scan-for-malware tool not yet implemented. Please add scanForMalware function to wordpress/api.js"
          }],
          isError: true
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: "text",
            text: `Error scanning for malware: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  // Lock Site Tool (Maintenance Mode)
  server.tool(
    "lock-site",
    "Enable or disable WordPress maintenance mode",
    {
      action: z.enum(["enable", "disable", "status"]).describe("Maintenance mode action"),
      message: z.string().optional().describe("Custom maintenance message for visitors"),
      allowedIPs: z.array(z.string()).optional().describe("IP addresses allowed to bypass maintenance mode"),
      duration: z.number().optional().describe("Auto-disable after N minutes (optional)")
    },
    async ({ action, message, allowedIPs, duration }) => {
      try {
        // TODO: Implement lockSite in wordpress/api.js
        const result = await lockSite(action, message, allowedIPs, duration);

        return {
          content: [{
            type: "text",
            text: "⚠️ lock-site tool not yet implemented. Please add lockSite function to wordpress/api.js"
          }],
          isError: true
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: "text",
            text: `Error managing maintenance mode: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  // Clear Cache Tool
  server.tool(
    "clear-cache",
    "Clear WordPress site cache from various caching plugins",
    {
      cacheType: z.enum(["all", "page", "object", "database", "cdn"]).default("all").describe("Type of cache to clear"),
      cachingPlugin: z.enum(["wp-rocket", "w3-total-cache", "wp-super-cache", "litespeed", "cloudflare", "auto"]).default("auto").describe("Caching plugin to target"),
      purgeExternal: z.boolean().default(true).describe("Also purge external CDN cache")
    },
    async ({ cacheType, cachingPlugin, purgeExternal }) => {
      try {
        // TODO: Implement clearCache in wordpress/api.js
        const result = await clearCache(cacheType, cachingPlugin, purgeExternal);

        return {
          content: [{
            type: "text",
            text: "⚠️ clear-cache tool not yet implemented. Please add clearCache function to wordpress/api.js"
          }],
          isError: true
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: "text",
            text: `Error clearing cache: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  // Backup Database Tool
  server.tool(
    "backup-database",
    "Create WordPress database backup using available backup plugins",
    {
      backupName: z.string().optional().describe("Custom name for the backup"),
      includeDrafts: z.boolean().default(true).describe("Include draft posts in backup"),
      includeMedia: z.boolean().default(false).describe("Include media files (may be large)"),
      compressionLevel: z.enum(["none", "low", "medium", "high"]).default("medium").describe("Backup compression level"),
      backupPlugin: z.enum(["updraftplus", "backwpup", "duplicator", "jetpack", "auto"]).default("auto").describe("Backup plugin to use"),
      storageLocation: z.enum(["local", "cloud", "both"]).default("local").describe("Where to store the backup")
    },
    async ({ backupName, includeDrafts, includeMedia, compressionLevel, backupPlugin, storageLocation }) => {
      try {
        // TODO: Implement backupDatabase in wordpress/api.js
        const result = await backupDatabase(backupName, includeDrafts, includeMedia, compressionLevel, backupPlugin, storageLocation);

        return {
          content: [{
            type: "text",
            text: "⚠️ backup-database tool not yet implemented. Please add backupDatabase function to wordpress/api.js"
          }],
          isError: true
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: "text",
            text: `Error creating database backup: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  // Audit Logs Tool (★ Advanced Feature)
  server.tool(
    "audit-logs",
    "View recent WordPress admin activity and security logs",
    {
      logType: z.enum(["all", "login", "post", "user", "plugin", "theme", "security"]).default("all").describe("Type of logs to retrieve"),
      limit: z.number().max(1000).default(50).describe("Maximum number of log entries"),
      dateFrom: z.string().optional().describe("Start date (ISO format: YYYY-MM-DD)"),
      dateTo: z.string().optional().describe("End date (ISO format: YYYY-MM-DD)"),
      userId: z.number().optional().describe("Filter by specific user ID"),
      severity: z.enum(["info", "warning", "error", "critical"]).optional().describe("Minimum log severity"),
      searchTerm: z.string().optional().describe("Search within log messages")
    },
    async ({ logType, limit, dateFrom, dateTo, userId, severity, searchTerm }) => {
      try {
        // Validate date formats if provided
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          if (isNaN(fromDate.getTime())) {
            return {
              content: [{
                type: "text",
                text: "Invalid 'dateFrom' format. Please use YYYY-MM-DD format."
              }],
              isError: true
            };
          }
        }

        if (dateTo) {
          const toDate = new Date(dateTo);
          if (isNaN(toDate.getTime())) {
            return {
              content: [{
                type: "text",
                text: "Invalid 'dateTo' format. Please use YYYY-MM-DD format."
              }],
              isError: true
            };
          }
        }

        // TODO: Implement getAuditLogs in wordpress/api.js
        const result = await getAuditLogs({
          logType,
          limit,
          dateFrom,
          dateTo,
          userId,
          severity,
          searchTerm
        });

        return {
          content: [{
            type: "text",
            text: "⚠️ audit-logs tool not yet implemented. Please add getAuditLogs function to wordpress/api.js"
          }],
          isError: true
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: "text",
            text: `Error retrieving audit logs: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  // System Info Tool (Bonus utility)
  server.tool(
    "get-system-info",
    "Retrieve detailed WordPress system information and environment details",
    {
      includePlugins: z.boolean().default(true).describe("Include active plugins list"),
      includeThemes: z.boolean().default(true).describe("Include installed themes"),
      includeServerInfo: z.boolean().default(true).describe("Include server/PHP details"),
      includePermissions: z.boolean().default(false).describe("Check file permissions (may be slow)")
    },
    async ({ includePlugins, includeThemes, includeServerInfo, includePermissions }) => {
      try {
        // This could reuse the testWpConnection function with extended details
        const result = await testWpConnection(true);

        if (!result.success) {
          return {
            content: [{
              type: "text",
              text: `Failed to retrieve system info: ${JSON.stringify(result.error)}`
            }],
            isError: true
          };
        }

        // TODO: Extend testWpConnection or create getSystemInfo for more detailed info
        return {
          content: [{
            type: "text",
            text: `WordPress System Information:\n\nSite: ${result.siteInfo?.name}\nURL: ${result.siteInfo?.url}\nWP Version: ${result.siteInfo?.version}\nPHP Version: ${result.siteInfo?.phpVersion || 'Unknown'}\nMySQL Version: ${result.siteInfo?.mysqlVersion || 'Unknown'}\n\n⚠️ Extended system info not yet implemented. Consider extending testWpConnection function.`
          }]
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: "text",
            text: `Error retrieving system info: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );
}