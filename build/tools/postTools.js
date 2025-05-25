import { z } from "zod";
import { createPost, 
// TODO : Add these imports as I implement the functions
updatePost, deletePost, getPost, listPosts } from "../wordpress/api.js";
import { saveDraft, loadDraft, truncateContent, formatPostContent } from '../utils/helpers.js';
/**
 * Register all post-related tools with the MCP server
 */
export function registerPostTools(server) {
    // Creare Blog Post Tool 
    server.tool("create-blog-post", "Create a blog post in WordPress", {
        title: z.string().describe("The title of the blog post"),
        content: z.string().describe("The HTML content of the blog post"),
        status: z.enum(["draft", "publish", "pending", "future"]).default("draft").describe("Publication status"),
        excerpt: z.string().optional().describe("Optional post excerpt/summary"),
        categories: z.array(z.number()).optional().describe("Array of category IDs"),
        tags: z.array(z.number()).optional().describe("Array of tag IDs")
    }, async ({ title, content, status, excerpt, categories, tags }) => {
        try {
            const result = await createPost(title, content, status || 'draft', excerpt || '', categories || [], tags || []);
            if (!result.success) {
                return {
                    content: [{
                            type: "text",
                            text: `Failed to create blog post: ${JSON.stringify(result.error)}`
                        }],
                    isError: true
                };
            }
            return {
                content: [{
                        type: "text",
                        text: `Blog post created successfully!\n\nTitle: ${result.post?.title}\nStatus: ${result.post?.status}\nLink: ${result.post?.link}\nID: ${result.post?.id}`
                    }]
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error("Error executing create-blog-post tool:", error);
            return {
                content: [{
                        type: "text",
                        text: `Error creating blog post: ${errorMessage}`
                    }],
                isError: true
            };
        }
    });
    // Save Draft Tool 
    server.tool("save-draft", "Save a post draft locally", {
        postId: z.string().describe("Unique ID for the draft"),
        title: z.string().describe("Post title"),
        content: z.string().describe("Post content")
    }, async ({ postId, title, content }) => {
        try {
            await saveDraft(postId, { title, content });
            return {
                content: [{ type: "text", text: `Draft saved (ID: ${postId})` }]
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return {
                content: [{ type: "text", text: `Error saving draft: ${errorMessage}` }],
                isError: true
            };
        }
    });
    // Load Draft Tool 
    server.tool("load-draft", "Load a saved draft", {
        postId: z.string().describe("Draft ID to load")
    }, async ({ postId }) => {
        const draft = await loadDraft(postId);
        if (!draft) {
            return {
                content: [{ type: "text", text: `No draft found with ID: ${postId}` }],
                isError: true
            };
        }
        return {
            content: [
                { type: "text", text: `Draft loaded (ID: ${postId})` },
                { type: "text", text: `Title: ${draft.title}` },
                { type: "text", text: `Content: ${truncateContent(draft.content, 100)}` }
            ]
        };
    });
    // Format Content Tool 
    server.tool("format-wp-content", "Format raw text into WordPress-ready HTML", {
        content: z.string().describe("Raw text content")
    }, async ({ content }) => {
        return {
            content: [{
                    type: "text",
                    text: formatPostContent(content)
                }]
        };
    });
    // ============================================
    // NEW TOOLS (to be implemented)
    // ============================================
    // Update Post Tool 
    server.tool("update-post", "Edit an existing WordPress post", {
        postId: z.number().describe("ID of the post to update"),
        title: z.string().optional().describe("New title (optional)"),
        content: z.string().optional().describe("New content (optional)"),
        status: z.enum(["draft", "publish", "pending", "future", "private"]).optional().describe("New status (optional)"),
        excerpt: z.string().optional().describe("New excerpt (optional)"),
        categories: z.array(z.number()).optional().describe("New category IDs (optional)"),
        tags: z.array(z.number()).optional().describe("New tag IDs (optional)")
    }, async ({ postId, title, content, status, excerpt, categories, tags }) => {
        try {
            // TODO: Implement updatePost in wordpress/api.js
            const result = await updatePost(postId, { title, content, status, excerpt, categories, tags });
            return {
                content: [{
                        type: "text",
                        text: "⚠️ update-post tool not yet implemented. Please add updatePost function to wordpress/api.js"
                    }],
                isError: true
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error("Error updating post:", error);
            return {
                content: [{
                        type: "text",
                        text: `Error updating post: ${errorMessage}`
                    }],
                isError: true
            };
        }
    });
    // Get Post Tool 
    server.tool("get-post", "Retrieve WordPress post details and revisions", {
        postId: z.number().describe("ID of the post to retrieve"),
        includeRevisions: z.boolean().default(false).describe("Include post revision history")
    }, async ({ postId, includeRevisions }) => {
        try {
            // TODO: Implement getPost in wordpress/api.js
            const result = await getPost(postId, includeRevisions);
            return {
                content: [{
                        type: "text",
                        text: "⚠️ get-post tool not yet implemented. Please add getPost function to wordpress/api.js"
                    }],
                isError: true
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                content: [{
                        type: "text",
                        text: `Error retrieving post: ${errorMessage}`
                    }],
                isError: true
            };
        }
    });
    // List Post Tool 
    server.tool("list-posts", "List WordPress posts with pagination and filters", {
        page: z.number().default(1).describe("Page number (default: 1)"),
        perPage: z.number().max(100).default(10).describe("Posts per page (max: 100)"),
        status: z.enum(["publish", "future", "draft", "pending", "private", "trash", "any"]).default("any").describe("Filter by post status"),
        author: z.number().optional().describe("Filter by author ID"),
        categories: z.array(z.number()).optional().describe("Filter by category IDs"),
        tags: z.array(z.number()).optional().describe("Filter by tag IDs"),
        search: z.string().optional().describe("Search query"),
        orderBy: z.enum(["date", "relevance", "id", "include", "title", "slug"]).default("date").describe("Order posts by"),
        order: z.enum(["asc", "desc"]).default("desc").describe("Sort order")
    }, async ({ page, perPage, status, author, categories, tags, search, orderBy, order }) => {
        try {
            // TODO: Implement listPosts in wordpress/api.js
            const result = await listPosts({ page, perPage, status, author, categories, tags, search, orderBy, order });
            return {
                content: [{
                        type: "text",
                        text: "⚠️ list-posts tool not yet implemented. Please add listPosts function to wordpress/api.js"
                    }],
                isError: true
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                content: [{
                        type: "text",
                        text: `Error listing posts: ${errorMessage}`
                    }],
                isError: true
            };
        }
    });
    // Delete Post Tool 
    server.tool("delete-post", "Permanently delete a WordPress post", {
        postId: z.number().describe("ID of the post to delete"),
        force: z.boolean().default(false).describe("Force delete (bypass trash)")
    }, async ({ postId, force }) => {
        try {
            // TODO: Implement deletePost in wordpress/api.js
            const result = await deletePost(postId, force);
            return {
                content: [{
                        type: "text",
                        text: "⚠️ delete-post tool not yet implemented. Please add deletePost function to wordpress/api.js"
                    }],
                isError: true
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                content: [{
                        type: "text",
                        text: `Error deleting post: ${errorMessage}`
                    }],
                isError: true
            };
        }
    });
    // Trash Post Tool 
    server.tool("trash-post", "Move a WordPress post to trash", {
        postId: z.number().describe("ID of the post to trash")
    }, async ({ postId }) => {
        try {
            // This can use the same deletePost function with force=false
            // TODO: Implement deletePost in wordpress/api.js
            // const result = await deletePost(postId, false);
            return {
                content: [{
                        type: "text",
                        text: "⚠️ trash-post tool not yet implemented. Please add deletePost function to wordpress/api.js"
                    }],
                isError: true
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                content: [{
                        type: "text",
                        text: `Error moving post to trash: ${errorMessage}`
                    }],
                isError: true
            };
        }
    });
    // Restore Post Tool 
    server.tool("restore-post", "Restore a WordPress post from trash", {
        postId: z.number().describe("ID of the post to restore")
    }, async ({ postId }) => {
        try {
            // TODO: Implement restorePost in wordpress/api.js
            // const result = await restorePost(postId);
            return {
                content: [{
                        type: "text",
                        text: "⚠️ restore-post tool not yet implemented. Please add restorePost function to wordpress/api.js"
                    }],
                isError: true
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                content: [{
                        type: "text",
                        text: `Error restoring post: ${errorMessage}`
                    }],
                isError: true
            };
        }
    });
    // Schedule Post Tool 
    server.tool("schedule-post", "Schedule a WordPress post for future publication", {
        postId: z.number().describe("ID of the post to schedule"),
        publishDate: z.string().describe("Publication date/time in ISO format (e.g., '2024-12-25T10:00:00')")
    }, async ({ postId, publishDate }) => {
        try {
            // Validate date format
            const scheduledDate = new Date(publishDate);
            if (isNaN(scheduledDate.getTime())) {
                return {
                    content: [{
                            type: "text",
                            text: "Invalid date format. Please use ISO format like '2024-12-25T10:00:00'"
                        }],
                    isError: true
                };
            }
            if (scheduledDate <= new Date()) {
                return {
                    content: [{
                            type: "text",
                            text: "Scheduled date must be in the future"
                        }],
                    isError: true
                };
            }
            // TODO: Implement schedulePost in wordpress/api.js
            // const result = await schedulePost(postId, publishDate);
            return {
                content: [{
                        type: "text",
                        text: "⚠️ schedule-post tool not yet implemented. Please add schedulePost function to wordpress/api.js"
                    }],
                isError: true
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                content: [{
                        type: "text",
                        text: `Error scheduling post: ${errorMessage}`
                    }],
                isError: true
            };
        }
    });
    // Clone Post Tool 
    server.tool("clone-post", "Duplicate an existing WordPress post", {
        postId: z.number().describe("ID of the post to clone"),
        newTitle: z.string().optional().describe("Title for the cloned post (defaults to 'Copy of [original title]')"),
        status: z.enum(["draft", "publish", "pending"]).default("draft").describe("Status for the cloned post")
    }, async ({ postId, newTitle, status }) => {
        try {
            // TODO: Implement clonePost in wordpress/api.js
            // const result = await clonePost(postId, newTitle, status);
            return {
                content: [{
                        type: "text",
                        text: "⚠️ clone-post tool not yet implemented. Please add clonePost function to wordpress/api.js"
                    }],
                isError: true
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                content: [{
                        type: "text",
                        text: `Error cloning post: ${errorMessage}`
                    }],
                isError: true
            };
        }
    });
    // Bulk Update Posts Tool 
    server.tool("bulk-update-posts", "Batch edit multiple WordPress posts", {
        postIds: z.array(z.number()).describe("Array of post IDs to update"),
        updates: z.object({
            status: z.enum(["draft", "publish", "pending", "private"]).optional(),
            categories: z.array(z.number()).optional().describe("Category IDs to assign"),
            tags: z.array(z.number()).optional().describe("Tag IDs to assign"),
            author: z.number().optional().describe("New author ID")
        }).describe("Updates to apply to all selected posts")
    }, async ({ postIds, updates }) => {
        try {
            if (postIds.length === 0) {
                return {
                    content: [{
                            type: "text",
                            text: "No post IDs provided for bulk update"
                        }],
                    isError: true
                };
            }
            // TODO: Implement bulkUpdatePosts in wordpress/api.js
            //const result = await bulkUpdatePosts(postIds, updates);
            return {
                content: [{
                        type: "text",
                        text: "⚠️ bulk-update-posts tool not yet implemented. Please add bulkUpdatePosts function to wordpress/api.js"
                    }],
                isError: true
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                content: [{
                        type: "text",
                        text: `Error bulk updating posts: ${errorMessage}`
                    }],
                isError: true
            };
        }
    });
}
