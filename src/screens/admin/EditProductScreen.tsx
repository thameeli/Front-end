import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RootStackParamList, ProductCategory } from '../../types';
import { productService } from '../../services/productService';
import { AppHeader, Input, Button, ErrorMessage, LoadingScreen } from '../../components';
import { PRODUCT_CATEGORIES } from '../../constants';
// Lazy import to avoid module-level initialization issues
let ImagePicker: any = null;
const getImagePicker = async () => {
  if (!ImagePicker) {
    ImagePicker = await import('expo-image-picker');
  }
  return ImagePicker;
};

type EditProductScreenRouteProp = RouteProp<RootStackParamList, 'EditProduct'>;
type EditProductScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditProduct'>;

const EditProductScreen = () => {
  const route = useRoute<EditProductScreenRouteProp>();
  const navigation = useNavigation<EditProductScreenNavigationProp>();
  const queryClient = useQueryClient();
  const { productId } = route.params;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('fresh');
  const [priceGermany, setPriceGermany] = useState('');
  const [priceNorway, setPriceNorway] = useState('');
  const [stock, setStock] = useState('');
  const [active, setActive] = useState(true);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  // Fetch product
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productService.getProductById(productId),
    enabled: !!productId,
  });

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || '');
      setCategory(product.category);
      setPriceGermany(product.price_germany.toString());
      setPriceNorway(product.price_norway.toString());
      setStock(product.stock.toString());
      setActive(product.active);
      setCurrentImageUrl(product.image_url || null);
    }
  }, [product]);

  const updateMutation = useMutation({
    mutationFn: async (productData: any) => {
      let imageUrl = currentImageUrl;
      
      // Upload new image if selected
      if (imageUri) {
        setUploading(true);
        try {
          imageUrl = await productService.uploadProductImage(imageUri);
        } catch (error) {
          console.error('Image upload error:', error);
          // Keep current image if upload fails
        } finally {
          setUploading(false);
        }
      }

      return productService.updateProduct(productId, {
        ...productData,
        image_url: imageUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      Alert.alert('Success', 'Product updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update product');
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
        setCurrentImageUrl(null); // Clear current image URL when new one is selected
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

    updateMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      price_germany: parseFloat(priceGermany),
      price_norway: parseFloat(priceNorway),
      stock: parseInt(stock),
      active,
    });
  };

  if (isLoading) {
    return <LoadingScreen message="Loading product..." />;
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <AppHeader title="Edit Product" showBack />
        <ErrorMessage message="Product not found" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Edit Product" showBack />
      <ScrollView style={styles.content}>
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

        <View style={styles.activeSection}>
          <Text style={styles.label}>Status</Text>
          <TouchableOpacity
            style={[styles.activeButton, active && styles.activeButtonActive]}
            onPress={() => setActive(!active)}
          >
            <Icon
              name={active ? 'check-circle' : 'close-circle'}
              size={20}
              color={active ? '#34C759' : '#FF3B30'}
            />
            <Text style={[styles.activeText, active && styles.activeTextActive]}>
              {active ? 'Active' : 'Inactive'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.imageSection}>
          <Text style={styles.label}>Product Image</Text>
          {(currentImageUrl || imageUri) ? (
            <View style={styles.imagePreview}>
              <Image
                source={{ uri: imageUri || currentImageUrl || '' }}
                style={styles.image}
                contentFit="cover"
              />
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={handlePickImage}
              >
                <Icon name="pencil" size={20} color="#007AFF" />
                <Text style={styles.changeImageText}>Change Image</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.imageButton} onPress={handlePickImage}>
              <View style={styles.imagePlaceholder}>
                <Icon name="image-plus" size={32} color="#007AFF" />
                <Text style={styles.imagePlaceholderText}>Select Image</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <Button
          title="Update Product"
          onPress={handleSubmit}
          loading={updateMutation.isPending || uploading}
          disabled={updateMutation.isPending || uploading}
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
    padding: 16,
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
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  textArea: {
    minHeight: 80,
  },
  activeSection: {
    marginBottom: 16,
  },
  activeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    gap: 8,
  },
  activeButtonActive: {
    borderColor: '#34C759',
    backgroundColor: '#e6f9ed',
  },
  activeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTextActive: {
    color: '#34C759',
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
    marginTop: 8,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 6,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  changeImageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 16,
  },
});

export default EditProductScreen;

