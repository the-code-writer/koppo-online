// Storage API service for file uploads

import { storageAPI } from "./api";

export interface FileUploadRequest {
  fileName: string;
  mimeType: string;
  lastModified: string;
  fileSize: number;
  data: string; // Base64 encoded file data
  metadata: {
    category: string;
    tags: string[];
  };
}

export interface FileUploadResponse {
  success: boolean;
  fileId?: string;
  url?: string;
  error?: string;
}

export interface UploadedFile {
  fileName: string;
  mimeType: string;
  lastModified: string;
  fileSize: number;
  url: string;
  fileId: string;
  metadata: {
    category: string;
    tags: string[];
  };
}

export class StorageService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || '';
  }

  /**
   * Convert file to base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data URL prefix (e.g., "data:image/png;base64,")
          const base64Data = reader.result.split(',')[1];
          resolve(base64Data);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Upload a file to the storage API
   */
  async uploadFile(file: File, category: string = 'profile', tags: string[] = []): Promise<FileUploadResponse> {
    try {
      const base64Data = await this.fileToBase64(file);
      
      const uploadRequest: FileUploadRequest = {
        fileName: file.name,
        mimeType: file.type,
        lastModified: new Date(file.lastModified).toISOString(),
        fileSize: file.size,
        data: base64Data,
        metadata: {
          category,
          tags
        }
      };

      // Use the centralized storageAPI instead of direct fetch
      return await storageAPI.uploadFile(uploadRequest);
      
    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Get file information by ID
   */
  async getFileInfo(fileId: string): Promise<UploadedFile | null> {
    try {
      // Use the centralized storageAPI instead of direct fetch
      return await storageAPI.getFileInfo(fileId);
    } catch (error) {
      console.error('Get file info error:', error);
      return null;
    }
  }

  /**
   * Delete a file by ID
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      // Use the centralized storageAPI instead of direct fetch
      return await storageAPI.deleteFile(fileId);
    } catch (error) {
      console.error('Delete file error:', error);
      return false;
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, maxSizeMB: number = 5, allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']): { valid: boolean; error?: string } {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File size must be less than ${maxSizeMB}MB`
      };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type must be one of: ${allowedTypes.join(', ')}`
      };
    }

    return { valid: true };
  }
}

export const storageService = new StorageService();
