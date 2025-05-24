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

interface WPUserResponse {
  id: number;
  name: string;
  roles?: string[]; 
  slug?: string;
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
    
    return {
      success: true,
      userInfo: {
        id: response.data.id,
        name: response.data.name || response.data.slug || 'Unknown',
        roles: Array.isArray(roles) ? roles : [String(roles)]
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

interface WPAPIResponse {
  namespaces?: string[];
  
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