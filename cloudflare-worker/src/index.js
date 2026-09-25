// Ev Hali - bildirim tetikleyici (Faz 5, 2026-09-25'te genisletildi)
//
// Her 60 saniyede bir calisir:
//   - status=='needed' && notified==false urunleri ekleyene ve eve gore
//     gruplar, (ekleyen haric) "Yeni eklenenler" tercihi acik uyelere tek
//     toplu bildirim gonderir, Bildirimler ekrani icin 'added' kaydi yazar.
//   - status=='bought' && boughtNotified==false urunler icin ayni seyi
//     "Alinanlar" tercihiyle yapar ('bought' kaydi).
// Her gun 06:00 UTC'de (09:00 TR): 3 gunden uzun bekleyen urunler icin
// 'reminder' kaydi ve 14 gunden eski kayitlarin temizligi; pazartesileri
// ayrica 'weekly' (haftalik ozet) kaydi. Bunlar push gondermez, yalnizca
// uygulama icindeki Bildirimler ekraninda gorunur.
//
// Sirlar (wrangler secret put ile eklenir, bu dosyada YOK):
//   FIREBASE_SERVICE_ACCOUNT_JSON - Firebase servis hesabi JSON'unun tamami
//   ONESIGNAL_REST_API_KEY       - OneSignal REST API anahtari

function base64UrlEncodeBytes(bytes) {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlEncodeString(str) {
  return base64UrlEncodeBytes(new TextEncoder().encode(str));
}

function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function getGoogleAccessToken(serviceAccount) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const nowSec = Math.floor(Date.now() / 1000);
  const claims = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: nowSec,
    exp: nowSec + 3600,
  };

  const signingInput =
    base64UrlEncodeString(JSON.stringify(header)) +
    '.' +
    base64UrlEncodeString(JSON.stringify(claims));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(serviceAccount.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput),
  );

  const jwt = signingInput + '.' + base64UrlEncodeBytes(new Uint8Array(signature));

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
}

function firestoreBaseUrl(projectId) {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
}

const DOCS_PREFIX = (projectId) => `projects/${projectId}/databases/(default)/documents`;

async function firestoreFetch(accessToken, url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      `Firestore ${url.split(':').pop()} failed: ${response.status} ${await response.text()}`,
    );
  }
  return response.json();
}

// ---- Firestore REST deger donusumleri ----

function fieldToString(field) {
  return field?.stringValue ?? '';
}

function fieldToBool(field) {
  return typeof field?.booleanValue === 'boolean' ? field.booleanValue : undefined;
}

function fieldToArray(field) {
  return (field?.arrayValue?.values ?? []).map((v) => v.stringValue).filter(Boolean);
}

function fieldToDate(field) {
  return field?.timestampValue ? new Date(field.timestampValue) : null;
}

function toValue(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return { integerValue: String(Math.trunc(value)) };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toValue) } };
  throw new Error(`Unsupported value: ${value}`);
}

function toFields(obj) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toValue(v)]));
}

// ---- sorgular ----

// items collectionGroup sorgusu; filters: [[fieldPath, op, value], ...]
async function queryItems(accessToken, projectId, filters, limit = 300) {
  const rows = await firestoreFetch(accessToken, `${firestoreBaseUrl(projectId)}:runQuery`, {
    structuredQuery: {
      from: [{ collectionId: 'items', allDescendants: true }],
      where: {
        compositeFilter: {
          op: 'AND',
          filters: filters.map(([fieldPath, op, value]) => ({
            fieldFilter: { field: { fieldPath }, op, value: toValue(value) },
          })),
        },
      },
      limit,
    },
  });

  const items = [];
  for (const row of rows) {
    if (!row.document) continue;
    const match = row.document.name.match(/\/documents\/homes\/([^/]+)\/items\/([^/]+)$/);
    if (!match) continue;
    const [, homeId, itemId] = match;
    const f = row.document.fields ?? {};
    items.push({
      homeId,
      itemId,
      name: fieldToString(f.name),
      addedBy: fieldToString(f.addedBy),
      boughtBy: fieldToString(f.boughtBy),
      addedAt: fieldToDate(f.addedAt),
      remindedAt: fieldToDate(f.remindedAt),
    });
  }
  return items;
}

