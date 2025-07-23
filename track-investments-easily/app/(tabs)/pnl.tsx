import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';

export default function PNLScreen() {
  const pnlData = useQuery(api.stocks.getPNLAnalytics);
  const exitedStocks = useQuery(api.stocks.getExitedStocks);
  const deleteStock = useMutation(api.stocks.deleteStock);

  const handleDeleteExitedStock = (stock: any) => {
    Alert.alert(
      'Delete Exited Stock',
      `Are you sure you want to delete "${stock.name}" from exited stocks? This will affect your P&L calculations.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStock({ stockId: stock._id });
            } catch (error) {
              console.error('Delete exited stock error:', error);
              Alert.alert('Error', 'Failed to delete stock');
            }
          },
        },
      ]
    );
  };

  if (pnlData === undefined || exitedStocks === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading PNL data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const formatDays = (days: number) => {
    if (days < 30) return `${days} days`;
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    if (remainingDays === 0) return `${months} month${months > 1 ? 's' : ''}`;
    return `${months}.${Math.floor((remainingDays / 30) * 10)} months`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const isProfitable = pnlData.netProfitLoss >= 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>PNL Analysis</Text>
          <Text style={styles.subtitle}>Realized profits & losses</Text>
        </View>

        {pnlData.totalTrades === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={64} color="#666666" />
            <Text style={styles.emptyTitle}>No Exited Stocks</Text>
            <Text style={styles.emptySubtitle}>
              Exit some stocks to see your PNL analysis
            </Text>
          </View>
        ) : (
          <>
            {/* Main PNL Card */}
            <View style={[styles.mainCard, isProfitable ? styles.profitCard : styles.lossCard]}>
              <Text style={styles.mainCardTitle}>Net Profit/Loss</Text>
              <Text style={[styles.mainAmount, isProfitable ? styles.profitText : styles.lossText]}>
                {formatCurrency(pnlData.netProfitLoss)}
              </Text>
              <Text style={[styles.mainPercentage, isProfitable ? styles.profitText : styles.lossText]}>
                {formatPercentage(pnlData.netProfitLossPercentage)}
              </Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Invested</Text>
                <Text style={styles.statValue}>{formatCurrency(pnlData.totalInvested)}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Realized</Text>
                <Text style={styles.statValue}>{formatCurrency(pnlData.totalRealized)}</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Avg. Holding</Text>
                <Text style={styles.statValue}>{formatDays(pnlData.averageHoldingDays)}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Trades</Text>
                <Text style={styles.statValue}>{pnlData.totalTrades}</Text>
              </View>
            </View>

            {/* Win/Loss Ratio */}
            <View style={styles.ratioCard}>
              <Text style={styles.ratioTitle}>Trade Performance</Text>
              <View style={styles.ratioStats}>
                <View style={styles.ratioItem}>
                  <Text style={styles.winText}>Winning Trades</Text>
                  <Text style={[styles.ratioNumber, styles.winText]}>{pnlData.winningTrades}</Text>
                </View>
                <View style={styles.ratioSeparator} />
                <View style={styles.ratioItem}>
                  <Text style={styles.lossText}>Losing Trades</Text>
                  <Text style={[styles.ratioNumber, styles.lossText]}>{pnlData.losingTrades}</Text>
                </View>
              </View>
              <Text style={styles.winRateText}>
                Win Rate: {pnlData.totalTrades > 0 ? ((pnlData.winningTrades / pnlData.totalTrades) * 100).toFixed(1) : 0}%
              </Text>
            </View>

            {/* Best Trade */}
            {pnlData.bestTrade && (
              <View style={styles.tradeCard}>
                <View style={styles.tradeHeader}>
                  <Ionicons name="trending-up" size={20} color="#F5FF3D" />
                  <Text style={styles.tradeTitle}>Best Trade</Text>
                </View>
                <Text style={styles.tradeName}>{pnlData.bestTrade.name}</Text>
                <View style={styles.tradeStats}>
                  <Text style={[styles.tradeProfit, styles.profitText]}>
                    {formatCurrency(pnlData.bestTrade.profitLoss)} ({formatPercentage(pnlData.bestTrade.profitLossPercentage)})
                  </Text>
                  <Text style={styles.tradeHolding}>
                    Held for {formatDays(pnlData.bestTrade.holdingDays)}
                  </Text>
                </View>
              </View>
            )}

            {/* Worst Trade */}
            {pnlData.worstTrade && pnlData.worstTrade.profitLoss < 0 && (
              <View style={styles.tradeCard}>
                <View style={styles.tradeHeader}>
                  <Ionicons name="trending-down" size={20} color="#FF4C4C" />
                  <Text style={styles.tradeTitle}>Worst Trade</Text>
                </View>
                <Text style={styles.tradeName}>{pnlData.worstTrade.name}</Text>
                <View style={styles.tradeStats}>
                  <Text style={[styles.tradeProfit, styles.lossText]}>
                    {formatCurrency(pnlData.worstTrade.profitLoss)} ({formatPercentage(pnlData.worstTrade.profitLossPercentage)})
                  </Text>
                  <Text style={styles.tradeHolding}>
                    Held for {formatDays(pnlData.worstTrade.holdingDays)}
                  </Text>
                </View>
              </View>
            )}

            {/* Exited Stocks List */}
            {exitedStocks.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Exited Stocks</Text>
                <View style={styles.exitedStocksList}>
                  {exitedStocks.map((stock) => {
                    const quantity = stock.exitQuantity || stock.quantity;
                    const invested = quantity * stock.buyPrice;
                    const realized = quantity * (stock.exitPrice || 0);
                    const profitLoss = realized - invested;
                    const profitLossPercentage = (profitLoss / invested) * 100;
                    
                    return (
                      <View key={stock._id} style={styles.exitedStockCard}>
                        <View style={styles.exitedStockHeader}>
                          <View style={styles.exitedStockInfo}>
                            <Text style={styles.exitedStockName}>{stock.name}</Text>
                            <Text style={styles.exitedStockDetails}>
                              {quantity} shares • {formatDate(stock.exitDate || '')}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.deleteExitedButton}
                            onPress={() => handleDeleteExitedStock(stock)}
                          >
                            <Ionicons name="trash-outline" size={16} color="#FF4C4C" />
                          </TouchableOpacity>
                        </View>
                        
                        <View style={styles.exitedStockStats}>
                          <View style={styles.exitedStockStat}>
                            <Text style={styles.exitedStockStatLabel}>Invested</Text>
                            <Text style={styles.exitedStockStatValue}>{formatCurrency(invested)}</Text>
                          </View>
                          <View style={styles.exitedStockStat}>
                            <Text style={styles.exitedStockStatLabel}>Realized</Text>
                            <Text style={styles.exitedStockStatValue}>{formatCurrency(realized)}</Text>
                          </View>
                          <View style={styles.exitedStockStat}>
                            <Text style={styles.exitedStockStatLabel}>P&L</Text>
                            <Text style={[
                              styles.exitedStockStatValue,
                              profitLoss >= 0 ? styles.profitText : styles.lossText
                            ]}>
                              {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)}
                            </Text>
                          </View>
                          <View style={styles.exitedStockStat}>
                            <Text style={styles.exitedStockStatLabel}>Return</Text>
                            <Text style={[
                              styles.exitedStockStatValue,
                              profitLoss >= 0 ? styles.profitText : styles.lossText
                            ]}>
                              {profitLoss >= 0 ? '+' : ''}{profitLossPercentage.toFixed(2)}%
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
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
  mainCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  profitCard: {
    backgroundColor: '#1A2B1A',
    borderWidth: 1,
    borderColor: '#F5FF3D',
  },
  lossCard: {
    backgroundColor: '#2B1A1A',
    borderWidth: 1,
    borderColor: '#FF4C4C',
  },
  mainCardTitle: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  mainAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mainPercentage: {
    fontSize: 18,
    fontWeight: '600',
  },
  profitText: {
    color: '#F5FF3D',
  },
  lossText: {
    color: '#FF4C4C',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  statLabel: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  ratioCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  ratioTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  ratioStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratioItem: {
    flex: 1,
    alignItems: 'center',
  },
  ratioSeparator: {
    width: 1,
    height: 40,
    backgroundColor: '#333333',
    marginHorizontal: 20,
  },
  ratioNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  winText: {
    color: '#F5FF3D',
  },
  winRateText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    fontWeight: '600',
  },
  tradeCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  tradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tradeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  tradeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tradeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tradeProfit: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tradeHolding: {
    fontSize: 14,
    color: '#999999',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 16,
  },
  exitedStocksList: {
    gap: 12,
    paddingBottom: 20,
  },
  exitedStockCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  exitedStockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exitedStockInfo: {
    flex: 1,
  },
  exitedStockName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  exitedStockDetails: {
    fontSize: 14,
    color: '#999999',
  },
  deleteExitedButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2A1A1A',
  },
  exitedStockStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exitedStockStat: {
    alignItems: 'center',
  },
  exitedStockStatLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  exitedStockStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});