import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RootStackParamList, ProductCategory, Product } from '../../types';
import { productService } from '../../services/productService';
import { hasConflict, resolveConflict } from '../../utils/conflictResolution';
import { AppHeader, Input, Button, ErrorMessage, LoadingScreen } from '../../components';
import { PRODUCT_CATEGORIES } from '../../constants';
import { isTablet, isSmallDevice, getResponsivePadding } from '../../utils/responsive';
import { glassmorphism, colors } from '../../theme';
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
  const padding = getResponsivePadding();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('fresh');
  const [priceGermany, setPriceGermany] = useState('');
  const [priceDenmark, setPriceDenmark] = useState('');
  const [stockGermany, setStockGermany] = useState('');
  const [stockDenmark, setStockDenmark] = useState('');
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
      setPriceGermany(product.price_germany?.toString() || '0');
      setPriceDenmark(product.price_denmark?.toString() || '0');
      setStockGermany(product.stock_germany?.toString() || '0');
      setStockDenmark(product.stock_denmark?.toString() || '0');
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
        setUploadProgress(0);
        try {
          imageUrl = await productService.uploadProductImage(imageUri, (progress) => {
            setUploadProgress(progress);
          });
        } catch (error) {
          console.error('Image upload error:', error);
          // Keep current image if upload fails
        } finally {
          setUploading(false);
          setUploadProgress(0);
        }
      }

      return productService.updateProduct(productId, {
        ...productData,
        image_url: imageUrl,
      });
    },
    onMutate: async (productData) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['product', productId] });
      await queryClient.cancelQueries({ queryKey: ['products'] });

      // Snapshot the previous value
      const previousProduct = queryClient.getQueryData(['product', productId]);
      const previousProducts = queryClient.getQueryData(['products']);

      // Optimistically update the product
      queryClient.setQueryData(['product', productId], (old: any) => ({
        ...old,
        ...productData,
        updated_at: new Date().toISOString(),
      }));

      // Optimistically update products list
      queryClient.setQueryData(['products'], (old: any[]) => {
        if (!old) return old;
        return old.map((p) =>
          p.id === productId
            ? { ...p, ...productData, updated_at: new Date().toISOString() }
            : p
        );
      });

      // Return context with previous values for rollback
      return { previousProduct, previousProducts };
    },
    onError: async (error: any, productData, context) => {
      // Check if it's a conflict error (409 or similar)
      const isConflict = error?.status === 409 || error?.message?.includes('conflict');
      
      if (isConflict && context?.previousProduct) {
        // Try to fetch the current server state
        try {
          const serverProduct = await productService.getProductById(productId);
          if (serverProduct && context.previousProduct) {
            // Detect and resolve conflict
            const conflict = hasConflict(
              productData as Product,
              serverProduct,
              context.previousProduct as Product
            );
            
            if (conflict) {
              // Resolve conflict using merge strategy
              const resolved = resolveConflict({
                strategy: 'merge',
                local: productData as Product,
                remote: serverProduct,
                base: context.previousProduct as Product,
              });
              
              // Update with resolved data
              queryClient.setQueryData(['product', productId], resolved);
              queryClient.setQueryData(['products'], (old: any[]) => {
                if (!old) return old;
                return old.map((p) => (p.id === productId ? resolved : p));
              });
              
              Alert.alert(
                'Conflict Resolved',
                'The product was updated by someone else. Changes have been merged automatically.',
                [{ text: 'OK' }]
              );
              return;
            }
          }
        } catch (fetchError) {
          console.error('Error fetching server state for conflict resolution:', fetchError);
        }
      }
      
      // Rollback on error
      if (context?.previousProduct) {
        queryClient.setQueryData(['product', productId], context.previousProduct);
      }
      if (context?.previousProducts) {
        queryClient.setQueryData(['products'], context.previousProducts);
      }
      Alert.alert('Error', error.message || 'Failed to update product');
    },
    onSuccess: () => {
      // Invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      Alert.alert('Success', 'Product updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onSettled: () => {
      // Always refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
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
    if (!priceDenmark || isNaN(parseFloat(priceDenmark)) || parseFloat(priceDenmark) <= 0) {
      newErrors.priceDenmark = 'Valid Denmark price is required';
    }
    if (!stockGermany || isNaN(parseInt(stockGermany)) || parseInt(stockGermany) < 0) {
      newErrors.stockGermany = 'Valid Germany stock quantity is required';
    }
    if (!stockDenmark || isNaN(parseInt(stockDenmark)) || parseInt(stockDenmark) < 0) {
      newErrors.stockDenmark = 'Valid Denmark stock quantity is required';
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
      price_denmark: parseFloat(priceDenmark),
      stock_germany: parseInt(stockGermany),
      stock_denmark: parseInt(stockDenmark),
      active,
    });
  };

  if (isLoading) {
    return <LoadingScreen message="Loading product..." />;
  }

  if (!product) {
    return (
      <View style={glassmorphism.screenBackground}>
        <AppHeader title="Edit Product" showBack />
        <ErrorMessage message="Product not found" />
      </View>
    );
  }

  return (
    <View style={glassmorphism.screenBackground}>
      <AppHeader title="Edit Product" showBack />
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

        {/* Image Upload Section - Moved to top for better accessibility */}
        <View style={styles.imageSection}>
          <Text style={styles.label}>Product Image (Optional)</Text>
          {uploading ? (
            <View style={styles.uploadProgressContainer}>
              <Icon name="upload" size={24} color={colors.primary[500]} />
              <Text style={styles.uploadProgressText}>Uploading... {uploadProgress}%</Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar,
                    { width: `${uploadProgress}%` }
                  ]} 
                />
              </View>
            </View>
          ) : (currentImageUrl || imageUri) ? (
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
                <Icon name="pencil" size={20} color={colors.primary[500]} />
                <Text style={styles.changeImageText}>Change Image</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setImageUri(null);
                  setCurrentImageUrl(null);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close-circle" size={20} color={colors.error[500]} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.imageButton} 
              onPress={handlePickImage}
              disabled={uploading}
            >
              <View style={styles.imagePlaceholder}>
                <Icon name="image-plus" size={32} color={colors.primary[500]} />
                <Text style={styles.imagePlaceholderText}>Tap to Select Image</Text>
                <Text style={styles.imageHintText}>Recommended: 4:3 aspect ratio</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

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
              label="Price (Denmark) *"
              placeholder="0.00"
              value={priceDenmark}
              onChangeText={(text) => {
                setPriceDenmark(text);
                if (errors.priceDenmark) setErrors({ ...errors, priceDenmark: '' });
              }}
              keyboardType="decimal-pad"
              error={errors.priceDenmark}
            />
          </View>
        </View>

        <View style={styles.priceRow}>
          <View style={styles.halfWidth}>
            <Input
              label="Stock (Germany) *"
              placeholder="0"
              value={stockGermany}
              onChangeText={(text) => {
                setStockGermany(text);
                if (errors.stockGermany) setErrors({ ...errors, stockGermany: '' });
              }}
              keyboardType="number-pad"
              error={errors.stockGermany}
            />
          </View>
          <View style={styles.halfWidth}>
            <Input
              label="Stock (Denmark) *"
              placeholder="0"
              value={stockDenmark}
              onChangeText={(text) => {
                setStockDenmark(text);
                if (errors.stockDenmark) setErrors({ ...errors, stockDenmark: '' });
              }}
              keyboardType="number-pad"
              error={errors.stockDenmark}
            />
          </View>
        </View>

        <View style={styles.activeSection}>
          <Text style={styles.label}>Status</Text>
          <TouchableOpacity
            style={[styles.activeButton, active && styles.activeButtonActive]}
            onPress={() => setActive(!active)}
          >
            <Icon
              name={active ? 'check-circle' : 'close-circle'}
              size={20}
              color={active ? colors.success[500] : colors.error[500]}
            />
            <Text style={[styles.activeText, active && styles.activeTextActive]}>
              {active ? 'Active' : 'Inactive'}
            </Text>
          </TouchableOpacity>
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
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(58, 181, 209, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
  },
  categoryButtonActive: {
    borderColor: colors.primary[500],
    backgroundColor: 'rgba(58, 181, 209, 0.1)',
  },
  categoryButtonText: {
    fontSize: 14,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: colors.primary[500],
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
  activeSection: {
    marginBottom: 16,
  },
  activeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(58, 181, 209, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    gap: 8,
    ...glassmorphism.panel,
  },
  activeButtonActive: {
    borderColor: colors.success[500],
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  activeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  activeTextActive: {
    color: colors.success[600],
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
    borderColor: 'rgba(58, 181, 209, 0.3)',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    ...glassmorphism.panel,
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.primary[500],
    fontWeight: '600',
  },
  imageHintText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.neutral[500],
    fontWeight: '400',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(58, 181, 209, 0.3)',
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
    color: colors.primary[500],
  },
  uploadProgressContainer: {
    height: 150,
    borderWidth: 2,
    borderColor: colors.primary[500],
    borderRadius: 12,
    backgroundColor: 'rgba(58, 181, 209, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  uploadProgressText: {
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '600',
  },
  progressBarContainer: {
    width: '80%',
    height: 4,
    backgroundColor: colors.neutral[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 2,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 16,
  },
});

export default EditProductScreen;

