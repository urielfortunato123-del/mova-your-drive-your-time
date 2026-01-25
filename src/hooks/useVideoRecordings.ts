import { useState, useEffect, useCallback } from 'react';

export interface VideoRecording {
  id: string;
  rideId: string;
  passengerName: string;
  filename: string;
  duration: number; // in seconds
  size: number; // in bytes
  createdAt: string;
  blob?: Blob;
}

const DB_NAME = 'RideRecordingsDB';
const STORE_NAME = 'recordings';
const DB_VERSION = 1;

// Open IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('rideId', 'rideId', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
};

export function useVideoRecordings() {
  const [recordings, setRecordings] = useState<VideoRecording[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all recordings metadata (without blobs for performance)
  const fetchRecordings = useCallback(async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      return new Promise<VideoRecording[]>((resolve, reject) => {
        request.onsuccess = () => {
          // Return without blob for list view
          const recordings = request.result.map(({ blob, ...rest }) => rest);
          resolve(recordings.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ));
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error fetching recordings:', error);
      return [];
    }
  }, []);

  // Load recordings on mount
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const data = await fetchRecordings();
      setRecordings(data);
      setIsLoading(false);
    };
    load();
  }, [fetchRecordings]);

  // Save a new recording
  const saveRecording = useCallback(async (
    blob: Blob,
    rideId: string,
    passengerName: string,
    duration: number
  ): Promise<VideoRecording> => {
    const id = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sanitizedName = passengerName.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `corrida_${sanitizedName}_${timestamp}.webm`;
    
    const recording: VideoRecording = {
      id,
      rideId,
      passengerName,
      filename,
      duration,
      size: blob.size,
      createdAt: new Date().toISOString(),
    };

    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.add({ ...recording, blob });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      setRecordings(prev => [recording, ...prev]);
      return recording;
    } catch (error) {
      console.error('Error saving recording:', error);
      throw error;
    }
  }, []);

  // Get a recording with its blob
  const getRecordingWithBlob = useCallback(async (id: string): Promise<VideoRecording | null> => {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting recording:', error);
      return null;
    }
  }, []);

  // Delete a recording
  const deleteRecording = useCallback(async (id: string): Promise<boolean> => {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      setRecordings(prev => prev.filter(r => r.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting recording:', error);
      return false;
    }
  }, []);

  // Download a recording
  const downloadRecording = useCallback(async (id: string): Promise<boolean> => {
    const recording = await getRecordingWithBlob(id);
    if (!recording?.blob) return false;

    const url = URL.createObjectURL(recording.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = recording.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }, [getRecordingWithBlob]);

  // Share a recording
  const shareRecording = useCallback(async (id: string): Promise<boolean> => {
    const recording = await getRecordingWithBlob(id);
    if (!recording?.blob) return false;

    const file = new File([recording.blob], recording.filename, { type: 'video/webm' });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `Gravação: ${recording.passengerName}`,
          text: `Vídeo da corrida com ${recording.passengerName}`,
          files: [file],
        });
        return true;
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
        return false;
      }
    } else {
      // Fallback to download
      return downloadRecording(id);
    }
  }, [getRecordingWithBlob, downloadRecording]);

  // Get total storage used
  const getTotalStorageUsed = useCallback(() => {
    return recordings.reduce((total, r) => total + r.size, 0);
  }, [recordings]);

  // Format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    recordings,
    isLoading,
    saveRecording,
    getRecordingWithBlob,
    deleteRecording,
    downloadRecording,
    shareRecording,
    getTotalStorageUsed,
    formatBytes,
    refreshRecordings: fetchRecordings,
  };
}
