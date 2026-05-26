// src/tools/settingsTools.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  getSiteSettings,
  updateSiteSettings
} from "../wordpress/api.js";

/**
 * Register site settings tools with the MCP server
 */
export function registerSettingsTools(server: McpServer) {
  server.tool(
    "get-site-settings",
    "Get the current WordPress site settings",
    {},
    async () => {
      try {
        const result = await getSiteSettings();

        if (!result.success || !result.settings) {
          return {
            content: [{
              type: "text",
              text: `Failed to get site settings: ${JSON.stringify(result.error)}`
            }],
            isError: true
          };
        }

        const settings = result.settings;
        const summary = [
          `Title: ${settings.title ?? "unknown"}`,
          `Description: ${settings.description ?? "unknown"}`,
          `Timezone: ${settings.timezone ?? "unknown"}`,
          `Language: ${settings.language ?? "unknown"}`,
          `Posts per page: ${settings.posts_per_page ?? "unknown"}`,
          `Default category: ${settings.default_category ?? "unknown"}`,
          `Front page: ${settings.show_on_front ?? "unknown"}`,
          `Comment status: ${settings.default_comment_status ?? "unknown"}`,
          `Ping status: ${settings.default_ping_status ?? "unknown"}`
        ].join("\n");

        return {
          content: [{
            type: "text",
            text: `WordPress site settings:\n\n${summary}`
          }]
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Error executing get-site-settings tool:", error);
        return {
          content: [{
            type: "text",
            text: `Error getting site settings: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  server.tool(
    "update-site-settings",
    "Update basic WordPress site settings",
    {
      title: z.string().optional().describe("Site title"),
      description: z.string().optional().describe("Site tagline"),
      timezone: z.string().optional().describe("Timezone string, for example 'Africa/Nairobi'"),
      language: z.string().optional().describe("WordPress locale code"),
      postsPerPage: z.number().int().positive().max(100).optional().describe("Number of posts shown per page"),
      defaultCategory: z.number().int().positive().optional().describe("Default post category ID"),
      defaultPostFormat: z.string().optional().describe("Default post format"),
      showOnFront: z.enum(["posts", "page"]).optional().describe("What to show on the front page"),
      pageOnFront: z.number().int().positive().optional().describe("Page ID to use as the front page"),
      pageForPosts: z.number().int().positive().optional().describe("Page ID to use for posts page"),
      defaultPingStatus: z.enum(["open", "closed"]).optional().describe("Default pingback/trackback status"),
      defaultCommentStatus: z.enum(["open", "closed"]).optional().describe("Default comment status"),
      useSmilies: z.boolean().optional().describe("Convert emoticons to graphics"),
      siteLogo: z.number().int().positive().optional().describe("Media ID for the site logo"),
      siteIcon: z.number().int().positive().optional().describe("Media ID for the site icon")
    },
    async ({
      title,
      description,
      timezone,
      language,
      postsPerPage,
      defaultCategory,
      defaultPostFormat,
      showOnFront,
      pageOnFront,
      pageForPosts,
      defaultPingStatus,
      defaultCommentStatus,
      useSmilies,
      siteLogo,
      siteIcon
    }) => {
      try {
        const result = await updateSiteSettings({
          title,
          description,
          timezone,
          language,
          posts_per_page: postsPerPage,
          default_category: defaultCategory,
          default_post_format: defaultPostFormat,
          show_on_front: showOnFront,
          page_on_front: pageOnFront,
          page_for_posts: pageForPosts,
          default_ping_status: defaultPingStatus,
          default_comment_status: defaultCommentStatus,
          use_smilies: useSmilies,
          site_logo: siteLogo,
          site_icon: siteIcon
        });

        if (!result.success || !result.settings) {
          return {
            content: [{
              type: "text",
              text: `Failed to update site settings: ${JSON.stringify(result.error)}`
            }],
            isError: true
          };
        }

        return {
          content: [{
            type: "text",
            text: `Site settings updated successfully.\n\nTitle: ${result.settings.title ?? "unknown"}\nDescription: ${result.settings.description ?? "unknown"}\nTimezone: ${result.settings.timezone ?? "unknown"}`
          }]
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Error executing update-site-settings tool:", error);
        return {
          content: [{
            type: "text",
            text: `Error updating site settings: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );
}
