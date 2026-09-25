import { act, fireEvent, screen } from '@testing-library/react-native';

import { AppText } from '@/shared/components/app-text';
import { Button } from '@/shared/components/button';
import { Checkbox } from '@/shared/components/checkbox';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { ErrorView, LoadingScreen } from '@/shared/components/states';
import { TextField } from '@/shared/components/text-field';
import { Toggle } from '@/shared/components/toggle';
import { renderWithTheme } from '@/test-utils/render';

describe('AppText', () => {
  it('tasarımdaki boyut ve ağırlığı kullanır', async () => {
    await renderWithTheme(
      <AppText size={18} weight="extrabold" lineHeight={1.3}>
        Süt
      </AppText>,
    );
    expect(screen.getByText('Süt')).toHaveStyle({
      fontSize: 18,
      lineHeight: 18 * 1.3,
      fontFamily: 'PlusJakartaSans-ExtraBold',
    });
  });

  it('strike üstünü çizer', async () => {
    await renderWithTheme(<AppText strike>Ekmek</AppText>);
    expect(screen.getByText('Ekmek')).toHaveStyle({ textDecorationLine: 'line-through' });
  });
});

describe('Button', () => {
  it('etiketi gösterir ve dokununca çalışır', async () => {
    const onPress = jest.fn();
    await renderWithTheme(<Button label="İhtiyaç Ekle" icon="plus" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'İhtiyaç Ekle' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('yüklenirken basılamaz ve meşgul olarak bildirilir', async () => {
    const onPress = jest.fn();
    await renderWithTheme(<Button label="Kaydet" loading onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Kaydet' });
    expect(button).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeOnTheScreen();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('TextField', () => {
  it('etiketle erişilebilir, yazılan metni iletir', async () => {
    const onChangeText = jest.fn();
    await renderWithTheme(
      <TextField accessibilityLabel="Ne lazım?" value="" onChangeText={onChangeText} />,
    );
    await fireEvent.changeText(screen.getByLabelText('Ne lazım?'), 'Süt');
    expect(onChangeText).toHaveBeenCalledWith('Süt');
  });
});

describe('Checkbox', () => {
  it('işaret durumunu bildirir, dokununca çalışır', async () => {
    const onPress = jest.fn();
    await renderWithTheme(
      <Checkbox
        checked={false}
        onPress={onPress}
        accessibilityLabel="Süt: aldım olarak işaretle"
      />,
    );
    const box = screen.getByRole('checkbox', { name: 'Süt: aldım olarak işaretle' });
    expect(box).not.toBeChecked();
    await fireEvent.press(box);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('misafirde (disabled) dokunma çalışmaz', async () => {
    const onPress = jest.fn();
    await renderWithTheme(
      <Checkbox checked={false} disabled onPress={onPress} accessibilityLabel="Süt" />,
    );
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Süt' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('Toggle', () => {
  it('switch rolüyle durumu bildirir ve tersine çevirir', async () => {
    const onValueChange = jest.fn();
    await renderWithTheme(
      <Toggle value={false} onValueChange={onValueChange} accessibilityLabel="Büyük yazı" />,
    );
    const toggle = screen.getByRole('switch', { name: 'Büyük yazı' });
    expect(toggle).not.toBeChecked();
    await fireEvent.press(toggle);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });
});

describe('durum ekranları', () => {
  it('LoadingScreen erişilebilir etiketli gösterge', async () => {
    await renderWithTheme(<LoadingScreen />);
    expect(screen.getByRole('progressbar', { name: 'Yükleniyor' })).toBeOnTheScreen();
  });

  it('ErrorView mesajı ve "Tekrar dene" düğmesini gösterir', async () => {
    const onRetry = jest.fn();
    await renderWithTheme(<ErrorView message="Ev bilgisi yüklenemedi." onRetry={onRetry} />);
    expect(screen.getByText('Ev bilgisi yüklenemedi.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('ErrorView onRetry yoksa düğme göstermez', async () => {
    await renderWithTheme(<ErrorView message="Hata" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('ConfirmDialog', () => {
  it('görünmezken içerik yok', async () => {
    await renderWithTheme(
      <ConfirmDialog
        visible={false}
        title="Hesabınız silinsin mi?"
        body="Geri alınamaz."
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />,
    );
    expect(screen.queryByText('Hesabınız silinsin mi?')).toBeNull();
  });

  it('Vazgeç ve onay düğmesi doğru geri çağrıları çalıştırır', async () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    await renderWithTheme(
      <ConfirmDialog
        visible
        title="Hesabınız silinsin mi?"
        body="Geri alınamaz."
        confirmLabel="Hesabı sil"
        destructive
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Vazgeç' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Hesabı sil' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await act(async () => undefined);
  });
});
