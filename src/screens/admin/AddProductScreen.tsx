import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RootStackParamList, ProductCategory } from '../../types';
import { productService } from '../../services/productService';
import { AppHeader, Input, Button, ErrorMessage } from '../../components';
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

type AddProductScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddProduct'>;

const STEPS = [
  { id: 1, title: 'Basic Info', icon: 'information' },
  { id: 2, title: 'Pricing', icon: 'currency-usd' },
  { id: 3, title: 'Stock & Review', icon: 'check-circle' },
] as const;

const AddProductScreen = () => {
  const navigation = useNavigation<AddProductScreenNavigationProp>();
  const queryClient = useQueryClient();
  const padding = getResponsivePadding();

  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('fresh');
  const [priceGermany, setPriceGermany] = useState('');
  const [priceDenmark, setPriceDenmark] = useState('');
  const [stockGermany, setStockGermany] = useState('');
  const [stockDenmark, setStockDenmark] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const createMutation = useMutation({
    mutationFn: async (productData: any) => {
      let imageUrl = null;
      
      // Upload image if selected
      if (imageUri) {
        setUploading(true);
        setUploadProgress(0);
        try {
          imageUrl = await productService.uploadProductImage(imageUri, (progress) => {
            setUploadProgress(progress);
          });
        } catch (error) {
          console.error('Image upload error:', error);
          // Continue without image if upload fails
        } finally {
          setUploading(false);
          setUploadProgress(0);
        }
      }

      return productService.createProduct({
        ...productData,
        image_url: imageUrl,
      });
    },
    onMutate: async (newProductData) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['products'] });

      // Snapshot the previous value
      const previousProducts = queryClient.getQueryData(['products']);

      // Generate temporary ID for optimistic product
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Optimistically add new product to the list
      queryClient.setQueryData(['products'], (old: any[] = []) => [
        {
          ...newProductData,
          id: tempId,
          created_at: new Date().toISOString(),
        },
        ...old,
      ]);

      // Return context with previous value and temp ID for rollback/replacement
      return { previousProducts, tempId };
    },
    onSuccess: (data, variables, context) => {
      // Replace temporary product with real one from server
      queryClient.setQueryData(['products'], (old: any[] = []) => {
        if (!old) return [data];
        return old.map((p) => (p.id === context?.tempId ? data : p));
      });

      Alert.alert('Success', 'Product created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any, variables, context) => {
      // Rollback to previous value on error
      if (context?.previousProducts) {
        queryClient.setQueryData(['products'], context.previousProducts);
      }
      Alert.alert('Error', error.message || 'Failed to create product');
    },
    onSettled: () => {
      // Always refetch after mutation to ensure consistency
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
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pick image');
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!name.trim()) newErrors.name = 'Product name is required';
    } else if (step === 2) {
      if (!priceGermany || isNaN(parseFloat(priceGermany)) || parseFloat(priceGermany) <= 0) {
        newErrors.priceGermany = 'Valid Germany price is required';
      }
      if (!priceDenmark || isNaN(parseFloat(priceDenmark)) || parseFloat(priceDenmark) <= 0) {
        newErrors.priceDenmark = 'Valid Denmark price is required';
      }
    } else if (step === 3) {
      if (!stockGermany || isNaN(parseInt(stockGermany)) || parseInt(stockGermany) < 0) {
        newErrors.stockGermany = 'Valid Germany stock quantity is required';
      }
      if (!stockDenmark || isNaN(parseInt(stockDenmark)) || parseInt(stockDenmark) < 0) {
        newErrors.stockDenmark = 'Valid Denmark stock quantity is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!validateStep(3)) {
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      price_germany: parseFloat(priceGermany),
      price_denmark: parseFloat(priceDenmark),
      stock_germany: parseInt(stockGermany),
      stock_denmark: parseInt(stockDenmark),
      active: true,
    });
  };

  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicator}>
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  currentStep >= step.id && styles.stepCircleActive,
                ]}
              >
                {currentStep > step.id ? (
                  <Icon name="check" size={16} color={colors.white} />
                ) : (
                  <Text style={[styles.stepNumber, currentStep >= step.id && styles.stepNumberActive]}>
                    {step.id}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepTitle,
                  currentStep >= step.id && styles.stepTitleActive,
                ]}
                numberOfLines={1}
              >
                {step.title}
              </Text>
            </View>
            {index < STEPS.length - 1 && (
              <View
                style={[
                  styles.stepLine,
                  currentStep > step.id && styles.stepLineActive,
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepHeader}>Basic Information</Text>
            <Text style={styles.stepDescription}>
              Enter the product name, image, and description
            </Text>

            <Input
              label="Product Name *"
              placeholder="Enter product name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              error={errors.name}
              containerStyle={styles.inputContainer}
            />

            <View style={styles.imageSection}>
              <Text style={styles.label}>Product Image (Optional)</Text>
              <TouchableOpacity 
                style={styles.imageButton} 
                onPress={handlePickImage}
                disabled={uploading}
              >
                {uploading ? (
                  <View style={styles.imagePreview}>
                    <Icon name="upload" size={24} color={colors.primary[500]} />
                    <Text style={styles.imagePreviewText}>Uploading... {uploadProgress}%</Text>
                    <View style={styles.progressBarContainer}>
                      <View 
                        style={[
                          styles.progressBar,
                          { width: `${uploadProgress}%` }
                        ]} 
                      />
                    </View>
                  </View>
                ) : imageUri ? (
                  <View style={styles.imagePreview}>
                    <Icon name="check-circle" size={24} color={colors.success[500]} />
                    <Text style={styles.imagePreviewText}>Image selected</Text>
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setImageUri(null)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icon name="close-circle" size={20} color={colors.error[500]} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Icon name="image-plus" size={32} color={colors.primary[500]} />
                    <Text style={styles.imagePlaceholderText}>Tap to Select Image</Text>
                    <Text style={styles.imageHintText}>Recommended: 4:3 aspect ratio</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <Input
              label="Description"
              placeholder="Enter product description (optional)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              style={styles.textArea}
              containerStyle={styles.inputContainer}
            />
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepHeader}>Category & Pricing</Text>
            <Text style={styles.stepDescription}>
              Select category and set prices for both countries
            </Text>

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
                  containerStyle={styles.inputContainer}
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
                  containerStyle={styles.inputContainer}
                />
              </View>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepHeader}>Stock & Review</Text>
            <Text style={styles.stepDescription}>
              Set stock quantities for both countries and review your product details
            </Text>

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
                  containerStyle={styles.inputContainer}
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
                  containerStyle={styles.inputContainer}
                />
              </View>
            </View>

            {/* Review Section */}
            <View style={styles.reviewSection}>
              <Text style={styles.reviewTitle}>Product Summary</Text>
              <View style={styles.reviewCard}>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Name:</Text>
                  <Text style={styles.reviewValue}>{name || 'Not set'}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Category:</Text>
                  <Text style={styles.reviewValue}>{category === 'fresh' ? 'Fresh' : 'Frozen'}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Price (Germany):</Text>
                  <Text style={styles.reviewValue}>
                    {priceGermany ? `€${parseFloat(priceGermany).toFixed(2)}` : 'Not set'}
                  </Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Price (Denmark):</Text>
                  <Text style={styles.reviewValue}>
                    {priceDenmark ? `kr ${parseFloat(priceDenmark).toFixed(2)}` : 'Not set'}
                  </Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Stock (Germany):</Text>
                  <Text style={styles.reviewValue}>{stockGermany || 'Not set'}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Stock (Denmark):</Text>
                  <Text style={styles.reviewValue}>{stockDenmark || 'Not set'}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Image:</Text>
                  <Text style={styles.reviewValue}>{imageUri ? 'Selected ✓' : 'Not selected'}</Text>
                </View>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={glassmorphism.screenBackground}>
      <AppHeader title="Add Product" showBack />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ 
          paddingBottom: padding.vertical * 2,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Step Indicator */}
        <View style={[styles.stepIndicatorContainer, { paddingHorizontal: padding.horizontal, paddingTop: padding.vertical }]}>
          {renderStepIndicator()}
        </View>

        {/* Step Content */}
        <View style={[styles.contentContainer, { paddingHorizontal: padding.horizontal }]}>
          {Object.keys(errors).length > 0 && (
            <ErrorMessage
              message="Please fix the errors below"
              type="error"
              style={styles.errorMessage}
            />
          )}

          {renderStepContent()}
        </View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={[styles.navigationContainer, { paddingHorizontal: padding.horizontal, paddingBottom: padding.vertical }]}>
        <View style={styles.navigationButtons}>
          {currentStep > 1 && (
            <Button
              title="Back"
              onPress={handleBack}
              variant="outline"
              style={styles.backButton}
            />
          )}
          <View style={{ flex: 1 }} />
          {currentStep < 3 ? (
            <Button
              title="Next"
              onPress={handleNext}
              style={styles.nextButton}
            />
          ) : (
            <Button
              title="Create Product"
              onPress={handleSubmit}
              loading={createMutation.isPending || uploading}
              disabled={createMutation.isPending || uploading}
              style={styles.submitButton}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  stepIndicatorContainer: {
    marginBottom: 24,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.neutral[300],
  },
  stepCircleActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  stepNumberActive: {
    color: colors.white,
  },
  stepTitle: {
    marginTop: 8,
    fontSize: 12,
    color: colors.neutral[600],
    fontWeight: '500',
    textAlign: 'center',
  },
  stepTitleActive: {
    color: colors.primary[500],
    fontWeight: '600',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.neutral[300],
    marginHorizontal: 8,
    maxWidth: 60,
  },
  stepLineActive: {
    backgroundColor: colors.primary[500],
  },
  contentContainer: {
    flex: 1,
    maxWidth: isTablet ? 600 : '100%',
    alignSelf: isTablet ? 'center' : 'stretch',
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.neutral[600],
    marginBottom: 24,
  },
  errorMessage: {
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  categorySection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[900],
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
    ...glassmorphism.panel,
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
    minHeight: 100,
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
    height: 150,
    borderWidth: 2,
    borderColor: colors.success[500],
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    position: 'relative',
    ...glassmorphism.panel,
  },
  imagePreviewText: {
    fontSize: 14,
    color: colors.success[600],
    fontWeight: '600',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
  },
  progressBarContainer: {
    width: '80%',
    height: 4,
    backgroundColor: colors.neutral[200],
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 2,
  },
  reviewSection: {
    marginTop: 24,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 12,
  },
  reviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    padding: 16,
    ...glassmorphism.panel,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(58, 181, 209, 0.1)',
  },
  reviewLabel: {
    fontSize: 14,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  reviewValue: {
    fontSize: 14,
    color: colors.neutral[900],
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  navigationContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(58, 181, 209, 0.2)',
    paddingTop: 16,
    ...glassmorphism.panel,
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    minWidth: 100,
  },
  nextButton: {
    minWidth: 100,
  },
  submitButton: {
    minWidth: 150,
  },
});

export default AddProductScreen;
