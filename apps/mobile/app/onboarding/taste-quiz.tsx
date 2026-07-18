import { useMutation, useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '@/lib/api-client';

interface QuizCard {
  id: string;
  styles: string[];
  imageUrl: string | null;
}

interface Swipe {
  imageId: string;
  liked: boolean;
}

/** Placeholder tints when a curated image is not uploaded yet (dev). */
const STYLE_TINTS: Record<string, string> = {
  modern: '#D4C5A9',
  minimalist: '#E7DCC8',
  bohemian: '#D8825B',
  'afro-contemporary': '#B4552D',
  scandinavian: '#F3E2D7',
  industrial: '#3D6652',
  classic: '#C99B3F',
  rustic: '#234436',
};

const STYLE_LABELS: Record<string, string> = {
  modern: 'Moderne',
  minimalist: 'Minimaliste',
  bohemian: 'Bohème',
  'afro-contemporary': 'Afro-contemporain',
  scandinavian: 'Scandinave',
  industrial: 'Industriel',
  classic: 'Classique',
  rustic: 'Rustique',
};

/**
 * Taste quiz (A2, ~90 seconds in the reference journey §6): like/dislike a few
 * curated interiors; the server derives the initial style profile (A3).
 */
export default function TasteQuizScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [swipes, setSwipes] = useState<Swipe[]>([]);

  const { data: cards, isLoading } = useQuery({
    queryKey: ['taste-quiz'],
    queryFn: () => apiFetch<QuizCard[]>('/users/me/taste-quiz'),
  });

  const submitMutation = useMutation({
    mutationFn: (allSwipes: Swipe[]) =>
      apiFetch('/users/me/taste-quiz', {
        method: 'PUT',
        body: JSON.stringify({ swipes: allSwipes }),
      }),
    onSettled: () => router.replace('/projects'),
  });

  const card = cards?.[index];
  const total = cards?.length ?? 0;
  const done = !isLoading && (total === 0 || index >= total);

  function answer(liked: boolean) {
    if (!card) {
      return;
    }
    const next = [...swipes, { imageId: card.id, liked }];
    setSwipes(next);
    if (index + 1 >= total) {
      submitMutation.mutate(next);
    } else {
      setIndex(index + 1);
    }
  }

  if (done && !submitMutation.isPending) {
    // No curated images yet (fresh install): skip gracefully.
    if (total === 0) {
      router.replace('/projects');
    }
    return null;
  }

  return (
    <View className="flex-1 bg-paper">
      <SafeAreaView className="flex-1 px-7">
        <View className="flex-row items-center justify-between pt-4">
          <View>
            <Text className="font-sans text-xs uppercase tracking-[3px] text-forest-soft">
              Vos goûts
            </Text>
            <Text className="mt-1 font-display text-2xl text-ink">Aimez-vous cet intérieur ?</Text>
          </View>
          <Pressable onPress={() => router.replace('/projects')} className="py-2">
            <Text className="font-sans text-sm text-ink/50">Passer</Text>
          </Pressable>
        </View>

        {/* Progress: one sand segment per card, filled in clay. */}
        <View className="mt-4 flex-row gap-1.5">
          {Array.from({ length: total }, (_, i) => (
            <View
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= index ? 'bg-clay' : 'bg-sand'}`}
            />
          ))}
        </View>

        <View className="mt-6 flex-1 overflow-hidden rounded-3xl">
          {isLoading || !card ? (
            <View className="flex-1 items-center justify-center bg-sand">
              <Text className="font-sans text-ink/40">Chargement…</Text>
            </View>
          ) : card.imageUrl ? (
            <Image source={{ uri: card.imageUrl }} style={{ flex: 1 }} contentFit="cover" transition={200} />
          ) : (
            <View
              className="flex-1 items-center justify-center"
              style={{ backgroundColor: STYLE_TINTS[card.styles[0] ?? ''] ?? '#E7DCC8' }}
            >
              <Text className="font-display text-2xl text-ink/70">
                {STYLE_LABELS[card.styles[0] ?? ''] ?? card.styles[0]}
              </Text>
              <Text className="mt-1 font-sans text-xs text-ink/40">image à venir</Text>
            </View>
          )}
        </View>

        <View className="flex-row gap-3 py-6">
          <Pressable
            onPress={() => answer(false)}
            disabled={!card || submitMutation.isPending}
            className="flex-1 items-center rounded-2xl border-2 border-sand-deep bg-white py-4 active:bg-sand disabled:opacity-50"
          >
            <Text className="font-sans-medium text-base text-ink/70">Pas pour moi</Text>
          </Pressable>
          <Pressable
            onPress={() => answer(true)}
            disabled={!card || submitMutation.isPending}
            className="flex-1 items-center rounded-2xl bg-clay py-4 active:bg-clay-soft disabled:opacity-50"
          >
            <Text className="font-sans-medium text-base text-paper">J’aime ♥</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
