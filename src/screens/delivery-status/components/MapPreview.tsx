import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Alert } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

interface MapPreviewProps {
  pickupLocation?: string;
  dropoffLocation?: string;
  showRoutePreview?: boolean;
  isLoading?: boolean;
}

export default function MapPreview({
  pickupLocation,
  dropoffLocation,
  showRoutePreview = true,
  isLoading = false,
}: MapPreviewProps) {
  const openInMaps = async (destination: string, mode: "directions" | "location" = "directions") => {
    const encodedDestination = encodeURIComponent(destination);

    if (Platform.OS === "ios") {
      // Try Apple Maps first, then Google Maps
      const appleMapsUrl = `maps://?daddr=${encodedDestination}`;
      const googleMapsUrl = `comgooglemaps://?daddr=${encodedDestination}&directionsmode=driving`;
      const webUrl = `https://maps.apple.com/?daddr=${encodedDestination}`;

      try {
        const canOpenGoogle = await Linking.canOpenURL(googleMapsUrl);
        if (canOpenGoogle) {
          await Linking.openURL(googleMapsUrl);
        } else {
          await Linking.openURL(appleMapsUrl);
        }
      } catch {
        await Linking.openURL(webUrl);
      }
    } else {
      // Android - Use Google Maps intent
      const googleMapsUrl = `google.navigation:q=${encodedDestination}`;
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedDestination}`;

      try {
        await Linking.openURL(googleMapsUrl);
      } catch {
        await Linking.openURL(webUrl);
      }
    }
  };

  const handleNavigatePress = () => {
    if (dropoffLocation) {
      openInMaps(dropoffLocation, "directions");
    } else if (pickupLocation) {
      openInMaps(pickupLocation, "directions");
    }
  };

  const showNavigationOptions = () => {
    if (!pickupLocation && !dropoffLocation) return;

    const options = [];

    if (pickupLocation) {
      options.push({
        text: "Navigate to Pickup",
        onPress: () => openInMaps(pickupLocation, "directions"),
      });
    }

    if (dropoffLocation) {
      options.push({
        text: "Navigate to Drop-off",
        onPress: () => openInMaps(dropoffLocation, "directions"),
      });
    }

    options.push({ text: "Cancel", style: "cancel" as const });

    Alert.alert(
      "Open Navigation",
      "Choose a destination",
      options
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="map-clock-outline" size={40} color="#9CA3AF" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </View>
    );
  }

  if (!pickupLocation && !dropoffLocation) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="map" size={18} color="#3B82F6" />
          <Text style={styles.headerTitle}>Route Preview</Text>
        </View>
        {showRoutePreview && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={showNavigationOptions}
          >
            <MaterialCommunityIcons name="arrow-expand-all" size={16} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Map Placeholder with Route Visualization */}
      <TouchableOpacity
        style={styles.mapContainer}
        onPress={showNavigationOptions}
        activeOpacity={0.8}
      >
        <View style={styles.mapPlaceholder}>
          {/* Route visualization */}
          <View style={styles.routeVisualization}>
            {/* Pickup marker */}
            <View style={styles.markerContainer}>
              <View style={[styles.marker, styles.pickupMarker]}>
                <MaterialCommunityIcons name="package-variant" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.markerLabel} numberOfLines={1}>
                Pickup
              </Text>
            </View>

            {/* Route line */}
            <View style={styles.routeLine}>
              <View style={styles.routeLineDashed} />
              <MaterialCommunityIcons name="truck-fast-outline" size={20} color="#3B82F6" />
              <View style={styles.routeLineDashed} />
            </View>

            {/* Dropoff marker */}
            <View style={styles.markerContainer}>
              <View style={[styles.marker, styles.dropoffMarker]}>
                <MaterialCommunityIcons name="map-marker" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.markerLabel} numberOfLines={1}>
                Drop-off
              </Text>
            </View>
          </View>

          {/* Tap hint */}
          <View style={styles.tapHint}>
            <MaterialCommunityIcons name="cursor-default-click" size={14} color="#6B7280" />
            <Text style={styles.tapHintText}>Tap to open in maps</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Quick Navigation Button */}
      <TouchableOpacity style={styles.navigateButton} onPress={handleNavigatePress}>
        <MaterialCommunityIcons name="navigation" size={18} color="#FFFFFF" />
        <Text style={styles.navigateButtonText}>Start Navigation</Text>
      </TouchableOpacity>

      {/* Navigation Options */}
      <View style={styles.navigationOptions}>
        <TouchableOpacity
          style={styles.navigationOption}
          onPress={() => pickupLocation && openInMaps(pickupLocation)}
        >
          <View style={[styles.optionIcon, styles.pickupIcon]}>
            <MaterialCommunityIcons name="package-variant" size={14} color="#10B981" />
          </View>
          <Text style={styles.optionText}>To Pickup</Text>
        </TouchableOpacity>

        <View style={styles.optionDivider} />

        <TouchableOpacity
          style={styles.navigationOption}
          onPress={() => dropoffLocation && openInMaps(dropoffLocation)}
        >
          <View style={[styles.optionIcon, styles.dropoffIcon]}>
            <MaterialCommunityIcons name="map-marker" size={14} color="#EF4444" />
          </View>
          <Text style={styles.optionText}>To Drop-off</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 8,
  },
  mapContainer: {
    marginBottom: 12,
  },
  mapPlaceholder: {
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    height: 120,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderStyle: "dashed",
    overflow: "hidden",
    justifyContent: "center",
  },
  routeVisualization: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  markerContainer: {
    alignItems: "center",
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  pickupMarker: {
    backgroundColor: "#10B981",
  },
  dropoffMarker: {
    backgroundColor: "#EF4444",
  },
  markerLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 4,
  },
  routeLine: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    gap: 8,
  },
  routeLineDashed: {
    flex: 1,
    height: 2,
    backgroundColor: "#BFDBFE",
    borderRadius: 1,
  },
  tapHint: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tapHintText: {
    fontSize: 11,
    color: "#6B7280",
  },
  navigateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  navigateButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  navigationOptions: {
    flexDirection: "row",
    marginTop: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    overflow: "hidden",
  },
  navigationOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 6,
  },
  optionDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
  },
  optionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pickupIcon: {
    backgroundColor: "#D1FAE5",
  },
  dropoffIcon: {
    backgroundColor: "#FEE2E2",
  },
  optionText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },
});
