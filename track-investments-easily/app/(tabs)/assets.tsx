import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type AssetType = 'schemes' | 'cryptocurrency' | 'stocks_investment' | 'mutual_funds' | 'commodities' | 'fd' | 'rd' | 'bonds';

const { width } = Dimensions.get('window');

export default function AssetsScreen() {
  const assets = useQuery(api.assets.getAllAssets);
  const addAsset = useMutation(api.assets.addAsset);
  const updateAsset = useMutation(api.assets.updateAsset);
  const deleteAsset = useMutation(api.assets.deleteAsset);

  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType>('schemes');
  const [assetName, setAssetName] = useState('');
  const [investedAmount, setInvestedAmount] = useState('');
  const [currentGain, setCurrentGain] = useState('');
  const [commodityType, setCommodityType] = useState<'gold' | 'silver'>('gold');
  const [bondType, setBondType] = useState<'government' | 'corporate'>('government');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [numberOfMonths, setNumberOfMonths] = useState('');
  const [returnRate, setReturnRate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');

  const resetForm = () => {
    setAssetName('');
    setInvestedAmount('');
    setCurrentGain('');
    setMonthlyAmount('');
    setNumberOfMonths('');
    setReturnRate('');
    setMaturityDate('');
    setEditMode(false);
    setSelectedAsset(null);
  };

  const openAddModal = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    resetForm();
    setModalVisible(true);
  };

  const openDetailModal = (asset: any) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedAsset(asset);
    setDetailModalVisible(true);
  };

  const openEditModal = (asset: any) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedAsset(asset);
    setSelectedAssetType(asset.type);
    setAssetName(asset.name);
    setInvestedAmount(asset.investedAmount.toString());
    setCurrentGain((asset.currentGain || 0).toString());
    if (asset.commodityType) setCommodityType(asset.commodityType);
    if (asset.bondType) setBondType(asset.bondType);
    if (asset.monthlyAmount) setMonthlyAmount(asset.monthlyAmount.toString());
    if (asset.numberOfMonths) setNumberOfMonths(asset.numberOfMonths.toString());
    if (asset.returnRate) setReturnRate(asset.returnRate.toString());
    if (asset.maturityDate) setMaturityDate(asset.maturityDate);
    setEditMode(true);
    setDetailModalVisible(false);
    setModalVisible(true);
  };

  const handleSaveAsset = async () => {
    if (!assetName || !investedAmount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (isNaN(Number(investedAmount)) || Number(investedAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid investment amount');
      return;
    }

    if (selectedAssetType === 'rd') {
      if (!monthlyAmount || !numberOfMonths) {
        Alert.alert('Error', 'Please fill monthly amount and number of months for RD');
        return;
      }
      if (isNaN(Number(monthlyAmount)) || isNaN(Number(numberOfMonths))) {
        Alert.alert('Error', 'Please enter valid numbers for RD fields');
        return;
      }
    }

    try {
      const assetData: any = {
        type: selectedAssetType,
        name: assetName,
        investedAmount: Number(investedAmount),
        currentGain: currentGain ? Number(currentGain) : 0,
      };

      if (selectedAssetType === 'commodities') {
        assetData.commodityType = commodityType;
      } else if (selectedAssetType === 'rd') {
        assetData.monthlyAmount = Number(monthlyAmount);
        assetData.numberOfMonths = Number(numberOfMonths);
      } else if (selectedAssetType === 'bonds') {
        assetData.bondType = bondType;
        if (returnRate) assetData.returnRate = Number(returnRate);
        if (maturityDate) assetData.maturityDate = maturityDate;
      }

      if (editMode && selectedAsset) {
        await updateAsset({ assetId: selectedAsset._id, ...assetData });
        Alert.alert('Success', 'Asset updated successfully!');
      } else {
        await addAsset(assetData);
        Alert.alert('Success', 'Asset added successfully!');
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      resetForm();
      setModalVisible(false);
    } catch (error) {
      console.error('Save asset error:', error);
      Alert.alert('Error', 'Failed to save asset. Please try again.');
    }
  };

  const handleDeleteAsset = (assetId: string, assetName: string) => {
    Alert.alert(
      'Delete Asset',
      `Are you sure you want to delete "${assetName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAsset({ assetId });
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              setDetailModalVisible(false);
            } catch (error) {
              console.error('Delete asset error:', error);
              Alert.alert('Error', 'Failed to delete asset');
            }
          },
        },
      ]
    );
  };

  const getAssetIcon = (type: AssetType) => {
    switch (type) {
      case 'schemes': return 'trending-up';
      case 'cryptocurrency': return 'logo-bitcoin';
      case 'stocks_investment': return 'bar-chart';
      case 'mutual_funds': return 'pie-chart';
      case 'commodities': return 'diamond';
      case 'fd': return 'card';
      case 'rd': return 'calendar';
      case 'bonds': return 'document-text';
      default: return 'cube';
    }
  };

  const getAssetColor = (asset: any) => {
    switch (asset.type) {
      case 'schemes': return '#4CAF50';
      case 'cryptocurrency': return '#F7931A';
      case 'stocks_investment': return '#2196F3';
      case 'mutual_funds': return '#9C27B0';
      case 'commodities':
      case 'commodity':
        return asset.commodityType === 'gold' ? '#FFD700' : '#C0C0C0';
      case 'fd': return '#00BCD4';
      case 'rd': return '#009688';
      case 'bonds':
        return asset.bondType === 'government' ? '#4CAF50' : '#FF9800';
      default: return '#666666';
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getAssetTypeLabel = (type: AssetType) => {
    switch (type) {
      case 'schemes': return 'Schemes';
      case 'cryptocurrency': return 'Cryptocurrency';
      case 'stocks_investment': return 'Stock Investment';
      case 'mutual_funds': return 'Mutual Funds';
      case 'commodities': return 'Commodities';
      case 'fd': return 'Fixed Deposit';
      case 'rd': return 'Recurring Deposit';
      case 'bonds': return 'Bonds';
      default: return type;
    }
  };

  const getAssetSubtitle = (asset: any) => {
    if (asset.type === 'commodities' && asset.commodityType) {
      return asset.commodityType.charAt(0).toUpperCase() + asset.commodityType.slice(1);
    }
    if (asset.type === 'bonds' && asset.bondType) {
      return asset.bondType === 'government' ? 'Government' : 'Corporate';
    }
    if (asset.type === 'rd' && asset.monthlyAmount && asset.numberOfMonths) {
      return `₹${asset.monthlyAmount}/month × ${asset.numberOfMonths}`;
    }
    return '';
  };

  const getTotalValue = (asset: any) => {
    return asset.investedAmount + (asset.currentGain || 0);
  };

  if (assets === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading assets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalAssetsValue = assets.reduce((sum, asset) => sum + getTotalValue(asset), 0);
  const totalInvested = assets.reduce((sum, asset) => sum + asset.investedAmount, 0);
  const totalGains = assets.reduce((sum, asset) => sum + (asset.currentGain || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Assets</Text>
            <Text style={styles.subtitle}>Your non-stock investments</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Ionicons name="add" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        {totalAssetsValue > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Assets Value</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(totalAssetsValue)}</Text>
            <View style={styles.summaryBreakdown}>
              <Text style={styles.summaryBreakdownText}>
                Invested: {formatCurrency(totalInvested)} • Gains: {formatCurrency(totalGains)}
              </Text>
            </View>
          </View>
        )}

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {assets.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="grid-outline" size={64} color="#666666" />
              <Text style={styles.emptyTitle}>No Assets</Text>
              <Text style={styles.emptySubtitle}>
                Add your first asset to get started
              </Text>
            </View>
          ) : (
            <View style={styles.assetsGrid}>
              {assets.map((asset) => {
                const totalValue = getTotalValue(asset);
                const percentage = totalAssetsValue > 0 ? (totalValue / totalAssetsValue) * 100 : 0;
                
                return (
                  <TouchableOpacity 
                    key={asset._id} 
                    style={styles.assetCard}
                    onPress={() => openDetailModal(asset)}
                  >
                    <View style={styles.assetHeader}>
                      <View style={[styles.assetIcon, { backgroundColor: getAssetColor(asset) + '20' }]}>
                        <Ionicons 
                          name={getAssetIcon(asset.type)} 
                          size={24} 
                          color={getAssetColor(asset)} 
                        />
                      </View>
                    </View>

                    <Text style={styles.assetName} numberOfLines={2}>{asset.name}</Text>
                    <Text style={styles.assetType}>{getAssetTypeLabel(asset.type)}</Text>
                    
                    {getAssetSubtitle(asset) && (
                      <Text style={styles.assetSubtype}>
                        {getAssetSubtitle(asset)}
                      </Text>
                    )}

                    <Text style={styles.assetAmount}>{formatCurrency(totalValue)}</Text>
                    <Text style={styles.assetPercentage}>{percentage.toFixed(1)}%</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Asset Detail Modal */}
        <Modal
          visible={detailModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setDetailModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.detailModalContent}>
              {selectedAsset && (
                <>
                  <View style={styles.detailHeader}>
                    <View style={styles.detailTitleRow}>
                      <View style={[styles.detailIcon, { backgroundColor: getAssetColor(selectedAsset) + '20' }]}>
                        <Ionicons 
                          name={getAssetIcon(selectedAsset.type)} 
                          size={32} 
                          color={getAssetColor(selectedAsset)} 
                        />
                      </View>
                      <View style={styles.detailTitleText}>
                        <Text style={styles.detailTitle}>{selectedAsset.name}</Text>
                        <Text style={styles.detailSubtitle}>{getAssetTypeLabel(selectedAsset.type)}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => setDetailModalVisible(false)}
                      style={styles.closeButton}
                    >
                      <Ionicons name="close" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.detailStats}>
                    <View style={styles.detailStatItem}>
                      <Text style={styles.detailStatLabel}>Invested Amount</Text>
                      <Text style={styles.detailStatValue}>{formatCurrency(selectedAsset.investedAmount)}</Text>
                    </View>
                    
                    {selectedAsset.currentGain !== undefined && selectedAsset.currentGain !== 0 && (
                      <View style={styles.detailStatItem}>
                        <Text style={styles.detailStatLabel}>Current Gain/Loss</Text>
                        <Text style={[
                          styles.detailStatValue,
                          { color: selectedAsset.currentGain >= 0 ? '#F5FF3D' : '#FF4C4C' }
                        ]}>
                          {selectedAsset.currentGain >= 0 ? '+' : ''}{formatCurrency(selectedAsset.currentGain)}
                        </Text>
                      </View>
                    )}

                    <View style={styles.detailStatItem}>
                      <Text style={styles.detailStatLabel}>Total Value</Text>
                      <Text style={styles.detailStatValue}>{formatCurrency(getTotalValue(selectedAsset))}</Text>
                    </View>

                    {selectedAsset.maturityDate && (
                      <View style={styles.detailStatItem}>
                        <Text style={styles.detailStatLabel}>Maturity Date</Text>
                        <Text style={styles.detailStatValue}>{selectedAsset.maturityDate}</Text>
                      </View>
                    )}

                    {selectedAsset.returnRate && (
                      <View style={styles.detailStatItem}>
                        <Text style={styles.detailStatLabel}>Return Rate</Text>
                        <Text style={styles.detailStatValue}>{selectedAsset.returnRate}%</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.detailActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openEditModal(selectedAsset)}
                    >
                      <Ionicons name="create-outline" size={20} color="#F5FF3D" />
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteAsset(selectedAsset._id, selectedAsset.name)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#FF4C4C" />
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Add/Edit Asset Modal */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalKeyboardView}
            >
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{editMode ? 'Edit Asset' : 'Add Asset'}</Text>
                    <TouchableOpacity
                      onPress={() => setModalVisible(false)}
                      style={styles.closeButton}
                    >
                      <Ionicons name="close" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>

                  {/* Asset Type Selector */}
                  {!editMode && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Asset Type</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScrollView}>
                        <View style={styles.typeSelector}>
                          {(['schemes', 'cryptocurrency', 'stocks_investment', 'mutual_funds', 'commodities', 'fd', 'rd', 'bonds'] as AssetType[]).map((type) => (
                            <TouchableOpacity
                              key={type}
                              style={[
                                styles.typeOption,
                                selectedAssetType === type && styles.selectedTypeOption
                              ]}
                              onPress={() => setSelectedAssetType(type)}
                            >
                              <Text style={[
                                styles.typeOptionText,
                                selectedAssetType === type && styles.selectedTypeOptionText
                              ]}>
                                {getAssetTypeLabel(type)}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  )}

                  {/* Asset Name */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      {selectedAssetType === 'cryptocurrency' ? 'Crypto Name' :
                       selectedAssetType === 'schemes' ? 'Scheme Name' :
                       selectedAssetType === 'stocks_investment' ? 'Investment Name' :
                       selectedAssetType === 'mutual_funds' ? 'Fund Name' :
                       selectedAssetType === 'commodities' ? 'Commodity Name' :
                       selectedAssetType === 'fd' ? 'FD Name' :
                       selectedAssetType === 'rd' ? 'RD Name' :
                       'Bond Name'}
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={assetName}
                      onChangeText={setAssetName}
                      placeholder="Enter name"
                      placeholderTextColor="#666666"
                    />
                  </View>

                  {/* Commodity Type */}
                  {selectedAssetType === 'commodities' && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Commodity Type</Text>
                      <View style={styles.radioGroup}>
                        <TouchableOpacity
                          style={styles.radioOption}
                          onPress={() => setCommodityType('gold')}
                        >
                          <View style={[styles.radio, commodityType === 'gold' && styles.radioSelected]} />
                          <Text style={styles.radioText}>Gold</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.radioOption}
                          onPress={() => setCommodityType('silver')}
                        >
                          <View style={[styles.radio, commodityType === 'silver' && styles.radioSelected]} />
                          <Text style={styles.radioText}>Silver</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Bond Type */}
                  {selectedAssetType === 'bonds' && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Bond Type</Text>
                      <View style={styles.radioGroup}>
                        <TouchableOpacity
                          style={styles.radioOption}
                          onPress={() => setBondType('government')}
                        >
                          <View style={[styles.radio, bondType === 'government' && styles.radioSelected]} />
                          <Text style={styles.radioText}>Government</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.radioOption}
                          onPress={() => setBondType('corporate')}
                        >
                          <View style={[styles.radio, bondType === 'corporate' && styles.radioSelected]} />
                          <Text style={styles.radioText}>Corporate</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* RD Specific Fields */}
                  {selectedAssetType === 'rd' && (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Monthly Amount (₹)</Text>
                        <TextInput
                          style={styles.input}
                          value={monthlyAmount}
                          onChangeText={setMonthlyAmount}
                          placeholder="Enter monthly amount"
                          placeholderTextColor="#666666"
                          keyboardType="numeric"
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Number of Months</Text>
                        <TextInput
                          style={styles.input}
                          value={numberOfMonths}
                          onChangeText={setNumberOfMonths}
                          placeholder="Enter number of months"
                          placeholderTextColor="#666666"
                          keyboardType="numeric"
                        />
                      </View>
                    </>
                  )}

                  {/* Invested Amount */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      {selectedAssetType === 'rd' ? 'Total Invested Amount (₹)' : 'Invested Amount (₹)'}
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={investedAmount}
                      onChangeText={setInvestedAmount}
                      placeholder="Enter amount"
                      placeholderTextColor="#666666"
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Current Gain/Loss */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Current Gain/Loss (₹) - Optional</Text>
                    <TextInput
                      style={styles.input}
                      value={currentGain}
                      onChangeText={setCurrentGain}
                      placeholder="Enter current gain or loss"
                      placeholderTextColor="#666666"
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Bond Specific Fields */}
                  {selectedAssetType === 'bonds' && (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Return Rate (%) - Optional</Text>
                        <TextInput
                          style={styles.input}
                          value={returnRate}
                          onChangeText={setReturnRate}
                          placeholder="Enter return rate"
                          placeholderTextColor="#666666"
                          keyboardType="numeric"
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Maturity Date - Optional</Text>
                        <TextInput
                          style={styles.input}
                          value={maturityDate}
                          onChangeText={setMaturityDate}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor="#666666"
                        />
                      </View>
                    </>
                  )}

                  <TouchableOpacity
                    style={styles.addAssetButton}
                    onPress={handleSaveAsset}
                  >
                    <Text style={styles.addAssetButtonText}>
                      {editMode ? 'Update Asset' : 'Add Asset'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#999999',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5FF3D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#999999',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  summaryBreakdown: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  summaryBreakdownText: {
    fontSize: 14,
    color: '#999999',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  assetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingBottom: 20,
  },
  assetCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    width: (width - 56) / 2,
    borderWidth: 1,
    borderColor: '#333333',
    minHeight: 140,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  assetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    minHeight: 40,
  },
  assetType: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  assetSubtype: {
    fontSize: 12,
    color: '#F5FF3D',
    marginBottom: 8,
  },
  assetAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  assetPercentage: {
    fontSize: 14,
    color: '#F5FF3D',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalKeyboardView: {
    justifyContent: 'flex-end',
    maxHeight: '90%',
  },
  modalScrollView: {
    maxHeight: '100%',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  detailModalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  detailTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailTitleText: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  detailSubtitle: {
    fontSize: 16,
    color: '#999999',
  },
  detailStats: {
    gap: 16,
    marginBottom: 24,
  },
  detailStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  detailStatLabel: {
    fontSize: 16,
    color: '#999999',
  },
  detailStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5FF3D',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A1A1A',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4C4C',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#333333',
  },
  typeScrollView: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#333333',
    minWidth: 120,
  },
  selectedTypeOption: {
    backgroundColor: '#F5FF3D',
    borderColor: '#F5FF3D',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  selectedTypeOptionText: {
    color: '#000000',
    fontWeight: '600',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#666666',
  },
  radioSelected: {
    borderColor: '#F5FF3D',
    backgroundColor: '#F5FF3D',
  },
  radioText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  addAssetButton: {
    backgroundColor: '#F5FF3D',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  addAssetButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
});