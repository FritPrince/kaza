import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ProjectType } from '@kaza/shared';
import { apiFetch } from '@/lib/api-client';

const PROJECT_TYPES: Array<{ value: ProjectType; title: string; description: string }> = [
  {
    value: 'relooking',
    title: 'Relooker une pièce',
    description: 'Photographiez une pièce existante et voyez-la transformée.',
  },
  {
    value: 'construction',
    title: 'Construire une maison',
    description: 'Des plans et des rendus pièce par pièce, guidés par l’IA. (Bientôt)',
  },
];

export default function NewProjectScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [type, setType] = useState<ProjectType>('relooking');

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ id: string }>('/projects', {
        method: 'POST',
        body: JSON.stringify({ name, type }),
      }),
    onSuccess: async (project) => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.replace({ pathname: '/projects/[projectId]', params: { projectId: project.id } });
    },
  });

  return (
    <View className="flex-1 bg-paper">
      <SafeAreaView className="flex-1 px-7">
        <Text className="pt-6 font-sans text-xs uppercase tracking-[3px] text-forest-soft">
          Nouveau projet
        </Text>
        <Text className="mt-2 font-display text-3xl text-ink">Que préparez-vous ?</Text>

        <View className="mt-8 gap-3">
          {PROJECT_TYPES.map((option) => {
            const selected = type === option.value;
            const disabled = option.value === 'construction'; // Phase 2 (§10)
            return (
              <Pressable
                key={option.value}
                disabled={disabled}
                onPress={() => setType(option.value)}
                className={`rounded-3xl border-2 p-5 ${
                  selected ? 'border-clay bg-clay-wash' : 'border-sand bg-white'
                } ${disabled ? 'opacity-45' : ''}`}
              >
                <Text className="font-display text-xl text-ink">{option.title}</Text>
                <Text className="mt-1.5 font-sans text-sm leading-5 text-ink/60">
                  {option.description}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text className="mt-8 font-sans-medium text-sm text-ink">Nom du projet</Text>
        <TextInput
          className="mt-2 rounded-2xl border border-sand-deep bg-white px-5 py-4 font-sans text-base text-ink"
          placeholder="Mon appart, Maison de Calavi…"
          placeholderTextColor="#D4C5A9"
          value={name}
          onChangeText={setName}
          maxLength={100}
        />

        <Pressable
          disabled={!name.trim() || createMutation.isPending}
          onPress={() => createMutation.mutate()}
          className="mt-8 items-center rounded-2xl bg-forest py-4 active:bg-forest-soft disabled:opacity-50"
        >
          <Text className="font-sans-medium text-base text-paper">
            {createMutation.isPending ? 'Création…' : 'Créer le projet'}
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}
