import { View, Text, TouchableOpacity, Linking, StyleSheet } from "react-native";

interface LocationCardProps {
  type: "pickup" | "dropoff";
  address: string;
  contactName?: string;
  contactPhone?: string;
  instructions?: string;
  onNavigate?: () => void;
}

export default function LocationCard({
  type,
  address,
  contactName,
  contactPhone,
  instructions,
  onNavigate,
}: LocationCardProps) {
  const handleCall = () => {
    if (contactPhone) {
      Linking.openURL(`tel:${contactPhone}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, type === "pickup" ? styles.pickupIcon : styles.dropoffIcon]}>
          <Text>{type === "pickup" ? "📍" : "🏠"}</Text>
        </View>
        <Text style={styles.title}>
          {type === "pickup" ? "Pickup" : "Drop-off"} Location
        </Text>
      </View>

      <Text style={styles.address}>{address}</Text>

      {contactName && (
        <View style={styles.contactRow}>
          <View>
            <Text style={styles.contactLabel}>Contact</Text>
            <Text style={styles.contactName}>{contactName}</Text>
          </View>
          {contactPhone && (
            <TouchableOpacity onPress={handleCall} style={styles.callButton}>
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {instructions && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsLabel}>Instructions</Text>
          <Text style={styles.instructionsText}>{instructions}</Text>
        </View>
      )}

      {onNavigate && (
        <TouchableOpacity onPress={onNavigate} style={styles.navigateButton}>
          <Text style={styles.navigateButtonText}>Navigate</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pickupIcon: {
    backgroundColor: '#DCFCE7',
  },
  dropoffIcon: {
    backgroundColor: '#DBEAFE',
  },
  title: {
    fontWeight: '600',
    color: '#111827',
    textTransform: 'capitalize',
  },
  address: {
    color: '#111827',
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  contactLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  contactName: {
    color: '#111827',
  },
  callButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  callButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  instructionsContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 8,
  },
  instructionsLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  instructionsText: {
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
});
