import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import Colors from '@/constants/colors';

interface UploadTask {
  id: string;
  fileName: string;
  progress: number;
  isComplete: boolean;
}

interface UploadProgressContextValue {
  currentUpload: UploadTask | null;
  startUpload: (fileName: string) => string;
  updateProgress: (id: string, progress: number) => void;
  completeUpload: (id: string) => void;
  cancelUpload: (id: string) => void;
}

export const [UploadProgressProvider, useUploadProgress] = createContextHook<UploadProgressContextValue>(() => {
  const [currentUpload, setCurrentUpload] = useState<UploadTask | null>(null);

  const startUpload = useCallback((fileName: string): string => {
    const id = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    console.log('[UPLOAD_PROGRESS] Starting upload:', id, fileName);
    
    setCurrentUpload({
      id,
      fileName,
      progress: 0,
      isComplete: false,
    });
    
    return id;
  }, []);

  const updateProgress = useCallback((id: string, progress: number) => {
    console.log('[UPLOAD_PROGRESS] Updating progress:', id, progress);
    
    setCurrentUpload(prev => {
      if (!prev || prev.id !== id) return prev;
      return {
        ...prev,
        progress: Math.min(Math.max(progress, 0), 100),
      };
    });
  }, []);

  const completeUpload = useCallback((id: string) => {
    console.log('[UPLOAD_PROGRESS] Completing upload:', id);
    
    setCurrentUpload(prev => {
      if (!prev || prev.id !== id) return prev;
      return {
        ...prev,
        progress: 100,
        isComplete: true,
      };
    });

    setTimeout(() => {
      setCurrentUpload(prev => {
        if (prev && prev.id === id) return null;
        return prev;
      });
    }, 2000);
  }, []);

  const cancelUpload = useCallback((id: string) => {
    console.log('[UPLOAD_PROGRESS] Canceling upload:', id);
    
    setCurrentUpload(prev => {
      if (!prev || prev.id !== id) return prev;
      return null;
    });
  }, []);

  return {
    currentUpload,
    startUpload,
    updateProgress,
    completeUpload,
    cancelUpload,
  };
});

export function UploadProgressOverlay() {
  const { currentUpload } = useUploadProgress();

  if (!currentUpload) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {currentUpload.isComplete ? '✓ Upload voltooid' : 'Uploaden...'}
        </Text>
        <Text style={styles.fileName} numberOfLines={1}>
          {currentUpload.fileName}
        </Text>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${currentUpload.progress}%` }
            ]} 
          />
        </View>
        <Text style={styles.percentage}>
          {Math.round(currentUpload.progress)}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 9999,
    pointerEvents: 'none',
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  title: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  fileName: {
    color: Colors.light.muted,
    fontSize: 13,
    fontWeight: '500' as const,
    marginBottom: 12,
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.light.darkGray,
    borderRadius: 3,
    overflow: 'hidden' as const,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 3,
  },
  percentage: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
});
