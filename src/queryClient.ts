import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale after 2 s — background refetch without flash
      staleTime: 2_000,
      // Retry once on failure before showing error
      retry: 1,
      // Keep data in cache for 5 min after last subscriber unmounts
      gcTime: 5 * 60 * 1000,
    },
  },
});
