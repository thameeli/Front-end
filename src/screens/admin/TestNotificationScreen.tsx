import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { AppHeader, Input, Button, Card } from '../../components';
// Lazy import to prevent module evaluation issues
// Import will only happen when component is actually rendered
let pushNotificationService: any = null;
const getPushNotificationService = async () => {
  if (!pushNotificationService) {
    const module = await import('../../services/pushNotificationService');
    pushNotificationService = module.pushNotificationService;
  }
  return pushNotificationService;
};
import { useAuthStore } from '../../store/authStore';
import { isTablet, getResponsivePadding, getResponsiveFontSize } from '../../utils/responsive';

const TestNotificationScreen = () => {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('Test Notification');
  const [body, setBody] = useState('This is a test notification from Thamili App');
  const [sending, setSending] = useState(false);
  const padding = getResponsivePadding();

  const handleSendTest = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Error', 'Please fill in both title and body');
      return;
    }

    setSending(true);
    try {
      // Lazy load the service
      const service = await getPushNotificationService();
      
      if (!service) {
        Alert.alert(
          'Notifications Unavailable',
          'Push notifications are disabled in Expo Go to prevent conflicts. They will work in standalone builds.'
        );
        setSending(false);
        return;
      }
      
      // Request permissions first
      const hasPermission = await service.requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Please enable notifications in settings');
        setSending(false);
        return;
      }

      // Send test notification
      await service.scheduleLocalNotification(title, body, {
        type: 'test',
        userId: user?.id,
      });

      Alert.alert('Success', 'Test notification sent!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send test notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Test Notification" showBack />
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ 
          padding: padding.vertical,
          maxWidth: isTablet ? 600 : '100%',
          alignSelf: isTablet ? 'center' : 'stretch',
        }}
      >
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Send Test Notification</Text>
          <Text style={styles.description}>
            Send a test push notification to verify that notifications are working correctly.
          </Text>
        </Card>

        <Input
          label="Title"
          placeholder="Notification title"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />

        <Input
          label="Body"
          placeholder="Notification message"
          value={body}
          onChangeText={setBody}
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />

        <Button
          title="Send Test Notification"
          onPress={handleSendTest}
          loading={sending}
          disabled={sending}
          fullWidth
          style={styles.sendButton}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  input: {
    marginBottom: 16,
  },
  textArea: {
    minHeight: 100,
    marginBottom: 16,
  },
  sendButton: {
    marginTop: 8,
    marginBottom: 16,
  },
});

export default TestNotificationScreen;

