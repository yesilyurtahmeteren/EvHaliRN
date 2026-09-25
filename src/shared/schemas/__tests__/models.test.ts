import {
  appUserSchema,
  homeEventSchema,
  parseCategory,
  roleOf,
  wantsAddedPush,
  wantsBoughtPush,
  catalogItemSchema,
  homeSchema,
  inviteSchema,
  itemCategories,
  itemCategorySchema,
  itemSchema,
  itemUnits,
} from '@/shared/schemas';

// Flutter'da JSON fixture yoktu; aşağıdaki örnekler CLAUDE.md §3 veri
// modelindeki gerçek doküman biçimleri. Timestamp, RNFB Timestamp gibi
// yalnızca toDate() taşıyan bir nesne.
const ts = (iso: string) => ({ toDate: () => new Date(iso) });

describe('appUserSchema', () => {
  it('tam dokümanı okur, yazılıp okunmayan pushTokens alanını atar', () => {
    const user = appUserSchema.parse({
      uid: 'u1',
      displayName: 'Ayşe Yılmaz',
      photoUrl: 'https://example.com/a.png',
      homeId: 'h1',
      pushTokens: ['sub-1'],
      notificationsEnabled: false,
      textScale: 1.15,
    });
    expect(user).toEqual({
      uid: 'u1',
      displayName: 'Ayşe Yılmaz',
      photoUrl: 'https://example.com/a.png',
      homeId: 'h1',
      notificationsEnabled: false,
      textScale: 1.15,
    });
  });

  it('yeni iki bildirim tercihi yoksa eski tek anahtar geçerli', () => {
    const old = appUserSchema.parse({ uid: 'u1', notificationsEnabled: false });
    expect(wantsAddedPush(old)).toBe(false);
    expect(wantsBoughtPush(old)).toBe(false);
    const split = appUserSchema.parse({ uid: 'u1', notifyAdded: true, notifyBought: false });
    expect(wantsAddedPush(split)).toBe(true);
    expect(wantsBoughtPush(split)).toBe(false);
  });

  it('ilk girişte oluşturulan minimal dokümanda Flutter varsayılanlarını kullanır', () => {
    const user = appUserSchema.parse({ uid: 'u1', displayName: '', photoUrl: null, homeId: null });
    expect(user.notificationsEnabled).toBe(true);
    expect(user.textScale).toBe(1.0);
    expect(user.homeId).toBeNull();
  });

  it('null displayName boş metne düşer', () => {
    expect(appUserSchema.parse({ uid: 'u1', displayName: null }).displayName).toBe('');
  });

  it('yanlış türdeki alanı reddeder', () => {
    expect(appUserSchema.safeParse({ uid: 'u1', homeId: 42 }).success).toBe(false);
  });
});

describe('homeSchema', () => {
  it('ev dokümanını okur', () => {
    const home = homeSchema.parse({
      id: 'h1',
      name: 'Yeşilyurt Evi',
      memberIds: ['u1', 'u2'],
      inviteCode: 'AB7K9TQX',
      createdAt: ts('2026-09-18T10:00:00Z'),
    });
    expect(home).toEqual({
      id: 'h1',
      name: 'Yeşilyurt Evi',
      memberIds: ['u1', 'u2'],
      inviteCode: 'AB7K9TQX',
      roles: null,
    });
  });

  it('roller: haritada olmayan üye "member"; harita yoksa kurucu yönetici', () => {
    const legacy = homeSchema.parse({ id: 'h', memberIds: ['u1', 'u2'] });
    expect(roleOf(legacy, 'u1')).toBe('admin');
    expect(roleOf(legacy, 'u2')).toBe('member');
    const withRoles = homeSchema.parse({
      id: 'h',
      memberIds: ['u1', 'u2', 'u3'],
      roles: { u2: 'admin', u3: 'guest', u9: 'king' },
    });
    expect(roleOf(withRoles, 'u1')).toBe('member');
    expect(roleOf(withRoles, 'u2')).toBe('admin');
    expect(roleOf(withRoles, 'u3')).toBe('guest');
    expect(withRoles.roles?.u9).toBe('member');
  });

  it('Faz 2/3 döneminden kalan davet kodsuz evde boş kod döner', () => {
    const home = homeSchema.parse({ id: 'h1', name: 'Ev', memberIds: ['u1'] });
    expect(home.inviteCode).toBe('');
  });
});

