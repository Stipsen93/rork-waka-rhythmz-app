import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Modal, Pressable, PanResponder, Animated, Dimensions, Platform, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { X, Download } from 'lucide-react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Colors from '@/constants/colors';

type ImageViewerModalProps = {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ImageViewerModal({ visible, imageUrl, onClose }: ImageViewerModalProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  
  const [currentScale, setCurrentScale] = useState(1);
  const [currentTranslateX, setCurrentTranslateX] = useState(0);
  const [currentTranslateY, setCurrentTranslateY] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const lastScale = useRef(1);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);
  const initialDistance = useRef(0);
  const lastTapTime = useRef(0);

  const resetZoom = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start();
    
    lastScale.current = 1;
    lastTranslateX.current = 0;
    lastTranslateY.current = 0;
    setCurrentScale(1);
    setCurrentTranslateX(0);
    setCurrentTranslateY(0);
  }, [scale, translateX, translateY]);

  const handleClose = useCallback(() => {
    resetZoom();
    onClose();
  }, [resetZoom, onClose]);

  const handleDownload = useCallback(async () => {
    if (isDownloading) return;
    
    try {
      setIsDownloading(true);
      console.log('[ImageViewer] Starting download:', imageUrl);
      
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = 'image.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Alert.alert('Download gestart', 'Het bestand wordt gedownload');
      } else {
        const filename = `image_${Date.now()}.jpg`;
        const destination = new File(Paths.cache, filename);
        
        const downloadedFile = await File.downloadFileAsync(imageUrl, destination, { idempotent: true });
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadedFile.uri);
        } else {
          Alert.alert('Download voltooid', `Bestand opgeslagen: ${filename}`);
        }
      }
      
      console.log('[ImageViewer] Download completed');
    } catch (error) {
      console.error('[ImageViewer] Download error:', error);
      Alert.alert('Download mislukt', 'Er is een fout opgetreden bij het downloaden');
    } finally {
      setIsDownloading(false);
    }
  }, [imageUrl, isDownloading]);

  const calculateDistance = (touches: any[]) => {
    const [touch1, touch2] = touches;
    const dx = touch1.pageX - touch2.pageX;
    const dy = touch1.pageY - touch2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        
        if (touches.length === 1) {
          const now = Date.now();
          const timeSinceLastTap = now - lastTapTime.current;
          
          if (timeSinceLastTap < 300) {
            if (currentScale > 1) {
              resetZoom();
            } else {
              Animated.parallel([
                Animated.spring(scale, { toValue: 2.5, useNativeDriver: true }),
                Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
                Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
              ]).start();
              lastScale.current = 2.5;
              lastTranslateX.current = 0;
              lastTranslateY.current = 0;
              setCurrentScale(2.5);
              setCurrentTranslateX(0);
              setCurrentTranslateY(0);
            }
          }
          
          lastTapTime.current = now;
        } else if (touches.length === 2) {
          initialDistance.current = calculateDistance(touches);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        
        if (touches.length === 2) {
          const currentDistance = calculateDistance(touches);
          const newScale = Math.max(
            1,
            Math.min(5, lastScale.current * (currentDistance / initialDistance.current))
          );
          
          scale.setValue(newScale);
          setCurrentScale(newScale);
        } else if (touches.length === 1 && currentScale > 1) {
          const maxTranslateX = (SCREEN_WIDTH * (currentScale - 1)) / 2;
          const maxTranslateY = (SCREEN_HEIGHT * (currentScale - 1)) / 2;
          
          const newTranslateX = Math.max(
            -maxTranslateX,
            Math.min(maxTranslateX, lastTranslateX.current + gestureState.dx)
          );
          const newTranslateY = Math.max(
            -maxTranslateY,
            Math.min(maxTranslateY, lastTranslateY.current + gestureState.dy)
          );
          
          translateX.setValue(newTranslateX);
          translateY.setValue(newTranslateY);
          setCurrentTranslateX(newTranslateX);
          setCurrentTranslateY(newTranslateY);
        }
      },
      onPanResponderRelease: () => {
        lastScale.current = currentScale;
        lastTranslateX.current = currentTranslateX;
        lastTranslateY.current = currentTranslateY;
        
        if (currentScale < 1) {
          resetZoom();
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        
        <View style={styles.topButtons}>
          <Pressable 
            style={styles.topButton}
            onPress={handleDownload}
            disabled={isDownloading}
          >
            <View style={styles.topButtonBg}>
              {isDownloading ? (
                <ActivityIndicator size="small" color={Colors.light.text} />
              ) : (
                <Download color={Colors.light.text} size={24} strokeWidth={2.5} />
              )}
            </View>
          </Pressable>
          <Pressable 
            style={styles.topButton}
            onPress={handleClose}
          >
            <View style={styles.topButtonBg}>
              <X color={Colors.light.text} size={24} strokeWidth={2.5} />
            </View>
          </Pressable>
        </View>

        <View style={styles.imageContainer} {...panResponder.panHandlers}>
          <Animated.View
            style={{
              transform: [
                { scale },
                { translateX },
                { translateY },
              ],
            }}
          >
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              contentFit="contain"
              transition={200}
            />
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  topButtons: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    gap: 12,
  },
  topButton: {
    width: 44,
    height: 44,
  },
  topButtonBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});
