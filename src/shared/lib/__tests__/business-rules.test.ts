import {
  cleanInviteCode,
  formatInviteCode,
  generateInviteCode,
  inviteCodeAlphabet,
} from '@/shared/lib/invite-code';
import { joinNames } from '@/shared/lib/join-names';
import { normalizeName } from '@/shared/lib/normalize-name';

describe('normalizeName', () => {
  it('büyük/küçük harf ve uç boşluklardan bağımsız aynı ID', () => {
    expect(normalizeName('Süt')).toBe('süt');
    expect(normalizeName('süt ')).toBe('süt');
    expect(normalizeName('  SÜT')).toBe('süt');
  });

  it('Dart toLowerCase ile aynı: I -> i (ı değil), İ -> i + birleşik nokta', () => {
    expect(normalizeName('IRMAK')).toBe('irmak');
    expect(normalizeName('İncir')).toBe('i̇ncir');
    expect(normalizeName('ÇAĞLA ŞÖĞÜŞ')).toBe('çağla şöğüş');
  });

  it("'/' karakteri doküman yolunu bölmesin diye '-' olur", () => {
    expect(normalizeName('Deterjan 1/2')).toBe('deterjan 1-2');
  });
});

describe('generateInviteCode', () => {
  it('alfabe 32 karakter (sapmasız & 31 varsayımı)', () => {
    expect(inviteCodeAlphabet).toHaveLength(32);
    expect(new Set(inviteCodeAlphabet).size).toBe(32);
    expect(inviteCodeAlphabet).not.toMatch(/[01OIl]/);
  });

  it('verilen baytlardan 8 karakterlik kod üretir', () => {
    const fixed = (bytes: Uint8Array) => {
      bytes.set([0, 31, 32, 255, 1, 2, 30, 64]);
      return bytes;
    };
    expect(generateInviteCode(fixed)).toBe('A9A9BC8A');
  });

  it('gerçek rastgele kaynakla geçerli kod üretir', () => {
    const code = generateInviteCode();
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ2-9]{8}$/);
  });
});

describe('davet kodu biçimleri', () => {
  it('yapıştırılan boşluklu/küçük harfli kodu temizler', () => {
    expect(cleanInviteCode(' ab7k 9tqx\n')).toBe('AB7K9TQX');
    expect(cleanInviteCode('ab7k-9tqx')).toBe('AB7K9TQX');
  });

  it('görüntülemede 4+4 gruplar, tasarımdaki gibi tireyle', () => {
    expect(formatInviteCode('AB7K9TQX')).toBe('AB7K-9TQX');
    expect(formatInviteCode('')).toBe('');
  });
});

describe('joinNames', () => {
  it('Türkçe liste birleştirme', () => {
    expect(joinNames([], 've')).toBe('');
    expect(joinNames(['Ayşe'], 've')).toBe('Ayşe');
    expect(joinNames(['Ayşe', 'Mehmet'], 've')).toBe('Ayşe ve Mehmet');
    expect(joinNames(['Ayşe', 'Mehmet', 'Can'], 've')).toBe('Ayşe, Mehmet ve Can');
  });
});
