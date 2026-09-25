// Birden fazla ekranın paylaştığı form kuralları.
import { z } from 'zod';

// Ev adı: kırpılır, boş olamaz, en fazla 60 karakter (firestore.rules da
// homes.name için 60'ı sınırlıyor). Ev Oluştur ve Ev sekmesindeki yeniden
// adlandırma aynı kuralı kullanır.
export const homeNameMaxLength = 60;
export const homeNameSchema = z.string().trim().min(1).max(homeNameMaxLength);
