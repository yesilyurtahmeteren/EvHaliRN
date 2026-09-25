import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

// Klavye açık mı? (Android'de pencere klavyeye göre küçülür; alt sekme
// çubuğu gibi sabit öğeler klavyenin üstüne binmesin diye gizlenir.)
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}
