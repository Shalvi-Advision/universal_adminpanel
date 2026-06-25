const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Get auth token from session storage
const getAuthToken = (): string | null => sessionStorage.getItem('authToken');

export interface UploadImageResponse {
  url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
}

/**
 * Upload a single image to VPS media storage (https://pagariyamart.com/media/)
 */
export async function uploadImage(file: File, folder: string = 'ecommerce'): Promise<UploadImageResponse> {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', folder);

  const response = await fetch(`${API_BASE_URL}/api/upload/image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to upload image');
  }

  if (!data.success) {
    throw new Error(data.message || 'Upload failed');
  }

  return data.data;
}

/**
 * Upload multiple images to VPS media storage
 */
export async function uploadImages(files: File[], folder: string = 'ecommerce'): Promise<UploadImageResponse[]> {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const formData = new FormData();
  files.forEach(file => {
    formData.append('images', file);
  });
  formData.append('folder', folder);

  const response = await fetch(`${API_BASE_URL}/api/upload/images`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to upload images');
  }

  if (!data.success) {
    throw new Error(data.message || 'Upload failed');
  }

  return data.data;
}
