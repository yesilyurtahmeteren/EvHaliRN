import { act, fireEvent, render, screen } from '@testing-library/react-native';

import '@/shared/i18n';
import { AppText } from '@/shared/components/app-text';
import { Button } from '@/shared/components/button';
import { Card } from '@/shared/components/card';
import { Chip } from '@/shared/components/chip';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { EmptyState, ErrorView, LoadingScreen } from '@/shared/components/states';
import { TextField } from '@/shared/components/text-field';
import { typeScale } from '@/shared/theme';
import { useTextScaleStore } from '@/shared/theme/text-scale-store';

afterEach(async () => {
  await act(async () => useTextScaleStore.getState().setMultiplier(1));
});

describe('AppText', () => {
  it('tipografi rolünün boyutunu kullanıcı çarpanıyla ölçekler', async () => {
    await act(async () => useTextScaleStore.getState().setMultiplier(1.3));
    await render(<AppText variant="body-lg">Süt</AppText>);

    const [size, lineHeight] = typeScale['body-lg'];
    expect(screen.getByText('Süt')).toHaveStyle({
      fontSize: size * 1.3,
      lineHeight: lineHeight * 1.3,
      fontFamily: 'PlusJakartaSans-Regular',
    });
  });

  it('weight rolün varsayılan ağırlığını ezer', async () => {
    await render(
      <AppText variant="body-md" weight="bold">
        Ekmek
      </AppText>,
    );
    expect(screen.getByText('Ekmek')).toHaveStyle({ fontFamily: 'PlusJakartaSans-Bold' });
  });
});

describe('Button', () => {
  it('etiketi gösterir ve dokununca çalışır', async () => {
    const onPress = jest.fn();
    await render(<Button label="Ev Oluştur" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Ev Oluştur' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('yüklenirken buton yerine ilerleme çubuğu gösterir (çift dokunma yok)', async () => {
    await render(<Button label="Ev Oluştur" loading onPress={jest.fn()} />);

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('progressbar')).toBeOnTheScreen();
  });

  it('devre dışıyken dokunma çalışmaz', async () => {
    const onPress = jest.fn();
    await render(<Button label="Kaydet" disabled onPress={onPress} />);

    const button = screen.getByRole('button', { name: 'Kaydet' });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('TextField', () => {
  it('etiketle erişilebilir, yazılan metni iletir', async () => {
    const onChangeText = jest.fn();
    await render(<TextField label="Ev adı" onChangeText={onChangeText} />);

    await fireEvent.changeText(screen.getByLabelText('Ev adı'), 'Yeşilyurt Evi');
    expect(onChangeText).toHaveBeenCalledWith('Yeşilyurt Evi');
  });

  it('hata metnini gösterir', async () => {
    await render(<TextField label="Davet kodu" errorText="Geçersiz davet kodu." />);
    expect(screen.getByText('Geçersiz davet kodu.')).toBeOnTheScreen();
  });
});

describe('Card', () => {
  it('içeriğini gösterir', async () => {
    await render(
      <Card>
        <AppText>Durum</AppText>
      </Card>,
    );
    expect(screen.getByText('Durum')).toBeOnTheScreen();
  });
});

describe('durum ekranları', () => {
  it('LoadingScreen erişilebilir etiketli gösterge', async () => {
    await render(<LoadingScreen />);
    expect(screen.getByLabelText('Yükleniyor')).toBeOnTheScreen();
  });

  it('ErrorView mesajı ve "Tekrar dene" düğmesini gösterir', async () => {
    const onRetry = jest.fn();
    await render(<ErrorView message="Ev bilgisi yüklenemedi." onRetry={onRetry} />);

    expect(screen.getByText('Ev bilgisi yüklenemedi.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('ErrorView onRetry yoksa düğme göstermez', async () => {
    await render(<ErrorView message="Hata" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('EmptyState başlık ve açıklama', async () => {
    await render(
      <EmptyState icon="shopping-bag" title="Evde eksik bir şey yok" description="Açıklama" />,
    );
    expect(screen.getByText('Evde eksik bir şey yok')).toBeOnTheScreen();
    expect(screen.getByText('Açıklama')).toBeOnTheScreen();
  });
});

describe('Chip', () => {
  it('seçili durumunu radyo olarak bildirir ve dokunulabilir', async () => {
    const onPress = jest.fn();
    await render(<Chip label="Büyük" selected onPress={onPress} />);

    const chip = screen.getByRole('radio', { name: 'Büyük' });
    expect(chip).toBeChecked();
    await fireEvent.press(chip);
    expect(onPress).toHaveBeenCalled();
  });
});

describe('ConfirmDialog', () => {
  it('görünmezken içerik yok', async () => {
    await render(
      <ConfirmDialog
        visible={false}
        title="Evden ayrıl?"
        body="Açıklama"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />,
    );
    expect(screen.queryByText('Evden ayrıl?')).toBeNull();
  });

  it('Vazgeç ve Onayla doğru geri çağrıları çalıştırır', async () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    await render(
      <ConfirmDialog
        visible
        title="Kodu yenile?"
        body="Eski kod çalışmayacak."
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText('Eski kod çalışmayacak.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Onayla' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByRole('button', { name: 'Vazgeç' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