async function listHomeIds(accessToken, projectId) {
  const ids = [];
  let pageToken;
  do {
    const url = new URL(`${firestoreBaseUrl(projectId)}/homes`);
    url.searchParams.set('pageSize', '300');
    url.searchParams.set('mask.fieldPaths', 'name');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!response.ok) {
      throw new Error(`Firestore list homes failed: ${response.status} ${await response.text()}`);
    }
    const data = await response.json();
    for (const d of data.documents ?? []) ids.push(d.name.split('/').pop());
    pageToken = data.nextPageToken;
  } while (pageToken);
  return ids;
}

async function batchGetDocuments(accessToken, projectId, relativePaths) {
  if (relativePaths.length === 0) return {};
  const rows = await firestoreFetch(accessToken, `${firestoreBaseUrl(projectId)}:batchGet`, {
    documents: relativePaths.map((p) => `${DOCS_PREFIX(projectId)}/${p}`),
  });
  const result = {};
  for (const row of rows) {
    if (!row.found) continue;
    const relativePath = row.found.name.split('/documents/')[1];
    result[relativePath] = row.found.fields ?? {};
  }
  return result;
}

// Tek commit en fazla 500 yazma alir.
async function commitWrites(accessToken, projectId, writes) {
  for (let i = 0; i < writes.length; i += 450) {
    await firestoreFetch(accessToken, `${firestoreBaseUrl(projectId)}:commit`, {
      writes: writes.slice(i, i + 450),
    });
  }
}

function patchWrite(projectId, path, fields) {
  return {
    update: { name: `${DOCS_PREFIX(projectId)}/${path}`, fields: toFields(fields) },
    updateMask: { fieldPaths: Object.keys(fields) },
  };
}

// Bildirimler ekrani kaydi (homes/{homeId}/events). Kimlik Firestore'a
// birakilmadigi icin rastgele uretilir; readBy baslangicta yapan kisi
// (kendi eylemi okunmamis sayilmaz).
function eventWrite(projectId, homeId, fields) {
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
  return {
    update: {
      name: `${DOCS_PREFIX(projectId)}/homes/${homeId}/events/${id}`,
      fields: toFields({ createdAt: new Date(), ...fields }),
    },
    currentDocument: { exists: false },
  };
}

