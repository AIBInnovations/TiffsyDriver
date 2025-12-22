// src/screens/help/components/ContactModal.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Clipboard,
  Alert,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { CompactModal } from "./BottomSheet";
import { Card } from "./UIComponents";
import { contactOptions } from "../data/faqs";

interface ContactModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ContactModal({ visible, onClose }: ContactModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (value: string, id: string) => {
    Clipboard.setString(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "call":
        return "phone";
      case "whatsapp":
        return "whatsapp";
      case "email":
        return "email";
      default:
        return "help-circle";
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "call":
        return "#16A34A";
      case "whatsapp":
        return "#25D366";
      case "email":
        return "#3B82F6";
      default:
        return "#6B7280";
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case "call":
        return "#F0FDF4";
      case "whatsapp":
        return "#F0FDF4";
      case "email":
        return "#EFF6FF";
      default:
        return "#F3F4F6";
    }
  };

  return (
    <CompactModal visible={visible} onClose={onClose} title="Contact Support">
      <View style={styles.container}>
        {contactOptions.map((option) => (
          <Card key={option.id} style={styles.optionCard}>
            <View style={styles.optionHeader}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: getIconBg(option.type) },
                ]}
              >
                <MaterialCommunityIcons
                  name={getIcon(option.type)}
                  size={24}
                  color={getIconColor(option.type)}
                />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionValue}>{option.value}</Text>
              </View>
              <Pressable
                onPress={() => handleCopy(option.value, option.id)}
                style={styles.copyButton}
              >
                <MaterialCommunityIcons
                  name={copiedId === option.id ? "check" : "content-copy"}
                  size={18}
                  color={copiedId === option.id ? "#16A34A" : "#6B7280"}
                />
              </Pressable>
            </View>
            <View style={styles.optionMeta}>
              <View style={styles.metaRow}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={14}
                  color="#9CA3AF"
                />
                <Text style={styles.metaText}>{option.availability}</Text>
              </View>
              <View style={styles.metaRow}>
                <MaterialCommunityIcons
                  name="timer-sand"
                  size={14}
                  color="#9CA3AF"
                />
                <Text style={styles.metaText}>{option.responseTime}</Text>
              </View>
            </View>
          </Card>
        ))}

        <View style={styles.infoBox}>
          <MaterialCommunityIcons
            name="information"
            size={16}
            color="#6B7280"
          />
          <Text style={styles.infoText}>
            Working hours: Mon-Sat, 8 AM - 10 PM IST
          </Text>
        </View>
      </View>
    </CompactModal>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  optionCard: {
    marginBottom: 0,
    padding: 12,
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  optionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  optionValue: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  copyButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  optionMeta: {
    flexDirection: "row",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 8,
    flex: 1,
  },
});
