import ReactNativeBlobUtil from 'react-native-blob-util';
import { API_CONFIG } from '../config/api';
import { getStoredToken } from './authService';

export type UploadFolder =
  | 'driver-profiles'
  | 'driver-licenses'
  | 'vehicle-documents'
  | 'delivery-pod'
  | 'uploads';

export interface UploadedFile {
  url: string;
  publicId: string;
  format: string;
  resourceType: string;
  bytes: number;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface UploadResponse {
  files: UploadedFile[];
  count: number;
}

export interface ImageAsset {
  uri: string;
  fileName?: string;
  type?: string;
}

export const uploadImage = async (
  asset: ImageAsset,
  folder: UploadFolder = 'uploads'
): Promise<UploadedFile> => {
  if (!asset.uri) {
    throw new Error('Image URI is required');
  }

  const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD}?folder=${encodeURIComponent(folder)}`;

  // Upload endpoint is public — token optional, sent if present (post-registration)
  let token: string | null = null;
  try {
    token = await getStoredToken();
  } catch {
    // No token yet — proceed without auth
  }

  const headers: Record<string, string> = {
    'Content-Type': 'multipart/form-data',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  // react-native-blob-util needs a path without the file:// prefix
  const filePath = asset.uri.replace(/^file:\/\//, '');
  const fileName = asset.fileName || `upload-${Date.now()}.jpg`;
  const fileType = asset.type || 'image/jpeg';

  console.log('📤 Uploading image to:', url);
  console.log('📤 File path:', filePath);

  const response = await ReactNativeBlobUtil.fetch(
    'POST',
    url,
    headers,
    [
      {
        name: 'file',
        filename: fileName,
        type: fileType,
        data: ReactNativeBlobUtil.wrap(filePath),
      },
    ]
  );

  const status = response.info().status;
  const responseText = response.text();

  let data: { data?: UploadResponse; message?: string; error?: string } | null = null;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(`Upload failed: server returned non-JSON response (${status})`);
  }

  if (status < 200 || status >= 300) {
    throw new Error(data?.error || data?.message || `Upload failed (${status})`);
  }

  const file = data?.data?.files?.[0];
  if (!file?.url) {
    throw new Error('Upload succeeded but no file URL returned');
  }

  console.log('✅ Image uploaded:', file.url);
  return file;
};
