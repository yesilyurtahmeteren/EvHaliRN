import i18n from '@/shared/i18n';

describe('i18n', () => {
  it('Türkçe metinleri döndürür', () => {
    expect(i18n.language).toBe('tr');
    expect(i18n.t('nav.shopping')).toBe('Alışveriş');
    expect(i18n.t('common.appName')).toBe('Ev Hali');
  });
});
