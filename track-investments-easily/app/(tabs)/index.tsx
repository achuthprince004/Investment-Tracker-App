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

const { width } = Dimensions.get('window');

export default function PortfolioScreen() {
  const portfolioSummary = useQuery(api.stocks.getPortfolioSummary);
  const activeStocks = useQuery(api.stocks.getActiveStocks);
  const assets = useQuery(api.assets.getAllAssets);
  const exitStock = useMutation(api.stocks.exitStock);

  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [exitPrice, setExitPrice] = useState('');
  const [exitQuantity, setExitQuantity] = useState('');
  const [exitDate, setExitDate] = useState(new Date().toISOString().split('T')[0]);

  const handleExitPress = (stock: any) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedStock(stock);
    setExitPrice('');
    setExitQuantity(stock.quantity.toString());
    setExitDate(new Date().toISOString().split('T')[0]);
    setExitModalVisible(true);
  };

  const handleExitStock = async () => {
    if (!selectedStock || !exitPrice || !exitQuantity) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const exitQty = parseInt(exitQuantity);
    if (exitQty <= 0 || exitQty > selectedStock.quantity) {
      Alert.alert('Error', `Exit quantity must be between 1 and ${selectedStock.quantity}`);
      return;
    }

    try {
      await exitStock({
        stockId: selectedStock._id,
        exitPrice: parseFloat(exitPrice),
        exitDate,
        exitQuantity: exitQty,
      });
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setExitModalVisible(false);
      
      const invested = exitQty * selectedStock.buyPrice;
      const realized = exitQty * parseFloat(exitPrice);
      const profitLoss = realized - invested;
      const profitLossPercentage = (profitLoss / invested) * 100;
      
      Alert.alert(
        'Stock Exited Successfully', 
        `P&L: ₹${profitLoss.toFixed(2)} (${profitLossPercentage >= 0 ? '+' : ''}${profitLossPercentage.toFixed(2)}%)`
      );
    } catch (error) {
      console.error('Exit stock error:', error);
      Alert.alert('Error', 'Failed to exit stock');
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Calculate asset distribution
  const getAssetDistribution = () => {
    if (!assets || !activeStocks || !portfolioSummary) return [];

    const stocksValue = portfolioSummary.stocksHoldingValue;
    const totalPortfolioValue = portfolioSummary.totalPortfolioCapital;

    const distribution = [];

    // Add stocks if any
    if (stocksValue > 0) {
      distribution.push({
        type: 'Stocks',
        value: stocksValue,
        percentage: (stocksValue / totalPortfolioValue) * 100,
        color: '#F5FF3D',
      });
    }

    // Group assets by type
    const assetGroups: Record<string, { value: number; color: string }> = {};
    
    assets.forEach(asset => {
      const totalValue = asset.investedAmount + (asset.currentGain || 0);
      const typeName = getAssetTypeLabel(asset.type);
      
      if (!assetGroups[typeName]) {
        assetGroups[typeName] = {
          value: 0,
          color: getAssetColor(asset),
        };
      }
      
      assetGroups[typeName].value += totalValue;
    });

    // Add asset groups to distribution
    Object.entries(assetGroups).forEach(([type, data]) => {
      distribution.push({
        type,
        value: data.value,
        percentage: (data.value / totalPortfolioValue) * 100,
        color: data.color,
      });
    });

    return distribution;
  };

  const getAssetTypeLabel = (type: string) => {
    switch (type) {
      case 'schemes': return 'Schemes';
      case 'cryptocurrency': return 'Cryptocurrency';
      case 'stocks_investment': return 'Stock Investment';
      case 'mutual_funds': return 'Mutual Funds';
      case 'commodities':
      case 'commodity': return 'Commodities';
      case 'fd': return 'Fixed Deposit';
      case 'rd': return 'Recurring Deposit';
      case 'bonds': return 'Bonds';
      default: return type;
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

  if (portfolioSummary === undefined || activeStocks === undefined || assets === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading portfolio...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const assetDistribution = getAssetDistribution();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Portfolio Overview</Text>
              <Text style={styles.subtitle}>Your investment summary</Text>
            </View>
            <View style={styles.profileIcon}>
              <Ionicons name="person" size={24} color="#F5FF3D" />
            </View>
          </View>

          {/* Total Portfolio Capital */}
          <View style={styles.totalCapitalCard}>
            <Text style={styles.totalCapitalLabel}>Total Portfolio Capital</Text>
            <Text style={styles.totalCapitalAmount}>
              {formatCurrency(portfolioSummary.totalPortfolioCapital)}
            </Text>
          </View>

          {/* Portfolio Breakdown */}
          <Text style={styles.sectionTitle}>Portfolio Breakdown</Text>

          {/* Stocks Holding */}
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownHeader}>
              <View style={styles.breakdownTitleRow}>
                <Ionicons name="trending-up" size={20} color="#F5FF3D" />
                <Text style={styles.breakdownTitle}>Stocks Holding</Text>
              </View>
            </View>
            <Text style={styles.breakdownAmount}>
              {formatCurrency(portfolioSummary.stocksHoldingValue)}
            </Text>
            <Text style={styles.breakdownSubtext}>
              {portfolioSummary.activeStocksCount} active position{portfolioSummary.activeStocksCount !== 1 ? 's' : ''}
            </Text>

            {/* Active Stocks List */}
            {activeStocks.length > 0 && (
              <View style={styles.stocksList}>
                {activeStocks.map((stock) => (
                  <View key={stock._id} style={styles.stockItem}>
                    <View style={styles.stockInfo}>
                      <Text style={styles.stockName}>{stock.name}</Text>
                      <Text style={styles.stockDetails}>
                        {stock.quantity} shares @ {formatCurrency(stock.buyPrice)}
                      </Text>
                    </View>
                    <View style={styles.stockActions}>
                      <Text style={styles.stockValue}>
                        {formatCurrency(stock.quantity * stock.buyPrice)}
                      </Text>
                      <TouchableOpacity
                        style={styles.exitButton}
                        onPress={() => handleExitPress(stock)}
                      >
                        <Ionicons name="exit-outline" size={16} color="#FF4C4C" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Stocks Exited */}
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownHeader}>
              <View style={styles.breakdownTitleRow}>
                <View style={[styles.statusDot, { backgroundColor: '#00FF88' }]} />
                <Text style={styles.breakdownTitle}>Stocks Exited</Text>
              </View>
            </View>
            <Text style={styles.breakdownAmount}>
              {formatCurrency(portfolioSummary.stocksExitedValue)}
            </Text>
            <Text style={styles.breakdownSubtext}>
              {portfolioSummary.exitedStocksCount === 0 ? 'No exits yet' : `${portfolioSummary.exitedStocksCount} exit${portfolioSummary.exitedStocksCount !== 1 ? 's' : ''}`}
            </Text>
          </View>

          {/* Assets Distribution */}
          {assetDistribution.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Asset Distribution</Text>
              <View style={styles.distributionGrid}>
                {assetDistribution.map((item, index) => (
                  <View key={index} style={styles.distributionBlock}>
                    <View style={[styles.distributionIcon, { backgroundColor: item.color + '20' }]}>
                      <View style={[styles.distributionColorDot, { backgroundColor: item.color }]} />
                    </View>
                    <Text style={styles.distributionType}>{item.type}</Text>
                    <Text style={styles.distributionAmount}>{formatCurrency(item.value)}</Text>
                    <Text style={styles.distributionPercentage}>{item.percentage.toFixed(1)}%</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Portfolio Performance Chart */}
          {assetDistribution.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Portfolio Performance</Text>
              <View style={styles.pieChartContainer}>
                <View style={styles.pieChart}>
                  {assetDistribution.map((item, index) => (
                    <View key={index} style={styles.pieSegment}>
                      <View style={[styles.pieColor, { backgroundColor: item.color }]} />
                      <Text style={styles.pieLabel}>{item.type}</Text>
                      <Text style={styles.piePercentage}>{item.percentage.toFixed(1)}%</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {/* Exit Stock Modal */}
        <Modal
          visible={exitModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setExitModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalKeyboardView}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Exit Stock</Text>
                  <TouchableOpacity
                    onPress={() => setExitModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {selectedStock && (
                  <View style={styles.stockSummary}>
                    <Text style={styles.stockSummaryName}>{selectedStock.name}</Text>
                    <Text style={styles.stockSummaryDetails}>
                      {selectedStock.quantity} shares bought at {formatCurrency(selectedStock.buyPrice)}
                    </Text>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Exit Quantity</Text>
                  <TextInput
                    style={styles.input}
                    value={exitQuantity}
                    onChangeText={setExitQuantity}
                    placeholder="Number of shares to exit"
                    placeholderTextColor="#666666"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Exit Price (₹ per share)</Text>
                  <TextInput
                    style={styles.input}
                    value={exitPrice}
                    onChangeText={setExitPrice}
                    placeholder="Enter exit price"
                    placeholderTextColor="#666666"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Exit Date</Text>
                  <TextInput
                    style={styles.input}
                    value={exitDate}
                    onChangeText={setExitDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#666666"
                  />
                </View>

                {/* Exit Summary */}
                {exitPrice && exitQuantity && selectedStock && (
                  <View style={styles.exitSummary}>
                    <Text style={styles.exitSummaryTitle}>Exit Summary</Text>
                    <View style={styles.exitSummaryRow}>
                      <Text style={styles.exitSummaryLabel}>Invested:</Text>
                      <Text style={styles.exitSummaryValue}>
                        {formatCurrency(parseInt(exitQuantity || '0') * selectedStock.buyPrice)}
                      </Text>
                    </View>
                    <View style={styles.exitSummaryRow}>
                      <Text style={styles.exitSummaryLabel}>Realized:</Text>
                      <Text style={styles.exitSummaryValue}>
                        {formatCurrency(parseInt(exitQuantity || '0') * parseFloat(exitPrice || '0'))}
                      </Text>
                    </View>
                    <View style={styles.exitSummaryRow}>
                      <Text style={styles.exitSummaryLabel}>P&L:</Text>
                      <Text style={[
                        styles.exitSummaryValue,
                        {
                          color: (parseInt(exitQuantity || '0') * parseFloat(exitPrice || '0')) - 
                                 (parseInt(exitQuantity || '0') * selectedStock.buyPrice) >= 0 
                                 ? '#F5FF3D' : '#FF4C4C'
                        }
                      ]}>
                        {(() => {
                          const invested = parseInt(exitQuantity || '0') * selectedStock.buyPrice;
                          const realized = parseInt(exitQuantity || '0') * parseFloat(exitPrice || '0');
                          const pnl = realized - invested;
                          const percentage = invested > 0 ? (pnl / invested) * 100 : 0;
                          return `${formatCurrency(pnl)} (${pnl >= 0 ? '+' : ''}${percentage.toFixed(2)}%)`;
                        })()}
                      </Text>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.exitConfirmButton}
                  onPress={handleExitStock}
                >
                  <Text style={styles.exitConfirmButtonText}>Exit Stock</Text>
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
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
    paddingTop: 20,
    paddingBottom: 30,
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
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalCapitalCard: {
    backgroundColor: '#F5FF3D',
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
  },
  totalCapitalLabel: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 8,
    fontWeight: '600',
  },
  totalCapitalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000000',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  distributionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 30,
  },
  distributionBlock: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    width: (width - 56) / 2,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
  },
  distributionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  distributionColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  distributionType: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
    textAlign: 'center',
  },
  distributionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  distributionPercentage: {
    fontSize: 14,
    color: '#F5FF3D',
    fontWeight: '600',
  },
  pieChartContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  pieChart: {
    gap: 12,
  },
  pieSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pieColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  pieLabel: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
  },
  piePercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F5FF3D',
  },
  breakdownCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakdownTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  breakdownSubtext: {
    fontSize: 14,
    color: '#999999',
  },
  stocksList: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  stockInfo: {
    flex: 1,
  },
  stockName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  stockDetails: {
    fontSize: 14,
    color: '#999999',
  },
  stockActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stockValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  exitButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2A1A1A',
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
    maxHeight: '80%',
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
  stockSummary: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  stockSummaryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  stockSummaryDetails: {
    fontSize: 14,
    color: '#999999',
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
  exitSummary: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  exitSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F5FF3D',
    marginBottom: 12,
  },
  exitSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exitSummaryLabel: {
    fontSize: 14,
    color: '#999999',
  },
  exitSummaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  exitConfirmButton: {
    backgroundColor: '#FF4C4C',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  exitConfirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});