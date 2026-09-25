import { act, fireEvent, screen } from '@testing-library/react-native';

import { useSessionStore } from '@/features/auth/store';
import { NotificationsScreen } from '@/features/notifications/components/notifications-screen';
import { markEventRead, markEventsRead, useHomeEvents } from '@/features/notifications/events';
import { useMembers } from '@/shared/hooks/use-home';
import type { HomeEvent } from '@/shared/schemas';
import { mockGoBack } from '@/test-utils/router-mock';
import { renderWithTheme, sleep } from '@/test-utils/render';

jest.mock('expo-router', () => jest.requireActual('@/test-utils/router-mock').mockExpoRouter());
jest.mock('@/features/notifications/events', () => ({
  useHomeEvents: jest.fn(),
  markEventRead: jest.fn(() => Promise.resolve()),
  markEventsRead: jest.fn(() => Promise.resolve()),
}));
jest.mock('@/shared/hooks/use-home', () => ({ useMembers: jest.fn() }));

const event = (id: string, extra: Partial<HomeEvent>): HomeEvent => ({
  id,
  type: 'added',
  actorId: 'u2',
  count: 1,
  itemNames: ['Diş Macunu'],
  createdAt: new Date(),
  readBy: [],
  ...extra,
});

beforeEach(() => {
  useSessionStore
    .getState()
    .setUser({ uid: 'u1', displayName: 'Zeynep', email: null, photoURL: null });
  jest.mocked(useMembers).mockReturnValue({
    data: [{ uid: 'u2', displayName: 'Defne Yılmaz', photoUrl: null }],
  } as never);
});
afterEach(async () => {
  await act(async () => sleep(0));
  jest.clearAllMocks();
});

function setEvents(events: HomeEvent[]) {
  jest.mocked(useHomeEvents).mockReturnValue({
    isPending: false,
    isError: false,
    events,
    unread: events.filter((e) => !e.readBy.includes('u1')),
  } as never);
}

describe('NotificationsScreen', () => {
  it('okunmamış sayısı, gruplar ve kart metni', async () => {
    setEvents([
      event('a', {}),
      event('b', {
        type: 'weekly',
        actorId: null,
        count: 18,
        readBy: ['u1'],
        createdAt: new Date(Date.now() - 86_400_000),
      }),
    ]);
    await renderWithTheme(<NotificationsScreen />, { homeId: 'h1' });
    expect(screen.getByText('1 yeni bildiriminiz var.')).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Bugün' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Dün' })).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: /Defne listeye Diş Macunu ekledi\..*okunmadı/ }),
    ).toBeOnTheScreen();
  });

  it('karta dokununca okundu, "Hepsini okudum" hepsini işaretler, Geri döner', async () => {
    setEvents([event('a', {}), event('c', { type: 'bought', itemNames: ['Süt'] })]);
    await renderWithTheme(<NotificationsScreen />, { homeId: 'h1' });
    await fireEvent.press(screen.getByRole('button', { name: /Süt aldı/ }));
    expect(markEventRead).toHaveBeenCalledWith({ homeId: 'h1', uid: 'u1', eventId: 'c' });
    await fireEvent.press(screen.getByRole('button', { name: 'Hepsini okudum' }));
    expect(markEventsRead).toHaveBeenCalledWith({ homeId: 'h1', uid: 'u1', eventIds: ['a', 'c'] });
    await fireEvent.press(screen.getByRole('button', { name: 'Geri' }));
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('hepsi okunduysa "Hepsini okudunuz."', async () => {
    setEvents([event('a', { readBy: ['u1'] })]);
    await renderWithTheme(<NotificationsScreen />, { homeId: 'h1' });
    expect(screen.getByText('Hepsini okudunuz.')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Hepsini okudum' })).toBeNull();
  });
});
