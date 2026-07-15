import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AuthTokens } from '@kaza/shared';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

/** Phone OTP sign-in — the primary channel for West Africa (A1). */
export default function PhoneAuthScreen() {
  const router = useRouter();
  const setTokens = useAuthStore((state) => state.setTokens);

  const [phone, setPhone] = useState('+229');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function requestCode() {
    setError(null);
    setPending(true);
    try {
      await apiFetch('/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ phone: phone.replace(/\s/g, '') }),
      });
      setStep('code');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Envoi du code impossible. Réessayez.');
    } finally {
      setPending(false);
    }
  }

  async function verifyCode() {
    setError(null);
    setPending(true);
    try {
      const tokens = await apiFetch<AuthTokens>('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone: phone.replace(/\s/g, ''), code }),
      });
      await setTokens(tokens);
      router.replace('/projects');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Code invalide. Réessayez.');
    } finally {
      setPending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-paper"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView className="flex-1 px-7">
        <Text className="pt-6 font-sans text-xs uppercase tracking-[3px] text-forest-soft">
          Inscription
        </Text>
        <Text className="mt-2 font-display text-3xl text-ink">
          {step === 'phone' ? 'Votre numéro' : 'Le code reçu'}
        </Text>
        <Text className="mt-3 font-sans text-base leading-6 text-ink/60">
          {step === 'phone'
            ? 'Un code de vérification vous sera envoyé par SMS.'
            : `Code envoyé au ${phone}. Il expire dans 5 minutes.`}
        </Text>

        {step === 'phone' ? (
          <TextInput
            className="mt-8 rounded-2xl border border-sand-deep bg-white px-5 py-4 font-sans text-lg text-ink"
            keyboardType="phone-pad"
            autoFocus
            value={phone}
            onChangeText={setPhone}
            placeholder="+229 90 00 00 00"
            placeholderTextColor="#D4C5A9"
          />
        ) : (
          <TextInput
            className="mt-8 rounded-2xl border border-sand-deep bg-white px-5 py-4 text-center font-sans text-2xl tracking-[12px] text-ink"
            keyboardType="number-pad"
            autoFocus
            maxLength={6}
            value={code}
            onChangeText={setCode}
            placeholder="••••••"
            placeholderTextColor="#D4C5A9"
          />
        )}

        {error ? (
          <Text className="mt-4 rounded-xl bg-clay-wash px-4 py-3 font-sans text-sm text-clay">
            {error}
          </Text>
        ) : null}

        <Pressable
          disabled={pending || (step === 'code' && code.length !== 6)}
          onPress={step === 'phone' ? requestCode : verifyCode}
          className="mt-8 items-center rounded-2xl bg-forest py-4 active:bg-forest-soft disabled:opacity-50"
        >
          <Text className="font-sans-medium text-base text-paper">
            {pending ? 'Un instant…' : step === 'phone' ? 'Recevoir le code' : 'Valider'}
          </Text>
        </Pressable>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
