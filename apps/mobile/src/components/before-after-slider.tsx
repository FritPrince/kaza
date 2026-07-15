import { Image } from 'expo-image';
import { useState } from 'react';
import { LayoutChangeEvent, PanResponder, Text, View } from 'react-native';

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
}

/**
 * Before/after comparator (B6): drag the clay handle to reveal the original
 * photo under the render. Pure layout math — no extra dependency.
 */
export function BeforeAfterSlider({ beforeUrl, afterUrl }: BeforeAfterSliderProps) {
  const [width, setWidth] = useState(0);
  const [ratio, setRatio] = useState(0.5);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_event, gesture) => {
      if (width > 0) {
        setRatio(Math.min(0.95, Math.max(0.05, gesture.moveX / width)));
      }
    },
  });

  function onLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  return (
    <View onLayout={onLayout} className="aspect-[3/4] w-full overflow-hidden rounded-3xl">
      {/* After (render) fills the frame; before (photo) is clipped on top. */}
      <Image source={{ uri: afterUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      <View
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${ratio * 100}%` }}
      >
        <Image
          source={{ uri: beforeUrl }}
          style={{ width: width || '100%', height: '100%' }}
          contentFit="cover"
        />
      </View>

      <View
        {...panResponder.panHandlers}
        className="absolute inset-y-0 -ml-5 w-10 items-center justify-center"
        style={{ left: `${ratio * 100}%` }}
      >
        <View className="h-full w-0.5 bg-paper" />
        <View className="absolute h-11 w-11 items-center justify-center rounded-full bg-clay shadow-lg">
          <Text className="font-sans-medium text-xs text-paper">⇔</Text>
        </View>
      </View>

      <View className="absolute left-4 top-4 rounded-full bg-ink/50 px-3 py-1">
        <Text className="font-sans text-[11px] uppercase tracking-wider text-paper">Avant</Text>
      </View>
      <View className="absolute right-4 top-4 rounded-full bg-ink/50 px-3 py-1">
        <Text className="font-sans text-[11px] uppercase tracking-wider text-paper">Après</Text>
      </View>
    </View>
  );
}
