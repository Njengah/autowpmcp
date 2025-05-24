// Helper functions for the AutoWP MCP server
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

const DRAFTS_FILE = path.join(process.cwd(), 'drafts.json')
/**
 * Validates WordPress blog post content
 * @param content The HTML content of the blog post
 * @returns Object with validation status and error message if any
 */
export function validatePostContent(content: string): { valid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Content cannot be empty' };
  }
  
  // Check for minimum content length
  if (content.trim().length < 50) {
    return { valid: false, error: 'Content too short (minimum 50 characters)' };
  }
  
  return { valid: true };
}

/**
 * Formats WordPress post content with appropriate HTML
 * @param content Raw content text
 * @returns Formatted HTML content with proper paragraph tags
 */
export function formatPostContent(content: string): string {
  if (content.includes('<p>') || content.includes('<h1>') || content.includes('<div>')) {
    return content;
  }
  
  return content
    .split('\n\n')
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph.length > 0)
    .map(paragraph => `<p>${paragraph}</p>`)
    .join('\n');
}

/**
 * Creates a schema for blog post content validation
 * @returns Zod schema for blog post content validation
 */
export function createBlogPostSchema() {
  return z.object({
    title: z.string()
      .min(5, { message: "Title must be at least 5 characters long" })
      .max(100, { message: "Title should not exceed 100 characters" }),
    content: z.string()
      .min(50, { message: "Content must be at least 50 characters long" }),
    status: z.enum(["draft", "publish", "pending", "future"])
      .default("draft"),
    excerpt: z.string().optional(),
    categories: z.array(z.number()).optional(),
    tags: z.array(z.number()).optional()
  });
}

/**
 * Truncates post content for summary or preview
 * @param content The full HTML content
 * @param maxLength Maximum number of characters (defaults to 150)
 * @returns Truncated content with ellipsis
 */
export function truncateContent(content: string, maxLength: number = 150): string {

  const plainText = content.replace(/<[^>]*>?/gm, '');
  
  if (plainText.length <= maxLength) {
    return plainText;
  }
  return plainText.substring(0, maxLength).trim() + '...';
}

/**
 * Extracts embedded media links from post content
 * @param content HTML content to process
 * @returns Array of media URLs found in the content
 */
export function extractMediaLinks(content: string): string[] {
  const mediaLinks: string[] = [];
  
  const imgRegex = /<img[^>]+src="([^">]+)"/g;
  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    mediaLinks.push(match[1]);
  }
  
  const videoRegex = /<video[^>]+src="([^">]+)"/g;
  while ((match = videoRegex.exec(content)) !== null) {
    mediaLinks.push(match[1]);
  }
  
  return mediaLinks;
}

// Save draft to local JSON file
export async function saveDraft(postId: string, draft: { title: string; content: string }) {
  let drafts = await loadAllDrafts();
  drafts[postId] = draft;
  await fs.writeFile(DRAFTS_FILE, JSON.stringify(drafts, null, 2));
}

// Load all drafts
export async function loadAllDrafts(): Promise<Record<string, { title: string; content: string }>> {
  try {
    const data = await fs.readFile(DRAFTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {}; 
  }
}

// Load single draft
export async function loadDraft(postId: string) {
  const drafts = await loadAllDrafts();
  return drafts[postId] || null;
}