import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Modal, Pressable, Animated, Text, PanResponder } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus, Audio } from 'expo-av';
import { Pause, Play, X, Volume2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import * as ScreenOrientation from 'expo-screen-orientation';

type VideoPlayerModalProps = {
  visible: boolean;
  videoUrl: string;
  onClose: () => void;
  isAudio?: boolean;
};

export default function VideoPlayerModal({ visible, videoUrl, onClose, isAudio = false }: VideoPlayerModalProps) {
  const videoRef = useRef<Video>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const progressBarRef = useRef<View>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [progressBarLayout, setProgressBarLayout] = useState({ x: 0, width: 0 });
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideControls = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowControls(false);
    });
  }, [fadeAnim]);

  const startControlsTimer = useCallback(() => {
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }

    controlsTimeout.current = setTimeout(() => {
      hideControls();
    }, 2000);
  }, [hideControls]);

  const onAudioPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      if (!isSeeking) {
        setPosition(status.positionMillis);
        setDuration(status.durationMillis || 0);
      }
    }
  }, [isSeeking]);

  const loadAudio = useCallback(async () => {
    try {
      console.log('[AudioPlayer] Loading audio:', videoUrl);
      const { sound } = await Audio.Sound.createAsync(
        { uri: videoUrl },
        { shouldPlay: true, rate: playbackRate, shouldCorrectPitch: true },
        onAudioPlaybackStatusUpdate
      );
      soundRef.current = sound;
      console.log('[AudioPlayer] Audio loaded successfully');
    } catch (error) {
      console.error('[AudioPlayer] Error loading audio:', error);
    }
  }, [videoUrl, playbackRate, onAudioPlaybackStatusUpdate]);

  const unloadAudio = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      } catch (error) {
        console.error('[AudioPlayer] Error unloading audio:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (visible) {
      Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      setShowControls(true);
      setIsPlaying(true);
      startControlsTimer();
      
      if (isAudio) {
        loadAudio();
      }
    } else {
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      
      if (isAudio && soundRef.current) {
        unloadAudio();
      }
    }

    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, [visible, startControlsTimer, isAudio, loadAudio, unloadAudio]);

  const showControlsTemporarily = () => {
    setShowControls(true);
    fadeAnim.setValue(1);
    startControlsTimer();
  };

  const handlePlayPause = async () => {
    if (isAudio && soundRef.current) {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        if (controlsTimeout.current) {
          clearTimeout(controlsTimeout.current);
        }
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
        startControlsTimer();
      }
    } else {
      if (isPlaying) {
        videoRef.current?.pauseAsync();
        setIsPlaying(false);
        if (controlsTimeout.current) {
          clearTimeout(controlsTimeout.current);
        }
      } else {
        videoRef.current?.playAsync();
        setIsPlaying(true);
        startControlsTimer();
      }
    }
  };

  const handleSlowMotion = async () => {
    const newRate = playbackRate === 1.0 ? 0.5 : 1.0;
    setPlaybackRate(newRate);
    if (isAudio && soundRef.current) {
      await soundRef.current.setRateAsync(newRate, true);
    } else {
      videoRef.current?.setRateAsync(newRate, true);
    }
    showControlsTemporarily();
  };

  const handleScreenPress = () => {
    if (showControls) {
      hideControls();
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    } else {
      showControlsTemporarily();
    }
  };

  const handleClose = async () => {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    onClose();
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      if (!isSeeking) {
        setPosition(status.positionMillis);
        setDuration(status.durationMillis || 0);
      }
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
  };

  const handleSeekEnd = async () => {
    setIsSeeking(false);
    if (isAudio && soundRef.current) {
      await soundRef.current.setPositionAsync(position);
    } else {
      await videoRef.current?.setPositionAsync(position);
    }
    showControlsTemporarily();
  };

  const handleSeek = (newPosition: number) => {
    setPosition(newPosition);
  };

  const handleProgressBarPress = async (evt: any) => {
    if (!progressBarLayout.width || duration === 0) return;
    
    const { locationX } = evt.nativeEvent;
    const progress = Math.max(0, Math.min(1, locationX / progressBarLayout.width));
    const newPosition = progress * duration;
    
    setPosition(newPosition);
    if (isAudio && soundRef.current) {
      await soundRef.current.setPositionAsync(newPosition);
    } else {
      videoRef.current?.setPositionAsync(newPosition);
    }
    showControlsTemporarily();
  };

  const progressPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        handleSeekStart();
      },
      onPanResponderMove: (evt, gestureState) => {
        if (!progressBarLayout.width || duration === 0) return;
        
        const relativeX = gestureState.moveX - progressBarLayout.x;
        const progress = Math.max(0, Math.min(1, relativeX / progressBarLayout.width));
        const newPosition = progress * duration;
        handleSeek(newPosition);
      },
      onPanResponderRelease: () => {
        handleSeekEnd();
      },
    })
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <Pressable 
          style={styles.videoContainer} 
          onPress={handleScreenPress}
        >
          {isAudio ? (
            <View style={styles.audioVisualization}>
              <LinearGradient
                colors={['rgba(220, 38, 38, 0.1)', 'rgba(220, 38, 38, 0.05)']}
                style={styles.audioGradient}
              >
                <Volume2 
                  color={Colors.light.primary} 
                  size={80} 
                  strokeWidth={2} 
                />
                <Text style={styles.audioLabel}>Audio Bestand</Text>
              </LinearGradient>
            </View>
          ) : (
            <Video
              ref={videoRef}
              source={{ uri: videoUrl }}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={isPlaying}
              isLooping
              onPlaybackStatusUpdate={onPlaybackStatusUpdate}
              rate={playbackRate}
            />
          )}

          {showControls && (
            <Animated.View 
              style={[
                styles.controlsOverlay,
                {
                  opacity: fadeAnim,
                }
              ]}
            >
              <Pressable 
                style={styles.closeButton}
                onPress={handleClose}
              >
                <View style={styles.closeButtonInner}>
                  <X color="#ffffff" size={24} strokeWidth={2.5} />
                </View>
              </Pressable>

              <Pressable 
                style={styles.playButton}
                onPress={handlePlayPause}
              >
                <LinearGradient
                  colors={[Colors.light.primary, '#B91C1C']}
                  style={styles.playButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isPlaying ? (
                    <Pause color={Colors.light.text} size={32} strokeWidth={2.5} />
                  ) : (
                    <Play color={Colors.light.text} size={32} strokeWidth={2.5} />
                  )}
                </LinearGradient>
              </Pressable>

              <View style={styles.bottomControls}>
                <View style={styles.progressContainer}>
                  <Text style={styles.timeText}>{formatTime(position)}</Text>
                  <View 
                    ref={progressBarRef}
                    style={styles.progressBar}
                    onLayout={() => {
                      progressBarRef.current?.measureInWindow((x, y, width, height) => {
                        setProgressBarLayout({ x, width });
                      });
                    }}
                  >
                    <Pressable 
                      style={styles.progressBarTouchable}
                      onPress={handleProgressBarPress}
                      {...progressPanResponder.panHandlers}
                    >
                      <View style={styles.progressTrack}>
                        <View 
                          style={[
                            styles.progressFill,
                            { width: `${duration > 0 ? (position / duration) * 100 : 0}%` }
                          ]} 
                        />
                        <View 
                          style={[
                            styles.progressThumb,
                            { left: `${duration > 0 ? (position / duration) * 100 : 0}%` }
                          ]}
                        />
                      </View>
                    </Pressable>
                  </View>
                  <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
                
                <View style={styles.buttonRow}>
                  <Pressable 
                    style={[
                      styles.controlButton,
                      playbackRate === 0.5 && styles.controlButtonActive
                    ]}
                    onPress={handleSlowMotion}
                  >
                    <LinearGradient
                      colors={playbackRate === 0.5 
                        ? [Colors.light.primary, '#B91C1C']
                        : ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.1)']
                      }
                      style={styles.controlButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.slowMotionIcon}>
                        <View style={[styles.slowMotionBar, { height: 8 }]} />
                        <View style={[styles.slowMotionBar, { height: 12 }]} />
                        <View style={[styles.slowMotionBar, { height: 16 }]} />
                      </View>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          )}
        </Pressable>
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
  videoContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: '80%',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  closeButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  playButtonGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'column',
    gap: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    justifyContent: 'center',
  },
  progressBarTouchable: {
    height: 44,
    justifyContent: 'center',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    height: 4,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    marginLeft: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  timeText: {
    color: Colors.light.text,
    fontSize: 13,
    fontWeight: '600' as const,
    minWidth: 40,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  controlButtonActive: {
    shadowColor: Colors.light.primary,
    shadowOpacity: 0.6,
  },
  controlButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  slowMotionIcon: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  slowMotionBar: {
    width: 3,
    backgroundColor: '#ffffff',
    borderRadius: 1.5,
  },
  audioVisualization: {
    width: '90%',
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(220, 38, 38, 0.2)',
    gap: 16,
  },
  audioLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    opacity: 0.8,
  },
});
