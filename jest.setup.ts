// TanStack Query durum bildirimlerini varsayılan olarak setTimeout(0) ile
// topluyor; testte bu, act() dışında kalan güncellemelere ve "not wrapped in
// act" uyarılarına yol açıyor. Testlerde bildirimler eşzamanlı yapılıyor.
import { notifyManager } from '@tanstack/react-query';

notifyManager.setScheduler((callback) => callback());
