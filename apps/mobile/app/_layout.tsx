import { Archivo_400Regular, Archivo_500Medium } from '@expo-google-fonts/archivo';
import { Fraunces_500Medium, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import '../src/global.css';

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const hydrate = useAuthStore((state) => state.hydrate);

  const [fontsLoaded] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Archivo_400Regular,
    Archivo_500Medium,
  });

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F7F2E9' },
        }}
      />
    </QueryClientProvider>
  );
}