describe('itemSchema', () => {
  const full = {
    id: 'i1',
    name: 'Süt',
    status: 'bought',
    addedBy: 'u1',
    addedAt: ts('2026-09-20T08:00:00Z'),
    boughtBy: 'u2',
    boughtAt: ts('2026-09-20T18:30:00Z'),
    notified: true,
    quantity: 2,
    note: 'Pınar',
    unit: 'litre',
    urgent: true,
  };

  it('tam dokümanı okur', () => {
    const item = itemSchema.parse(full);
    expect(item).toEqual({
      id: 'i1',
      name: 'Süt',
      status: 'bought',
      addedBy: 'u1',
      addedAt: new Date('2026-09-20T08:00:00Z'),
      boughtBy: 'u2',
      boughtAt: new Date('2026-09-20T18:30:00Z'),
      quantity: 2,
      note: 'Pınar',
      unit: 'litre',
      urgent: true,
    });
  });

  it('Faz 7 öncesi eski kayıtta quantity/note/unit/urgent varsayılanlarını kullanır', () => {
    const item = itemSchema.parse({
      id: 'i2',
      name: 'Ekmek',
      status: 'needed',
      addedBy: 'u1',
      addedAt: ts('2026-09-01T08:00:00Z'),
      boughtBy: null,
      boughtAt: null,
    });
    expect(item).toMatchObject({ quantity: 1, note: null, unit: 'adet', urgent: false });
    expect(item.boughtAt).toBeNull();
  });

  it('gönderilmeyi bekleyen yazmada null addedAt şimdiki zamana düşer', () => {
    const before = Date.now();
    const item = itemSchema.parse({ ...full, addedAt: null });
    expect(item.addedAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('bilinmeyen status needed, bilinmeyen birim adet olur', () => {
    const item = itemSchema.parse({ ...full, status: 'archived', unit: 'kasa' });
    expect(item.status).toBe('needed');
    expect(item.unit).toBe('adet');
  });

  it('ondalıklı miktarı reddeder', () => {
    expect(itemSchema.safeParse({ ...full, quantity: 1.5 }).success).toBe(false);
  });
});

describe('catalogItemSchema', () => {
  it('katalog kaydını okur', () => {
    const entry = catalogItemSchema.parse({
      id: 'süt',
      name: 'Süt',
      count: 14,
      lastUsedAt: ts('2026-09-20T08:00:00Z'),
      category: 'food',
    });
    expect(entry).toEqual({ id: 'süt', name: 'Süt', count: 14, category: 'food' });
  });

  it("Flutter sürümünün eski 10'lu kategorilerini 4'lüye çevirir", () => {
    const parse = (category: string) =>
      catalogItemSchema.parse({ id: 'a', name: 'A', count: 1, category }).category;
    expect(parse('dairy_breakfast')).toBe('food');
    expect(parse('bakery')).toBe('food');
    expect(parse('cleaning')).toBe('clean');
    expect(parse('personal_care')).toBe('care');
    expect(parse('other')).toBe('other');
  });

  it('kategorisiz ya da listede olmayan kategoriyi null yapar', () => {
    expect(catalogItemSchema.parse({ id: 'a', name: 'A', count: 1 }).category).toBeNull();
    expect(catalogItemSchema.parse({ id: 'a', name: 'A', count: 1, category: 'x' }).category).toBe(
      null,
    );
  });
});

describe('inviteSchema', () => {
  it('davet dokümanını okur', () => {
    const invite = inviteSchema.parse({
      code: 'AB7K9TQX',
      homeId: 'h1',
      createdAt: ts('2026-09-18T10:00:00Z'),
    });
    expect(invite.homeId).toBe('h1');
  });

  it('homeId olmayan daveti reddeder', () => {
    expect(inviteSchema.safeParse({ code: 'AB7K9TQX' }).success).toBe(false);
  });
});

describe('homeEventSchema', () => {
  it('bildirim kaydını okur, bilinmeyen türü reddeder', () => {
    const event = homeEventSchema.parse({
      id: 'e1',
      type: 'bought',
      actorId: 'u1',
      count: 2,
      itemNames: ['Süt', 'Ekmek'],
      createdAt: ts('2026-09-25T10:00:00Z'),
      readBy: ['u1'],
    });
    expect(event.type).toBe('bought');
    expect(event.readBy).toEqual(['u1']);
    expect(homeEventSchema.safeParse({ id: 'e2', type: 'location' }).success).toBe(false);
  });
});

describe('enum listeleri', () => {
  it('firestore.rules ile aynı bölüm ve birim listeleri', () => {
    expect(itemCategories).toEqual(['food', 'clean', 'care', 'other']);
    expect(itemUnits).toEqual(['adet', 'kg', 'g', 'litre', 'paket', 'kutu']);
    expect(itemCategorySchema.safeParse('frozen').success).toBe(false);
    expect(parseCategory('snack')).toBe('food');
    expect(parseCategory(42)).toBeNull();
  });
});
