// src/screens/help/components/UIComponents.tsx

import React, { ReactNode } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

// ============ Card Component ============
interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
}

export function Card({ children, style, noPadding }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        noPadding && { padding: 0 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ============ Section Header ============
interface SectionHeaderProps {
  title: string;
  action?: { label: string; onPress: () => void };
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <Pressable onPress={action.onPress}>
          <Text style={styles.sectionAction}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ============ Search Input ============
interface SearchInputProps extends TextInputProps {
  onClear?: () => void;
}

export function SearchInput({ value, onClear, ...props }: SearchInputProps) {
  return (
    <View style={styles.searchContainer}>
      <MaterialCommunityIcons
        name="magnify"
        size={20}
        color="#9CA3AF"
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.searchInput}
        placeholder="Search FAQs..."
        placeholderTextColor="#9CA3AF"
        value={value}
        {...props}
      />
      {value && value.length > 0 && onClear && (
        <Pressable onPress={onClear} style={styles.searchClear}>
          <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
        </Pressable>
      )}
    </View>
  );
}

// ============ Chip / Pill ============
interface ChipProps {
  label: string;
  icon?: string;
  onPress?: () => void;
  variant?: "default" | "primary" | "danger" | "success" | "warning";
  size?: "small" | "medium";
  selected?: boolean;
}

export function Chip({
  label,
  icon,
  onPress,
  variant = "default",
  size = "medium",
  selected,
}: ChipProps) {
  const variantStyles = {
    default: { bg: "#F3F4F6", text: "#374151", border: "#E5E7EB" },
    primary: { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" },
    danger: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
    success: { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" },
    warning: { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" },
  };

  const colors = variantStyles[variant];
  const isSmall = size === "small";

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.text : colors.bg,
          borderColor: colors.border,
          paddingVertical: isSmall ? 4 : 8,
          paddingHorizontal: isSmall ? 8 : 12,
        },
      ]}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon}
          size={isSmall ? 14 : 16}
          color={selected ? "#FFFFFF" : colors.text}
          style={{ marginRight: 4 }}
        />
      )}
      <Text
        style={[
          styles.chipText,
          {
            color: selected ? "#FFFFFF" : colors.text,
            fontSize: isSmall ? 12 : 14,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ============ Badge (Status/Category) ============
interface BadgeProps {
  label: string;
  variant: "draft" | "submitted" | "resolved" | "closed" | "safety" | "high";
}

export function Badge({ label, variant }: BadgeProps) {
  const variantStyles = {
    draft: { bg: "#F3F4F6", text: "#6B7280" },
    submitted: { bg: "#DBEAFE", text: "#2563EB" },
    resolved: { bg: "#D1FAE5", text: "#059669" },
    closed: { bg: "#D1FAE5", text: "#059669" },
    safety: { bg: "#FEF3C7", text: "#D97706" },
    high: { bg: "#FEE2E2", text: "#DC2626" },
  };

  const colors = variantStyles[variant];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

// ============ Inline Banner ============
interface InlineBannerProps {
  message: string;
  type: "error" | "warning" | "success" | "info";
  action?: { label: string; onPress: () => void };
  onDismiss?: () => void;
}

export function InlineBanner({
  message,
  type,
  action,
  onDismiss,
}: InlineBannerProps) {
  const typeStyles = {
    error: { bg: "#FEF2F2", text: "#DC2626", icon: "alert-circle" },
    warning: { bg: "#FFFBEB", text: "#D97706", icon: "alert" },
    success: { bg: "#F0FDF4", text: "#16A34A", icon: "check-circle" },
    info: { bg: "#EFF6FF", text: "#2563EB", icon: "information" },
  };

  const colors = typeStyles[type];

  return (
    <View style={[styles.banner, { backgroundColor: colors.bg }]}>
      <MaterialCommunityIcons
        name={colors.icon}
        size={20}
        color={colors.text}
      />
      <Text style={[styles.bannerText, { color: colors.text }]}>{message}</Text>
      {action && (
        <Pressable onPress={action.onPress}>
          <Text style={[styles.bannerAction, { color: colors.text }]}>
            {action.label}
          </Text>
        </Pressable>
      )}
      {onDismiss && (
        <Pressable onPress={onDismiss} style={styles.bannerDismiss}>
          <MaterialCommunityIcons name="close" size={18} color={colors.text} />
        </Pressable>
      )}
    </View>
  );
}

// ============ Primary Button ============
interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "small" | "medium" | "large";
  icon?: string;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  loading,
  disabled,
  variant = "primary",
  size = "medium",
  icon,
  fullWidth,
}: ButtonProps) {
  const variantStyles = {
    primary: { bg: "#F56B4C", text: "#FFFFFF" },
    secondary: { bg: "#FFFFFF", text: "#374151", border: "#E5E7EB" },
    danger: { bg: "#DC2626", text: "#FFFFFF" },
    ghost: { bg: "transparent", text: "#3B82F6" },
  };

  const sizeStyles = {
    small: { py: 8, px: 12, text: 13 },
    medium: { py: 12, px: 16, text: 15 },
    large: { py: 16, px: 20, text: 16 },
  };

  const colors = variantStyles[variant];
  const sizing = sizeStyles[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: disabled ? "#E5E7EB" : colors.bg,
          paddingVertical: sizing.py,
          paddingHorizontal: sizing.px,
          borderWidth: variant === "secondary" ? 1 : 0,
          borderColor: colors.border,
          opacity: disabled ? 0.6 : 1,
        },
        fullWidth && { width: "100%" },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.text} />
      ) : (
        <>
          {icon && (
            <MaterialCommunityIcons
              name={icon}
              size={sizing.text + 2}
              color={disabled ? "#9CA3AF" : colors.text}
              style={{ marginRight: 6 }}
            />
          )}
          <Text
            style={[
              styles.buttonText,
              {
                color: disabled ? "#9CA3AF" : colors.text,
                fontSize: sizing.text,
              },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

// ============ List Row ============
interface ListRowProps {
  icon?: string;
  iconColor?: string;
  iconBgColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  rightElement?: ReactNode;
  disabled?: boolean;
}

export function ListRow({
  icon,
  iconColor = "#374151",
  iconBgColor = "#F3F4F6",
  title,
  subtitle,
  value,
  onPress,
  showChevron = true,
  rightElement,
  disabled,
}: ListRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={[styles.listRow, disabled && { opacity: 0.5 }]}
    >
      {icon && (
        <View style={[styles.listRowIcon, { backgroundColor: iconBgColor }]}>
          <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
        </View>
      )}
      <View style={styles.listRowContent}>
        <Text style={styles.listRowTitle}>{title}</Text>
        {subtitle && <Text style={styles.listRowSubtitle}>{subtitle}</Text>}
      </View>
      {value && <Text style={styles.listRowValue}>{value}</Text>}
      {rightElement}
      {showChevron && onPress && (
        <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
      )}
    </Pressable>
  );
}

// ============ Toggle Row ============
interface ToggleRowProps {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export function ToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
  disabled,
}: ToggleRowProps) {
  return (
    <View style={[styles.toggleRow, disabled && { opacity: 0.5 }]}>
      <View style={styles.toggleRowContent}>
        <Text style={styles.toggleRowTitle}>{title}</Text>
        {subtitle && <Text style={styles.toggleRowSubtitle}>{subtitle}</Text>}
      </View>
      <Pressable
        onPress={() => !disabled && onValueChange(!value)}
        style={[
          styles.toggle,
          { backgroundColor: value ? "#F56B4C" : "#E5E7EB" },
        ]}
      >
        <View
          style={[
            styles.toggleThumb,
            { transform: [{ translateX: value ? 20 : 0 }] },
          ]}
        />
      </Pressable>
    </View>
  );
}

// ============ Radio Group ============
interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  horizontal?: boolean;
}

export function RadioGroup({
  options,
  value,
  onChange,
  horizontal,
}: RadioGroupProps) {
  return (
    <View style={[styles.radioGroup, horizontal && { flexDirection: "row" }]}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => onChange(option.value)}
          style={[
            styles.radioOption,
            horizontal && { flex: 1, marginRight: 8 },
          ]}
        >
          <View
            style={[
              styles.radioCircle,
              value === option.value && styles.radioCircleSelected,
            ]}
          >
            {value === option.value && <View style={styles.radioInner} />}
          </View>
          <Text style={styles.radioLabel}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ============ Skeleton Components ============
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 4,
  style,
}: SkeletonProps) {
  return (
    <View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <Card>
      <Skeleton width="70%" height={20} style={{ marginBottom: 8 }} />
      <Skeleton width="100%" height={14} style={{ marginBottom: 4 }} />
      <Skeleton width="90%" height={14} />
    </Card>
  );
}

