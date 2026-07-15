import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Link, useLocalSearchParams } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '@/lib/api-client';

interface RoomRow {
  id: string;
  name: string;
  type: string;
  sourcePhotoKey: string | null;
  generations: Array<{ id: string; imageKey: string | null; status: string }>;
}

interface ProjectDetail {
  id: string;
  name: string;
  type: string;
  rooms: RoomRow[];
}

export default function ProjectDetailScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiFetch<ProjectDetail>(`/projects/${projectId}`),
  });

  return (
    <View className="flex-1 bg-paper">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-end justify-between px-7 pt-4">
          <View className="flex-1 pr-4">
            <Text className="font-sans text-xs uppercase tracking-[3px] text-forest-soft">
              {data?.type === 'construction' ? 'Construction' : 'Relooking'}
            </Text>
            <Text className="mt-1 font-display text-3xl text-ink" numberOfLines={1}>
              {data?.name ?? '…'}
            </Text>
          </View>
          <Link
            href={{ pathname: '/projects/[projectId]/new-room', params: { projectId } }}
            asChild
          >
            <Pressable className="h-11 w-11 items-center justify-center rounded-full bg-clay active:bg-clay-soft">
              <Text className="pb-0.5 text-2xl leading-7 text-paper">+</Text>
            </Pressable>
          </Link>
        </View>

        <FlatList
          className="mt-6"
          contentContainerClassName="px-7 pb-10 gap-4"
          data={data?.rooms ?? []}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View className="mt-16 items-center px-6">
              {isLoading ? (
                <Text className="font-sans text-ink/40">Chargement…</Text>
              ) : (
                <>
                  <Text className="text-center font-display text-2xl text-ink">
                    Ajoutez votre première pièce
                  </Text>
                  <Text className="mt-3 text-center font-sans text-base leading-6 text-ink/60">
                    Une photo bien cadrée suffit : tenez le téléphone droit et prenez un angle
                    large.
                  </Text>
                </>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const lastRender = item.generations[0];
            return (
              <Link
                href={{ pathname: '/rooms/[roomId]/chat', params: { roomId: item.id } }}
                asChild
              >
                <Pressable className="overflow-hidden rounded-3xl bg-white active:opacity-90">
                  <View className="h-44 bg-sand">
                    {lastRender?.imageKey ? (
                      <Image
                        source={{ uri: lastRender.imageKey }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                      />
                    ) : null}
                  </View>
                  <View className="flex-row items-center justify-between p-5">
                    <View>
                      <Text className="font-display text-lg text-ink">{item.name}</Text>
                      <Text className="mt-0.5 font-sans text-xs text-ink/50">
                        {item.generations.length
                          ? `${item.generations.length} version${item.generations.length > 1 ? 's' : ''}`
                          : 'Pas encore de rendu'}
                      </Text>
                    </View>
                    <Text className="font-sans text-lg text-clay">→</Text>
                  </View>
                </Pressable>
              </Link>
            );
          }}
        />
      </SafeAreaView>
    </View>
  );
}
