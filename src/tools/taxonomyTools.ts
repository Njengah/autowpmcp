// ============================================
// TAXONOMY TOOLS 
// ============================================

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { 
  getCategories,
  getTags
} from "../wordpress/api.js";


interface WPCategory {
  id: number;
  name: string;
  count: number;
  slug?: string;
}

interface WPTag {
  id: number;
  name: string;
  count: number;
  slug?: string;
}


export function registerPostTools(server: McpServer) {

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

// Create Category 

// Add Tag  

//  Edit / Update Category 

// Delete Category 

// Delete Tag 

}