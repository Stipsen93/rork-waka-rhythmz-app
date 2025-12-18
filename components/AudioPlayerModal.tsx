import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, PanResponder, Animated } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { X, Play, Pause, Volume2, SkipBack, SkipForward } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type AudioPlayerModalProps = {
  visible: boolean;
  audioUri: string;
  audioTitle: string;
  onClose: () => void;
};

export default function AudioPlayerModal({ visible, audioUri, audioTitle, onClose }: AudioPlayerModalProps) {
  const insets = useSafeAreaInsets();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isSeeking, setIsSeeking] = useState<boolean>(false);
  const progressBarWidth = useRef<number>(0);
  const thumbPosition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      if (sound) {
        console.log('Unloading Sound');
        sound.unloadAsync();
      }
    };
  }, [sound]);

  useEffect(() => {
    if (!visible || !audioUri) {
      return;
    }

    const loadAudio = async () => {
      try {
        setIsLoading(true);
        console.log('[AudioPlayer] Loading audio:', audioUri);
        
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: false },
          onPlaybackStatusUpdate
        );
        
        setSound(newSound);
        setIsLoading(false);
        console.log('[AudioPlayer] Audio loaded successfully');
      } catch (error) {
        console.error('[AudioPlayer] Error loading audio:', error);
        setIsLoading(false);
      }
    };

    loadAudio();
  }, [visible, audioUri]);

  useEffect(() => {
    if (visible) return;

    const cleanup = async () => {
      if (sound) {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
          setSound(null);
          setIsPlaying(false);
          setPosition(0);
          setDuration(0);
        } catch (error) {
          console.error('[AudioPlayer] Error unloading audio:', error);
        }
      }
    };

    cleanup();
  }, [visible, sound]);

  const unloadAudio = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
        setPosition(0);
        setDuration(0);
      } catch (error) {
        console.error('[AudioPlayer] Error unloading audio:', error);
      }
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
      
      if (status.didJustFinish && !status.isLooping) {
        setIsPlaying(false);
        setPosition(0);
      }
    }
  };

  const togglePlayPause = async () => {
    if (!sound) return;

    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        if (isPlaying) {
          await sound.pauseAsync();
        } else {
          await sound.playAsync();
        }
      }
    } catch (error) {
      console.error('[AudioPlayer] Error toggling play/pause:', error);
    }
  };

  const seekBackward = async () => {
    if (!sound) return;
    const newPosition = Math.max(0, position - 10000);
    await sound.setPositionAsync(newPosition);
  };

  const seekForward = async () => {
    if (!sound) return;
    const newPosition = Math.min(duration, position + 10000);
    await sound.setPositionAsync(newPosition);
  };

  const seekToPosition = async (seekPosition: number) => {
    if (!sound || duration === 0) return;
    try {
      await sound.setPositionAsync(seekPosition);
    } catch (error) {
      console.error('[AudioPlayer] Error seeking:', error);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (_, gestureState) => {
      setIsSeeking(true);
    },
    onPanResponderMove: (_, gestureState) => {
      if (progressBarWidth.current === 0 || duration === 0) return;
      const currentThumbPos = (position / duration) * progressBarWidth.current;
      const newPosition = Math.max(0, Math.min(progressBarWidth.current, currentThumbPos + gestureState.dx));
      thumbPosition.setValue(newPosition);
      const seekPosition = (newPosition / progressBarWidth.current) * duration;
      setPosition(seekPosition);
    },
    onPanResponderRelease: (_, gestureState) => {
      if (progressBarWidth.current === 0 || duration === 0) {
        setIsSeeking(false);
        return;
      }
      const currentThumbPos = (position / duration) * progressBarWidth.current;
      const newPosition = Math.max(0, Math.min(progressBarWidth.current, currentThumbPos + gestureState.dx));
      const seekPosition = (newPosition / progressBarWidth.current) * duration;
      seekToPosition(seekPosition);
      setIsSeeking(false);
    },
  });

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    unloadAudio();
    onClose();
  };

  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;

  useEffect(() => {
    if (!isSeeking && duration > 0 && progressBarWidth.current > 0) {
      const newThumbPosition = (position / duration) * progressBarWidth.current;
      Animated.timing(thumbPosition, {
        toValue: newThumbPosition,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }
  }, [position, duration, isSeeking, thumbPosition]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{audioTitle}</Text>
            <TouchableOpacity onPress={handleClose}>
              <X color={Colors.light.text} size={28} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <View style={styles.playerContainer}>
            <View style={styles.waveformContainer}>
              <Volume2 color={Colors.light.primary} size={48} strokeWidth={2} />
              <Text style={styles.audioLabel}>Audio Bestand</Text>
            </View>

            {isLoading ? (
              <ActivityIndicator size="large" color={Colors.light.primary} />
            ) : (
              <>
                <View style={styles.progressContainer}>
                  <View 
                    style={styles.progressBarContainer}
                    onLayout={(e) => {
                      progressBarWidth.current = e.nativeEvent.layout.width;
                    }}
                  >
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
                    </View>
                    <Animated.View
                      style={[
                        styles.progressThumb,
                        {
                          left: thumbPosition,
                        },
                      ]}
                      {...panResponder.panHandlers}
                    />
                  </View>
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>{formatTime(position)}</Text>
                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                  </View>
                </View>

                <View style={styles.controls}>
                  <TouchableOpacity style={styles.controlButton} onPress={seekBackward}>
                    <SkipBack color={Colors.light.text} size={28} strokeWidth={2} />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
                    {isPlaying ? (
                      <Pause color={Colors.light.text} size={36} strokeWidth={2.5} fill={Colors.light.text} />
                    ) : (
                      <Play color={Colors.light.text} size={36} strokeWidth={2.5} fill={Colors.light.text} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.controlButton} onPress={seekForward}>
                    <SkipForward color={Colors.light.text} size={28} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: Colors.light.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.surfaceLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginRight: 16,
  },
  playerContainer: {
    gap: 24,
  },
  waveformContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: Colors.light.darkGray,
    borderRadius: 16,
    gap: 12,
  },
  audioLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.muted,
  },
  progressContainer: {
    gap: 8,
  },
  progressBarContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.light.darkGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.primary,
    marginLeft: -8,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 3,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.muted,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
