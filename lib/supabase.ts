import { createClient } from '@supabase/supabase-js';
import { cache } from './cache';

// Supabase client with caching layer
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Create singleton with connection pooling
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'X-Client-Info': 'lumina-clean-v5.0',
        } as Record<string, string>,
      },
      db: {},
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  
  return supabaseInstance;
}

// Cached Supabase query wrapper
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<{ data: T | null; error: any }>,
  ttl?: number
): Promise<{ data: T | null; error: any }> {
  // Try cache first
  const cached = cache.get<{ data: T | null; error: any }>(key);
  if (cached) return cached;

  // Execute query
  const result = await queryFn();
  
  // Cache successful queries
  if (!result.error) {
    cache.set(key, result, { ttl, tags: ['supabase', key.split(':')[0]] });
  }
  
  return result;
}

// Invalidate cache on mutations
export async function supabaseMutation<T>(
  key: string,
  mutationFn: () => Promise<{ data: T | null; error: any }>,
  invalidateTags?: string[]
): Promise<{ data: T | null; error: any }> {
  const result = await mutationFn();
  
  // Invalidate related cache entries
  if (!result.error && invalidateTags) {
    for (const tag of invalidateTags) {
      cache.invalidateByTag(tag);
    }
  }
  
  return result;
}

export default getSupabaseClient;
