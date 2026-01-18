import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AnimatedSplashScreenProps {
  onComplete: () => void;
}

export default function AnimatedSplashScreen({ onComplete }: AnimatedSplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const note1Anim = useRef(new Animated.Value(0)).current;
  const note2Anim = useRef(new Animated.Value(0)).current;
  const note3Anim = useRef(new Animated.Value(0)).current;
  const note4Anim = useRef(new Animated.Value(0)).current;
  const note5Anim = useRef(new Animated.Value(0)).current;
  const note6Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(note1Anim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(note2Anim, {
          toValue: 1,
          duration: 3500,
          useNativeDriver: true,
        }),
        Animated.timing(note3Anim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(note4Anim, {
          toValue: 1,
          duration: 3200,
          useNativeDriver: true,
        }),
        Animated.timing(note5Anim, {
          toValue: 1,
          duration: 3800,
          useNativeDriver: true,
        }),
        Animated.timing(note6Anim, {
          toValue: 1,
          duration: 4200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 2 }
      ),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onComplete();
    });
  }, [fadeAnim, scaleAnim, pulseAnim, note1Anim, note2Anim, note3Anim, note4Anim, note5Anim, note6Anim, onComplete]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#7C3AED', '#6366F1', '#06B6D4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: Animated.multiply(scaleAnim, pulseAnim) },
              ],
            },
          ]}
        >
          <Animated.Text
            style={[
              styles.note,
              styles.note1,
              {
                transform: [
                  { translateY: note1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) },
                  { rotate: note1Anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '15deg'] }) },
                ],
                opacity: note1Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 1, 0.4] }),
              },
            ]}
          >
            ♪
          </Animated.Text>

          <Animated.Text
            style={[
              styles.note,
              styles.note2,
              {
                transform: [
                  { translateY: note2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 15] }) },
                  { rotate: note2Anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-10deg'] }) },
                ],
                opacity: note2Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1, 0.5] }),
              },
            ]}
          >
            ♫
          </Animated.Text>

          <Animated.Text
            style={[
              styles.note,
              styles.note3,
              {
                transform: [
                  { translateY: note3Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -25] }) },
                  { rotate: note3Anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '20deg'] }) },
                ],
                opacity: note3Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1, 0.3] }),
              },
            ]}
          >
            ♬
          </Animated.Text>

          <Animated.Text
            style={[
              styles.note,
              styles.note4,
              {
                transform: [
                  { translateY: note4Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 18] }) },
                  { rotate: note4Anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-15deg'] }) },
                ],
                opacity: note4Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 1, 0.4] }),
              },
            ]}
          >
            ♩
          </Animated.Text>

          <Animated.Text
            style={[
              styles.note,
              styles.note5,
              {
                transform: [
                  { translateY: note5Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) },
                  { rotate: note5Anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '25deg'] }) },
                ],
                opacity: note5Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1, 0.5] }),
              },
            ]}
          >
            ♪
          </Animated.Text>

          <Animated.Text
            style={[
              styles.note,
              styles.note6,
              {
                transform: [
                  { translateY: note6Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) },
                  { rotate: note6Anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-20deg'] }) },
                ],
                opacity: note6Anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1, 0.3] }),
              },
            ]}
          >
            ♫
          </Animated.Text>

          <Text style={styles.brandText}>OneBand</Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative' as const,
  },
  brandText: {
    fontSize: 56,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  note: {
    position: 'absolute' as const,
    fontSize: 48,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  note1: {
    top: -60,
    left: -80,
  },
  note2: {
    top: 40,
    left: -90,
  },
  note3: {
    top: -70,
    right: -70,
  },
  note4: {
    top: 50,
    right: -80,
  },
  note5: {
    top: -40,
    left: 0,
  },
  note6: {
    top: 30,
    right: 0,
  },
});
