// src/tools/taxonomyTools.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { 
   getCategories,
   getTags,
   createCategory,
   createTag,
   updateCategory,
   updateTag,
   deleteCategory,
   deleteTag,
   mergeCategories,
   assignCategoriesToPosts,
   assignTagsToPosts,
   listTaxonomies
} from "../wordpress/api.js";

import {
  WPCategory,
  WPTag
} from '../types/interfaces.js';

/**
 * Register all taxonomy-related tools with the MCP server
 */
export function registerTaxonomyTools(server: McpServer) {

  // Get Categories Tool    
  server.tool(
    "get-wp-categories",
    "Get available WordPress categories",
    {},
    async () => {
      try {
        const result = await getCategories();
        
        if (!result.success) {
          return {
            content: [{
              type: "text",
              text: `Failed to get WordPress categories: ${JSON.stringify(result.error)}`
            }],
            isError: true
          };
        }
        const categoriesList = Array.isArray(result.categories)
          ? result.categories.map((cat: WPCategory) => `- ID: ${cat.id}, Name: ${cat.name}, Posts: ${cat.count}`).join('\n')
          : "No categories found.";
        
        return {
          content: [{
            type: "text",
            text: `WordPress Categories:\n\n${categoriesList}`
          }]
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Error executing get-wp-categories tool:", error);
        return {
          content: [{
            type: "text",
            text: `Error getting WordPress categories: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  // Get Tags Tool 
  server.tool(
    "get-wp-tags",
    "Get available WordPress tags",
    {},
    async () => {
      try {
        const result = await getTags();
        
        if (!result.success) {
          return {
            content: [{
              type: "text",
              text: `Failed to get WordPress tags: ${JSON.stringify(result.error)}`
            }],
            isError: true
          };
        }
        const tagsList = Array.isArray(result.tags)
          ? result.tags.map((tag: WPTag) => `- ID: ${tag.id}, Name: ${tag.name}, Posts: ${tag.count}`).join('\n')
          : "No tags found.";
        
        return {
          content: [{
            type: "text",
            text: `WordPress Tags:\n\n${tagsList}`
          }]
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Error executing get-wp-tags tool:", error);
        return {
          content: [{
            type: "text",
            text: `Error getting WordPress tags: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  // Create Category Tool
  server.tool(
    "create-category",
    "Create a new WordPress category",
    {
      name: z.string().describe("Category name"),
      slug: z.string().optional().describe("Category slug (auto-generated if not provided)"),
      description: z.string().optional().describe("Category description"),
      parent: z.number().optional().describe("Parent category ID for hierarchical categories")
    },
    async ({ name, slug, description, parent }) => {
      try {
        // TODO: Implement createCategory in wordpress/api.js
        const result = await createCategory({ name, slug, description, parent });
        
        return {
          content: [{
            type: "text",
            text: "⚠️ create-category tool not yet implemented. Please add createCategory function to wordpress/api.js"
          }],
          isError: true
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Error creating category:", error);
        return {
          content: [{
            type: "text",
            text: `Error creating category: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  // Create Tag Tool
  server.tool(
    "create-tag",
    "Create a new WordPress tag",
    {
      name: z.string().describe("Tag name"),
      slug: z.string().optional().describe("Tag slug (auto-generated if not provided)"),
      description: z.string().optional().describe("Tag description")
    },
    async ({ name, slug, description }) => {
      try {
        // TODO: Implement createTag in wordpress/api.js
         const result = await createTag({ name, slug, description });
        
        return {
          content: [{
            type: "text",
            text: "⚠️ create-tag tool not yet implemented. Please add createTag function to wordpress/api.js"
          }],
          isError: true
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Error creating tag:", error);
        return {
          content: [{
            type: "text",
            text: `Error creating tag: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  // Update/Rename Category Tool
  server.tool(
    "update-category",
    "Update or rename an existing WordPress category",
    {
      categoryId: z.number().describe("ID of the category to update"),
      name: z.string().optional().describe("New category name"),
      slug: z.string().optional().describe("New category slug"),
      description: z.string().optional().describe("New category description"),
      parent: z.number().optional().describe("New parent category ID")
    },
    async ({ categoryId, name, slug, description, parent }) => {
      try {
        // TODO: Implement updateCategory in wordpress/api.js
         const result = await updateCategory(categoryId, { name, slug, description, parent });
        
        return {
          content: [{
            type: "text",
            text: "⚠️ update-category tool not yet implemented. Please add updateCategory function to wordpress/api.js"
          }],
          isError: true
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Error updating category:", error);
        return {
          content: [{
            type: "text",
            text: `Error updating category: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  // Update/Rename Tag Tool
  server.tool(
    "update-tag",
    "Update or rename an existing WordPress tag",
    {
      tagId: z.number().describe("ID of the tag to update"),
      name: z.string().optional().describe("New tag name"),
      slug: z.string().optional().describe("New tag slug"),
      description: z.string().optional().describe("New tag description")
    },
    async ({ tagId, name, slug, description }) => {
      try {
        // TODO: Implement updateTag in wordpress/api.js
        const result = await updateTag(tagId, { name, slug, description });
        
        return {
          content: [{
            type: "text",
            text: "⚠️ update-tag tool not yet implemented. Please add updateTag function to wordpress/api.js"
          }],
          isError: true
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Error updating tag:", error);
        return {
          content: [{
            type: "text",
            text: `Error updating tag: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  // Delete Category Tool
  server.tool(
    "delete-category",
    "Delete a WordPress category",
    {
      categoryId: z.number().describe("ID of the category to delete"),
      force: z.boolean().default(false).describe("Force delete (bypass trash)")
    },
    async ({ categoryId, force }) => {
      try {
        // TODO: Implement deleteCategory in wordpress/api.js
         const result = await deleteCategory(categoryId, force);
        
        return {
          content: [{
            type: "text",
            text: "⚠️ delete-category tool not yet implemented. Please add deleteCategory function to wordpress/api.js"
          }],
          isError: true
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Error deleting category:", error);
        return {
          content: [{
            type: "text",
            text: `Error deleting category: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  // Delete Tag Tool
  server.tool(
    "delete-tag",
    "Delete a WordPress tag",
    {
      tagId: z.number().describe("ID of the tag to delete"),
      force: z.boolean().default(false).describe("Force delete (bypass trash)")
    },
    async ({ tagId, force }) => {
      try {
        // TODO: Implement deleteTag in wordpress/api.js
         const result = await deleteTag(tagId, force);
        
        return {
          content: [{
            type: "text",
            text: "⚠️ delete-tag tool not yet implemented. Please add deleteTag function to wordpress/api.js"
          }],
          isError: true
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Error deleting tag:", error);
        return {
          content: [{
            type: "text",
            text: `Error deleting tag: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  // Merge Categories Tool
  server.tool(
    "merge-categories",
    "Merge two categories by moving all posts from source to target category",
    {
      sourceCategoryId: z.number().describe("ID of the category to merge from"),
      targetCategoryId: z.number().describe("ID of the category to merge into"),
      deleteSource: z.boolean().default(true).describe("Delete source category after merging")
    },
    async ({ sourceCategoryId, targetCategoryId, deleteSource }) => {
      try {
        if (sourceCategoryId === targetCategoryId) {
          return {
            content: [{
              type: "text",
              text: "Source and target categories cannot be the same"
            }],
            isError: true
          };
        }

        // TODO: Implement mergeCategories in wordpress/api.js
        const result = await mergeCategories(sourceCategoryId, targetCategoryId, deleteSource);
        
        return {
          content: [{
            type: "text",
            text: "⚠️ merge-categories tool not yet implemented. Please add mergeCategories function to wordpress/api.js"
          }],
          isError: true
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Error merging categories:", error);
        return {
          content: [{
            type: "text",
            text: `Error merging categories: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  // Assign Categories to Posts Tool
  server.tool(
    "assign-categories-to-posts",
    "Bulk assign categories to multiple posts",
    {
      postIds: z.array(z.number()).describe("Array of post IDs to update"),
      categoryIds: z.array(z.number()).describe("Array of category IDs to assign"),
      replaceExisting: z.boolean().default(false).describe("Replace existing categories or add to them")
    },
    async ({ postIds, categoryIds, replaceExisting }) => {
      try {
        if (postIds.length === 0) {
          return {
            content: [{
              type: "text",
              text: "No post IDs provided"
            }],
            isError: true
          };
        }

        if (categoryIds.length === 0) {
          return {
            content: [{
              type: "text",
              text: "No category IDs provided"
            }],
            isError: true
          };
        }

        // TODO: Implement assignCategoriesToPosts in wordpress/api.js
        const result = await assignCategoriesToPosts(postIds, categoryIds, replaceExisting);
        
        return {
          content: [{
            type: "text",
            text: "⚠️ assign-categories-to-posts tool not yet implemented. Please add assignCategoriesToPosts function to wordpress/api.js"
          }],
          isError: true
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Error assigning categories to posts:", error);
        return {
          content: [{
            type: "text",
            text: `Error assigning categories to posts: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  // Assign Tags to Posts Tool
  server.tool(
    "assign-tags-to-posts",
    "Bulk assign tags to multiple posts",
    {
      postIds: z.array(z.number()).describe("Array of post IDs to update"),
      tagIds: z.array(z.number()).describe("Array of tag IDs to assign"),
      replaceExisting: z.boolean().default(false).describe("Replace existing tags or add to them")
    },
    async ({ postIds, tagIds, replaceExisting }) => {
      try {
        if (postIds.length === 0) {
          return {
            content: [{
              type: "text",
              text: "No post IDs provided"
            }],
            isError: true
          };
        }

        if (tagIds.length === 0) {
          return {
            content: [{
              type: "text",
              text: "No tag IDs provided"
            }],
            isError: true
          };
        }

        // TODO: Implement assignTagsToPosts in wordpress/api.js
        const result = await assignTagsToPosts(postIds, tagIds, replaceExisting);
        
        return {
          content: [{
            type: "text",
            text: "⚠️ assign-tags-to-posts tool not yet implemented. Please add assignTagsToPosts function to wordpress/api.js"
          }],
          isError: true
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Error assigning tags to posts:", error);
        return {
          content: [{
            type: "text",
            text: `Error assigning tags to posts: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );

  // List Taxonomies Tool
  server.tool(
    "list-taxonomies",
    "View all available taxonomies including custom taxonomies",
    {
      type: z.enum(["all", "builtin", "custom"]).default("all").describe("Filter taxonomies by type")
    },
    async ({ type }) => {
      try {
        // TODO: Implement listTaxonomies in wordpress/api.js
        const result = await listTaxonomies(type);
        
        return {
          content: [{
            type: "text",
            text: "⚠️ list-taxonomies tool not yet implemented. Please add listTaxonomies function to wordpress/api.js"
          }],
          isError: true
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error("Error listing taxonomies:", error);
        return {
          content: [{
            type: "text",
            text: `Error listing taxonomies: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  );
}