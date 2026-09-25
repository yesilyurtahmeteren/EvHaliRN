import { nextRoles } from '@/features/home-dashboard/hooks/use-dashboard-actions';
import { mustHandOver } from '@/features/profile/hooks/use-profile-actions';
import { homeSchema } from '@/shared/schemas';

jest.mock('@/features/auth/api', () => ({ deleteAccount: jest.fn() }));
jest.mock('@/features/home-dashboard/api', () => ({}));
jest.mock('@/features/profile/api', () => ({}));

const home = (memberIds: string[], roles?: Record<string, string>) =>
  homeSchema.parse({ id: 'h', memberIds, roles });

describe('nextRoles', () => {
  it('eski evde (rol haritası yok) kurucuyu yönetici olarak yazar', () => {
    expect(nextRoles(home(['a', 'b']), 'b', 'guest')).toEqual({ a: 'admin', b: 'guest' });
  });

  it('"Üye"ye çevrilen kişinin kaydı silinir, üye olmayanların kayıtları atılır', () => {
    expect(
      nextRoles(home(['a', 'b'], { a: 'admin', b: 'child', x: 'guest' }), 'b', 'member'),
    ).toEqual({ a: 'admin' });
  });
});

describe('mustHandOver', () => {
  it('tek yönetici, evde başkası varken ayrılamaz', () => {
    expect(mustHandOver(home(['a', 'b'], { a: 'admin' }), 'a')).toBe(true);
  });
  it('başka yönetici varsa ya da evde yalnızsa ayrılabilir', () => {
    expect(mustHandOver(home(['a', 'b'], { a: 'admin', b: 'admin' }), 'a')).toBe(false);
    expect(mustHandOver(home(['a'], { a: 'admin' }), 'a')).toBe(false);
    expect(mustHandOver(home(['a', 'b'], { a: 'admin' }), 'b')).toBe(false);
  });
});
