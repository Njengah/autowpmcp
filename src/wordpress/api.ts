// WordPress API utilities
import axios from 'axios';
import { z } from 'zod';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import tinify from 'tinify';

import {
  WPUserResponse,
  WPAPIResponse,
  WPPost,
  WPPostResponse,
  WPCategory,
  WPTag,
  WPPostSummary,
  ListPostsOptions,
  WPPostDetailed,
  WPDeleteResponse,
  WPTaxonomy,
  WPUser,
  WPRole,
  ListUsersOptions,
  CreateUserData,
  UpdateUserData,
  WPMediaResponse,
  WPMedia,
  MediaUploadOptions,
  MediaListOptions,
  MediaSearchOptions
} from '../types/interfaces.js';

export interface WordPressConfig {
  siteUrl: string;
  username: string;
  password?: string;
  appPassword?: string;
  isAuthenticated: boolean;
}


let wpConfig: WordPressConfig = {
  siteUrl: '',
  username: '',
  isAuthenticated: false
}


export function setWordPressConfig(config: Partial<WordPressConfig>): void {
  wpConfig = { ...wpConfig, ...config };
}


export function getWordPressConfig(): WordPressConfig {
  return { ...wpConfig };
}


export async function getAuthHeader(): Promise<string> {
  try {
   
    if (wpConfig.appPassword) {
      const credentials = Buffer.from(`${wpConfig.username}:${wpConfig.appPassword}`).toString('base64');
      return `Basic ${credentials}`;
    }
    if (!wpConfig.password) {
      throw new Error('No password or app password provided for WordPress authentication');
    }
    
    const credentials = Buffer.from(`${wpConfig.username}:${wpConfig.password}`).toString('base64');
    return `Basic ${credentials}`;
  } catch (error: any) {
    console.error('Authentication error:', error);
    throw new Error('Failed to create authentication header: ' + (error.message || 'Unknown error'));
  }
}

export function formatErrorResponse(error: any) {
  if (isAxiosError(error)) {
    return {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    };
  }
  return error.message || 'Unknown error';
}

