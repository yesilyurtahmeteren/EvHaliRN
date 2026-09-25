// Liste ekranının parçaları: bölüm başlığı, Alınanlar, boş durum, çevrimdışı
// bandı (Main.dc.html).
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Animated, {
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AppIconMark } from '@/shared/components/app-icon-mark';
import { AppText } from '@/shared/components/app-text';
import { Box } from '@/shared/components/box';
import { Card } from '@/shared/components/card';
import { Icon } from '@/shared/components/icon';
import { Floaty, Pop, Rise } from '@/shared/components/motion';
import { PressScale } from '@/shared/components/press-scale';
import { categoryLook } from '@/shared/lib/category-look';
import type { Item, ItemCategory } from '@/shared/schemas';
import { Durations, Ease } from '@/shared/theme';

export function CategoryHeader({
  category,
  count,
  delay,
}: {
  category: ItemCategory;
  count: number;
  delay: number;
}) {
  const { t } = useTranslation();
  const look = categoryLook[category];
  return (
    <Rise
      delay={delay}
      style={{
        marginTop: 24,
        marginBottom: 10,
        marginHorizontal: 2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Box
        bg={look.bg}
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={look.icon} size={22} color={look.fg} />
      </Box>
      <AppText size={20} weight="bold" scaled accessibilityRole="header" style={{ flex: 1 }}>
        {t(`categories.${category}`)}
      </AppText>
      <Box
        bg="well"
        style={{
          height: 28,
          minWidth: 28,
          paddingHorizontal: 10,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppText size={15} weight="bold">
          {String(count)}
        </AppText>
      </Box>
    </Rise>
  );
}

export function EmptyListCard() {
  const { t } = useTranslation();
  return (
    <Pop style={{ marginTop: 16 }}>
      <Card
        style={{
          paddingVertical: 32,
          paddingHorizontal: 24,
          borderRadius: 28,
          alignItems: 'center',
        }}
      >
        <Floaty>
          <Box
            bg="well"
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIconMark size={76} radius={22} />
          </Box>
        </Floaty>
        <AppText size={22} weight="bold" style={{ marginTop: 20, marginBottom: 6 }}>
          {t('list.emptyTitle')}
        </AppText>
        <AppText
          size={16}
          lineHeight={1.5}
          scaled
          tone="ink2"
          style={{ maxWidth: 270, textAlign: 'center' }}
        >
          {t('list.emptyBody')}
        </AppText>
      </Card>
    </Pop>
  );
}

// "Alınanlar": varsayılan kapalı, "Göster/Gizle" + 180° dönen ok (350 ms).
export function BoughtSection({
  items,
  open,
  readOnly,
  onToggle,
  onRestore,
}: {
  items: readonly Item[];
  open: boolean;
  readOnly: boolean;
  onToggle: () => void;
  onRestore: (item: Item) => void;
}) {
  const { t } = useTranslation();
  const turn = useSharedValue(open ? 1 : 0);
  useEffect(() => {
    turn.value = withTiming(open ? 1 : 0, { duration: Durations.chevron, easing: Ease.easeOut });
  }, [open, turn]);
  const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 180}deg` }] }));

  return (
    <Rise delay={440} style={{ marginTop: 24 }}>
      <Box bg="well" style={{ padding: 6, borderRadius: 24 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${t('list.boughtTitle')}, ${items.length}`}
          onPress={onToggle}
          style={{
            height: 60,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 14,
          }}
        >
          <Icon name="circleCheck" size={24} color="brand" strokeWidth={2} />
          <AppText size={18} weight="bold" scaled>
            {t('list.boughtTitle')}
          </AppText>
          <Box
            bg="card"
            style={{
              height: 26,
              minWidth: 26,
              paddingHorizontal: 8,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppText size={14} weight="bold">
              {String(items.length)}
            </AppText>
          </Box>
          <View style={{ flex: 1 }} />
          <AppText size={15} weight="semibold" tone="ink2">
            {open ? t('list.hide') : t('list.show')}
          </AppText>
          <Animated.View style={chevron}>
            <Icon name="chevronDown" size={22} color="ink2" strokeWidth={2.2} />
          </Animated.View>
        </Pressable>
        {open && (
          <View style={{ gap: 6, paddingTop: 2, paddingHorizontal: 4, paddingBottom: 6 }}>
            {items.map((item, index) => (
              <Animated.View
                key={item.id}
                layout={LinearTransition.duration(300)}
                exiting={FadeOut.duration(200)}
              >
                <Rise delay={index * 60}>
                  <Box
                    bg="card"
                    style={{
                      minHeight: 60,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingVertical: 6,
                      paddingRight: 6,
                      paddingLeft: 14,
                      borderRadius: 16,
                    }}
                  >
                    <Box
                      bg="btn"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name="check" size={15} color="#ffffff" strokeWidth={3} />
                    </Box>
                    <AppText size={16} scaled tone="ink2" strike style={{ flex: 1, minWidth: 0 }}>
                      {item.name}
                    </AppText>
                    {!readOnly && (
                      <PressScale
                        bg="well"
                        accessibilityRole="button"
                        accessibilityLabel={t('list.restoreLabel', { name: item.name })}
                        onPress={() => onRestore(item)}
                        style={{
                          height: 48,
                          paddingHorizontal: 14,
                          borderRadius: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Icon name="undo" size={18} color="brand" strokeWidth={2.2} />
                        <AppText size={15} weight="bold" tone="brand">
                          {t('list.restore')}
                        </AppText>
                      </PressScale>
                    )}
                  </Box>
                </Rise>
              </Animated.View>
            ))}
          </View>
        )}
      </Box>
    </Rise>
  );
}

// Veri yerel önbellekten geliyor: eklemeler bağlanınca gönderilecek
// (HANDOFF §6: başlığın altında ince bir bant).
export function OfflineBanner() {
  const { t } = useTranslation();
  return (
    <Box
      bg="honey"
      accessibilityLiveRegion="polite"
      style={{ paddingVertical: 8, paddingHorizontal: 20 }}
    >
      <AppText size={14} weight="semibold" tone="honeyFg">
        {t('shell.offlineBanner')}
      </AppText>
    </Box>
  );
}