async function sendOneSignalNotification(apiKey, appId, subscriptionIds, message, data) {
  if (subscriptionIds.length === 0) return;
  const response = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: {
      Authorization: `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_id: appId,
      target_channel: 'push',
      include_subscription_ids: subscriptionIds,
      contents: { en: message },
      data,
    }),
  });

  if (!response.ok) {
    console.error('OneSignal send failed', response.status, await response.text());
  }
}

// ---- eklenen / alinan urun bildirimleri (dakikalik) ----

// Uye tercihi: yeni alan yoksa eski tek anahtar (notificationsEnabled), o
// da yoksa acik. Flutter surumu yalnizca notificationsEnabled yaziyor.
function wantsPush(userFields, prefField) {
  const specific = fieldToBool(userFields?.[prefField]);
  if (specific !== undefined) return specific;
  return fieldToBool(userFields?.notificationsEnabled) ?? true;
}

function pushMessage(kind, actorName, names) {
  if (kind === 'added') {
    return names.length === 1
      ? `${actorName} listeye ${names[0]} ekledi`
      : `${actorName} ${names.length} ürün ekledi`;
  }
  return names.length === 1
    ? `${actorName} ${names[0]} aldı`
    : `${actorName} ${names.length} ürün aldı`;
}

// kind: 'added' | 'bought'. items: queryItems sonucu, actorOf: urunun
// eylemini yapan uid. Her (ev, kisi) cifti tek bildirim + tek kayit.
async function notifyGroups(env, accessToken, kind, items, actorOf, flagField, prefField) {
  const projectId = env.FIREBASE_PROJECT_ID;
  if (items.length === 0) return { processed: 0, notificationsSent: 0 };

  const groups = new Map();
  for (const item of items) {
    const actor = actorOf(item);
    const key = `${item.homeId}|${actor}`;
    if (!groups.has(key)) groups.set(key, { homeId: item.homeId, actor, items: [] });
    groups.get(key).items.push(item);
  }

  const homeIds = [...new Set(items.map((i) => i.homeId))];
  const homeDocs = await batchGetDocuments(
    accessToken,
    projectId,
    homeIds.map((id) => `homes/${id}`),
  );
  const homeMemberIds = {};
  const allUids = new Set();
  for (const homeId of homeIds) {
    const memberIds = fieldToArray(homeDocs[`homes/${homeId}`]?.memberIds);
    homeMemberIds[homeId] = memberIds;
    for (const uid of memberIds) allUids.add(uid);
  }
  for (const g of groups.values()) allUids.add(g.actor);
  const userDocs = await batchGetDocuments(
    accessToken,
    projectId,
    [...allUids].map((uid) => `users/${uid}`),
  );

  let notificationsSent = 0;
  const writes = [];

  for (const { homeId, actor, items: groupItems } of groups.values()) {
    const actorName =
      fieldToString(userDocs[`users/${actor}`]?.displayName).split(' ')[0] || 'Birisi';
    const names = groupItems.map((i) => i.name).filter(Boolean);

    const subscriptionIds = [];
    for (const uid of homeMemberIds[homeId] ?? []) {
      if (uid === actor) continue; // yapana kendi bildirimi gitmez
      const fields = userDocs[`users/${uid}`];
      if (!wantsPush(fields, prefField)) continue;
      subscriptionIds.push(...fieldToArray(fields?.pushTokens));
    }

    if (subscriptionIds.length > 0) {
      await sendOneSignalNotification(
        env.ONESIGNAL_REST_API_KEY,
        env.ONESIGNAL_APP_ID,
        subscriptionIds,
        pushMessage(kind, actorName, names),
        { homeId },
      );
      notificationsSent += 1;
    }

    // Ev silinmis/uyesiz kalmissa kayit yazmaya gerek yok, yalnizca isaretle.
    if ((homeMemberIds[homeId] ?? []).length > 0) {
      writes.push(
        eventWrite(projectId, homeId, {
          type: kind,
          actorId: actor,
          count: groupItems.length,
          itemNames: names.slice(0, 3),
          readBy: [actor],
        }),
      );
    }
    for (const item of groupItems) {
      writes.push(
        patchWrite(projectId, `homes/${homeId}/items/${item.itemId}`, { [flagField]: true }),
      );
    }
  }

  await commitWrites(accessToken, projectId, writes);
  return { processed: items.length, notificationsSent };
}

async function processNotifications(env) {
  const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  const projectId = env.FIREBASE_PROJECT_ID;
  const accessToken = await getGoogleAccessToken(serviceAccount);

  const added = await queryItems(accessToken, projectId, [
    ['status', 'EQUAL', 'needed'],
    ['notified', 'EQUAL', false],
  ]);
  const addedResult = await notifyGroups(
    env,
    accessToken,
    'added',
    added,
    (i) => i.addedBy,
    'notified',
    'notifyAdded',
  );

  // boughtNotified alani olmayan (eski) kayitlar sorguya girmez - bildirim
  // yalnizca yeni surumle isaretlenen urunler icin gider.
  const bought = await queryItems(accessToken, projectId, [
    ['status', 'EQUAL', 'bought'],
    ['boughtNotified', 'EQUAL', false],
  ]);
  const boughtResult = await notifyGroups(
    env,
    accessToken,
    'bought',
    bought.filter((i) => i.boughtBy),
    (i) => i.boughtBy,
    'boughtNotified',
    'notifyBought',
  );

  return { added: addedResult, bought: boughtResult };
}

// ---- gunluk / haftalik isler (06:00 UTC) ----

const DAY_MS = 24 * 60 * 60 * 1000;

async function processDaily(env, now = new Date()) {
  const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  const projectId = env.FIREBASE_PROJECT_ID;
  const accessToken = await getGoogleAccessToken(serviceAccount);
  const writes = [];

  // Hatirlatma: 3 gunden uzun bekleyen ve daha once hatirlatilmamis urunler,
  // ev basina tek kayit.
  const stale = (
    await queryItems(accessToken, projectId, [
      ['status', 'EQUAL', 'needed'],
      ['addedAt', 'LESS_THAN', new Date(now.getTime() - 3 * DAY_MS)],
    ])
  ).filter((i) => !i.remindedAt);
  const staleByHome = new Map();
  for (const item of stale) {
    if (!staleByHome.has(item.homeId)) staleByHome.set(item.homeId, []);
    staleByHome.get(item.homeId).push(item);
  }
  for (const [homeId, items] of staleByHome) {
    writes.push(
      eventWrite(projectId, homeId, {
        type: 'reminder',
        count: items.length,
        itemNames: items
          .map((i) => i.name)
          .filter(Boolean)
          .slice(0, 3),
        readBy: [],
      }),
    );
    for (const item of items) {
      writes.push(
        patchWrite(projectId, `homes/${homeId}/items/${item.itemId}`, { remindedAt: now }),
      );
    }
  }

  // Haftalik ozet: pazartesi, son 7 gunde alinanlar (0 olan eve yazilmaz).
  let weekly = 0;
  if (now.getUTCDay() === 1) {
    const boughtWeek = await queryItems(
      accessToken,
      projectId,
      [
        ['status', 'EQUAL', 'bought'],
        ['boughtAt', 'GREATER_THAN_OR_EQUAL', new Date(now.getTime() - 7 * DAY_MS)],
      ],
      5000,
    );
    const counts = new Map();
    for (const item of boughtWeek) counts.set(item.homeId, (counts.get(item.homeId) ?? 0) + 1);
    for (const [homeId, count] of counts) {
      writes.push(eventWrite(projectId, homeId, { type: 'weekly', count, readBy: [] }));
      weekly += 1;
    }
  }

  // 14 gunden eski kayitlarin temizligi.
  let deleted = 0;
  const cutoff = new Date(now.getTime() - 14 * DAY_MS);
  for (const homeId of await listHomeIds(accessToken, projectId)) {
    const rows = await firestoreFetch(
      accessToken,
      `${firestoreBaseUrl(projectId)}/homes/${homeId}:runQuery`,
      {
        structuredQuery: {
          from: [{ collectionId: 'events' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'createdAt' },
              op: 'LESS_THAN',
              value: toValue(cutoff),
            },
          },
          select: { fields: [] },
          limit: 400,
        },
      },
    );
    for (const row of rows) {
      if (!row.document) continue;
      writes.push({ delete: row.document.name });
      deleted += 1;
    }
  }

  await commitWrites(accessToken, projectId, writes);
  return { reminders: staleByHome.size, weekly, deleted };
}

export default {
  async scheduled(event, env, ctx) {
    const job = event.cron === '0 6 * * *' ? processDaily : processNotifications;
    ctx.waitUntil(
      job(env).then(
        (result) => console.log(`${job.name} done`, JSON.stringify(result)),
        (error) => console.error(`${job.name} failed`, error),
      ),
    );
  },

  // Manuel tetikleme / hata ayiklama icin: worker URL'sine tarayicidan girilebilir.
  // Yalnizca dakikalik isi calistirir (gunluk is kayit yazdigi icin disaridan
  // tetiklenmez).
  async fetch(request, env, ctx) {
    try {
      const result = await processNotifications(env);
      return Response.json(result);
    } catch (error) {
      return Response.json({ error: String(error) }, { status: 500 });
    }
  },
};
