/**
 * Safe API Retry Utility
 * 
 * Implements exponential backoff retry mechanism for GET requests
 * - Max 3 retries
 * - Exponential backoff: 1s → 2s → 4s
 * - Only retries on network errors or 502/503/504
 * - Does NOT retry on 400/401/403/404
 * - Prevents concurrent duplicate requests
 */

interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number; // milliseconds
  shouldRetry?: (error: Error | Response) => boolean;
}

interface PendingRequest {
  promise: Promise<Response>;
  timestamp: number;
}

// Cache for preventing concurrent duplicate requests
const pendingRequests = new Map<string, PendingRequest>();

// Default configuration
const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  shouldRetry: (error: Error | Response) => {
    // If it's a Response object, check status code
    if (error instanceof Response) {
      const status = error.status;
      // Retry on server errors (502, 503, 504) but NOT on 500
      return status === 502 || status === 503 || status === 504;
    }
    
    // If it's an Error, retry on network errors only
    return (
      error.name === 'TypeError' || // Network error
      error.message.includes('fetch') ||
      error.message.includes('network')
    );
  },
};

/**
 * Sleep utility for exponential backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate cache key for deduplication
 */
function getCacheKey(url: string, options?: RequestInit): string {
  const method = options?.method || 'GET';
  const headers = JSON.stringify(options?.headers || {});
  return `${method}:${url}:${headers}`;
}

/**
 * Clean up stale pending requests (older than 30 seconds)
 */
function cleanupStaleRequests(): void {
  const now = Date.now();
  const staleThreshold = 30000; // 30 seconds

  for (const [key, pending] of pendingRequests.entries()) {
    if (now - pending.timestamp > staleThreshold) {
      pendingRequests.delete(key);
    }
  }
}

/**
 * Fetch with retry logic
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param config - Retry configuration
 * @returns Promise<Response>
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  config: RetryConfig = {}
): Promise<Response> {
  const { maxRetries, baseDelay, shouldRetry } = { ...DEFAULT_CONFIG, ...config };
  
  // Only deduplicate GET requests
  const isGetRequest = !options?.method || options.method.toUpperCase() === 'GET';
  
  if (isGetRequest) {
    // Clean up stale requests periodically
    cleanupStaleRequests();
    
    // Check if same request is already pending
    const cacheKey = getCacheKey(url, options);
    const pending = pendingRequests.get(cacheKey);
    
    if (pending) {
      console.log(`[API] Deduplicating concurrent request: ${url}`);
      return pending.promise;
    }
  }

  let lastError: Error | Response | null = null;
  let attempt = 0;

  // Create the fetch promise
  const fetchPromise = (async (): Promise<Response> => {
    while (attempt <= maxRetries) {
      try {
        console.log(`[API] Attempt ${attempt + 1}/${maxRetries + 1}: ${url}`);
        
        const response = await fetch(url, options);
        
        // Check if we should retry based on status code
        if (!response.ok && shouldRetry(response)) {
          lastError = response.clone();
          
          if (attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
            console.warn(
              `[API] Retry ${attempt + 1}/${maxRetries} after ${delay}ms - Status: ${response.status} - ${url}`
            );
            await sleep(delay);
            attempt++;
            continue;
          }
        }
        
        // Success or non-retryable error
        return response;
        
      } catch (error) {
        lastError = error as Error;
        
        // Check if we should retry this error
        if (shouldRetry(lastError)) {
          if (attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
            console.warn(
              `[API] Retry ${attempt + 1}/${maxRetries} after ${delay}ms - Error: ${lastError.message} - ${url}`
            );
            await sleep(delay);
            attempt++;
            continue;
          }
        }
        
        // Non-retryable error, throw immediately
        console.error(`[API] Non-retryable error: ${lastError.message} - ${url}`);
        throw lastError;
      }
    }

    // Max retries exceeded
    if (lastError instanceof Response) {
      console.error(
        `[API] Max retries exceeded - Status: ${lastError.status} - ${url}`
      );
      return lastError;
    } else {
      console.error(
        `[API] Max retries exceeded - Error: ${lastError?.message} - ${url}`
      );
      throw lastError;
    }
  })();

  // Cache the promise for deduplication (GET requests only)
  if (isGetRequest) {
    const cacheKey = getCacheKey(url, options);
    pendingRequests.set(cacheKey, {
      promise: fetchPromise,
      timestamp: Date.now(),
    });

    // Clean up after request completes
    fetchPromise.finally(() => {
      pendingRequests.delete(cacheKey);
    });
  }

  return fetchPromise;
}

/**
 * Convenience wrapper for GET requests with retry
 */
export async function getWithRetry(
  url: string,
  headers?: HeadersInit,
  config?: RetryConfig
): Promise<Response> {
  return fetchWithRetry(
    url,
    {
      method: 'GET',
      headers,
    },
    config
  );
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: Error | Response): boolean {
  return DEFAULT_CONFIG.shouldRetry(error);
}
