// Flutter utils/feedback.dart _friendlyErrorMessage karşılığı: teknik hata
// kullanıcıya gösterilmez, anlaşılır bir Türkçe mesaja eşlenir.
//
// RNFB hata kodları modül önekli gelir ("firestore/permission-denied");
// önek olmadan gelen kodlar da (web SDK biçimi) aynı şekilde tanınır.

export type FriendlyErrorKey = 'errors.permissionDenied' | 'errors.generic';

export function errorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return undefined;
  }
  const { code } = error as { code: unknown };
  if (typeof code !== 'string') {
    return undefined;
  }
  const slash = code.indexOf('/');
  return slash === -1 ? code : code.slice(slash + 1);
}

export function isPermissionDenied(error: unknown): boolean {
  return errorCode(error) === 'permission-denied';
}

export function friendlyErrorKey(error: unknown): FriendlyErrorKey {
  return isPermissionDenied(error) ? 'errors.permissionDenied' : 'errors.generic';
}
