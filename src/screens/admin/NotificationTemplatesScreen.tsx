import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { AppHeader, Card, Button, EmptyState, LoadingScreen, ErrorMessage } from '../../components';
import { NotificationTemplate } from '../../types/notifications';
import { notificationService } from '../../services/notificationService';

const NotificationTemplatesScreen = () => {
  const queryClient = useQueryClient();

  // Fetch templates
  const {
    data: templates = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notificationTemplates'],
    queryFn: () => notificationService.getTemplates(),
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ templateId, active }: { templateId: string; active: boolean }) =>
      notificationService.updateTemplate(templateId, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationTemplates'] });
    },
  });

  const handleToggleActive = (template: NotificationTemplate) => {
    toggleActiveMutation.mutate({
      templateId: template.id,
      active: !template.active,
    });
  };

  if (isLoading) {
    return <LoadingScreen message="Loading templates..." />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <AppHeader title="Notification Templates" />
        <ErrorMessage
          message="Failed to load templates. Please try again."
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Notification Templates" />

      {templates.length === 0 ? (
        <EmptyState
          icon="file-document-outline"
          title="No templates"
          message="Notification templates will appear here"
        />
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.templateCard}>
              <View style={styles.templateHeader}>
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName}>{item.name}</Text>
                  <Text style={styles.templateType}>
                    {item.type.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.activeButton, item.active && styles.activeButtonActive]}
                  onPress={() => handleToggleActive(item)}
                >
                  <Icon
                    name={item.active ? 'check-circle' : 'close-circle'}
                    size={20}
                    color={item.active ? '#34C759' : '#FF3B30'}
                  />
                  <Text
                    style={[styles.activeText, item.active && styles.activeTextActive]}
                  >
                    {item.active ? 'Active' : 'Inactive'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.templateContent}>
                <Text style={styles.templateLabel}>Title:</Text>
                <Text style={styles.templateText}>{item.title_template}</Text>
                <Text style={styles.templateLabel}>Message:</Text>
                <Text style={styles.templateText}>{item.message_template}</Text>
                {item.variables.length > 0 && (
                  <>
                    <Text style={styles.templateLabel}>Variables:</Text>
                    <View style={styles.variablesContainer}>
                      {item.variables.map((variable) => (
                        <View key={variable} style={styles.variableTag}>
                          <Text style={styles.variableText}>{`{${variable}}`}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            </Card>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  templateCard: {
    marginBottom: 12,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  templateType: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  activeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    gap: 4,
  },
  activeButtonActive: {
    borderColor: '#34C759',
    backgroundColor: '#e6f9ed',
  },
  activeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  activeTextActive: {
    color: '#34C759',
  },
  templateContent: {
    marginTop: 8,
  },
  templateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  templateText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  variablesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  variableTag: {
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  variableText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default NotificationTemplatesScreen;