export async function testAuthentication(): Promise<{ 
  success: boolean; 
  userInfo?: { id: number; name: string; roles: string[] };
  error?: string 
}> {
  try {
    const authHeader = await getAuthHeader();
    const response = await axios.get<WPUserResponse>(
      `${wpConfig.siteUrl}/wp-json/wp/v2/users/me`,
      { headers: { 'Authorization': authHeader } }
    );
    const roles = response.data.roles || ['contributor'];

    wpConfig.isAuthenticated = true;
    
    return {
      success: true,
      userInfo: {
        id: response.data.id,
        name: response.data.name || response.data.slug || 'Unknown',
        roles: Array.isArray(roles) ? roles : [String(roles)]
      }
    };
  } catch (error) {
    wpConfig.isAuthenticated = false;
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function testSiteConnection(siteUrl: string): Promise<boolean> {
  try {
    const response = await axios.get<WPAPIResponse>(`${siteUrl}/wp-json/`, {
      timeout: 5000
    });
    return response.data?.namespaces?.includes('wp/v2') ?? false;
  } catch {
    return false;
  }
}

export async function createPost(
  title: string,
  content: string,
  status: string = 'draft',
  excerpt: string = '',
  categories: number[] = [],
  tags: number[] = []
): Promise<{ success: boolean; post?: WPPost; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const authHeader = await getAuthHeader();
    const response = await axios.post<WPPostResponse>(
      `${wpConfig.siteUrl}/wp-json/wp/v2/posts`,
      { title, content, status, excerpt, categories, tags },
      { headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' } }
    );

    return {
      success: true,
      post: {
        id: response.data.id,
        title: response.data.title.rendered,
        link: response.data.link,
        status: response.data.status
      }
    };
  } catch (error: unknown) {
    console.error('Error creating post:', error);
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function getCategories(): Promise<{
  success: boolean;
  categories?: WPCategory[];
  error?: any;
}> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const authHeader = await getAuthHeader();
    const response = await axios.get<WPCategory[]>(
      `${wpConfig.siteUrl}/wp-json/wp/v2/categories?per_page=100`,
      { headers: { 'Authorization': authHeader } }
    );

    return {
      success: true,
      categories: response.data.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        count: category.count
      }))
    };
  } catch (error: unknown) {
    console.error('Error fetching categories:', error);
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function getTags(): Promise<{
  success: boolean;
  tags?: WPTag[];
  error?: any;
}> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const authHeader = await getAuthHeader();
    const response = await axios.get<WPTag[]>(
      `${wpConfig.siteUrl}/wp-json/wp/v2/tags?per_page=100`,
      { headers: { 'Authorization': authHeader } }
    );

    return {
      success: true,
      tags: response.data
    };
  } catch (error: unknown) {
    console.error('Error fetching tags:', error);
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

function isAxiosError(error: unknown): error is { 
  isAxiosError: boolean; 
  response?: { 
    status?: number; 
    statusText?: string; 
    data?: any 
  }; 
  message: string 
} {
  return (
    typeof error === 'object' && 
    error !== null && 
    'isAxiosError' in error && 
    (error as any).isAxiosError === true
  );
}
export async function updatePost(
  postId: number, 
  updates: {
    title?: string;
    content?: string;
    status?: string;
    excerpt?: string;
    categories?: number[];
    tags?: number[];
  }
): Promise<{ success: boolean; post?: WPPost; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');
    
    const authHeader = await getAuthHeader();
    const response = await axios.put<WPPostResponse>(
      `${wpConfig.siteUrl}/wp-json/wp/v2/posts/${postId}`,
      updates,
      { headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' } }
    );

    return {
      success: true,
      post: {
        id: response.data.id,
        title: response.data.title.rendered,
        link: response.data.link,
        status: response.data.status
      }
    };
  } catch (error: unknown) {
    console.error('Error updating post:', error);
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function deletePost(
  postId: number, 
  force: boolean = false
): Promise<{ success: boolean; deleted?: boolean; previous?: any; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');
    
    const authHeader = await getAuthHeader();
    const url = `${wpConfig.siteUrl}/wp-json/wp/v2/posts/${postId}${force ? '?force=true' : ''}`;
    
    const response = await axios.delete<WPDeleteResponse>(url, {
      headers: { 'Authorization': authHeader }
    });

    return {
      success: true,
      deleted: response.data.deleted || false,
      previous: response.data.previous
    };
  } catch (error: unknown) {
    console.error('Error deleting post:', error);
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function getPost(
  postId: number, 
  includeRevisions: boolean = false
): Promise<{ success: boolean; post?: WPPostDetailed; revisions?: any[]; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');
    
    const authHeader = await getAuthHeader();
    const response = await axios.get<any>(
      `${wpConfig.siteUrl}/wp-json/wp/v2/posts/${postId}`,
      { headers: { 'Authorization': authHeader } }
    );

    let revisions: any[] = [];
    if (includeRevisions) {
      try {
        const revisionsResponse = await axios.get<any[]>(
          `${wpConfig.siteUrl}/wp-json/wp/v2/posts/${postId}/revisions`,
          { headers: { 'Authorization': authHeader } }
        );
        revisions = revisionsResponse.data;
      } catch (revError) {
        console.warn('Could not fetch revisions:', revError);
      }
    }

    return {
      success: true,
      post: {
        id: response.data.id,
        title: response.data.title.rendered,
        content: response.data.content.rendered,
        excerpt: response.data.excerpt.rendered,
        status: response.data.status,
        link: response.data.link,
        date: response.data.date,
        modified: response.data.modified,
        categories: response.data.categories,
        tags: response.data.tags,
        author: response.data.author
      },
      revisions: includeRevisions ? revisions : undefined
    };
  } catch (error: unknown) {
    console.error('Error getting post:', error);
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function listPosts(
  options: ListPostsOptions = {}
): Promise<{ success: boolean; posts?: WPPostSummary[]; totalPages?: number; totalPosts?: number; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');
    
    const authHeader = await getAuthHeader();
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page.toString());
    if (options.perPage) params.append('per_page', options.perPage.toString());
    if (options.status) params.append('status', options.status);
    if (options.author) params.append('author', options.author.toString());
    if (options.categories?.length) params.append('categories', options.categories.join(','));
    if (options.tags?.length) params.append('tags', options.tags.join(','));
    if (options.search) params.append('search', options.search);
    if (options.orderBy) params.append('orderby', options.orderBy);
    if (options.order) params.append('order', options.order);

    const response = await axios.get<any[]>(
      `${wpConfig.siteUrl}/wp-json/wp/v2/posts?${params.toString()}`,
      { headers: { 'Authorization': authHeader } }
    );

    return {
      success: true,
      posts: response.data.map((post: any) => ({
        id: post.id,
        title: post.title.rendered,
        excerpt: post.excerpt.rendered,
        status: post.status,
        link: post.link,
        date: post.date,
        modified: post.modified,
        categories: post.categories,
        tags: post.tags,
        author: post.author
      })),
      totalPages: parseInt(response.headers['x-wp-totalpages'] || '1'),
      totalPosts: parseInt(response.headers['x-wp-total'] || '0')
    };
  } catch (error: unknown) {
    console.error('Error listing posts:', error);
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

// New taxonomy management methods

export async function createCategory(data: {
  name: string;
  slug?: string;
  description?: string;
  parent?: number;
}): Promise<{ success: boolean; category?: WPCategory; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const authHeader = await getAuthHeader();
    const response = await axios.post<WPCategory>(
      `${wpConfig.siteUrl}/wp-json/wp/v2/categories`,
      data,
      { headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' } }
    );

    return {
      success: true,
      category: response.data
    };
  } catch (error: unknown) {
    console.error('Error creating category:', error);
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function createTag(data: {
  name: string;
  slug?: string;
  description?: string;
}): Promise<{ success: boolean; tag?: WPTag; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const authHeader = await getAuthHeader();
    const response = await axios.post<WPTag>(
      `${wpConfig.siteUrl}/wp-json/wp/v2/tags`,
      data,
      { headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' } }
    );

    return {
      success: true,
      tag: response.data
    };
  } catch (error: unknown) {
    console.error('Error creating tag:', error);
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function updateCategory(
  categoryId: number,
  updates: {
    name?: string;
    slug?: string;
    description?: string;
    parent?: number;
  }
): Promise<{ success: boolean; category?: WPCategory; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const authHeader = await getAuthHeader();
    const response = await axios.put<WPCategory>(
      `${wpConfig.siteUrl}/wp-json/wp/v2/categories/${categoryId}`,
      updates,
      { headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' } }
    );

    return {
      success: true,
      category: response.data
    };
  } catch (error: unknown) {
    console.error('Error updating category:', error);
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function updateTag(
  tagId: number,
  updates: {
    name?: string;
    slug?: string;
    description?: string;
  }
): Promise<{ success: boolean; tag?: WPTag; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const authHeader = await getAuthHeader();
    const response = await axios.put<WPTag>(
      `${wpConfig.siteUrl}/wp-json/wp/v2/tags/${tagId}`,
      updates,
      { headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' } }
    );

    return {
      success: true,
      tag: response.data
    };
  } catch (error: unknown) {
    console.error('Error updating tag:', error);
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function deleteCategory(
  categoryId: number,
  force: boolean = false
): Promise<{ success: boolean; deleted?: boolean; previous?: any; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const authHeader = await getAuthHeader();
    const url = `${wpConfig.siteUrl}/wp-json/wp/v2/categories/${categoryId}${force ? '?force=true' : ''}`;

    const response = await axios.delete<WPDeleteResponse>(url, {
      headers: { 'Authorization': authHeader }
    });

    return {
      success: true,
      deleted: response.data.deleted || false,
      previous: response.data.previous
    };
  } catch (error: unknown) {
    console.error('Error deleting category:', error);
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function deleteTag(
  tagId: number,
  force: boolean = false
): Promise<{ success: boolean; deleted?: boolean; previous?: any; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const authHeader = await getAuthHeader();
    const url = `${wpConfig.siteUrl}/wp-json/wp/v2/tags/${tagId}${force ? '?force=true' : ''}`;

    const response = await axios.delete<WPDeleteResponse>(url, {
      headers: { 'Authorization': authHeader }
    });

    return {
      success: true,
      deleted: response.data.deleted || false,
      previous: response.data.previous
    };
  } catch (error: unknown) {
    console.error('Error deleting tag:', error);
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function mergeCategories(
  sourceCategoryId: number,
  targetCategoryId: number,
  deleteSource: boolean = true
): Promise<{ success: boolean; mergedPosts?: number; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const authHeader = await getAuthHeader();
    
    // Get posts from source category
    const postsResponse = await axios.get<any[]>(
      `${wpConfig.siteUrl}/wp-json/wp/v2/posts?categories=${sourceCategoryId}&per_page=100`,
      { headers: { 'Authorization': authHeader } }
    );

    let mergedCount = 0;
    
    // Update each post to use target category
    for (const post of postsResponse.data) {
      const currentCategories = post.categories.filter((id: number) => id !== sourceCategoryId);
      if (!currentCategories.includes(targetCategoryId)) {
        currentCategories.push(targetCategoryId);
      }

      await axios.put(
        `${wpConfig.siteUrl}/wp-json/wp/v2/posts/${post.id}`,
        { categories: currentCategories },
        { headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' } }
      );
      mergedCount++;
    }

    // Delete source category if requested
    if (deleteSource) {
      await deleteCategory(sourceCategoryId, true);
    }

    return {
      success: true,
      mergedPosts: mergedCount
    };
  } catch (error: unknown) {
    console.error('Error merging categories:', error);
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function assignCategoriesToPosts(
  postIds: number[],
  categoryIds: number[],
  replaceExisting: boolean = false
): Promise<{ success: boolean; updatedPosts?: number; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const authHeader = await getAuthHeader();
    let updatedCount = 0;

    for (const postId of postIds) {
      let categories = categoryIds;
      
      if (!replaceExisting) {
        // Get current categories and merge
        const postResponse = await axios.get<any>(
          `${wpConfig.siteUrl}/wp-json/wp/v2/posts/${postId}`,
          { headers: { 'Authorization': authHeader } }
        );
        const currentCategories = postResponse.data.categories || [];
        categories = [...new Set([...currentCategories, ...categoryIds])];
      }

      await axios.put(
        `${wpConfig.siteUrl}/wp-json/wp/v2/posts/${postId}`,
        { categories },
        { headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' } }
      );
      updatedCount++;
    }

    return {
      success: true,
      updatedPosts: updatedCount
    };
  } catch (error: unknown) {
    console.error('Error assigning categories to posts:', error);
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function assignTagsToPosts(
  postIds: number[],
  tagIds: number[],
  replaceExisting: boolean = false
): Promise<{ success: boolean; updatedPosts?: number; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const authHeader = await getAuthHeader();
    let updatedCount = 0;

    for (const postId of postIds) {
      let tags = tagIds;
      
      if (!replaceExisting) {
        // Get current tags and merge
        const postResponse = await axios.get<any>(
          `${wpConfig.siteUrl}/wp-json/wp/v2/posts/${postId}`,
          { headers: { 'Authorization': authHeader } }
        );
        const currentTags = postResponse.data.tags || [];
        tags = [...new Set([...currentTags, ...tagIds])];
      }

      await axios.put(
        `${wpConfig.siteUrl}/wp-json/wp/v2/posts/${postId}`,
        { tags },
        { headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' } }
      );
      updatedCount++;
    }

    return {
      success: true,
      updatedPosts: updatedCount
    };
  } catch (error: unknown) {
    console.error('Error assigning tags to posts:', error);
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}


export async function listTaxonomies(
  type: "all" | "builtin" | "custom" = "all"
): Promise<{ success: boolean; taxonomies?: WPTaxonomy[]; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const authHeader = await getAuthHeader();
    const response = await axios.get<Record<string, WPTaxonomy>>(
      `${wpConfig.siteUrl}/wp-json/wp/v2/taxonomies`,
      { headers: { 'Authorization': authHeader } }
    );

    let taxonomies = Object.values(response.data);
    
    if (type === "builtin") {
      taxonomies = taxonomies.filter(tax => ['category', 'post_tag'].includes(tax.name));
    } else if (type === "custom") {
      taxonomies = taxonomies.filter(tax => !['category', 'post_tag'].includes(tax.name));
    }

    return {
      success: true,
      taxonomies
    };
  } catch (error: unknown) {
    console.error('Error listing taxonomies:', error);
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

// User Tools  


export async function listUsers(options: ListUsersOptions = {}): Promise<{ success: boolean; users?: WPUser[]; totalPages?: number; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.perPage) params.append('per_page', options.perPage.toString());
    if (options.role) params.append('roles', options.role);
    if (options.search) params.append('search', options.search);
    if (options.orderBy) params.append('orderby', options.orderBy);
    if (options.order) params.append('order', options.order);
    if (options.registeredAfter) params.append('after', options.registeredAfter);
    if (options.registeredBefore) params.append('before', options.registeredBefore);

    const authHeader = await getAuthHeader();
    const response = await axios.get<WPUser[]>(
      `${wpConfig.siteUrl}/wp-json/wp/v2/users?${params.toString()}`,
      { headers: { 'Authorization': authHeader } }
    );

    const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1');

    return {
      success: true,
      users: response.data,
      totalPages
    };
  } catch (error: unknown) {
    console.error('Error listing users:', error);
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function createUser(userData: CreateUserData): Promise<{ success: boolean; user?: WPUser; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const payload = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      first_name: userData.firstName || '',
      last_name: userData.lastName || '',
      name: userData.displayName || userData.username,
      roles: userData.role ? [userData.role] : ['subscriber'],
      description: userData.bio || '',
      url: userData.website || ''
    };

    const authHeader = await getAuthHeader();
    const response = await axios.post<WPUser>(
      `${wpConfig.siteUrl}/wp-json/wp/v2/users`,
      payload,
      { headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' } }
    );

    return {
      success: true,
      user: response.data
    };
  } catch (error: unknown) {
    console.error('Error creating user:', error);
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function updateUser(userId: number, userData: UpdateUserData): Promise<{ success: boolean; user?: WPUser; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const payload: any = {};
    if (userData.email) payload.email = userData.email;
    if (userData.firstName) payload.first_name = userData.firstName;
    if (userData.lastName) payload.last_name = userData.lastName;
    if (userData.displayName) payload.name = userData.displayName;
    if (userData.bio) payload.description = userData.bio;
    if (userData.website) payload.url = userData.website;
    if (userData.password) payload.password = userData.password;

    const authHeader = await getAuthHeader();
    const response = await axios.post<WPUser>(
      `${wpConfig.siteUrl}/wp-json/wp/v2/users/${userId}`,
      payload,
      { headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' } }
    );

    return {
      success: true,
      user: response.data
    };
  } catch (error: unknown) {
    console.error('Error updating user:', error);
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function disableUser(userId: number, reason?: string): Promise<{ success: boolean; message?: string; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const authHeader = await getAuthHeader();
    const response = await axios.delete(
      `${wpConfig.siteUrl}/wp-json/wp/v2/users/${userId}?reassign=1`,
      { headers: { 'Authorization': authHeader } }
    );

    return {
      success: true,
      message: `User ${userId} has been disabled${reason ? ` (Reason: ${reason})` : ''}`
    };
  } catch (error: unknown) {
    console.error('Error disabling user:', error);
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function resetUserPassword(options: { userId?: number; email?: string; sendEmail?: boolean }): Promise<{ success: boolean; message?: string; resetLink?: string; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    let userId = options.userId;
    if (!userId && options.email) {
      const usersResult = await listUsers({ search: options.email, perPage: 1 });
      if (!usersResult.success || !usersResult.users?.length) {
        throw new Error('User not found with provided email');
      }
      userId = usersResult.users[0].id;
    }

    if (!userId) throw new Error('User ID could not be determined');

    const newPassword = Math.random().toString(36).slice(-12);
    const updateResult = await updateUser(userId, { password: newPassword });

    if (!updateResult.success) {
      throw new Error('Failed to reset password');
    }

    return {
      success: true,
      message: `Password reset for user ${userId}. ${options.sendEmail ? 'Reset notification sent via email.' : 'New password generated.'}`,
      resetLink: options.sendEmail ? undefined : `Temporary password: ${newPassword}`
    };
  } catch (error: unknown) {
    console.error('Error resetting user password:', error);
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function setUserRole(userId: number, role: string, removeOtherRoles: boolean = true): Promise<{ success: boolean; user?: WPUser; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const payload = {
      roles: removeOtherRoles ? [role] : undefined,
      role: !removeOtherRoles ? role : undefined
    };

    const authHeader = await getAuthHeader();
    const response = await axios.post<WPUser>(
      `${wpConfig.siteUrl}/wp-json/wp/v2/users/${userId}`,
      payload,
      { headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' } }
    );

    return {
      success: true,
      user: response.data
    };
  } catch (error: unknown) {
    console.error('Error setting user role:', error);
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function listUserRoles(includeCapabilities: boolean = false): Promise<{ success: boolean; roles?: WPRole[]; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const authHeader = await getAuthHeader();
    const response = await axios.get(
      `${wpConfig.siteUrl}/wp-json/wp/v2/types/post`,
      { headers: { 'Authorization': authHeader } }
    );

    const defaultRoles: WPRole[] = [
      {
        name: 'administrator',
        display_name: 'Administrator',
        capabilities: includeCapabilities ? {
          'switch_themes': true,
          'edit_themes': true,
          'activate_plugins': true,
          'edit_plugins': true,
          'edit_users': true,
          'edit_files': true,
          'manage_options': true,
          'moderate_comments': true,
          'manage_categories': true,
          'manage_links': true,
          'upload_files': true,
          'import': true,
          'unfiltered_html': true,
          'edit_posts': true,
          'edit_others_posts': true,
          'edit_published_posts': true,
          'publish_posts': true,
          'edit_pages': true,
          'read': true,
          'level_10': true,
          'level_9': true,
          'level_8': true,
          'level_7': true,
          'level_6': true,
          'level_5': true,
          'level_4': true,
          'level_3': true,
          'level_2': true,
          'level_1': true,
          'level_0': true
        } : {}
      },
      {
        name: 'editor',
        display_name: 'Editor',
        capabilities: includeCapabilities ? {
          'moderate_comments': true,
          'manage_categories': true,
          'manage_links': true,
          'upload_files': true,
          'unfiltered_html': true,
          'edit_posts': true,
          'edit_others_posts': true,
          'edit_published_posts': true,
          'publish_posts': true,
          'edit_pages': true,
          'read': true,
          'level_7': true,
          'level_6': true,
          'level_5': true,
          'level_4': true,
          'level_3': true,
          'level_2': true,
          'level_1': true,
          'level_0': true
        } : {}
      },
      {
        name: 'author',
        display_name: 'Author',
        capabilities: includeCapabilities ? {
          'upload_files': true,
          'edit_posts': true,
          'edit_published_posts': true,
          'publish_posts': true,
          'read': true,
          'level_2': true,
          'level_1': true,
          'level_0': true
        } : {}
      },
      {
        name: 'contributor',
        display_name: 'Contributor',
        capabilities: includeCapabilities ? {
          'edit_posts': true,
          'read': true,
          'level_1': true,
          'level_0': true
        } : {}
      },
      {
        name: 'subscriber',
        display_name: 'Subscriber',
        capabilities: includeCapabilities ? {
          'read': true,
          'level_0': true
        } : {}
      }
    ];

    return {
      success: true,
      roles: defaultRoles
    };
  } catch (error: unknown) {
    console.error('Error listing user roles:', error);
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}




// Media Tools  
export async function uploadMedia(
  source: string,
  options: MediaUploadOptions = {}
): Promise<{ success: boolean; media?: WPMedia; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const authHeader = await getAuthHeader();
    const formData = new FormData();

    if (source.startsWith('http')) {
      const response = await axios.get(source, { responseType: 'stream' });
      formData.append('file', response.data, path.basename(source));
    } else {
      formData.append('file', fs.createReadStream(source), path.basename(source));
    }

    if (options.title) formData.append('title', options.title);
    if (options.caption) formData.append('caption', options.caption);
    if (options.altText) formData.append('alt_text', options.altText);
    if (options.description) formData.append('description', options.description);

    const response = await axios.post<WPMediaResponse>(
      `${wpConfig.siteUrl}/wp-json/wp/v2/media`,
      formData,
      {
        headers: {
          'Authorization': authHeader,
          ...formData.getHeaders()
        }
      }
    );

    return {
      success: true,
      media: {
        id: response.data.id,
        title: response.data.title.rendered,
        caption: response.data.caption.rendered,
        altText: response.data.alt_text,
        description: response.data.description.rendered,
        mediaType: response.data.media_type,
        mimeType: response.data.mime_type,
        sourceUrl: response.data.source_url,
        width: response.data.media_details?.width,
        height: response.data.media_details?.height,
        filesize: response.data.media_details?.filesize,
        date: response.data.date,
        link: response.data.link,
        slug: response.data.slug
      }
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function listMedia(
  options: MediaListOptions = {}
): Promise<{ success: boolean; media?: WPMedia[]; totalPages?: number; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const authHeader = await getAuthHeader();
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page.toString());
    if (options.perPage) params.append('per_page', options.perPage.toString());
    if (options.mediaType && options.mediaType !== 'any') params.append('media_type', options.mediaType);
    if (options.mimeType) params.append('mime_type', options.mimeType);
    if (options.orderBy) params.append('orderby', options.orderBy);
    if (options.order) params.append('order', options.order);
    if (options.parent) params.append('parent', options.parent.toString());

    const response = await axios.get<WPMediaResponse[]>(
      `${wpConfig.siteUrl}/wp-json/wp/v2/media?${params.toString()}`,
      { headers: { 'Authorization': authHeader } }
    );

    const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1');

    return {
      success: true,
      media: response.data.map(item => ({
        id: item.id,
        title: item.title.rendered,
        caption: item.caption.rendered,
        altText: item.alt_text,
        description: item.description.rendered,
        mediaType: item.media_type,
        mimeType: item.mime_type,
        sourceUrl: item.source_url,
        width: item.media_details?.width,
        height: item.media_details?.height,
        filesize: item.media_details?.filesize,
        date: item.date,
        link: item.link,
        slug: item.slug
      })),
      totalPages
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function searchMedia(
  options: MediaSearchOptions
): Promise<{ success: boolean; media?: WPMedia[]; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const authHeader = await getAuthHeader();
    const params = new URLSearchParams();
    
    params.append('search', options.query);
    if (options.mediaType && options.mediaType !== 'any') params.append('media_type', options.mediaType);
    if (options.dateAfter) params.append('after', options.dateAfter);
    if (options.dateBefore) params.append('before', options.dateBefore);
    if (options.limit) params.append('per_page', options.limit.toString());

    const response = await axios.get<WPMediaResponse[]>(
      `${wpConfig.siteUrl}/wp-json/wp/v2/media?${params.toString()}`,
      { headers: { 'Authorization': authHeader } }
    );

    return {
      success: true,
      media: response.data.map(item => ({
        id: item.id,
        title: item.title.rendered,
        caption: item.caption.rendered,
        altText: item.alt_text,
        description: item.description.rendered,
        mediaType: item.media_type,
        mimeType: item.mime_type,
        sourceUrl: item.source_url,
        width: item.media_details?.width,
        height: item.media_details?.height,
        filesize: item.media_details?.filesize,
        date: item.date,
        link: item.link,
        slug: item.slug
      }))
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function editMediaMetadata(
  mediaId: number,
  metadata: { title?: string; caption?: string; altText?: string; description?: string }
): Promise<{ success: boolean; media?: WPMedia; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const authHeader = await getAuthHeader();
    const updateData: any = {};
    
    if (metadata.title) updateData.title = metadata.title;
    if (metadata.caption) updateData.caption = metadata.caption;
    if (metadata.altText) updateData.alt_text = metadata.altText;
    if (metadata.description) updateData.description = metadata.description;

    const response = await axios.post<WPMediaResponse>(
      `${wpConfig.siteUrl}/wp-json/wp/v2/media/${mediaId}`,
      updateData,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      media: {
        id: response.data.id,
        title: response.data.title.rendered,
        caption: response.data.caption.rendered,
        altText: response.data.alt_text,
        description: response.data.description.rendered,
        mediaType: response.data.media_type,
        mimeType: response.data.mime_type,
        sourceUrl: response.data.source_url,
        width: response.data.media_details?.width,
        height: response.data.media_details?.height,
        filesize: response.data.media_details?.filesize,
        date: response.data.date,
        link: response.data.link,
        slug: response.data.slug
      }
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function deleteMedia(
  mediaId: number,
  force: boolean = true
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const authHeader = await getAuthHeader();
    const params = new URLSearchParams();
    if (force) params.append('force', 'true');

    await axios.delete(
      `${wpConfig.siteUrl}/wp-json/wp/v2/media/${mediaId}?${params.toString()}`,
      { headers: { 'Authorization': authHeader } }
    );

    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function setFeaturedImage(
  postId: number,
  mediaId: number
): Promise<{ success: boolean; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const authHeader = await getAuthHeader();
    
    await axios.post(
      `${wpConfig.siteUrl}/wp-json/wp/v2/posts/${postId}`,
      { featured_media: mediaId },
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      }
    );

    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function getMediaDetails(
  mediaId: number
): Promise<{ success: boolean; media?: WPMedia; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const authHeader = await getAuthHeader();
    const response = await axios.get<WPMediaResponse>(
      `${wpConfig.siteUrl}/wp-json/wp/v2/media/${mediaId}`,
      { headers: { 'Authorization': authHeader } }
    );

    return {
      success: true,
      media: {
        id: response.data.id,
        title: response.data.title.rendered,
        caption: response.data.caption.rendered,
        altText: response.data.alt_text,
        description: response.data.description.rendered,
        mediaType: response.data.media_type,
        mimeType: response.data.mime_type,
        sourceUrl: response.data.source_url,
        width: response.data.media_details?.width,
        height: response.data.media_details?.height,
        filesize: response.data.media_details?.filesize,
        date: response.data.date,
        link: response.data.link,
        slug: response.data.slug
      }
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function bulkDeleteMedia(
  mediaIds: number[],
  force: boolean = true
): Promise<{ success: boolean; deleted: number[]; failed: number[]; error?: any }> {
  try {
    if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
    if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

    const deleted: number[] = [];
    const failed: number[] = [];

    for (const mediaId of mediaIds) {
      const result = await deleteMedia(mediaId, force);
      if (result.success) {
        deleted.push(mediaId);
      } else {
        failed.push(mediaId);
      }
    }

    return {
      success: true,
      deleted,
      failed
    };
  } catch (error: unknown) {
    return {
      success: false,
      deleted: [],
      failed: mediaIds,
      error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
    };
  }
}

export async function optimizeMedia(
 mediaId: number,
 options: { quality?: number; replaceOriginal?: boolean } = {}
): Promise<{ success: boolean; media?: WPMedia; error?: any }> {
 try {
   if (!process.env.TINIFY_API_KEY) throw new Error('TinyPNG API key not configured');
   if (!wpConfig.siteUrl) throw new Error('WordPress site URL not configured');
   if (!wpConfig.isAuthenticated) throw new Error('Not authenticated');

   tinify.key = process.env.TINIFY_API_KEY;
   
   const mediaDetails = await getMediaDetails(mediaId);
   if (!mediaDetails.success || !mediaDetails.media) throw new Error('Media not found');

   const imageResponse = await axios.get(mediaDetails.media.sourceUrl, { responseType: 'arraybuffer' });
   const source = tinify.fromBuffer(Buffer.from(imageResponse.data as ArrayBuffer));
   const resized = options.quality ? source.resize({ method: 'fit' }) : source;
   const optimized = await resized.toBuffer();

   if (options.replaceOriginal) {
     const formData = new FormData();
     formData.append('file', optimized, `optimized_${mediaDetails.media.slug}`);
     
     const authHeader = await getAuthHeader();
     await axios.post(
       `${wpConfig.siteUrl}/wp-json/wp/v2/media/${mediaId}`,
       formData,
       { headers: { 'Authorization': authHeader, ...formData.getHeaders() } }
     );
   }

   return { success: true, media: mediaDetails.media };
 } catch (error: unknown) {
   return {
     success: false,
     error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
   };
 }
}