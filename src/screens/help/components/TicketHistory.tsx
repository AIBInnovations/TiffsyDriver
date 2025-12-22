// src/screens/help/components/TicketHistory.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { BottomSheet, CompactModal } from "./BottomSheet";
import { Card, Badge, Button, EmptyState } from "./UIComponents";
import { SupportTicket, TicketFilterTab, TicketStatus } from "../types";
import { useHelpSupportStore } from "../useHelpSupportStore";

// Format date
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return "Today";
  } else if (days === 1) {
    return "Yesterday";
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  }
}

// Get status badge variant
function getStatusVariant(
  status: TicketStatus
): "draft" | "submitted" | "resolved" | "closed" {
  return status;
}

// Get category icon
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    "Delivery Issue": "package-variant",
    "Batch Issue": "format-list-bulleted",
    "POD Issue": "qrcode-scan",
    "Payment/Settlement": "currency-inr",
    "App Bug": "bug",
    Account: "account-circle",
    Other: "help-circle",
    Safety: "shield-alert",
  };
  return icons[category] || "help-circle";
}

interface TicketRowProps {
  ticket: SupportTicket;
  onPress: () => void;
}

function TicketRow({ ticket, onPress }: TicketRowProps) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.ticketCard}>
        <View style={styles.ticketHeader}>
          <View style={styles.categoryBadge}>
            <MaterialCommunityIcons
              name={getCategoryIcon(ticket.category)}
              size={14}
              color={ticket.category === "Safety" ? "#D97706" : "#6B7280"}
            />
            <Text
              style={[
                styles.categoryText,
                ticket.category === "Safety" && styles.safetyCategoryText,
              ]}
            >
              {ticket.category}
            </Text>
          </View>
          <Badge
            label={ticket.status}
            variant={getStatusVariant(ticket.status)}
          />
        </View>

        <Text style={styles.ticketSubject} numberOfLines={2}>
          {ticket.subject}
        </Text>

        <View style={styles.ticketMeta}>
          <Text style={styles.ticketDate}>{formatDate(ticket.createdAt)}</Text>
          {ticket.priority === "High" && (
            <View style={styles.priorityBadge}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={12}
                color="#DC2626"
              />
              <Text style={styles.priorityText}>High Priority</Text>
            </View>
          )}
        </View>
      </Card>
    </Pressable>
  );
}

// ============ Ticket Detail Component ============
interface TicketDetailProps {
  ticket: SupportTicket | null;
  visible: boolean;
  onClose: () => void;
}

