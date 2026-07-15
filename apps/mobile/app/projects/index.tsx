import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '@/lib/api-client';

interface ProjectRow {
  id: string;
  name: string;
  type: 'relooking' | 'construction';
  status: string;
  updatedAt: string;
  _count: { rooms: number };
}

/** Dashboard — the reader's own magazine: each project is an issue (E2). */
export default function ProjectsScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiFetch<ProjectRow[]>('/projects'),
  });

  return (
    <View className="flex-1 bg-paper">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-end justify-between px-7 pt-4">
          <View>
            <Text className="font-sans text-xs uppercase tracking-[3px] text-forest-soft">
              Vos projets
            </Text>
            <Text className="mt-1 font-display text-3xl text-ink">Chez vous</Text>
          </View>
          <Link href="/projects/new" asChild>
            <Pressable className="h-11 w-11 items-center justify-center rounded-full bg-clay active:bg-clay-soft">
              <Text className="pb-0.5 text-2xl leading-7 text-paper">+</Text>
            </Pressable>
          </Link>
        </View>

        <FlatList
          className="mt-6"
          contentContainerClassName="px-7 pb-10 gap-4"
          data={data ?? []}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View className="mt-16 items-center px-6">
              {isLoading ? (
                <Text className="font-sans text-ink/40">Chargement…</Text>
              ) : (
                <>
                  <Text className="text-center font-display text-2xl text-ink">
                    Votre premier projet vous attend
                  </Text>
                  <Text className="mt-3 text-center font-sans text-base leading-6 text-ink/60">
                    Photographiez une pièce et voyez-la transformée en quelques minutes.
                  </Text>
                  <Link href="/projects/new" asChild>
                    <Pressable className="mt-8 rounded-2xl bg-forest px-8 py-4 active:bg-forest-soft">
                      <Text className="font-sans-medium text-paper">Créer un projet</Text>
                    </Pressable>
                  </Link>
                </>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <Link href={{ pathname: '/projects/[projectId]', params: { projectId: item.id } }} asChild>
              <Pressable className="overflow-hidden rounded-3xl bg-white active:opacity-90">
                {/* Cover placeholder — replaced by the latest render once generated. */}
                <View className="h-40 items-start justify-end bg-sand p-5">
                  <Text className="font-sans text-[10px] uppercase tracking-[2px] text-ink/50">
                    {item.type === 'relooking' ? 'Relooking' : 'Construction'}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between p-5">
                  <View>
                    <Text className="font-display text-xl text-ink">{item.name}</Text>
                    <Text className="mt-1 font-sans text-xs text-ink/50">
                      {item._count.rooms} pièce{item._count.rooms > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text className="font-sans text-lg text-clay">→</Text>
                </View>
              </Pressable>
            </Link>
          )}
        />
      </SafeAreaView>
    </View>
  );
}
