import { useQuery } from '@tanstack/react-query';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { GenerationStatus } from '@kaza/shared';
import { BeforeAfterSlider } from '@/components/before-after-slider';
import { apiFetch } from '@/lib/api-client';

interface GenerationDetail {
  id: string;
  version: number;
  status: GenerationStatus;
  imageUrl: string | null;
  failureReason: string | null;
}

interface RoomDetail {
  id: string;
  name: string;
  sourcePhotoUrl: string | null;
}

/** Engaging wait messages while the render is produced (§6.4, ≤ 45 s). */
const WAITING_MESSAGES = [
  'Nous étudions la lumière de votre pièce…',
  'Choix des matières et des couleurs…',
  'Placement du mobilier, respect de vos contraintes…',
  'Dernières retouches du décorateur…',
];

export default function GenerationScreen() {
  const { roomId, generationId } = useLocalSearchParams<{
    roomId: string;
    generationId: string;
  }>();
  const [messageIndex, setMessageIndex] = useState(0);

  const { data: generation } = useQuery({
    queryKey: ['generation', generationId],
    queryFn: () => apiFetch<GenerationDetail>(`/generations/${generationId}`),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'pending' || status === 'processing' ? 3000 : false;
    },
  });

  const { data: room } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => apiFetch<RoomDetail>(`/rooms/${roomId}`),
  });

  const inProgress = !generation || generation.status === 'pending' || generation.status === 'processing';

  useEffect(() => {
    if (!inProgress) {
      return;
    }
    const timer = setInterval(
      () => setMessageIndex((index) => (index + 1) % WAITING_MESSAGES.length),
      4000,
    );
    return () => clearInterval(timer);
  }, [inProgress]);

  if (inProgress) {
    return (
      <View className="flex-1 items-center justify-center bg-forest-deep px-10">
        {/* Breathing swatches — the quiet wait, no spinner anxiety. */}
        <View className="flex-row gap-2">
          <View className="h-3 w-14 rounded-full bg-clay" />
          <View className="h-3 w-14 rounded-full bg-gold opacity-70" />
          <View className="h-3 w-14 rounded-full bg-sand-deep opacity-40" />
        </View>
        <Text className="mt-10 text-center font-display text-2xl leading-8 text-paper">
          {WAITING_MESSAGES[messageIndex]}
        </Text>
        <Text className="mt-4 text-center font-sans text-sm text-sand">
          Généralement 15 à 40 secondes. Vous pouvez continuer à utiliser l’app, nous vous
          préviendrons.
        </Text>
      </View>
    );
  }

  if (generation.status === 'failed') {
    return (
      <View className="flex-1 items-center justify-center bg-paper px-10">
        <Text className="text-center font-display text-2xl text-ink">
          La génération n’a pas abouti
        </Text>
        <Text className="mt-3 text-center font-sans text-base leading-6 text-ink/60">
          Votre crédit a été remboursé. Réessayez dans quelques instants.
        </Text>
        <Link href={{ pathname: '/rooms/[roomId]/chat', params: { roomId } }} asChild>
          <Pressable className="mt-8 rounded-2xl bg-forest px-8 py-4 active:bg-forest-soft">
            <Text className="font-sans-medium text-paper">Revenir à l’entretien</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-paper">
      <SafeAreaView className="flex-1 px-5">
        <View className="flex-row items-baseline justify-between px-2 pt-2">
          <Text className="font-display text-2xl text-ink">{room?.name ?? 'Votre pièce'}</Text>
          <Text className="font-sans text-xs uppercase tracking-[2px] text-forest-soft">
            Version {generation.version}
          </Text>
        </View>

        <View className="mt-4 flex-1">
          {generation.imageUrl && room?.sourcePhotoUrl ? (
            <BeforeAfterSlider beforeUrl={room.sourcePhotoUrl} afterUrl={generation.imageUrl} />
          ) : null}
        </View>

        <View className="gap-3 pb-4 pt-5">
          <Link href={{ pathname: '/rooms/[roomId]/chat', params: { roomId } }} asChild>
            <Pressable className="items-center rounded-2xl bg-clay py-4 active:bg-clay-soft">
              <Text className="font-sans-medium text-base text-paper">
                Ajuster par le chat — « moins de jaune, un tapis plus grand »
              </Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    </View>
  );
}
