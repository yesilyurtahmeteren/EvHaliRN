import { renderRouter } from 'expo-router/testing-library';

import '@/shared/i18n';
import { PlaceholderScreen } from '@/shared/components/placeholder-screen';

describe('PlaceholderScreen', () => {
  it('başlığı, açıklamayı ve ekran bağlantılarını gösterir', async () => {
    const view = await renderRouter(
      { index: () => <PlaceholderScreen title="Ev" /> },
      { initialUrl: '/' },
    );

    expect(view.getByText('Ev')).toBeOnTheScreen();
    expect(view.getByText('Bu ekran henüz taşınmadı.')).toBeOnTheScreen();
    expect(view.getAllByRole('link')).toHaveLength(6);
  });
});
