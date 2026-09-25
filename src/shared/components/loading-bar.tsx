import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

// Flutter widgets/loading_bar.dart karşılığı: 3dp belirsiz lineer gösterge.
// Buton bağlamlarında spinner yerine kullanılır (işlem sürerken buton bunun
// yerine geçer, bkz. Button `loading`).
const segmentRatio = 0.4;
const cycleMs = 1400;

export function LoadingBar({ width }: { width?: number }) {
  const { t } = useTranslation();
  const [trackWidth, setTrackWidth] = useState(width ?? 0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: cycleMs, easing: Easing.inOut(Easing.ease) }),
      -1,
    );
    return () => cancelAnimation(progress);
  }, [progress]);

  const segmentStyle = useAnimatedStyle(() => {
    const segment = trackWidth * segmentRatio;
    return {
      width: segment,
      transform: [{ translateX: -segment + progress.value * (trackWidth + segment) }],
    };
  });

  const onLayout = (event: LayoutChangeEvent) => {
    if (width === undefined) {
      setTrackWidth(event.nativeEvent.layout.width);
    }
  };

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t('common.loading')}
      onLayout={onLayout}
      className="h-[3px] overflow-hidden rounded-full bg-primary-container"
      style={width !== undefined ? { width } : { alignSelf: 'stretch' }}
    >
      <Animated.View className="h-full rounded-full bg-primary" style={segmentStyle} />
    </View>
  );
}
