import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';

import { AppText } from '@/shared/components/app-text';
import { useToastStore } from '@/shared/components/toast/toast-store';
import { useAppTheme } from '@/shared/theme/theme-provider';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

// Sekme route adı -> ikon. Alışveriş (index) ortadaki taşan düğme.
const icons: Record<string, { icon: IconName; selectedIcon: IconName }> = {
  home: { icon: 'home', selectedIcon: 'home' },
  profile: { icon: 'person-outline', selectedIcon: 'person' },
};
const centerRoute = 'index';

// Flutter MainShell _EvHaliBottomBar: beyaz zemin, yukarı doğru yumuşak
// adaçayı gölge; ortadaki yeşil sepet düğmesi çubuğun 14px üstüne taşar.
export function ShellTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { colors } = useAppTheme();
  const setBottomOffset = useToastStore((s) => s.setBottomOffset);

  // Toast mesajları çubuğun altında kalmasın.
  useEffect(() => () => setBottomOffset(0), [setBottomOffset]);
  const onLayout = (event: LayoutChangeEvent) => setBottomOffset(event.nativeEvent.layout.height);

  return (
    <View
      testID="shell-tab-bar"
      onLayout={onLayout}
      className="flex-row items-end bg-surface-container-lowest px-lg pt-sm"
      style={{
        paddingBottom: insets.bottom + 8,
        boxShadow: [{ offsetX: 0, offsetY: -2, blurRadius: 16, color: `${colors.primary}14` }],
      }}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const color = focused ? colors.primary : colors['on-surface-variant'];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const isCenter = route.name === centerRoute;
        const icon = icons[route.name];

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            className="flex-1 items-center rounded-full py-xs active:opacity-70"
          >
            {isCenter ? (
              <>
                <View
                  className="h-[52px] w-[52px] items-center justify-center rounded-full bg-primary"
                  style={{
                    marginTop: -14,
                    boxShadow: [
                      { offsetX: 0, offsetY: 6, blurRadius: 16, color: `${colors.primary}59` },
                    ],
                  }}
                >
                  <MaterialIcons name="shopping-basket" size={24} color={colors['on-primary']} />
                </View>
                <AppText variant="label-sm" style={{ color, marginTop: 2 }}>
                  {label}
                </AppText>
              </>
            ) : (
              <>
                <MaterialIcons
                  name={focused ? icon?.selectedIcon : icon?.icon}
                  size={24}
                  color={color}
                />
                <AppText variant="label-sm" style={{ color, marginTop: 2 }}>
                  {label}
                </AppText>
              </>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
