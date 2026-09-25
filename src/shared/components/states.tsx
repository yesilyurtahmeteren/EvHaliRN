// Yükleniyor / hata durumları (tam ekran). Boş liste durumu tasarımda
// ekrana özgü olduğu için ilgili ekranın içinde.
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText } from './app-text';
import { Button } from './button';
import { Card } from './card';
import { Icon } from './icon';
import { Spinner } from './spinner';

export function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Spinner size={36} />
    </View>
  );
}

// Okuma hatası. "Veri yok" ile karıştırılmaz: kullanıcı tekrar deneyebilir.
export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Card style={{ padding: 24, borderRadius: 28, alignItems: 'center', gap: 16 }}>
        <Icon name="warning" size={40} color="peachFg" />
        <AppText size={18} weight="bold" scaled lineHeight={1.4} style={{ textAlign: 'center' }}>
          {message}
        </AppText>
        {onRetry !== undefined && (
          <View style={{ alignSelf: 'stretch' }}>
            <Button label={t('common.retry')} icon="refresh" onPress={onRetry} />
          </View>
        )}
      </Card>
    </View>
  );
}
