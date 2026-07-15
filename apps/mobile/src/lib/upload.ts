import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { apiFetch } from './api-client';

const MAX_DIMENSION = 1080;
const JPEG_QUALITY = 0.8;

/**
 * Compresses the photo to ~1080p JPEG (slow-network friendly, §7.5), uploads it
 * to the signed URL and confirms it on the room. Returns the updated room.
 */
export async function uploadRoomPhoto(roomId: string, localUri: string) {
  const context = ImageManipulator.manipulate(localUri);
  context.resize({ width: MAX_DIMENSION });
  const rendered = await context.renderAsync();
  const compressed = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });

  const { key, uploadUrl } = await apiFetch<{ key: string; uploadUrl: string }>(
    `/rooms/${roomId}/photo/upload-url`,
    { method: 'POST', body: JSON.stringify({ contentType: 'image/jpeg' }) },
  );

  const blob = await (await fetch(compressed.uri)).blob();
  const putResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    body: blob,
  });
  if (!putResponse.ok) {
    throw new Error(`Photo upload failed (${putResponse.status})`);
  }

  return apiFetch<{ id: string; sourcePhotoUrl: string }>(`/rooms/${roomId}/photo/confirm`, {
    method: 'POST',
    body: JSON.stringify({ key }),
  });
}
