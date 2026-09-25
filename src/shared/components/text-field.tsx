import { useState, type Ref } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { fontFamilies, typeScale } from '@/shared/theme';
import { useTextScaleStore } from '@/shared/theme/text-scale-store';
import { useAppTheme } from '@/shared/theme/theme-provider';

import { AppText } from './app-text';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  errorText?: string;
  className?: string;
  ref?: Ref<TextInput>;
};

// Flutter theme.dart inputDecorationTheme karşılığı: kenarlıksız,
// surface-container-low dolgulu, 16 köşe; odakta 2px primary, hatada error
// kenarlık. Flutter'daki yüzen etiket yerine alanın üstünde sabit etiket
// (RN'de yüzen etiket için ek animasyon kodu gerekirdi, işlevi aynı).
export function TextField({
  label,
  errorText,
  className,
  ref,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const { colors } = useAppTheme();
  const multiplier = useTextScaleStore((s) => s.multiplier);
  const [focused, setFocused] = useState(false);
  const [fontSize, lineHeight] = typeScale['body-lg'];
  const hasError = errorText !== undefined && errorText.length > 0;

  const borderColor = hasError ? colors.error : focused ? colors.primary : 'transparent';

  return (
    <View className={`gap-xs ${className ?? ''}`}>
      {label !== undefined && (
        <AppText variant="label-lg" tone={hasError ? 'error' : 'on-surface-variant'}>
          {label}
        </AppText>
      )}
      <TextInput
        {...rest}
        ref={ref}
        accessibilityLabel={rest.accessibilityLabel ?? label}
        placeholderTextColor={colors['on-surface-variant']}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        className="min-h-[56px] rounded-md bg-surface-container-low px-md"
        style={{
          borderWidth: 2,
          borderColor,
          color: colors['on-surface'],
          fontFamily: fontFamilies.regular,
          fontSize: fontSize * multiplier,
          lineHeight: lineHeight * multiplier,
        }}
      />
      {hasError && (
        <AppText variant="body-sm" tone="error" accessibilityLiveRegion="polite">
          {errorText}
        </AppText>
      )}
    </View>
  );
}
