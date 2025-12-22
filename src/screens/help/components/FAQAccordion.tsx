// src/screens/help/components/FAQAccordion.tsx

import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { FAQ } from "../types";
import { Card, EmptyState } from "./UIComponents";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQItemProps {
  faq: FAQ;
  isExpanded: boolean;
  onToggle: () => void;
}

function FAQItem({ faq, isExpanded, onToggle }: FAQItemProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isExpanded]);

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <Card style={styles.faqCard}>
      <Pressable
        onPress={handleToggle}
        style={styles.faqHeader}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityLabel={faq.title}
      >
        <View style={styles.faqTitleContainer}>
          <View style={styles.faqIcon}>
            <MaterialCommunityIcons
              name="help-circle-outline"
              size={20}
              color="#F56B4C"
            />
          </View>
          <Text style={styles.faqTitle}>{faq.title}</Text>
        </View>
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <MaterialCommunityIcons
            name="chevron-down"
            size={24}
            color="#6B7280"
          />
        </Animated.View>
      </Pressable>

      {isExpanded && (
        <View style={styles.faqContent}>
          <Text style={styles.faqAnswer}>{faq.shortAnswer}</Text>

          {faq.details && faq.details.length > 0 && (
            <View style={styles.faqDetails}>
              {faq.details.map((detail, index) => (
                <View key={index} style={styles.detailRow}>
                  <Text style={styles.detailBullet}>•</Text>
                  <Text style={styles.detailText}>{detail}</Text>
                </View>
              ))}
            </View>
          )}

          {faq.category && (
            <View style={styles.faqCategory}>
              <MaterialCommunityIcons
                name="tag-outline"
                size={14}
                color="#9CA3AF"
              />
              <Text style={styles.categoryText}>{faq.category}</Text>
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

interface FAQAccordionProps {
  faqs: FAQ[];
  expandedId: string | null;
  onToggle: (id: string | null) => void;
  searchQuery: string;
}

export function FAQAccordion({
  faqs,
  expandedId,
  onToggle,
  searchQuery,
}: FAQAccordionProps) {
  if (faqs.length === 0) {
    if (searchQuery) {
      return (
        <EmptyState
          icon="magnify"
          title="No matches found"
          message={`No FAQs match "${searchQuery}". Try searching for "POD", "batch", or "payment".`}
        />
      );
    }

    return (
      <EmptyState
        icon="help-circle-outline"
        title="No FAQs available"
        message="FAQs are currently unavailable. Please try again later or contact support."
      />
    );
  }

  return (
    <View style={styles.container}>
      {faqs.map((faq) => (
        <FAQItem
          key={faq.id}
          faq={faq}
          isExpanded={expandedId === faq.id}
          onToggle={() => onToggle(expandedId === faq.id ? null : faq.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  faqCard: {
    marginBottom: 8,
    padding: 0,
    overflow: "hidden",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    minHeight: 56,
  },
  faqTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  faqIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  faqTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
    flex: 1,
    lineHeight: 20,
  },
  faqContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  faqAnswer: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 22,
    marginTop: 12,
  },
  faqDetails: {
    marginTop: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  detailBullet: {
    fontSize: 14,
    color: "#F56B4C",
    marginRight: 8,
    lineHeight: 20,
  },
  detailText: {
    fontSize: 13,
    color: "#4B5563",
    flex: 1,
    lineHeight: 20,
  },
  faqCategory: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  categoryText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 6,
  },
});
