import { QueryClient } from '@tanstack/react-query';

// Firestore verisi canlı onSnapshot aboneliklerinden gelip cache'e
// setQueryData ile yazılacak (docs/ANALYSIS.md R5); bu yüzden otomatik
// yeniden çekme kapalı, RNFB'nin offline cache'i zaten kalıcılığı sağlıyor.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
    },
  },
});
