/**
 * Image Zoom Modal Component
 * Full-screen image viewer with pinch-to-zoom functionality
 */

import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Dimensions, StatusBar, Platform } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme';
import { EASING } from '../utils/animations';

// Safe import of gesture handler
let GestureDetector: any;
let Gesture: any;
try {
  const GestureHandler = require('react-native-gesture-handler');
  GestureDetector = GestureHandler.GestureDetector;
  Gesture = GestureHandler.Gesture;
} catch (e) {
  // Fallback for web or if gesture handler not available
  GestureDetector = ({ children, gesture }: any) => children;
  Gesture = {
    Pinch: () => ({ onUpdate: () => {}, onEnd: () => {} }),
    Pan: () => ({ onUpdate: () => {}, onEnd: () => {} }),
    Tap: () => ({ numberOfTaps: () => ({ onEnd: () => {} }) }),
    Simultaneous: (...args: any[]) => null,
  };
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageZoomModalProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
}

const AnimatedImage = Animated.createAnimatedComponent(Image);
const AnimatedView = Animated.createAnimatedComponent(View);

const ImageZoomModal: React.FC<ImageZoomModalProps> = ({
  visible,
  imageUri,
  onClose,
}) => {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
    }
  }, [visible]);

  // Only use gestures on native platforms
  const useGestures = Platform.OS !== 'web';
  
  const pinchGesture = useGestures ? Gesture.Pinch()
    .onUpdate((e: any) => {
      scale.value = Math.max(1, Math.min(e.scale, 4));
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1, EASING.spring);
      } else if (scale.value > 4) {
        scale.value = withSpring(4, EASING.spring);
      }
    }) : null;

  const panGesture = useGestures ? Gesture.Pan()
    .onUpdate((e: any) => {
      if (scale.value > 1) {
        translateX.value = e.translationX;
        translateY.value = e.translationY;
      }
    })
    .onEnd(() => {
      if (scale.value <= 1) {
        translateX.value = withSpring(0, EASING.spring);
        translateY.value = withSpring(0, EASING.spring);
      }
    }) : null;

  const doubleTapGesture = useGestures ? Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withSpring(1, EASING.spring);
        translateX.value = withSpring(0, EASING.spring);
        translateY.value = withSpring(0, EASING.spring);
      } else {
        scale.value = withSpring(2, EASING.spring);
      }
    }) : null;

  const composedGesture = useGestures && pinchGesture && panGesture && doubleTapGesture
    ? Gesture.Simultaneous(
        pinchGesture,
        panGesture,
        doubleTapGesture
      )
    : null;

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleClose = () => {
    scale.value = withSpring(1, EASING.spring);
    translateX.value = withSpring(0, EASING.spring);
    translateY.value = withSpring(0, EASING.spring);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar hidden />
      <AnimatedView style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close image viewer"
        >
          <Icon name="close" size={28} color="white" />
        </TouchableOpacity>

        {composedGesture ? (
          <GestureDetector gesture={composedGesture}>
            <AnimatedView style={styles.imageContainer}>
              <AnimatedImage
                source={{ uri: imageUri }}
                style={[styles.image, imageStyle]}
                contentFit="contain"
              />
            </AnimatedView>
          </GestureDetector>
        ) : (
          <AnimatedView style={styles.imageContainer}>
            <AnimatedImage
              source={{ uri: imageUri }}
              style={[styles.image, imageStyle]}
              contentFit="contain"
            />
          </AnimatedView>
        )}
      </AnimatedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
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

export default ImageZoomModal;

