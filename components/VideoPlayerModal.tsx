import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Modal, Pressable, Animated, Text, PanResponder } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus, Audio } from 'expo-av';
import { Pause, Play, Maximize, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import * as ScreenOrientation from 'expo-screen-orientation';

type VideoPlayerModalProps = {
  visible: boolean;
  videoUrl: string;
  onClose: () => void;
};

export default function VideoPlayerModal({ visible, videoUrl, onClose }: VideoPlayerModalProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

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
    } else {
      setIsPlaying(false);
      setIsFullscreen(false);
      setPosition(0);
      setDuration(0);
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }

    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, [visible, startControlsTimer]);

  const showControlsTemporarily = () => {
    setShowControls(true);
    fadeAnim.setValue(1);
    startControlsTimer();
  };

  const handlePlayPause = () => {
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
  };

  const handleSlowMotion = () => {
    const newRate = playbackRate === 1.0 ? 0.5 : 1.0;
    setPlaybackRate(newRate);
    videoRef.current?.setRateAsync(newRate, true);
    showControlsTemporarily();
  };

  const handleFullscreen = async () => {
    if (!isFullscreen) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      setIsFullscreen(true);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      setIsFullscreen(false);
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
    setIsFullscreen(false);
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
    await videoRef.current?.setPositionAsync(position);
    showControlsTemporarily();
  };

  const handleSeek = (newPosition: number) => {
    setPosition(newPosition);
  };

  const handleProgressBarPress = (evt: any) => {
    const { locationX, nativeEvent } = evt;
    const barWidth = nativeEvent.target?.offsetWidth || 300;
    const newPosition = (locationX / barWidth) * duration;
    setPosition(newPosition);
    videoRef.current?.setPositionAsync(newPosition);
    showControlsTemporarily();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        handleSeekStart();
      },
      onPanResponderMove: (evt, gestureState) => {
        const barWidth = 300;
        const relativeX = Math.max(0, Math.min(barWidth, gestureState.moveX - 40));
        const newPosition = (relativeX / barWidth) * duration;
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
                  <X color={Colors.light.text} size={24} strokeWidth={2.5} />
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
                  <Pressable 
                    style={styles.progressBar}
                    onPress={handleProgressBarPress}
                  >
                    <View style={styles.progressTrack}>
                      <View 
                        style={[
                          styles.progressFill,
                          { width: `${duration > 0 ? (position / duration) * 100 : 0}%` }
                        ]} 
                      />
                      <View 
                        {...panResponder.panHandlers}
                        style={[
                          styles.progressThumb,
                          { left: `${duration > 0 ? (position / duration) * 100 : 0}%` }
                        ]}
                      />
                    </View>
                  </Pressable>
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

                  <Pressable 
                    style={styles.controlButton}
                    onPress={handleFullscreen}
                  >
                    <LinearGradient
                      colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.1)']}
                      style={styles.controlButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Maximize color={Colors.light.text} size={24} strokeWidth={2.5} />
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
    height: '100%',
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
    height: 40,
    justifyContent: 'center',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.light.text,
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.text,
    marginLeft: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
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
    backgroundColor: Colors.light.text,
    borderRadius: 1.5,
  },
});
