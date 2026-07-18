import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AuthTokens } from '@kaza/shared';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

/** E-mail sign-in (A1). Phone OTP remains the primary channel (welcome screen). */
export default function EmailLoginScreen() {
  const router = useRouter();
  const setTokens = useAuthStore((state) => state.setTokens);

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    setError(null);
    setPending(true);
    try {
      const tokens = await apiFetch<AuthTokens>(mode === 'login' ? '/auth/login' : '/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      await setTokens(tokens);
      router.replace(mode === 'signup' ? '/onboarding/taste-quiz' : '/projects');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('E-mail ou mot de passe incorrect.');
      } else if (err instanceof ApiError && err.status === 409) {
        setError('Un compte existe déjà avec cet e-mail. Connectez-vous.');
      } else {
        setError('Connexion impossible. Vérifiez votre réseau et réessayez.');
      }
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
          {mode === 'login' ? 'Connexion' : 'Inscription'}
        </Text>
        <Text className="mt-2 font-display text-3xl text-ink">
          {mode === 'login' ? 'Ravi de vous revoir' : 'Créer un compte'}
        </Text>

        <Text className="mt-8 font-sans-medium text-sm text-ink">E-mail</Text>
        <TextInput
          className="mt-2 rounded-2xl border border-sand-deep bg-white px-5 py-4 font-sans text-base text-ink"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          placeholder="vous@exemple.com"
          placeholderTextColor="#D4C5A9"
        />

        <Text className="mt-4 font-sans-medium text-sm text-ink">Mot de passe</Text>
        <TextInput
          className="mt-2 rounded-2xl border border-sand-deep bg-white px-5 py-4 font-sans text-base text-ink"
          secureTextEntry
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          value={password}
          onChangeText={setPassword}
          placeholder={mode === 'signup' ? '8 caractères minimum' : '••••••••'}
          placeholderTextColor="#D4C5A9"
        />

        {error ? (
          <Text className="mt-4 rounded-xl bg-clay-wash px-4 py-3 font-sans text-sm text-clay">
            {error}
          </Text>
        ) : null}

        <Pressable
          disabled={pending || !email.includes('@') || password.length < (mode === 'signup' ? 8 : 1)}
          onPress={submit}
          className="mt-8 items-center rounded-2xl bg-forest py-4 active:bg-forest-soft disabled:opacity-50"
        >
          <Text className="font-sans-medium text-base text-paper">
            {pending ? 'Un instant…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError(null);
          }}
          className="mt-4 items-center py-3"
        >
          <Text className="font-sans text-sm text-forest-soft">
            {mode === 'login' ? 'Pas encore de compte ? Inscrivez-vous' : 'Déjà un compte ? Connectez-vous'}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.replace('/auth/phone')} className="items-center py-2">
          <Text className="font-sans text-sm text-ink/50">Utiliser mon numéro de téléphone</Text>
        </Pressable>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
