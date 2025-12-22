import { View, Text, StyleSheet } from "react-native";

interface OrderItem {
  name: string;
  quantity: number;
  price?: number;
  weight?: string;
}

interface OrderDetailsProps {
  orderId: string;
  items: OrderItem[];
  totalAmount?: number;
  specialInstructions?: string;
}

export default function OrderDetails({
  orderId,
  items,
  totalAmount,
  specialInstructions,
}: OrderDetailsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order Details</Text>
        <Text style={styles.orderId}>{orderId}</Text>
      </View>

      {items.map((item, index) => (
        <View key={index} style={styles.itemRow}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            {item.weight && (
              <Text style={styles.itemWeight}>{item.weight}</Text>
            )}
          </View>
          <Text style={styles.itemQuantity}>x{item.quantity}</Text>
          {item.price && (
            <Text style={styles.itemPrice}>
              N{item.price.toLocaleString()}
            </Text>
          )}
        </View>
      ))}

      {totalAmount && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>
            N{totalAmount.toLocaleString()}
          </Text>
        </View>
      )}

      {specialInstructions && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsLabel}>Special Instructions</Text>
          <Text style={styles.instructionsText}>{specialInstructions}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '600',
    color: '#111827',
  },
  orderId: {
    fontSize: 14,
    color: '#6B7280',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: '#111827',
  },
  itemWeight: {
    fontSize: 14,
    color: '#6B7280',
  },
  itemQuantity: {
    color: '#6B7280',
    marginHorizontal: 8,
  },
  itemPrice: {
    color: '#111827',
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontWeight: '600',
    color: '#111827',
  },
  totalAmount: {
    fontWeight: '700',
    fontSize: 18,
    color: '#111827',
  },
  instructionsContainer: {
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  instructionsLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  instructionsText: {
    color: '#111827',
  },
});
