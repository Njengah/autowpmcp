// WordPress API utilities
import axios from 'axios';
let wpConfig = {
    siteUrl: '',
    username: '',
    isAuthenticated: false
};
export function setWordPressConfig(config) {
    wpConfig = { ...wpConfig, ...config };
}
export function getWordPressConfig() {
    return { ...wpConfig };
}
export async function getAuthHeader() {
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
    }
    catch (error) {
        console.error('Authentication error:', error);
        throw new Error('Failed to create authentication header: ' + (error.message || 'Unknown error'));
    }
}
export function formatErrorResponse(error) {
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
// export async function testAuthentication(): Promise<{ 
//   success: boolean; 
//   userInfo?: { id: number; name: string; roles: string[] };
//   error?: string 
// }> {
//   try {
//     const authHeader = await getAuthHeader();
//     const response = await axios.get<WPUserResponse>(
//       `${wpConfig.siteUrl}/wp-json/wp/v2/users/me`,
//       { headers: { 'Authorization': authHeader } }
//     );
//     const roles = response.data.roles || ['contributor'];
//     return {
//       success: true,
//       userInfo: {
//         id: response.data.id,
//         name: response.data.name || response.data.slug || 'Unknown',
//         roles: Array.isArray(roles) ? roles : [String(roles)]
//       }
//     };
//   } catch (error) {
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : 'Unknown error'
//     };
//   }
// }
export async function testAuthentication() {
    try {
        const authHeader = await getAuthHeader();
        const response = await axios.get(`${wpConfig.siteUrl}/wp-json/wp/v2/users/me`, { headers: { 'Authorization': authHeader } });
        const roles = response.data.roles || ['contributor'];
        // SET AUTHENTICATION FLAG TO TRUE
        wpConfig.isAuthenticated = true;
        return {
            success: true,
            userInfo: {
                id: response.data.id,
                name: response.data.name || response.data.slug || 'Unknown',
                roles: Array.isArray(roles) ? roles : [String(roles)]
            }
        };
    }
    catch (error) {
        // ENSURE FLAG IS FALSE ON FAILURE
        wpConfig.isAuthenticated = false;
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
export async function testSiteConnection(siteUrl) {
    try {
        const response = await axios.get(`${siteUrl}/wp-json/`, {
            timeout: 5000
        });
        return response.data?.namespaces?.includes('wp/v2') ?? false;
    }
    catch {
        return false;
    }
}
export async function createPost(title, content, status = 'draft', excerpt = '', categories = [], tags = []) {
    try {
        if (!wpConfig.siteUrl)
            throw new Error('WordPress site URL not configured');
        if (!wpConfig.isAuthenticated)
            throw new Error('Not authenticated');
        const authHeader = await getAuthHeader();
        const response = await axios.post(`${wpConfig.siteUrl}/wp-json/wp/v2/posts`, { title, content, status, excerpt, categories, tags }, { headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' } });
        return {
            success: true,
            post: {
                id: response.data.id,
                title: response.data.title.rendered,
                link: response.data.link,
                status: response.data.status
            }
        };
    }
    catch (error) {
        console.error('Error creating post:', error);
        return {
            success: false,
            error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
        };
    }
}
export async function getCategories() {
    try {
        if (!wpConfig.siteUrl)
            throw new Error('WordPress site URL not configured');
        if (!wpConfig.isAuthenticated)
            throw new Error('Not authenticated');
        const authHeader = await getAuthHeader();
        const response = await axios.get(`${wpConfig.siteUrl}/wp-json/wp/v2/categories?per_page=100`, { headers: { 'Authorization': authHeader } });
        return {
            success: true,
            categories: response.data.map(category => ({
                id: category.id,
                name: category.name,
                slug: category.slug,
                count: category.count
            }))
        };
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        return {
            success: false,
            error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
        };
    }
}
export async function getTags() {
    try {
        if (!wpConfig.siteUrl)
            throw new Error('WordPress site URL not configured');
        if (!wpConfig.isAuthenticated)
            throw new Error('Not authenticated');
        const authHeader = await getAuthHeader();
        const response = await axios.get(`${wpConfig.siteUrl}/wp-json/wp/v2/tags?per_page=100`, { headers: { 'Authorization': authHeader } });
        return {
            success: true,
            tags: response.data
        };
    }
    catch (error) {
        console.error('Error fetching tags:', error);
        return {
            success: false,
            error: error instanceof Error ? formatErrorResponse(error) : 'Unknown error'
        };
    }
}
function isAxiosError(error) {
    return (typeof error === 'object' &&
        error !== null &&
        'isAxiosError' in error &&
        error.isAxiosError === true);
}
