import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from "react-native";
import { useState } from "react";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { DeliveryStatusType } from "../../../navigation/types";
import ActionSheet from "../../../components/common/ActionSheet";

interface MapPreviewProps {
  pickupLocation?: string;
  dropoffLocation?: string;
  showRoutePreview?: boolean;
  isLoading?: boolean;
  currentStatus?: DeliveryStatusType;
  onStartDelivery?: () => void;
  isUpdating?: boolean;
  etaSeconds?: number;
  distanceMeters?: number;
}

export default function MapPreview({
  pickupLocation,
  dropoffLocation,
  showRoutePreview = true,
  isLoading = false,
  currentStatus,
  onStartDelivery,
  isUpdating = false,
  etaSeconds,
  distanceMeters,
}: MapPreviewProps) {
  const [showNavigationSheet, setShowNavigationSheet] = useState(false);

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
      // Android - Use Google Maps search URL for accurate address matching
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedDestination}`;
      await Linking.openURL(googleMapsUrl);
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
    setShowNavigationSheet(true);
  };

  const getNavigationOptions = () => {
    const options = [];

    if (pickupLocation) {
      options.push({
        label: "Navigate to Pickup",
        icon: "package-variant",
        iconColor: "#10B981",
        onPress: () => openInMaps(pickupLocation, "directions"),
      });
    }

    if (dropoffLocation) {
      options.push({
        label: "Navigate to Drop-off",
        icon: "map-marker",
        iconColor: "#EF4444",
        onPress: () => openInMaps(dropoffLocation, "directions"),
      });
    }

    return options;
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

      {/* ETA and Distance Display */}
      {(etaSeconds != null || distanceMeters != null) && (
        <View style={styles.etaContainer}>
          {etaSeconds != null && (
            <View style={styles.etaItem}>
              <MaterialCommunityIcons name="clock-outline" size={16} color="#3B82F6" />
              <Text style={styles.etaText}>
                ETA: {etaSeconds < 60 ? '< 1 min' : `${Math.round(etaSeconds / 60)} min`}
              </Text>
            </View>
          )}
          {distanceMeters != null && (
            <View style={styles.etaItem}>
              <MaterialCommunityIcons name="map-marker-distance" size={16} color="#3B82F6" />
              <Text style={styles.etaText}>
                {distanceMeters >= 1000
                  ? `${(distanceMeters / 1000).toFixed(1)} km away`
                  : `${Math.round(distanceMeters)} m away`}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Start Delivery Button - only show when status is pending */}
      {currentStatus === "pending" && onStartDelivery && (
        <TouchableOpacity
          style={[styles.startDeliveryButton, isUpdating && styles.buttonDisabled]}
          onPress={onStartDelivery}
          disabled={isUpdating}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={isUpdating ? "loading" : "play"}
            size={22}
            color="#FFFFFF"
          />
          <Text style={styles.startDeliveryButtonText}>
            {isUpdating ? "Processing..." : "Start Delivery"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Navigation Action Sheet */}
      <ActionSheet
        visible={showNavigationSheet}
        title="Open Navigation"
        message="Choose a destination"
        options={getNavigationOptions()}
        onClose={() => setShowNavigationSheet(false)}
      />
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
  etaContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingVertical: 10,
    marginBottom: 4,
    backgroundColor: "#F0F9FF",
    borderRadius: 8,
  },
  etaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  etaText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E40AF",
  },
  startDeliveryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startDeliveryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  buttonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
});