// ============ Empty State ============
interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyStateIcon}>
        <MaterialCommunityIcons name={icon} size={48} color="#9CA3AF" />
      </View>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateMessage}>{message}</Text>
      {action && (
        <Button
          label={action.label}
          onPress={action.onPress}
          variant="primary"
          size="medium"
        />
      )}
    </View>
  );
}

// ============ Styles ============
const styles = StyleSheet.create({
  // Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3B82F6",
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    paddingVertical: 8,
  },
  searchClear: {
    padding: 4,
  },

  // Chip
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontWeight: "500",
  },

  // Badge
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },

  // Banner
  banner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
  },
  bannerAction: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  bannerDismiss: {
    marginLeft: 8,
    padding: 4,
  },

  // Button
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  buttonText: {
    fontWeight: "600",
  },

  // List Row
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  listRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  listRowContent: {
    flex: 1,
  },
  listRowTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  listRowSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  listRowValue: {
    fontSize: 14,
    color: "#6B7280",
    marginRight: 8,
  },

  // Toggle Row
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  toggleRowContent: {
    flex: 1,
  },
  toggleRowTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  toggleRowSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // Radio Group
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radioCircleSelected: {
    borderColor: "#F56B4C",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#F56B4C",
  },
  radioLabel: {
    fontSize: 15,
    color: "#374151",
  },

  // Skeleton
  skeleton: {
    backgroundColor: "#E5E7EB",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
});
