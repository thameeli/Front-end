/**
 * Modern Loading Screen with Skeleton Animation
 * Replaces ActivityIndicator with beautiful skeleton loader
 * Safe for Expo Go - uses StyleSheet instead of className
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';

interface LoadingScreenProps {
  message?: string;
  showSkeleton?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  showSkeleton = true,
}) => {
  if (showSkeleton) {
    return (
      <View style={styles.container}>
        {/* Header Skeleton */}
        <View style={styles.header}>
          <SkeletonLoader width="60%" height={32} borderRadius={8} style={styles.mb2} />
          <SkeletonLoader width="40%" height={16} borderRadius={8} />
        </View>

        {/* Content Skeletons */}
        <View style={styles.content}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.card}>
              <SkeletonLoader width="100%" height={180} borderRadius={12} style={styles.mb4} />
              <SkeletonLoader width="70%" height={20} borderRadius={8} style={styles.mb2} />
              <SkeletonLoader width="40%" height={16} borderRadius={8} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  // Fallback to simple loading state
  return (
    <View style={styles.simpleContainer}>
      <View style={styles.simpleContent}>
        <SkeletonLoader width={60} height={60} borderRadius={30} style={styles.mb4} />
        {message && (
          <Text style={styles.message}>{message}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  content: {
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  simpleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  simpleContent: {
    alignItems: 'center',
  },
  mb2: {
    marginBottom: 8,
  },
  mb4: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
});

// Set displayName for better debugging
LoadingScreen.displayName = 'LoadingScreen';

export default LoadingScreen;
