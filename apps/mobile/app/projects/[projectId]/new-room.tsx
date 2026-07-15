import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RoomType } from '@kaza/shared';
import { apiFetch } from '@/lib/api-client';

const ROOM_OPTIONS: Array<{ value: RoomType; label: string }> = [
  { value: 'living-room', label: 'Salon' },
  { value: 'bedroom', label: 'Chambre' },
  { value: 'kitchen', label: 'Cuisine' },
  { value: 'bathroom', label: 'Salle de bain' },
  { value: 'dining-room', label: 'Salle à manger' },
  { value: 'office', label: 'Bureau' },
  { value: 'kids-room', label: 'Chambre d’enfant' },
  { value: 'exterior', label: 'Extérieur' },
  { value: 'other', label: 'Autre' },
];

export default function NewRoomScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [type, setType] = useState<RoomType>('living-room');
  const [name, setName] = useState('Salon');

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ id: string }>(`/projects/${projectId}/rooms`, {
        method: 'POST',
        body: JSON.stringify({ type, name, constraints: [] }),
      }),
    onSuccess: async (room) => {
      await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      router.replace({ pathname: '/rooms/[roomId]/capture', params: { roomId: room.id } });
    },
  });

  function selectType(option: (typeof ROOM_OPTIONS)[number]) {
    setType(option.value);
    setName(option.label);
  }

  return (
    <View className="flex-1 bg-paper">
      <SafeAreaView className="flex-1 px-7">
        <Text className="pt-6 font-sans text-xs uppercase tracking-[3px] text-forest-soft">
          Nouvelle pièce
        </Text>
        <Text className="mt-2 font-display text-3xl text-ink">Quelle pièce relooker ?</Text>

        <ScrollView className="mt-6" contentContainerClassName="pb-6">
          <View className="flex-row flex-wrap gap-2">
            {ROOM_OPTIONS.map((option) => {
              const selected = type === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => selectType(option)}
                  className={`rounded-full border px-4 py-2.5 ${
                    selected ? 'border-clay bg-clay-wash' : 'border-sand-deep bg-white'
                  }`}
                >
                  <Text
                    className={`font-sans-medium text-sm ${selected ? 'text-clay' : 'text-ink/70'}`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text className="mt-8 font-sans-medium text-sm text-ink">Nom de la pièce</Text>
          <TextInput
            className="mt-2 rounded-2xl border border-sand-deep bg-white px-5 py-4 font-sans text-base text-ink"
            value={name}
            onChangeText={setName}
            maxLength={80}
          />
        </ScrollView>

        <Pressable
          disabled={!name.trim() || createMutation.isPending}
          onPress={() => createMutation.mutate()}
          className="mb-4 items-center rounded-2xl bg-forest py-4 active:bg-forest-soft disabled:opacity-50"
        >
          <Text className="font-sans-medium text-base text-paper">
            {createMutation.isPending ? 'Création…' : 'Continuer vers la photo'}
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}
