import { Link, Redirect } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Welcome screen — the magazine cover. Deep forest field, editorial headline,
 * one clear action. The renders will take over this space once real projects exist.
 */
export default function WelcomeScreen() {
  const { isAuthenticated, isHydrated } = useAuthStore();

  if (isHydrated && isAuthenticated) {
    return <Redirect href="/projects" />;
  }

  return (
    <View className="flex-1 bg-forest-deep">
      <SafeAreaView className="flex-1 justify-between px-7 pb-6">
        <Text className="pt-4 font-display text-3xl text-paper">Kaza</Text>

        <View>
          <Text className="font-display text-[40px] leading-[46px] text-paper">
            Voyez votre intérieur{'\n'}avant de dépenser.
          </Text>
          <Text className="mt-4 font-sans text-base leading-6 text-sand">
            Photographiez une pièce, répondez à quelques questions, et découvrez un rendu fidèle
            à votre espace — puis passez à l’action.
          </Text>
        </View>

        <View>
          {/* Material swatches — the brand signature, quiet. */}
          <View className="mb-8 flex-row gap-2">
            <View className="h-2 w-12 rounded-full bg-clay" />
            <View className="h-2 w-12 rounded-full bg-gold" />
            <View className="h-2 w-12 rounded-full bg-sand-deep" />
          </View>

          <Link href="/auth/phone" asChild>
            <Pressable className="items-center rounded-2xl bg-clay py-4 active:bg-clay-soft">
              <Text className="font-sans-medium text-base text-paper">Commencer</Text>
            </Pressable>
          </Link>
          <Link href="/auth/login" asChild>
            <Pressable className="mt-3 items-center py-3">
              <Text className="font-sans text-sm text-sand">J’ai déjà un compte</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    </View>
  );
}
