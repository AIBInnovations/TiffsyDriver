import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

interface DeliveryDetailScreenProps {
  route?: {
    params?: {
      deliveryId?: string;
    };
  };
}

export default function DeliveryDetailScreen({ route }: DeliveryDetailScreenProps) {
  const navigation = useNavigation();
  const deliveryId = route?.params?.deliveryId || "DEL-001";

  // Mock data - replace with actual data fetching
  const delivery = {
    id: deliveryId,
    customerName: "John Doe",
    address: "123 Main Street, Ikeja, Lagos",
    phone: "+234 801 234 5678",
    status: "pending" as const,
    items: [
      { name: "Package 1", quantity: 2, weight: "1.5kg" },
      { name: "Package 2", quantity: 1, weight: "0.5kg" },
    ],
    notes: "Please call before delivery",
    estimatedTime: "2:30 PM - 3:00 PM",
  };

  const handleCall = () => {
    Linking.openURL(`tel:${delivery.phone}`);
  };

  const handleNavigate = () => {
    // TODO: Open maps with address
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.deliveryId}>{delivery.id}</Text>
          <Text style={styles.customerName}>{delivery.customerName}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>

        {/* Address */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Delivery Address</Text>
          <Text style={styles.cardValue}>{delivery.address}</Text>
          <TouchableOpacity
            onPress={handleNavigate}
            style={styles.navigateButton}
          >
            <Text style={styles.navigateButtonText}>Navigate</Text>
          </TouchableOpacity>
        </View>

        {/* Contact */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Contact</Text>
          <View style={styles.contactRow}>
            <Text style={styles.cardValue}>{delivery.phone}</Text>
            <TouchableOpacity
              onPress={handleCall}
              style={styles.callButton}
            >
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Items</Text>
          {delivery.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDetails}>
                x{item.quantity} ({item.weight})
              </Text>
            </View>
          ))}
        </View>

        {/* Notes */}
        {delivery.notes && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Notes</Text>
            <Text style={styles.cardValue}>{delivery.notes}</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.startButton}>
          <Text style={styles.startButtonText}>Start Delivery</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
  },
  deliveryId: {
    fontSize: 14,
    color: '#6B7280',
  },
  customerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 8,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 16,
    color: '#111827',
  },
  navigateButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  navigateButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  callButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  callButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemName: {
    fontSize: 16,
    color: '#111827',
  },
  itemDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  startButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 8,
  },
  startButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});
