import { View, StyleSheet } from "react-native";
import { useEffect, useRef } from "react";
import { Animated } from "react-native";

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export default function SkeletonLoader({
  width = "100%",
  height = 20,
  borderRadius = 4,
  style,
}: SkeletonLoaderProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: "#e5e7eb",
          opacity,
        },
        style,
      ]}
    />
  );
}

// Pre-built skeleton patterns
export function CardSkeleton() {
  return (
    <View style={styles.cardContainer}>
      <SkeletonLoader width={80} height={12} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="60%" height={18} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="100%" height={14} style={{ marginBottom: 4 }} />
      <SkeletonLoader width="40%" height={12} />
    </View>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
});
