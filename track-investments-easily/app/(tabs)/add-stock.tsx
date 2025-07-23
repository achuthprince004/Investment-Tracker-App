import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const POPULAR_STOCKS = [
  'Reliance Industries', 'TCS', 'HDFC Bank', 'Infosys', 'ICICI Bank',
  'Hindustan Unilever', 'ITC', 'State Bank of India', 'Bharti Airtel',
  'Kotak Mahindra Bank', 'Larsen & Toubro', 'Asian Paints', 'Axis Bank',
  'Maruti Suzuki', 'Bajaj Finance', 'Wipro', 'UltraTech Cement',
  'Nestle India', 'HCL Technologies', 'Titan Company'
];

export default function AddStockScreen() {
  const [stockName, setStockName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [buyDate, setBuyDate] = useState(new Date().toISOString().split('T')[0]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredStocks, setFilteredStocks] = useState<string[]>([]);

  const addStock = useMutation(api.stocks.addStock);

  const handleStockNameChange = (text: string) => {
    setStockName(text);
    if (text.length > 0) {
      const filtered = POPULAR_STOCKS.filter(stock =>
        stock.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredStocks(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectStock = (stock: string) => {
    setStockName(stock);
    setShowSuggestions(false);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAddStock = async () => {
    if (!stockName || !quantity || !buyPrice) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (isNaN(Number(quantity)) || isNaN(Number(buyPrice))) {
      Alert.alert('Error', 'Quantity and price must be valid numbers');
      return;
    }

    if (Number(quantity) <= 0 || Number(buyPrice) <= 0) {
      Alert.alert('Error', 'Quantity and price must be greater than 0');
      return;
    }

    try {
      await addStock({
        name: stockName,
        quantity: Number(quantity),
        buyPrice: Number(buyPrice),
        buyDate,
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Reset form
      setStockName('');
      setQuantity('');
      setBuyPrice('');
      setBuyDate(new Date().toISOString().split('T')[0]);
      setShowSuggestions(false);

      Alert.alert('Success', 'Stock added to your portfolio!');
    } catch (error) {
      console.error('Add stock error:', error);
      Alert.alert('Error', 'Failed to add stock. Please try again.');
    }
  };

  const totalInvestment = quantity && buyPrice ? Number(quantity) * Number(buyPrice) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Stock</Text>
          <Text style={styles.subtitle}>Log a stock you bought</Text>
        </View>

        <View style={styles.form}>
          {/* Stock Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Stock Name *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={stockName}
                onChangeText={handleStockNameChange}
                placeholder="Search for a stock..."
                placeholderTextColor="#666666"
                onFocus={() => {
                  if (stockName.length > 0) setShowSuggestions(true);
                }}
              />
              <Ionicons name="search" size={20} color="#666666" style={styles.inputIcon} />
            </View>
            
            {showSuggestions && filteredStocks.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {filteredStocks.slice(0, 5).map((stock, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => selectStock(stock)}
                  >
                    <Text style={styles.suggestionText}>{stock}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Quantity */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quantity (Number of shares) *</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="Enter number of shares"
              placeholderTextColor="#666666"
              keyboardType="numeric"
            />
          </View>

          {/* Buy Price */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Buy Price (₹ per share) *</Text>
            <TextInput
              style={styles.input}
              value={buyPrice}
              onChangeText={setBuyPrice}
              placeholder="Enter price per share"
              placeholderTextColor="#666666"
              keyboardType="numeric"
            />
          </View>

          {/* Buy Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Buy Date</Text>
            <TextInput
              style={styles.input}
              value={buyDate}
              onChangeText={setBuyDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666666"
            />
          </View>

          {/* Investment Summary */}
          {totalInvestment > 0 && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Investment Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Investment:</Text>
                <Text style={styles.summaryValue}>₹{totalInvestment.toLocaleString('en-IN')}</Text>
              </View>
              {stockName && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Stock:</Text>
                  <Text style={styles.summaryValue}>{stockName}</Text>
                </View>
              )}
            </View>
          )}

          {/* Add Button */}
          <TouchableOpacity
            style={[styles.addButton, (!stockName || !quantity || !buyPrice) && styles.addButtonDisabled]}
            onPress={handleAddStock}
            disabled={!stockName || !quantity || !buyPrice}
          >
            <Ionicons name="add-circle" size={24} color="#000000" />
            <Text style={styles.addButtonText}>Add to Portfolio</Text>
          </TouchableOpacity>
        </View>

        {/* Popular Stocks */}
        <View style={styles.popularSection}>
          <Text style={styles.popularTitle}>Popular Stocks</Text>
          <View style={styles.popularGrid}>
            {POPULAR_STOCKS.slice(0, 6).map((stock, index) => (
              <TouchableOpacity
                key={index}
                style={styles.popularItem}
                onPress={() => selectStock(stock)}
              >
                <Text style={styles.popularText}>{stock}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
  form: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
    position: 'relative',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#333333',
    paddingRight: 50,
  },
  inputIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  suggestionsContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#333333',
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  suggestionText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D4FF00',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D4FF00',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#999999',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#D4FF00',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#333333',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  popularSection: {
    marginBottom: 30,
  },
  popularTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  popularItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333333',
    minWidth: '30%',
  },
  popularText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});