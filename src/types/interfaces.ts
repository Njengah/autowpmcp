export interface WPUserResponse {
  id: number;
  name: string;
  roles?: string[]; 
  slug?: string;
}

export interface WPAPIResponse {
  namespaces?: string[];
}

export interface WPPost {
  id: number;
  title: string;
  link: string;
  status: string;
}

export interface WPPostResponse {
  id: number;
  title: { rendered: string };
  link: string;
  status: string;
}

export interface WPCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface WPTag {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface WPPostSummary {
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

export interface ListPostsOptions {
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

export interface WPPostDetailed {
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

export interface WPDeleteResponse {
  deleted: boolean;
  previous: any;
}

export interface WPTaxonomy {
  name: string;
  label: string;
  description: string;
  public: boolean;
  hierarchical: boolean;
  rest_base: string;
}

export interface WPUser {
  id: number;
  username: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  roles: string[];
  registered_date: string;
  capabilities: Record<string, boolean>;
}

export interface WPRole {
  name: string;
  display_name: string;
  capabilities: Record<string, boolean>;
}

export interface ListUsersOptions {
  page?: number;
  perPage?: number;
  role?: string;
  search?: string;
  orderBy?: string;
  order?: string;
  registeredAfter?: string;
  registeredBefore?: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  role?: string;
  bio?: string;
  website?: string;
  sendNotification?: boolean;
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  website?: string;
  password?: string;
}

export interface WPMediaResponse {
  id: number;
  title: { rendered: string };
  caption: { rendered: string };
  alt_text: string;
  description: { rendered: string };
  media_type: string;
  mime_type: string;
  source_url: string;
  media_details: {
    width: number;
    height: number;
    file: string;
    filesize: number;
  };
  date: string;
  link: string;
  slug: string;
}

export interface WPMedia {
  id: number;
  title: string;
  caption: string;
  altText: string;
  description: string;
  mediaType: string;
  mimeType: string;
  sourceUrl: string;
  width?: number;
  height?: number;
  filesize?: number;
  date: string;
  link: string;
  slug: string;
}

export interface MediaUploadOptions {
  title?: string;
  caption?: string;
  altText?: string;
  description?: string;
}

export interface MediaListOptions {
  page?: number;
  perPage?: number;
  mediaType?: string;
  mimeType?: string;
  orderBy?: string;
  order?: string;
  parent?: number;
}

export interface MediaSearchOptions {
  query: string;
  mediaType?: string;
  dateAfter?: string;
  dateBefore?: string;
  limit?: number;
}