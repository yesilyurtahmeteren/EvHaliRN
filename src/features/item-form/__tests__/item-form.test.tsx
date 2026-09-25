import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/shared/i18n';
import { ItemForm, type ItemFormProps } from '@/features/item-form/components/item-form';
import { itemFormSchema } from '@/features/item-form/schemas';
import { hideToast, useToastStore } from '@/shared/components/toast/toast-store';
import type { ItemCategory } from '@/shared/schemas';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const blank = {
  name: '',
  quantity: 1,
  unit: 'adet' as const,
  note: '',
  urgent: false,
  category: null,
};

async function renderForm(overrides: Partial<ItemFormProps> = {}) {
  const onSubmit = jest.fn();
  const onClose = jest.fn();
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ItemForm
        mode="add"
        defaultValues={blank}
        homeName="Yeşilyurt Evi"
        syncTargetNames={['Mehmet', 'Can']}
        suggestions={[{ id: 'süt', name: 'Süt', count: 9, category: 'dairy_breakfast' }]}
        categoriesByName={new Map<string, ItemCategory | null>([['süt', 'dairy_breakfast']])}
        saving={false}
        onSubmit={onSubmit}
        onClose={onClose}
        {...overrides}
      />
    </SafeAreaProvider>,
  );
  return { onSubmit, onClose };
}

afterEach(async () => {
  await act(async () => hideToast());
});

describe('itemFormSchema', () => {
  it('adı ve notu kırpar, boş not null olur', () => {
    expect(itemFormSchema.parse({ ...blank, name: ' Süt ', note: '   ' })).toMatchObject({
      name: 'Süt',
      note: null,
    });
  });

  it('kural sınırları: ad 1-60, miktar 1-99, not <= 100', () => {
    expect(itemFormSchema.safeParse({ ...blank, name: '  ' }).success).toBe(false);
    expect(itemFormSchema.safeParse({ ...blank, name: 'x'.repeat(61) }).success).toBe(false);
    expect(itemFormSchema.safeParse({ ...blank, name: 'Süt', quantity: 100 }).success).toBe(false);
    expect(itemFormSchema.safeParse({ ...blank, name: 'Süt', note: 'n'.repeat(101) }).success).toBe(
      false,
    );
  });
});

describe('ItemForm', () => {
  it('ekleme modu: başlık, ev adıyla alt yazı, senkron ibaresi', async () => {
    await renderForm();
    expect(screen.getByRole('header', { name: 'İhtiyaç Ekle' })).toBeOnTheScreen();
    expect(screen.getByText('Yeşilyurt Evi ortak sepetine eklenecek')).toBeOnTheScreen();
    expect(screen.getByText('Mehmet ve Can ile anında senkronize olur.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Listeye Ekle' })).toBeOnTheScreen();
  });

  it('düzenleme modu: farklı başlık, "Kaydet", senkron ibaresi yok', async () => {
    await renderForm({ mode: 'edit', defaultValues: { ...blank, name: 'Süt' } });
    expect(screen.getByRole('header', { name: 'Ürünü Düzenle' })).toBeOnTheScreen();
    expect(screen.getByText('Değişiklikler anında senkronize olur')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Kaydet' })).toBeOnTheScreen();
    expect(screen.queryByText(/ile anında senkronize olur\./)).toBeNull();
  });

  it('boş adla gönderilmez (Flutter gibi)', async () => {
    const { onSubmit } = await renderForm();
    await fireEvent.press(screen.getByRole('button', { name: 'Listeye Ekle' }));
    await act(async () => new Promise((resolve) => setTimeout(resolve, 20)));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('tüm alanları doldurup gönderir', async () => {
    const { onSubmit } = await renderForm();

    await fireEvent.changeText(screen.getByLabelText('Ürün adı'), '  Peynir ');
    await fireEvent.press(screen.getByRole('button', { name: 'Artır' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Artır' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'kg' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Süt & Kahvaltı' }));
    await fireEvent.changeText(screen.getByLabelText('Marka / not (isteğe bağlı)'), ' Ezine ');
    await fireEvent.press(screen.getByRole('switch', { name: 'Acil İhtiyaç' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Listeye Ekle' }));

    await waitFor(() =>
      expect(onSubmit.mock.calls[0][0]).toEqual({
        name: 'Peynir',
        quantity: 3,
        unit: 'kg',
        note: 'Ezine',
        category: 'dairy_breakfast',
        urgent: true,
      }),
    );
  });

  it('miktar 1 ile 99 arasında kalır', async () => {
    await renderForm({ defaultValues: { ...blank, quantity: 99 } });
    expect(screen.getByRole('button', { name: 'Artır' })).toBeDisabled();
    expect(screen.getByRole('adjustable', { name: 'Miktar' })).toHaveAccessibilityValue({
      now: 99,
    });
  });

  it('sık alınan çipi adı ve katalog kategorisini doldurur', async () => {
    await renderForm();
    await fireEvent.press(screen.getByRole('button', { name: 'Süt' }));

    expect(screen.getByLabelText('Ürün adı')).toHaveDisplayValue('Süt');
    expect(screen.getByRole('radio', { name: 'Süt & Kahvaltı' })).toBeChecked();
  });

  it('mikrofon "henüz eklenmedi" mesajı gösterir', async () => {
    await renderForm();
    await fireEvent.press(screen.getByRole('button', { name: 'Sesle ekle' }));
    expect(useToastStore.getState().current?.message).toBe('Sesli giriş henüz eklenmedi.');
  });

  it('kaydederken düğme yerine ilerleme çubuğu', async () => {
    await renderForm({ saving: true });
    expect(screen.queryByRole('button', { name: 'Listeye Ekle' })).toBeNull();
    expect(screen.getByRole('progressbar')).toBeOnTheScreen();
  });

  it('kapat düğmesi', async () => {
    const { onClose } = await renderForm();
    await fireEvent.press(screen.getByRole('button', { name: 'Vazgeç' }));
    expect(onClose).toHaveBeenCalled();
  });
});
