import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RootStackParamList, ProductCategory } from '../../types';
import { productService } from '../../services/productService';
import { AppHeader, Input, Button, ErrorMessage } from '../../components';
import { PRODUCT_CATEGORIES } from '../../constants';
import { isTablet, isSmallDevice, getResponsivePadding } from '../../utils/responsive';
// Lazy import to avoid module-level initialization issues
let ImagePicker: any = null;
const getImagePicker = async () => {
  if (!ImagePicker) {
    ImagePicker = await import('expo-image-picker');
  }
  return ImagePicker;
};

type AddProductScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddProduct'>;

const AddProductScreen = () => {
  const navigation = useNavigation<AddProductScreenNavigationProp>();
  const queryClient = useQueryClient();
  const padding = getResponsivePadding();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('fresh');
  const [priceGermany, setPriceGermany] = useState('');
  const [priceNorway, setPriceNorway] = useState('');
  const [stock, setStock] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (productData: any) => {
      let imageUrl = null;
      
      // Upload image if selected
      if (imageUri) {
        setUploading(true);
        try {
          imageUrl = await productService.uploadProductImage(imageUri);
        } catch (error) {
          console.error('Image upload error:', error);
          // Continue without image if upload fails
        } finally {
          setUploading(false);
        }
      }

      return productService.createProduct({
        ...productData,
        image_url: imageUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      Alert.alert('Success', 'Product created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create product');
    },
  });

  const handlePickImage = async () => {
    try {
      const ImagePickerModule = await getImagePicker();
      const { status } = await ImagePickerModule.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload images');
        return;
      }

      const result = await ImagePickerModule.launchImageLibraryAsync({
        mediaTypes: ImagePickerModule.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pick image');
    }
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Product name is required';
    if (!priceGermany || isNaN(parseFloat(priceGermany)) || parseFloat(priceGermany) <= 0) {
      newErrors.priceGermany = 'Valid Germany price is required';
    }
    if (!priceNorway || isNaN(parseFloat(priceNorway)) || parseFloat(priceNorway) <= 0) {
      newErrors.priceNorway = 'Valid Norway price is required';
    }
    if (!stock || isNaN(parseInt(stock)) || parseInt(stock) < 0) {
      newErrors.stock = 'Valid stock quantity is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      price_germany: parseFloat(priceGermany),
      price_norway: parseFloat(priceNorway),
      stock: parseInt(stock),
      active: true,
    });
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Add Product" showBack />
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ 
          padding: padding.vertical,
          maxWidth: isTablet ? 600 : '100%',
          alignSelf: isTablet ? 'center' : 'stretch',
        }}
      >
        {Object.keys(errors).length > 0 && (
          <ErrorMessage
            message="Please fix the errors below"
            type="error"
            style={styles.errorMessage}
          />
        )}

        <Input
          label="Product Name *"
          placeholder="Enter product name"
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (errors.name) setErrors({ ...errors, name: '' });
          }}
          error={errors.name}
        />

        <Input
          label="Description"
          placeholder="Enter product description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />

        <View style={styles.categorySection}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.categoryButtons}>
            <TouchableOpacity
              style={[styles.categoryButton, category === PRODUCT_CATEGORIES.FRESH && styles.categoryButtonActive]}
              onPress={() => setCategory(PRODUCT_CATEGORIES.FRESH)}
            >
              <Text style={[styles.categoryButtonText, category === PRODUCT_CATEGORIES.FRESH && styles.categoryButtonTextActive]}>
                Fresh
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.categoryButton, category === PRODUCT_CATEGORIES.FROZEN && styles.categoryButtonActive]}
              onPress={() => setCategory(PRODUCT_CATEGORIES.FROZEN)}
            >
              <Text style={[styles.categoryButtonText, category === PRODUCT_CATEGORIES.FROZEN && styles.categoryButtonTextActive]}>
                Frozen
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.priceRow}>
          <View style={styles.halfWidth}>
            <Input
              label="Price (Germany) *"
              placeholder="0.00"
              value={priceGermany}
              onChangeText={(text) => {
                setPriceGermany(text);
                if (errors.priceGermany) setErrors({ ...errors, priceGermany: '' });
              }}
              keyboardType="decimal-pad"
              error={errors.priceGermany}
            />
          </View>
          <View style={styles.halfWidth}>
            <Input
              label="Price (Norway) *"
              placeholder="0.00"
              value={priceNorway}
              onChangeText={(text) => {
                setPriceNorway(text);
                if (errors.priceNorway) setErrors({ ...errors, priceNorway: '' });
              }}
              keyboardType="decimal-pad"
              error={errors.priceNorway}
            />
          </View>
        </View>

        <Input
          label="Stock Quantity *"
          placeholder="0"
          value={stock}
          onChangeText={(text) => {
            setStock(text);
            if (errors.stock) setErrors({ ...errors, stock: '' });
          }}
          keyboardType="number-pad"
          error={errors.stock}
        />

        <View style={styles.imageSection}>
          <Text style={styles.label}>Product Image</Text>
          <TouchableOpacity style={styles.imageButton} onPress={handlePickImage}>
            {imageUri ? (
              <View style={styles.imagePreview}>
                <Text style={styles.imagePreviewText}>Image selected</Text>
                <Icon name="check-circle" size={24} color="#34C759" />
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Icon name="image-plus" size={32} color="#007AFF" />
                <Text style={styles.imagePlaceholderText}>Select Image</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Button
          title="Create Product"
          onPress={handleSubmit}
          loading={createMutation.isPending || uploading}
          disabled={createMutation.isPending || uploading}
          fullWidth
          style={styles.submitButton}
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
  errorMessage: {
    marginBottom: 16,
  },
  categorySection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  categoryButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: isSmallDevice ? 'column' : 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  textArea: {
    minHeight: 80,
  },
  imageSection: {
    marginBottom: 16,
  },
  imageButton: {
    marginTop: 8,
  },
  imagePlaceholder: {
    height: 150,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  imagePreview: {
    height: 150,
    borderWidth: 2,
    borderColor: '#34C759',
    borderRadius: 8,
    backgroundColor: '#e6f9ed',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  imagePreviewText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 16,
  },
});

export default AddProductScreen;

