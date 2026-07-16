import { useMutation, useQuery } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '@/lib/api-client';

interface CreditPack {
  id: string;
  credits: number;
  priceXof: number;
}

const formatXof = (value: number) => `${new Intl.NumberFormat('fr-FR').format(value)} F`;

/**
 * Soft paywall (F1, §6.7): shown after the free generations run out. Credit
 * packs are paid by Mobile Money through a hosted checkout (F2).
 */
export default function PaywallScreen() {
  const router = useRouter();
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [phone, setPhone] = useState('+229');

  const { data: packs } = useQuery({
    queryKey: ['credit-packs'],
    queryFn: () => apiFetch<CreditPack[]>('/payments/packs'),
  });

  const payMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ checkoutUrl: string | null }>('/payments/mobile-money/initiate', {
        method: 'POST',
        body: JSON.stringify({
          packId: selectedPackId,
          provider: 'fedapay',
          phone: phone.replace(/\s/g, ''),
        }),
      }),
    onSuccess: async (result) => {
      if (result.checkoutUrl) {
        // Hosted Mobile Money checkout opens in the browser; credits land via webhook.
        await Linking.openURL(result.checkoutUrl);
        router.back();
      }
    },
  });

  return (
    <View className="flex-1 bg-forest-deep">
      <SafeAreaView className="flex-1 px-7">
        <Pressable onPress={() => router.back()} className="self-end py-3">
          <Text className="font-sans text-sm text-sand">Plus tard</Text>
        </Pressable>

        <Text className="font-sans text-xs uppercase tracking-[3px] text-sand-deep">
          Vos crédits sont épuisés
        </Text>
        <Text className="mt-2 font-display text-[32px] leading-10 text-paper">
          Continuez à voir{'\n'}avant de dépenser.
        </Text>
        <Text className="mt-3 font-sans text-base leading-6 text-sand">
          1 crédit = 1 rendu photoréaliste de votre pièce. Payable par Mobile Money.
        </Text>

        <View className="mt-8 gap-3">
          {(packs ?? []).map((pack) => {
            const selected = selectedPackId === pack.id;
            const perCredit = Math.round(pack.priceXof / pack.credits);
            return (
              <Pressable
                key={pack.id}
                onPress={() => setSelectedPackId(pack.id)}
                className={`flex-row items-center justify-between rounded-2xl border-2 p-5 ${
                  selected ? 'border-clay bg-forest' : 'border-forest bg-forest'
                }`}
              >
                <View>
                  <Text className="font-display text-xl text-paper">{pack.credits} crédits</Text>
                  <Text className="mt-0.5 font-sans text-xs text-sand-deep">
                    {formatXof(perCredit)} / rendu
                  </Text>
                </View>
                <Text className="font-sans-medium text-lg text-gold">{formatXof(pack.priceXof)}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text className="mt-8 font-sans-medium text-sm text-paper">Numéro Mobile Money</Text>
        <TextInput
          className="mt-2 rounded-2xl bg-forest px-5 py-4 font-sans text-lg text-paper"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          placeholderTextColor="#3D6652"
        />

        {payMutation.isError ? (
          <Text className="mt-3 rounded-xl bg-clay px-4 py-3 font-sans text-sm text-paper">
            Paiement impossible pour le moment. Réessayez dans un instant.
          </Text>
        ) : null}

        <Pressable
          disabled={!selectedPackId || phone.length < 9 || payMutation.isPending}
          onPress={() => payMutation.mutate()}
          className="mt-6 items-center rounded-2xl bg-clay py-4 active:bg-clay-soft disabled:opacity-50"
        >
          <Text className="font-sans-medium text-base text-paper">
            {payMutation.isPending ? 'Ouverture du paiement…' : 'Payer par Mobile Money'}
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}
