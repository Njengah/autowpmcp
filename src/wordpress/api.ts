// WordPress API utilities
import axios from 'axios';
import { z } from 'zod';

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
};


interface WPUserResponse {
  id: number;
  name: string;
  roles?: string[]; 
  slug?: string;
}

interface WPAPIResponse {
  namespaces?: string[];
  
}

interface WPPost {
  id: number;
  title: string;
  link: string;
  status: string;
}

interface WPPostResponse {
  id: number;
  title: { rendered: string };
  link: string;
  status: string;
}

interface WPPostDetailed {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  status: string;
  link: string;
  date: string;
  modified: string;
  categories: number[];
  tags: number[];
  author: number;
}

interface WPPostSummary {
  id: number;
  title: string;
  excerpt: string;
  status: string;
  link: string;
  date: string;
  modified: string;
  categories: number[];
  tags: number[];
  author: number;
}

interface ListPostsOptions {
  page?: number;
  perPage?: number;
  status?: string;
  author?: number;
  categories?: number[];
  tags?: number[];
  search?: string;
  orderBy?: string;
  order?: string;
}

interface WPDeleteResponse {
  deleted: boolean;
  previous: any;
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

interface WPCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
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

interface WPTag {
  id: number;
  name: string;
  slug: string;
  count: number;
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

interface WPPostDetailed {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  status: string;
  link: string;
  date: string;
  modified: string;
  categories: number[];
  tags: number[];
  author: number;
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

interface WPPostSummary {
  id: number;
  title: string;
  excerpt: string;
  status: string;
  link: string;
  date: string;
  modified: string;
  categories: number[];
  tags: number[];
  author: number;
}

interface ListPostsOptions {
  page?: number;
  perPage?: number;
  status?: string;
  author?: number;
  categories?: number[];
  tags?: number[];
  search?: string;
  orderBy?: string;
  order?: string;
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