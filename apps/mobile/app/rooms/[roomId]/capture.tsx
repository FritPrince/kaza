import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { uploadRoomPhoto } from '@/lib/upload';

/**
 * Room photo capture (B1): live camera with a framing guide — hold the phone
 * straight, take a wide angle — or import from the gallery. The photo is
 * compressed (~1080p) before upload for slow networks (§7.5).
 */
export default function CaptureScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(localUri: string) {
    setError(null);
    setUploading(true);
    try {
      await uploadRoomPhoto(roomId, localUri);
      router.replace({ pathname: '/rooms/[roomId]/chat', params: { roomId } });
    } catch {
      setError('Envoi impossible. Vérifiez votre connexion et réessayez.');
    } finally {
      setUploading(false);
    }
  }

  async function takePhoto() {
    const photo = await cameraRef.current?.takePictureAsync();
    if (photo) {
      await handleUpload(photo.uri);
    }
  }

  async function pickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 1 });
    const asset = result.assets?.[0];
    if (asset) {
      await handleUpload(asset.uri);
    }
  }

  if (!permission?.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-forest-deep px-8">
        <Text className="text-center font-display text-2xl text-paper">
          Kaza a besoin de la caméra
        </Text>
        <Text className="mt-3 text-center font-sans text-base leading-6 text-sand">
          Pour photographier votre pièce et générer un rendu fidèle.
        </Text>
        <Pressable
          onPress={() => void requestPermission()}
          className="mt-8 rounded-2xl bg-clay px-8 py-4 active:bg-clay-soft"
        >
          <Text className="font-sans-medium text-paper">Autoriser la caméra</Text>
        </Pressable>
        <Pressable onPress={pickFromGallery} className="mt-4 py-3">
          <Text className="font-sans text-sm text-sand">Importer depuis la galerie</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-ink">
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
        <SafeAreaView className="flex-1 justify-between">
          {/* Framing guide: hold straight, capture wide (B1). */}
          <View className="mx-6 mt-4 rounded-2xl bg-ink/60 px-5 py-3">
            <Text className="text-center font-sans text-sm leading-5 text-paper">
              Tenez le téléphone bien droit et cadrez large : murs, sol et fenêtres visibles.
            </Text>
          </View>

          <View className="mx-6 flex-1 justify-center">
            <View className="aspect-[4/3] rounded-3xl border-2 border-dashed border-paper/60" />
          </View>

          {error ? (
            <Text className="mx-6 mb-3 rounded-xl bg-clay px-4 py-3 text-center font-sans text-sm text-paper">
              {error}
            </Text>
          ) : null}

          <View className="mb-6 flex-row items-center justify-around">
            <Pressable onPress={pickFromGallery} disabled={uploading} className="w-20 items-center py-3">
              <Text className="font-sans text-sm text-paper">Galerie</Text>
            </Pressable>

            <Pressable
              onPress={takePhoto}
              disabled={uploading}
              className="h-20 w-20 items-center justify-center rounded-full border-4 border-paper bg-clay active:bg-clay-soft disabled:opacity-60"
            >
              {uploading ? <ActivityIndicator color="#F7F2E9" /> : null}
            </Pressable>

            <View className="w-20" />
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}
