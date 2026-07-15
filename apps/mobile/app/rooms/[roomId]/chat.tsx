import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AgentTurn, QuickReply } from '@kaza/shared';
import { apiFetch } from '@/lib/api-client';

interface UiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  quickReplies?: QuickReply[];
}

/**
 * The guided interview (B2): the agent asks like a decorator would; the user
 * answers by tapping quick replies or typing. When the agent is ready, the
 * generation can start.
 */
export default function RoomChatScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Parlons de cette pièce. Comment l’utilisez-vous au quotidien ?',
    },
  ]);
  const [draft, setDraft] = useState('');
  const [readyPrompt, setReadyPrompt] = useState<AgentTurn | null>(null);

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      apiFetch<AgentTurn>(`/rooms/${roomId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    onSuccess: (turn) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${prev.length}`,
          role: 'assistant',
          content: turn.message,
          quickReplies: turn.kind === 'question' ? turn.quickReplies : undefined,
        },
      ]);
      if (turn.kind === 'ready-to-generate') {
        setReadyPrompt(turn);
      }
    },
  });

  function send(content: string) {
    if (!content.trim()) {
      return;
    }
    setMessages((prev) => [...prev, { id: `user-${prev.length}`, role: 'user', content }]);
    setDraft('');
    sendMutation.mutate(content);
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-paper"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView className="flex-1">
        <View className="border-b border-sand px-7 pb-4 pt-2">
          <Text className="font-sans text-xs uppercase tracking-[3px] text-forest-soft">
            Entretien
          </Text>
          <Text className="mt-0.5 font-display text-2xl text-ink">Votre pièce, vos envies</Text>
        </View>

        <FlatList
          className="flex-1"
          contentContainerClassName="px-5 py-5 gap-3"
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View>
              <View
                className={
                  item.role === 'user'
                    ? 'ml-12 self-end rounded-3xl rounded-br-lg bg-forest px-5 py-3.5'
                    : 'mr-12 self-start rounded-3xl rounded-bl-lg bg-white px-5 py-3.5'
                }
              >
                <Text
                  className={
                    item.role === 'user'
                      ? 'font-sans text-[15px] leading-[22px] text-paper'
                      : 'font-sans text-[15px] leading-[22px] text-ink'
                  }
                >
                  {item.content}
                </Text>
              </View>
              {item.quickReplies?.length ? (
                <View className="mt-2.5 flex-row flex-wrap gap-2">
                  {item.quickReplies.map((reply) => (
                    <Pressable
                      key={reply.value}
                      onPress={() => send(reply.label)}
                      className="rounded-full border border-clay bg-clay-wash px-4 py-2 active:bg-clay-soft"
                    >
                      <Text className="font-sans-medium text-sm text-clay">{reply.label}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          )}
        />

        {readyPrompt ? (
          <View className="border-t border-sand px-5 py-4">
            <Pressable className="items-center rounded-2xl bg-clay py-4 active:bg-clay-soft">
              <Text className="font-sans-medium text-base text-paper">Générer le rendu ✦</Text>
            </Pressable>
          </View>
        ) : (
          <View className="flex-row items-center gap-2 border-t border-sand px-5 py-3">
            <TextInput
              className="flex-1 rounded-full bg-white px-5 py-3 font-sans text-[15px] text-ink"
              placeholder="Répondez librement…"
              placeholderTextColor="#D4C5A9"
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={() => send(draft)}
              editable={!sendMutation.isPending}
            />
            <Pressable
              onPress={() => send(draft)}
              disabled={sendMutation.isPending}
              className="h-11 w-11 items-center justify-center rounded-full bg-forest active:bg-forest-soft disabled:opacity-50"
            >
              <Text className="text-lg text-paper">↑</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
