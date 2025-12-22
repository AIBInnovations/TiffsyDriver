import { View, Text, Pressable, Switch, Animated, StyleSheet } from "react-native";
import { useRef, useEffect } from "react";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

// ─────────────────────────────────────────────────────────────
// Profile Avatar
// ─────────────────────────────────────────────────────────────
interface ProfileAvatarProps {
  initials: string;
  size?: "sm" | "md" | "lg";
  isOnline?: boolean;
}

export function ProfileAvatar({ initials, size = "md", isOnline }: ProfileAvatarProps) {
  const sizeStyles = {
    sm: styles.avatarSm,
    md: styles.avatarMd,
    lg: styles.avatarLg,
  };
  const textStyles = {
    sm: styles.avatarTextSm,
    md: styles.avatarTextMd,
    lg: styles.avatarTextLg,
  };

  return (
    <View style={[styles.avatarContainer, sizeStyles[size]]}>
      <Text style={[styles.avatarText, textStyles[size]]}>{initials}</Text>
      {isOnline !== undefined && (
        <View
          style={[
            styles.statusDot,
            isOnline ? styles.statusOnline : styles.statusOffline,
          ]}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Section Card
// ─────────────────────────────────────────────────────────────
interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
  compact?: boolean;
  style?: object;
}

export function SectionCard({ children, title, compact, style }: SectionCardProps) {
  return (
    <View style={[styles.sectionCard, compact && styles.sectionCardCompact, style]}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      {children}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// List Row
// ─────────────────────────────────────────────────────────────
interface ListRowProps {
  icon?: string;
  iconColor?: string;
  iconBgColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  showChevron?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

export function ListRow({
  icon,
  iconColor = "#6B7280",
  iconBgColor = "#F3F4F6",
  title,
  subtitle,
  value,
  showChevron = true,
  onPress,
  disabled,
  destructive,
}: ListRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.listRow,
        pressed && !disabled && styles.listRowPressed,
        disabled && styles.listRowDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || !onPress}
    >
      {icon && (
        <View style={[styles.listRowIcon, value ? styles.listRowIconWithValue : styles.listRowIconNoValue, { backgroundColor: iconBgColor }]}>
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={destructive ? "#EF4444" : iconColor}
          />
        </View>
      )}
      <View style={value ? styles.listRowContentRow : styles.listRowContent}>
        <View style={!value && showChevron ? styles.listRowTitleChevronRow : undefined}>
          <Text
            style={[
              styles.listRowTitle,
              !value && styles.listRowTitleNoValue,
              value && styles.listRowTitleWithValue,
              destructive && styles.listRowTitleDestructive,
            ]}
          >
            {title}
          </Text>
          {!value && showChevron && onPress && (
            <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" style={styles.listRowChevronInline} />
          )}
        </View>
        {subtitle && <Text style={styles.listRowSubtitle}>{subtitle}</Text>}
        {value && <Text style={styles.listRowValue}>{value}</Text>}
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────
// Switch Row
// ─────────────────────────────────────────────────────────────
interface SwitchRowProps {
  icon?: string;
  iconColor?: string;
  iconBgColor?: string;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export function SwitchRow({
  icon,
  iconColor = "#6B7280",
  iconBgColor = "#F3F4F6",
  title,
  subtitle,
  value,
  onValueChange,
  disabled,
}: SwitchRowProps) {
  return (
    <View style={[styles.listRow, disabled && styles.listRowDisabled]}>
      {icon && (
        <View style={[styles.listRowIcon, { backgroundColor: iconBgColor }]}>
          <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
        </View>
      )}
      <View style={styles.listRowContent}>
        <Text style={styles.listRowTitle}>{title}</Text>
        {subtitle && <Text style={styles.listRowSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: "#E5E7EB", true: "#86EFAC" }}
        thumbColor={value ? "#10B981" : "#9CA3AF"}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Segmented Control
// ─────────────────────────────────────────────────────────────
interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: SegmentedControlProps<T>) {
  return (
    <View style={[styles.segmentedContainer, disabled && styles.segmentedDisabled]}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          style={[
            styles.segmentedOption,
            value === option.value && styles.segmentedOptionActive,
          ]}
          onPress={() => onChange(option.value)}
          disabled={disabled}
        >
          <Text
            style={[
              styles.segmentedText,
              value === option.value && styles.segmentedTextActive,
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Skeleton Blocks
// ─────────────────────────────────────────────────────────────
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 8, style }: SkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonAvatar({ size = 64 }: { size?: number }) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} />;
}

export function SkeletonText({ width = "60%", height = 14 }: { width?: string | number; height?: number }) {
  return <Skeleton width={width} height={height} borderRadius={4} />;
}

// ─────────────────────────────────────────────────────────────
// Toast / Snackbar
// ─────────────────────────────────────────────────────────────
interface ToastProps {
  visible: boolean;
  message: string;
  type?: "success" | "error" | "info";
  onDismiss?: () => void;
}

export function Toast({ visible, message, type = "success", onDismiss }: ToastProps) {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  if (!visible) return null;

  const bgColor =
    type === "success" ? "#10B981" : type === "error" ? "#EF4444" : "#3B82F6";
  const icon =
    type === "success" ? "check-circle" : type === "error" ? "alert-circle" : "information";

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: bgColor, transform: [{ translateY }], opacity },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={20} color="#FFFFFF" />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Quick Action Tile
// ─────────────────────────────────────────────────────────────
interface QuickActionTileProps {
  icon: string;
  iconColor: string;
  iconBgColor: string;
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

export function QuickActionTile({
  icon,
  iconColor,
  iconBgColor,
  title,
  onPress,
  disabled,
}: QuickActionTileProps) {
  return (
    <View style={styles.quickActionTile}>
      <Pressable
        style={({ pressed }) => [
          styles.quickActionTileInner,
          pressed && !disabled && styles.quickActionTilePressed,
          disabled && styles.quickActionTileDisabled,
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: iconBgColor }]}>
          <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
        </View>
        <Text style={styles.quickActionTitle} numberOfLines={1}>{title}</Text>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Status Pill
// ─────────────────────────────────────────────────────────────
interface StatusPillProps {
  isOnline: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function StatusPill({ isOnline, onToggle, disabled }: StatusPillProps) {
  return (
    <Pressable
      style={[
        styles.statusPill,
        isOnline ? styles.statusPillOnline : styles.statusPillOffline,
        disabled && styles.statusPillDisabled,
      ]}
      onPress={onToggle}
      disabled={disabled}
    >
      <View style={styles.statusPillContent}>
        <View
          style={[
            styles.statusPillDot,
            isOnline ? styles.statusPillDotOnline : styles.statusPillDotOffline,
          ]}
        />
        <Text
          style={[
            styles.statusPillText,
            isOnline ? styles.statusPillTextOnline : styles.statusPillTextOffline,
          ]}
        >
          {isOnline ? "Online" : "Offline"}
        </Text>
      </View>
      <Switch
        value={isOnline}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: "#E5E7EB", true: "#86EFAC" }}
        thumbColor={isOnline ? "#10B981" : "#9CA3AF"}
        style={styles.statusPillSwitch}
      />
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────
// Error Banner
// ─────────────────────────────────────────────────────────────
interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
  onReset?: () => void;
}

export function ErrorBanner({ message, onRetry, onReset }: ErrorBannerProps) {
  return (
    <View style={styles.errorBanner}>
      <View style={styles.errorBannerContent}>
        <MaterialCommunityIcons name="alert-circle" size={20} color="#991B1B" />
        <Text style={styles.errorBannerText}>{message}</Text>
      </View>
      <View style={styles.errorBannerActions}>
        <Pressable style={styles.errorBannerButton} onPress={onRetry}>
          <Text style={styles.errorBannerButtonText}>Retry</Text>
        </Pressable>
        {onReset && (
          <Pressable style={styles.errorBannerButtonSecondary} onPress={onReset}>
            <Text style={styles.errorBannerButtonTextSecondary}>Reset</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Avatar
  avatarContainer: {
    backgroundColor: "#F56B4C",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarSm: { width: 40, height: 40, borderRadius: 20 },
  avatarMd: { width: 64, height: 64, borderRadius: 32 },
  avatarLg: { width: 80, height: 80, borderRadius: 40 },
  avatarText: { color: "#FFFFFF", fontWeight: "700" },
  avatarTextSm: { fontSize: 14 },
  avatarTextMd: { fontSize: 22 },
  avatarTextLg: { fontSize: 28 },
  statusDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  statusOnline: { backgroundColor: "#10B981" },
  statusOffline: { backgroundColor: "#9CA3AF" },

  // Section Card
  sectionCard: {
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
  sectionCardCompact: {
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  // List Row
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 25,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  listRowPressed: { opacity: 0.7 },
  listRowDisabled: { opacity: 0.5 },
  listRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  listRowIconWithValue: {
    marginBottom: 8,
  },
  listRowIconNoValue: {
    marginBottom: 20,
  },
  listRowContent: {
    flex: 1,
  },
  listRowContentRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  listRowLabelValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  listRowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  listRowTitleNoValue: {
    marginLeft: 52,
    marginTop: -75,
  },
  listRowTitleWithValue: {
    marginBottom: 10,
    marginLeft: 52,
    marginTop: -42,
  },
  listRowTitleDestructive: { color: "#EF4444" },
  listRowSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  listRowValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginLeft: 8,
    marginTop: -42,
  },
  listRowTitleChevronRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  listRowChevronInline: {
    marginLeft: 8,
    marginTop: -60,
  },
  listRowChevron: {
    marginLeft: 270,
  },
  listRowChevronWithValue: {
    marginTop: -50,
  },
  listRowChevronNoValue: {
    marginTop: -75,
    marginLeft: 0,
  },

  // Segmented Control
  segmentedContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 4,
  },
  segmentedDisabled: { opacity: 0.5 },
  segmentedOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  segmentedOptionActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentedText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  segmentedTextActive: {
    color: "#111827",
    fontWeight: "600",
  },

  // Skeleton
  skeleton: {
    backgroundColor: "#E5E7EB",
  },

  // Toast
  toast: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },

  // Quick Action Tile
  quickActionTile: {
    width: "35%",
  },
  quickActionTileInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 16,
  },
  quickActionTilePressed: { opacity: 0.7 },
  quickActionTileDisabled: { opacity: 0.5 },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickActionTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },

  // Status Pill
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 12,
  },
  statusPillContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusPillOnline: { backgroundColor: "#D1FAE5" },
  statusPillOffline: { backgroundColor: "#FEE2E2" },
  statusPillDisabled: { opacity: 0.5 },
  statusPillDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusPillDotOnline: { backgroundColor: "#10B981" },
  statusPillDotOffline: { backgroundColor: "#EF4444" },
  statusPillText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusPillTextOnline: { color: "#065F46" },
  statusPillTextOffline: { color: "#991B1B" },
  statusPillSwitch: {
    transform: [{ scale: 0.9 }],
  },

  // Error Banner
  errorBanner: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    color: "#991B1B",
  },
  errorBannerActions: {
    flexDirection: "row",
    gap: 12,
  },
  errorBannerButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  errorBannerButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  errorBannerButtonSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorBannerButtonTextSecondary: {
    fontSize: 13,
    fontWeight: "500",
    color: "#991B1B",
  },
});
