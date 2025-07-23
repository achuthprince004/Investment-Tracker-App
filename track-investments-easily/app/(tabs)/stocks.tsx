import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function StocksScreen() {
  const [activeTab, setActiveTab] = useState<'holding' | 'exited'>('holding');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editBuyPrice, setEditBuyPrice] = useState('');
  const [editBuyDate, setEditBuyDate] = useState('');

  const activeStocks = useQuery(api.stocks.getActiveStocks);
  const exitedStocks = useQuery(api.stocks.getExitedStocks);
  const updateStock = useMutation(api.stocks.updateStock);
  const deleteStock = useMutation(api.stocks.deleteStock);

  const handleTabPress = (tab: 'holding' | 'exited') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
  };

  const handleEditPress = (stock: any) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedStock(stock);
    setEditName(stock.name);
    setEditQuantity(stock.quantity.toString());
    setEditBuyPrice(stock.buyPrice.toString());
    setEditBuyDate(stock.buyDate);
    setEditModalVisible(true);
  };

  const handleUpdateStock = async () => {
    if (!editName || !editQuantity || !editBuyPrice || !editBuyDate) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isNaN(Number(editQuantity)) || isNaN(Number(editBuyPrice))) {
      Alert.alert('Error', 'Quantity and price must be valid numbers');
      return;
    }

    if (Number(editQuantity) <= 0 || Number(editBuyPrice) <= 0) {
      Alert.alert('Error', 'Quantity and price must be greater than 0');
      return;
    }

    try {
      await updateStock({
        stockId: selectedStock._id,
        name: editName,
        quantity: Number(editQuantity),
        buyPrice: Number(editBuyPrice),
        buyDate: editBuyDate,
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setEditModalVisible(false);
      Alert.alert('Success', 'Stock updated successfully');
    } catch (error) {
      console.error('Update stock error:', error);
      Alert.alert('Error', 'Failed to update stock');
    }
  };

  const handleDeleteStock = (stock: any) => {
    const stockType = activeTab === 'holding' ? 'holding' : 'exited';
    Alert.alert(
      'Delete Stock',
      `Are you sure you want to delete "${stock.name}" from ${stockType} stocks?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStock({ stockId: stock._id });
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (error) {
              console.error('Delete stock error:', error);
              Alert.alert('Error', 'Failed to delete stock');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const calculateProfitLoss = (stock: any) => {
    if (!stock.exitPrice) return { amount: 0, percentage: 0 };
    
    const quantity = stock.exitQuantity || stock.quantity;
    const invested = quantity * stock.buyPrice;
    const realized = quantity * stock.exitPrice;
    const profitLoss = realized - invested;
    const percentage = (profitLoss / invested) * 100;
    
    return { amount: profitLoss, percentage };
  };

  const calculateHoldingDays = (buyDate: string, exitDate?: string) => {
    const buy = new Date(buyDate);
    const exit = exitDate ? new Date(exitDate) : new Date();
    const diffTime = Math.abs(exit.getTime() - buy.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (activeStocks === undefined || exitedStocks === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading stocks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStocks = activeTab === 'holding' ? activeStocks : exitedStocks;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Stocks</Text>
          <Text style={styles.subtitle}>Your stock investments</Text>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'holding' && styles.activeTab]}
            onPress={() => handleTabPress('holding')}
          >
            <Text style={[styles.tabText, activeTab === 'holding' && styles.activeTabText]}>
              Holding ({activeStocks.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'exited' && styles.activeTab]}
            onPress={() => handleTabPress('exited')}
          >
            <Text style={[styles.tabText, activeTab === 'exited' && styles.activeTabText]}>
              Exited ({exitedStocks.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {currentStocks.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons 
                name={activeTab === 'holding' ? 'trending-up-outline' : 'exit-outline'} 
                size={64} 
                color="#666666" 
              />
              <Text style={styles.emptyTitle}>
                {activeTab === 'holding' ? 'No Holdings' : 'No Exits'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'holding' 
                  ? 'Add your first stock to get started' 
                  : 'Exit some stocks to see them here'
                }
              </Text>
            </View>
          ) : (
            <View style={styles.stocksList}>
              {currentStocks.map((stock) => {
                const profitLoss = calculateProfitLoss(stock);
                const holdingDays = calculateHoldingDays(stock.buyDate, stock.exitDate);
                const quantity = stock.exitQuantity || stock.quantity;
                const currentValue = activeTab === 'holding' 
                  ? stock.quantity * stock.buyPrice 
                  : quantity * (stock.exitPrice || 0);
                
                return (
                  <View key={stock._id} style={styles.stockCard}>
                    <View style={styles.stockHeader}>
                      <View style={styles.stockTitleRow}>
                        <Text style={styles.stockName}>{stock.name}</Text>
                        <View style={styles.stockActions}>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleEditPress(stock)}
                          >
                            <Ionicons name="create-outline" size={16} color="#D4FF00" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleDeleteStock(stock)}
                          >
                            <Ionicons name="trash-outline" size={16} color="#FF4C4C" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      <View style={styles.stockValueRow}>
                        <Text style={styles.stockValue}>{formatCurrency(currentValue)}</Text>
                        {activeTab === 'holding' ? (
                          <View style={styles.holdingBadge}>
                            <Text style={styles.holdingBadgeText}>HOLDING</Text>
                          </View>
                        ) : (
                          <View style={[
                            styles.pnlBadge, 
                            profitLoss.amount >= 0 ? styles.profitBadge : styles.lossBadge
                          ]}>
                            <Text style={[
                              styles.pnlBadgeText,
                              profitLoss.amount >= 0 ? styles.profitText : styles.lossText
                            ]}>
                              {profitLoss.amount >= 0 ? '+' : ''}{profitLoss.percentage.toFixed(1)}%
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.stockDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Quantity:</Text>
                        <Text style={styles.detailValue}>
                          {activeTab === 'exited' && stock.exitQuantity 
                            ? stock.exitQuantity : stock.quantity} shares
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Buy Price:</Text>
                        <Text style={styles.detailValue}>{formatCurrency(stock.buyPrice)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Buy Date:</Text>
                        <Text style={styles.detailValue}>{formatDate(stock.buyDate)}</Text>
                      </View>
                      {activeTab === 'exited' && stock.exitPrice && (
                        <>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Exit Price:</Text>
                            <Text style={styles.detailValue}>{formatCurrency(stock.exitPrice)}</Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Exit Date:</Text>
                            <Text style={styles.detailValue}>{formatDate(stock.exitDate || '')}</Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>P&L:</Text>
                            <Text style={[
                              styles.detailValue,
                              profitLoss.amount >= 0 ? styles.profitText : styles.lossText
                            ]}>
                              {profitLoss.amount >= 0 ? '+' : ''}{formatCurrency(profitLoss.amount)}
                            </Text>
                          </View>
                        </>
                      )}
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                          {activeTab === 'holding' ? 'Holding Period:' : 'Held For:'}
                        </Text>
                        <Text style={styles.detailValue}>
                          {holdingDays} day{holdingDays !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Edit Stock Modal */}
        <Modal
          visible={editModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalKeyboardView}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Stock</Text>
                  <TouchableOpacity
                    onPress={() => setEditModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Stock Name</Text>
                  <TextInput
                    style={styles.input}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter stock name"
                    placeholderTextColor="#666666"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Quantity</Text>
                  <TextInput
                    style={styles.input}
                    value={editQuantity}
                    onChangeText={setEditQuantity}
                    placeholder="Enter quantity"
                    placeholderTextColor="#666666"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Buy Price (₹)</Text>
                  <TextInput
                    style={styles.input}
                    value={editBuyPrice}
                    onChangeText={setEditBuyPrice}
                    placeholder="Enter buy price"
                    placeholderTextColor="#666666"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Buy Date</Text>
                  <TextInput
                    style={styles.input}
                    value={editBuyDate}
                    onChangeText={setEditBuyDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#666666"
                  />
                </View>

                <TouchableOpacity
                  style={styles.updateButton}
                  onPress={handleUpdateStock}
                >
                  <Text style={styles.updateButtonText}>Update Stock</Text>
                </TouchableOpacity>
              </View>
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#D4FF00',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999999',
  },
  activeTabText: {
    color: '#000000',
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
  stocksList: {
    paddingBottom: 20,
  },
  stockCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  stockHeader: {
    marginBottom: 16,
  },
  stockTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stockName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  stockActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
  },
  stockValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  holdingBadge: {
    backgroundColor: '#D4FF00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  holdingBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  pnlBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  profitBadge: {
    backgroundColor: '#1A2B1A',
  },
  lossBadge: {
    backgroundColor: '#2B1A1A',
  },
  pnlBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  profitText: {
    color: '#F5FF3D',
  },
  lossText: {
    color: '#FF4C4C',
  },
  stockDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#999999',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalKeyboardView: {
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
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
  updateButton: {
    backgroundColor: '#D4FF00',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
});