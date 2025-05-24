// Import the necessary modules from the MCP SDK
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  createPost,
  setWordPressConfig,
  testSiteConnection,
  testAuthentication,
  getCategories,
  getTags,
} from "./wordpress/api.js";
import {
  saveDraft,
  loadDraft,
  truncateContent,
  formatPostContent,
} from "./utils/helpers.js";
// Create the MCP server instance with metadata
const server = new McpServer({
  name: "AutoWP",
  version: "1.0.0",
  description: "WordPress blog post creation and publishing via Claude",
  capabilities: {
    resources: {},
    tools: {},
  },
});

server.tool(
  "authenticate-wp",
  "Connect to a WordPress site with credentials",
  {
    siteUrl: z.string().url().describe("The URL of the WordPress site"),
    username: z.string().describe("WordPress username"),
    password: z
      .string()
      .optional()
      .describe("WordPress password (use app password for better security)"),
    appPassword: z
      .string()
      .optional()
      .describe(
        "WordPress application password (preferred over regular password)"
      ),
  },
  async ({ siteUrl, username, password, appPassword }) => {
    try {
      // Validate credentials
      if (!password && !appPassword) {
        return {
          content: [
            {
              type: "text",
              text: "Either password or appPassword must be provided",
            },
          ],
          isError: true,
        };
      }
      // Update config
      setWordPressConfig({ siteUrl, username, password, appPassword });
      // Test authentication
      const authResult = await testAuthentication();
      // Type-safe success check
      if (!authResult.success || !authResult.userInfo) {
        return {
          content: [
            {
              type: "text",
              text: `Authentication failed: ${
                authResult.error || "No user info returned"
              }`,
            },
          ],
          isError: true,
        };
      }
      // Safe role formatting
      const roles = authResult.userInfo.roles.join(", ") || "no roles assigned";
      return {
        content: [
          {
            type: "text",
            text:
              `Successfully authenticated to ${siteUrl}\n\n` +
              `User: ${authResult.userInfo.name}\n` +
              `Roles: ${roles}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Authentication error:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error authenticating: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }
);
// Register the create-blog-post tool
server.tool(
  "create-blog-post",
  "Create a blog post in WordPress",
  {
    title: z.string().describe("The title of the blog post"),
    content: z.string().describe("The HTML content of the blog post"),
    status: z
      .enum(["draft", "publish", "pending", "future"])
      .default("draft")
      .describe("Publication status"),
    excerpt: z.string().optional().describe("Optional post excerpt/summary"),
    categories: z
      .array(z.number())
      .optional()
      .describe("Array of category IDs"),
    tags: z.array(z.number()).optional().describe("Array of tag IDs"),
  },
  async ({ title, content, status, excerpt, categories, tags }) => {
    try {
      // Call WordPress API to create post
      const result = await createPost(
        title,
        content,
        status || "draft",
        excerpt || "",
        categories || [],
        tags || []
      );
      if (!result.success) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to create blog post: ${JSON.stringify(
                result.error
              )}`,
            },
          ],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: "text",
            text: `Blog post created successfully!\n\nTitle: ${result.post?.title}\nStatus: ${result.post?.status}\nLink: ${result.post?.link}\nID: ${result.post?.id}`,
          },
        ],
      };
    } catch (error) {
      console.error("Error executing create-blog-post tool:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error creating blog post: ${
              error.message || "Unknown error"
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);
server.tool(
  "get-wp-categories",
  "Get available WordPress categories",
  {},
  async () => {
    try {
      const result = await getCategories();
      if (!result.success) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to get WordPress categories: ${JSON.stringify(
                result.error
              )}`,
            },
          ],
          isError: true,
        };
      }
      // Format the categories for better readability
      const categoriesList = Array.isArray(result.categories)
        ? result.categories
            .map(
              (cat) => `- ID: ${cat.id}, Name: ${cat.name}, Posts: ${cat.count}`
            )
            .join("\n")
        : "No categories found.";
      return {
        content: [
          {
            type: "text",
            text: `WordPress Categories:\n\n${categoriesList}`,
          },
        ],
      };
    } catch (error) {
      console.error("Error executing get-wp-categories tool:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error getting WordPress categories: ${
              error.message || "Unknown error"
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);
server.tool("get-wp-tags", "Get available WordPress tags", {}, async () => {
  try {
    const result = await getTags();
    if (!result.success) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to get WordPress tags: ${JSON.stringify(
              result.error
            )}`,
          },
        ],
        isError: true,
      };
    }
    // Format the tags for better readability
    const tagsList = Array.isArray(result.tags)
      ? result.tags
          .map(
            (tag) => `- ID: ${tag.id}, Name: ${tag.name}, Posts: ${tag.count}`
          )
          .join("\n")
      : "No tags found.";
    return {
      content: [
        {
          type: "text",
          text: `WordPress Tags:\n\n${tagsList}`,
        },
      ],
    };
  } catch (error) {
    console.error("Error executing get-wp-tags tool:", error);
    return {
      content: [
        {
          type: "text",
          text: `Error getting WordPress tags: ${
            error.message || "Unknown error"
          }`,
        },
      ],
      isError: true,
    };
  }
});
// Register save-draft tool
server.tool(
  "save-draft",
  "Save a post draft locally",
  {
    postId: z.string().describe("Unique ID for the draft"),
    title: z.string().describe("Post title"),
    content: z.string().describe("Post content"),
  },
  async ({ postId, title, content }) => {
    try {
      await saveDraft(postId, { title, content });
      return {
        content: [{ type: "text", text: `Draft saved (ID: ${postId})` }],
      };
    } catch (error) {
      // Type guard to check if it's an Error object
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return {
        content: [
          { type: "text", text: `Error saving draft: ${errorMessage}` },
        ],
        isError: true,
      };
    }
  }
);
// Register load-draft tool
server.tool(
  "load-draft",
  "Load a saved draft",
  {
    postId: z.string().describe("Draft ID to load"),
  },
  async ({ postId }) => {
    const draft = await loadDraft(postId);
    if (!draft) {
      return {
        content: [{ type: "text", text: `No draft found with ID: ${postId}` }],
        isError: true,
      };
    }
    return {
      content: [
        { type: "text", text: `Draft loaded (ID: ${postId})` },
        { type: "text", text: `Title: ${draft.title}` },
        {
          type: "text",
          text: `Content: ${truncateContent(draft.content, 100)}`,
        },
      ],
    };
  }
);
// Register test wp connection tool
server.tool(
  "test-wp-connection",
  "Test if a WordPress site is reachable",
  {
    siteUrl: z.string().url().describe("WordPress site URL"),
  },
  async ({ siteUrl }) => {
    const isReachable = await testSiteConnection(siteUrl);
    return {
      content: [
        {
          type: "text",
          text: isReachable
            ? `✅ WordPress REST API is reachable at ${siteUrl}`
            : `❌ Could not connect to WordPress at ${siteUrl}`,
        },
      ],
    };
  }
);
// Format content tool
server.tool(
  "format-wp-content",
  "Format raw text into WordPress-ready HTML",
  {
    content: z.string().describe("Raw text content"),
  },
  async ({ content }) => {
    return {
      content: [
        {
          type: "text",
          text: formatPostContent(content),
        },
      ],
    };
  }
);
// Add a basic main function to be expanded later
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