function TicketDetail({ ticket, visible, onClose }: TicketDetailProps) {
  const {
    loadDraftForEdit,
    duplicateTicket,
    closeTicket,
    deleteTicket,
  } = useHelpSupportStore();

  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!ticket) return null;

  const handleEditDraft = () => {
    loadDraftForEdit(ticket.id);
    onClose();
  };

  const handleDuplicate = () => {
    duplicateTicket(ticket.id);
    onClose();
  };

  const handleClose = async () => {
    await closeTicket(ticket.id);
    setShowCloseConfirm(false);
    onClose();
  };

  const handleDelete = async () => {
    await deleteTicket(ticket.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <>
      <BottomSheet
        visible={visible}
        onClose={onClose}
        title="Request Details"
        height="auto"
      >
        {/* Status & Category */}
        <View style={styles.detailHeader}>
          <Badge
            label={ticket.status}
            variant={getStatusVariant(ticket.status)}
          />
          <Badge
            label={ticket.category}
            variant={ticket.category === "Safety" ? "safety" : "draft"}
          />
          {ticket.priority === "High" && (
            <Badge label="High Priority" variant="high" />
          )}
        </View>

        {/* Subject */}
        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Subject</Text>
          <Text style={styles.detailValue}>{ticket.subject}</Text>
        </View>

        {/* Description */}
        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Description</Text>
          <Text style={styles.detailValue}>{ticket.description}</Text>
        </View>

        {/* IDs if present */}
        {(ticket.orderId || ticket.batchId) && (
          <View style={styles.detailRow}>
            {ticket.orderId && (
              <View style={styles.detailHalf}>
                <Text style={styles.detailLabel}>Order ID</Text>
                <Text style={styles.detailValue}>{ticket.orderId}</Text>
              </View>
            )}
            {ticket.batchId && (
              <View style={styles.detailHalf}>
                <Text style={styles.detailLabel}>Batch ID</Text>
                <Text style={styles.detailValue}>{ticket.batchId}</Text>
              </View>
            )}
          </View>
        )}

        {/* Contact Preference */}
        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Contact Preference</Text>
          <Text style={styles.detailValue}>{ticket.contactPreference}</Text>
        </View>

        {/* Attachments */}
        {ticket.attachments.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>
              Attachments ({ticket.attachments.length})
            </Text>
            <View style={styles.attachmentsList}>
              {ticket.attachments.map((att) => (
                <View key={att.id} style={styles.attachmentItem}>
                  <MaterialCommunityIcons
                    name={att.type === "photo" ? "image" : "cellphone"}
                    size={16}
                    color="#6B7280"
                  />
                  <Text style={styles.attachmentName}>
                    {att.name || att.type}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Dates */}
        <View style={styles.detailRow}>
          <View style={styles.detailHalf}>
            <Text style={styles.detailLabel}>Created</Text>
            <Text style={styles.detailValue}>
              {new Date(ticket.createdAt).toLocaleString("en-IN")}
            </Text>
          </View>
          <View style={styles.detailHalf}>
            <Text style={styles.detailLabel}>Updated</Text>
            <Text style={styles.detailValue}>
              {new Date(ticket.updatedAt).toLocaleString("en-IN")}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.detailActions}>
          {ticket.status === "draft" && (
            <Button
              label="Edit Draft"
              onPress={handleEditDraft}
              variant="primary"
              icon="pencil"
              size="medium"
            />
          )}

          <Button
            label="Duplicate"
            onPress={handleDuplicate}
            variant="secondary"
            icon="content-copy"
            size="medium"
          />

          {ticket.status === "submitted" && (
            <Button
              label="Close"
              onPress={() => setShowCloseConfirm(true)}
              variant="secondary"
              icon="check-circle"
              size="medium"
            />
          )}

          {ticket.status === "draft" && (
            <Button
              label="Delete"
              onPress={() => setShowDeleteConfirm(true)}
              variant="danger"
              icon="delete"
              size="medium"
            />
          )}
        </View>
      </BottomSheet>

      {/* Close Confirmation */}
      <CompactModal
        visible={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        title="Close Request?"
      >
        <Text style={styles.confirmText}>
          Are you sure you want to close this request? This cannot be undone.
        </Text>
        <View style={styles.confirmActions}>
          <Button
            label="Cancel"
            onPress={() => setShowCloseConfirm(false)}
            variant="secondary"
            size="medium"
          />
          <View style={{ width: 12 }} />
          <Button
            label="Close Request"
            onPress={handleClose}
            variant="primary"
            size="medium"
          />
        </View>
      </CompactModal>

      {/* Delete Confirmation */}
      <CompactModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Draft?"
      >
        <Text style={styles.confirmText}>
          Are you sure you want to delete this draft? This cannot be undone.
        </Text>
        <View style={styles.confirmActions}>
          <Button
            label="Cancel"
            onPress={() => setShowDeleteConfirm(false)}
            variant="secondary"
            size="medium"
          />
          <View style={{ width: 12 }} />
          <Button
            label="Delete"
            onPress={handleDelete}
            variant="danger"
            size="medium"
          />
        </View>
      </CompactModal>
    </>
  );
}

// ============ Ticket History Main Component ============
interface TicketHistoryProps {
  visible: boolean;
  onClose: () => void;
}

export function TicketHistory({ visible, onClose }: TicketHistoryProps) {
  const {
    ticketFilter,
    setTicketFilter,
    getFilteredTickets,
    selectedTicketId,
    selectTicket,
    getTicketById,
    openNewRequest,
  } = useHelpSupportStore();

  const tickets = getFilteredTickets();
  const selectedTicket = selectedTicketId
    ? getTicketById(selectedTicketId)
    : null;

  const filterTabs: { key: TicketFilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "drafts", label: "Drafts" },
    { key: "submitted", label: "Submitted" },
    { key: "resolved", label: "Resolved" },
  ];

  const handleCreateRequest = () => {
    onClose();
    setTimeout(openNewRequest, 300);
  };

  return (
    <>
      <BottomSheet
        visible={visible}
        onClose={onClose}
        title="Request History"
        height="full"
      >
        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {filterTabs.map((tab) => (
            <Pressable
              key={tab.key}
              style={[
                styles.filterTab,
                ticketFilter === tab.key && styles.filterTabActive,
              ]}
              onPress={() => setTicketFilter(tab.key)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  ticketFilter === tab.key && styles.filterTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Ticket List */}
        <ScrollView showsVerticalScrollIndicator={false} style={styles.ticketList}>
          {tickets.length === 0 ? (
            <EmptyState
              icon="ticket-outline"
              title="No requests yet"
              message="Your support requests will appear here"
              action={{
                label: "Create Request",
                onPress: handleCreateRequest,
              }}
            />
          ) : (
            tickets.map((ticket) => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                onPress={() => selectTicket(ticket.id)}
              />
            ))
          )}
        </ScrollView>

        {/* Create Request Button */}
        {tickets.length > 0 && (
          <Pressable style={styles.createRequestButton} onPress={handleCreateRequest}>
            <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
            <Text style={styles.createRequestButtonText}>Create Request</Text>
          </Pressable>
        )}
      </BottomSheet>

      {/* Ticket Detail */}
      <TicketDetail
        ticket={selectedTicket || null}
        visible={!!selectedTicketId}
        onClose={() => selectTicket(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // Filter Tabs
  filterTabs: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  filterTabTextActive: {
    color: "#111827",
    fontWeight: "600",
  },

  // Ticket Card
  ticketCard: {
    marginBottom: 8,
  },
  ticketHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
    fontWeight: "500",
  },
  safetyCategoryText: {
    color: "#D97706",
  },
  ticketSubject: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
    lineHeight: 20,
    marginBottom: 8,
  },
  ticketMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ticketDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  priorityText: {
    fontSize: 11,
    color: "#DC2626",
    marginLeft: 4,
    fontWeight: "500",
  },

  // Detail
  detailHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  detailHalf: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#111827",
    lineHeight: 20,
  },
  attachmentsList: {
    gap: 8,
    marginTop: 8,
  },
  attachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  attachmentName: {
    fontSize: 13,
    color: "#374151",
    marginLeft: 8,
  },
  detailActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },

  // Confirm Modal
  confirmText: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  confirmActions: {
    flexDirection: "row",
    justifyContent: "center",
  },

  // Ticket List
  ticketList: {
    flex: 1,
  },

  // Create Request Button
  createRequestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F56B4C",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  createRequestButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
