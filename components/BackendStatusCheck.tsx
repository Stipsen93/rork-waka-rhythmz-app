import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Colors from '@/constants/colors';

export function BackendStatusCheck() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [message, setMessage] = useState('Checking backend...');

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 
                       (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : 'http://localhost:8081');
        
        console.log('[BACKEND CHECK] Testing:', `${baseUrl}/api`);
        
        const response = await fetch(`${baseUrl}/api`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });

        console.log('[BACKEND CHECK] Response status:', response.status);
        const text = await response.text();
        console.log('[BACKEND CHECK] Response text:', text.substring(0, 200));

        if (response.ok) {
          setStatus('ok');
          setMessage('Backend is running');
        } else {
          setStatus('error');
          setMessage(`Backend error: ${response.status} - ${text.substring(0, 100)}`);
        }
      } catch (error: any) {
        console.error('[BACKEND CHECK] Error:', error);
        setStatus('error');
        setMessage(`Cannot connect to backend: ${error.message}`);
      }
    };

    checkBackend();
  }, []);

  if (status === 'checking') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={Colors.light.primary} />
        <Text style={styles.text}>{message}</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>⚠️ {message}</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    margin: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
  },
  text: {
    color: Colors.light.text,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '600' as const,
  },
});
