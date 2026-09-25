import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/shared/components/app-text';
import { Box } from '@/shared/components/box';
import { useShadow } from '@/shared/components/card';
import { Icon, type IconName } from '@/shared/components/icon';
import { PressScale } from '@/shared/components/press-scale';
import { useToastStore } from '@/shared/components/toast/toast-store';
import { useKeyboardVisible } from '@/shared/hooks/use-keyboard-visible';
import { Durations, Ease, fixedColors, sizes } from '@/shared/theme';
import { useThemedStyle } from '@/shared/theme/use-theme-color';

export type ShellTab = 'home' | 'index' | 'profile';

// Main.dc.html alt gezinme (96 px, üst köşeler 28, `nav` zemin): Ev (sol),
// Liste (ortada yükseltilmiş 70 px FAB), Profil (sağ). Aktif sekmede ikonun
// arkasında `mint` hap 40 -> 64 px (300 ms easeOut), renk `brand`.
// Bildirimler açıkken hiçbiri aktif değildir.
export function ShellTabBar({
  active,
  onNavigate,
}: {
  active: ShellTab | null;
  onNavigate: (tab: ShellTab) => void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const shadow = useShadow('card');
  const setBottomOffset = useToastStore((s) => s.setBottomOffset);
  const keyboardVisible = useKeyboardVisible();

  useEffect(() => () => setBottomOffset(0), [setBottomOffset]);
  useEffect(() => {
    if (keyboardVisible) {
      setBottomOffset(0);
    }
  }, [keyboardVisible, setBottomOffset]);
  const onLayout = (event: LayoutChangeEvent) => setBottomOffset(event.nativeEvent.layout.height);

  // Klavye açıkken pencere küçülür; çubuk klavyenin üstüne çıkmasın.
  if (keyboardVisible) {
    return null;
  }

  return (
    <Box
      bg="nav"
      testID="shell-tab-bar"
      onLayout={onLayout}
      accessibilityRole="tablist"
      style={{
        height: sizes.bottomNavHeight + insets.bottom,
        paddingTop: 10,
        paddingHorizontal: 28,
        paddingBottom: insets.bottom,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        boxShadow: shadow.replace('0px 6px 24px -6px', '0px -8px 30px -8px'),
      }}
    >
      <SideTab
        icon="home"
        label={t('shell.navHome')}
        active={active === 'home'}
        onPress={() => onNavigate('home')}
      />
      <CenterTab
        label={t('shell.navList')}
        accessibilityLabel={t('shell.navListLabel')}
        active={active === 'index'}
        onPress={() => onNavigate('index')}
      />
      <SideTab
        icon="person"
        label={t('shell.navProfile')}
        active={active === 'profile'}
        onPress={() => onNavigate('profile')}
      />
    </Box>
  );
}

function SideTab({
  icon,
  label,
  active,
  onPress,
}: {
  icon: IconName;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const width = useSharedValue(active ? 64 : 40);
  useEffect(() => {
    width.value = withTiming(active ? 64 : 40, {
      duration: Durations.navPill,
      easing: Ease.easeOut,
    });
  }, [active, width]);
  const pillSize = useAnimatedStyle(() => ({ width: width.value }));
  const pillColor = useThemedStyle({ backgroundColor: active ? 'mint' : 'transparent' });
  const color = active ? 'brand' : 'ink2';

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{ width: 84, height: 66, alignItems: 'center', gap: 4 }}
    >
      <Animated.View
        style={[
          { height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
          pillSize,
          pillColor,
        ]}
      >
        <Icon name={icon} size={26} color={color} />
      </Animated.View>
      <AppText size={15} weight="bold" tone={color}>
        {label}
      </AppText>
    </Pressable>
  );
}

// Liste ekranındayken scale(1.06), basınca scale(.92) (300 ms spring).
function CenterTab({
  label,
  accessibilityLabel,
  active,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(active ? 1.06 : 1);
  useEffect(() => {
    scale.value = withTiming(active ? 1.06 : 1, { duration: Durations.fab, easing: Ease.spring });
  }, [active, scale]);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={{ width: 100, alignItems: 'center' }}>
      <Animated.View style={[{ marginTop: -40 }, scaleStyle]}>
        <PressScale
          bg="btn"
          border="bg"
          pressedScale={0.92}
          accessibilityRole="tab"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ selected: active }}
          onPress={onPress}
          style={{
            width: sizes.fab,
            height: sizes.fab,
            borderRadius: sizes.fab / 2,
            borderWidth: 5,
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0px 10px 22px -6px ${fixedColors.primaryShadow}`,
          }}
        >
          <Icon name="basket" size={30} color={fixedColors.onBtn} strokeWidth={2} />
        </PressScale>
      </Animated.View>
      <AppText
        size={15}
        weight="bold"
        tone={active ? 'brand' : 'ink2'}
        style={{ marginTop: 4 }}
        importantForAccessibility="no"
      >
        {label}
      </AppText>
    </View>
  );
}
