import { useRequiredUser } from '@/features/auth/store';
import { useFeedbackMutation } from '@/shared/lib/feedback';

import { addItem, type AddItemInput } from '../api';

// Hızlı ekleme (alt alan + çipler). Çağıran sonucu beklemez: alan hemen
// temizlenir, bir sonraki ürün yazılabilir; hata olursa toast gelir.
export function useAddItem(homeId: string) {
  const { uid } = useRequiredUser();
  return useFeedbackMutation({
    mutationFn: (input: Omit<AddItemInput, 'homeId' | 'uid'>) => addItem({ ...input, homeId, uid }),
  });
}
