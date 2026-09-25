import { act, fireEvent, screen } from '@testing-library/react-native';

import { ItemForm } from '@/features/item-form/components/item-form';
import { emptyItemForm } from '@/features/item-form/schemas';
import { renderWithTheme, sleep } from '@/test-utils/render';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

async function renderForm() {
  const onSubmit = jest.fn();
  const onClose = jest.fn();
  await renderWithTheme(
    <ItemForm mode="add" initialValues={emptyItemForm} onSubmit={onSubmit} onClose={onClose} />,
  );
  return { onSubmit, onClose };
}

afterEach(async () => {
  await act(async () => sleep(0));
});

describe('ItemForm (İhtiyaç Ekle)', () => {
  it('boş adla eklenmez', async () => {
    const { onSubmit } = await renderForm();
    await fireEvent.press(screen.getByRole('button', { name: 'Listeye Ekle' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('varsayılanlar: 1 adet, Gıda, acil değil', async () => {
    const { onSubmit } = await renderForm();
    await fireEvent.changeText(screen.getByLabelText('Ne lazım?'), 'Süt');
    await fireEvent.press(screen.getByRole('button', { name: 'Listeye Ekle' }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Süt',
      quantity: 1,
      unit: 'adet',
      category: 'food',
      urgent: false,
    });
  });

  it('hızlı seçim adı ve bölümü doldurur; miktar, birim ve acil seçilir', async () => {
    const { onSubmit } = await renderForm();
    await fireEvent.press(screen.getByRole('button', { name: 'Şampuan' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Arttır' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Birim seçin: Adet' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Kutu' }));
    await fireEvent.press(screen.getByRole('switch', { name: 'Acil ihtiyaç' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Listeye Ekle' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Şampuan',
      quantity: 2,
      unit: 'kutu',
      category: 'care',
      urgent: true,
    });
  });

  it("bölüm karoları radyo olarak seçilir; miktar 1'in altına inmez", async () => {
    const { onSubmit } = await renderForm();
    await fireEvent.changeText(screen.getByLabelText('Ne lazım?'), 'Pil');
    expect(screen.getByRole('button', { name: 'Azalt' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('radio', { name: 'Diğer' }));
    expect(screen.getByRole('radio', { name: 'Diğer' })).toBeChecked();
    await fireEvent.press(screen.getByRole('button', { name: 'Listeye Ekle' }));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ category: 'other', quantity: 1 });
  });

  it('Kapat düğmesi yazılı ve çalışır', async () => {
    const { onClose } = await renderForm();
    await fireEvent.press(screen.getByRole('button', { name: 'Kapat' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
