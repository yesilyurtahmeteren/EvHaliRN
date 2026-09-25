import { useEffect, useState, type ReactNode, type Ref } from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { darkColors, Durations, fontFamilies, lightColors } from '@/shared/theme';
import { useAppTheme } from '@/shared/theme/theme-provider';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  // Her değiştiğinde alan yatayda sallanır (boş gönderim, HANDOFF §2.3).
  shakeKey?: number;
  trailing?: ReactNode;
  ref?: Ref<TextInput>;
};

// Main.dc.html ".field": 60 px, 2 px `reed` kenarlık (odakta `brand`),
// radius 18, `card` zemin, 19 px yazı.
export function TextField({
  shakeKey = 0,
  trailing,
  ref,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const { colors, progress } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const focus = useSharedValue(0);
  const shake = useSharedValue(0);

  useEffect(() => {
    focus.value = withTiming(focused ? 1 : 0, { duration: 200 });
  }, [focus, focused]);

  useEffect(() => {
    if (shakeKey === 0) {
      return;
    }
    // @keyframes shake: -2, 4, -7, 7, -7, 7, -7, 4, -2 (450 ms, doğrusal).
    const step = Durations.shake / 10;
    shake.value = withSequence(
      ...[-2, 4, -7, 7, -7, 7, -7, 4, -2, 0].map((x) => withTiming(x, { duration: step })),
    );
  }, [shake, shakeKey]);

  const boxStyle = useAnimatedStyle(() => {
    const reed = interpolateColor(progress.value, [0, 1], [lightColors.reed, darkColors.reed]);
    const brand = interpolateColor(progress.value, [0, 1], [lightColors.brand, darkColors.brand]);
    return {
      borderColor: interpolateColor(focus.value, [0, 1], [reed, brand]),
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [lightColors.card, darkColors.card],
      ),
      transform: [{ translateX: shake.value }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          height: 60,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingLeft: 16,
          paddingRight: trailing === undefined ? 16 : 6,
          borderRadius: 18,
          borderWidth: 2,
        },
        boxStyle,
      ]}
    >
      <TextInput
        {...rest}
        ref={ref}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        placeholderTextColor={colors.muted}
        cursorColor={colors.brand}
        selectionColor={colors.brand}
        style={{
          flex: 1,
          minWidth: 0,
          height: '100%',
          fontFamily: fontFamilies.regular,
          fontSize: 19,
          color: colors.ink,
          padding: 0,
        }}
      />
      {trailing}
    </Animated.View>
  );
}
