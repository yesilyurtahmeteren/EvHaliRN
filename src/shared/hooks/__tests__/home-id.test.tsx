import { render, renderHook, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { HomeIdProvider, useRequiredHomeId } from '@/shared/hooks/home-id';

function ShowHomeId() {
  return <Text>{useRequiredHomeId()}</Text>;
}

describe('HomeIdProvider', () => {
  it('ev kimliğini sağlar', async () => {
    await render(
      <HomeIdProvider homeId="h1">
        <ShowHomeId />
      </HomeIdProvider>,
    );
    expect(screen.getByText('h1')).toBeOnTheScreen();
  });

  it('evden ayrılınca (null) son render çökmez, son ev döner', async () => {
    const view = await render(
      <HomeIdProvider homeId="h1">
        <ShowHomeId />
      </HomeIdProvider>,
    );
    await view.rerender(
      <HomeIdProvider homeId={null}>
        <ShowHomeId />
      </HomeIdProvider>,
    );
    expect(screen.getByText('h1')).toBeOnTheScreen();
  });

  it('başka bir eve geçince yeni evi döner', async () => {
    const view = await render(
      <HomeIdProvider homeId="h1">
        <ShowHomeId />
      </HomeIdProvider>,
    );
    await view.rerender(
      <HomeIdProvider homeId="h2">
        <ShowHomeId />
      </HomeIdProvider>,
    );
    expect(screen.getByText('h2')).toBeOnTheScreen();
  });

  it('sağlayıcı dışında hata fırlatır', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(renderHook(() => useRequiredHomeId())).rejects.toThrow();
  });
});
