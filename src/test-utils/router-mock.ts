// expo-router: gerçek modül (tema sabitleri için) + testte odak etkisi
// bağlandığında bir kez çalışır.
export function mockExpoRouter() {
  const { useEffect } = jest.requireActual('react');
  return {
    ...jest.requireActual('expo-router'),
    useFocusEffect: (cb: () => void) => useEffect(cb, [cb]),
    useNavigation: () => ({ goBack: mockGoBack }),
    router: { navigate: jest.fn() },
  };
}
export const mockGoBack = jest.fn();
