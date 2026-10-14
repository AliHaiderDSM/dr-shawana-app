import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { formatSize } from '@/lib/format';
import type { UploadableFile } from '@/types/api';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const VOICE_TYPE = 'audio/mp4';

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const UPLOAD_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const;

const EXTENSION_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export function normalizeType(name: string, mimeType: string | null | undefined) {
  const type = mimeType?.toLowerCase() === 'image/jpg' ? 'image/jpeg' : mimeType?.toLowerCase();
  if (type && (UPLOAD_TYPES as readonly string[]).includes(type)) return type;
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_TYPES[ext] ?? type ?? '';
}

export function validateFile(file: UploadableFile) {
  if (!(UPLOAD_TYPES as readonly string[]).includes(file.mimeType)) {
    return 'Choose a PDF or a photo (JPG, PNG or WebP).';
  }
  if (file.size !== null && file.size > MAX_UPLOAD_BYTES) {
    return `This file is ${formatSize(file.size)}. The limit is ${formatSize(MAX_UPLOAD_BYTES)}.`;
  }
  return null;
}

export async function pickDocumentFile(): Promise<UploadableFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [...UPLOAD_TYPES],
    multiple: false,
    copyToCacheDirectory: true,
  });
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;
  return {
    uri: asset.uri,
    name: asset.name,
    mimeType: normalizeType(asset.name, asset.mimeType),
    size: asset.size ?? null,
  };
}

export async function pickImageFile(camera: boolean): Promise<UploadableFile | null> {
  if (camera) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera not allowed', 'Allow camera access in your phone settings to take a photo.');
      return null;
    }
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8, exif: false };
  const result = camera
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;
  const name = asset.fileName ?? `photo-${Date.now()}.jpg`;
  return {
    uri: asset.uri,
    name,
    mimeType: normalizeType(name, asset.mimeType ?? 'image/jpeg'),
    size: asset.fileSize ?? null,
  };
}

export function validateImage(file: UploadableFile) {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.mimeType))
    return 'Choose a photo (JPG, PNG or WebP).';
  return validateFile(file);
}
