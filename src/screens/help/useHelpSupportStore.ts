// src/screens/help/useHelpSupportStore.ts

import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import {
  SupportTicket,
  TicketFormData,
  SupportPreferences,
  TicketStatus,
  TicketFilterTab,
  FAQ,
} from "./types";
import { seedFAQs } from "./data/faqs";

// Storage keys
const STORAGE_KEYS = {
  TICKETS: "support.tickets",
  DRAFT: "support.ticketDraft",
  PREFERENCES: "support.preferences",
};

// Generate UUID
const generateId = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Get device metadata
const getDeviceMetadata = () => ({
  appVersion: "1.0.0",
  device: Platform.OS === "ios" ? "iOS" : "Android",
});

// Initial form data
const initialFormData: TicketFormData = {
  category: null,
  orderId: "",
  batchId: "",
  subject: "",
  description: "",
  attachments: [],
  contactPreference: "WhatsApp",
  consentToShareLogs: false,
  priority: "Normal",
};

const defaultPreferences: SupportPreferences = {
  preferredContactMethod: "WhatsApp",
};

export function useHelpSupportStore() {
  // Data state
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [faqs] = useState<FAQ[]>(seedFAQs);
  const [preferences, setPreferences] = useState<SupportPreferences>(defaultPreferences);
  const [currentDraft, setCurrentDraft] = useState<TicketFormData>({ ...initialFormData });

  // UI state
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftSaveStatus, setDraftSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [ticketFilter, setTicketFilter] = useState<TicketFilterTab>("all");

  // Modal states
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSafetyFlowOpen, setIsSafetyFlowOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Hydration
  const hydrate = useCallback(async () => {
    try {
      setIsLoading(true);
      setHydrationError(null);

      const [ticketsJson, draftJson, prefsJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TICKETS),
        AsyncStorage.getItem(STORAGE_KEYS.DRAFT),
        AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES),
      ]);

      if (ticketsJson) setTickets(JSON.parse(ticketsJson));
      if (draftJson) setCurrentDraft(JSON.parse(draftJson));
      if (prefsJson) setPreferences(JSON.parse(prefsJson));

      setIsHydrated(true);
      setIsLoading(false);
    } catch (error) {
      console.error("Hydration error:", error);
      setHydrationError("Failed to load data. Using defaults.");
      setIsLoading(false);
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      hydrate();
    }
  }, [isHydrated, hydrate]);

  // FAQ filtering
  const getFilteredFaqs = useCallback(() => {
    if (!searchQuery.trim()) return faqs;
    const query = searchQuery.toLowerCase();
    return faqs.filter(
      (faq) =>
        faq.title.toLowerCase().includes(query) ||
        faq.shortAnswer.toLowerCase().includes(query) ||
        faq.details?.some((d) => d.toLowerCase().includes(query))
    );
  }, [faqs, searchQuery]);

  // Ticket filtering
  const getFilteredTickets = useCallback(() => {
    const sorted = [...tickets].sort((a, b) => b.updatedAt - a.updatedAt);
    switch (ticketFilter) {
      case "drafts":
        return sorted.filter((t) => t.status === "draft");
      case "submitted":
        return sorted.filter((t) => t.status === "submitted");
      case "resolved":
        return sorted.filter((t) => t.status === "resolved" || t.status === "closed");
      default:
        return sorted;
    }
  }, [tickets, ticketFilter]);

  const getTicketById = useCallback(
    (id: string) => tickets.find((t) => t.id === id),
    [tickets]
  );

  // Form actions
  const updateDraft = useCallback((data: Partial<TicketFormData>) => {
    setCurrentDraft((prev) => ({ ...prev, ...data }));
    setDraftSaveStatus("idle");
  }, []);

  const saveDraft = useCallback(async () => {
    if (!currentDraft.subject && !currentDraft.description) return;

    try {
      setDraftSaveStatus("saving");
      setIsSaving(true);

      const now = Date.now();
      const existingDraft = tickets.find(
        (t) => t.status === "draft" && t.subject === currentDraft.subject && t.category === currentDraft.category
      );

      let updatedTickets: SupportTicket[];

      if (existingDraft) {
        updatedTickets = tickets.map((t) =>
          t.id === existingDraft.id
            ? { ...t, ...currentDraft, category: currentDraft.category || "Other", updatedAt: now }
            : t
        );
      } else {
        const newTicket: SupportTicket = {
          id: generateId(),
          createdAt: now,
          updatedAt: now,
          status: "draft",
          category: currentDraft.category || "Other",
          orderId: currentDraft.orderId || undefined,
          batchId: currentDraft.batchId || undefined,
          priority: currentDraft.priority,
          subject: currentDraft.subject,
          description: currentDraft.description,
          attachments: currentDraft.attachments,
          contactPreference: currentDraft.contactPreference,
          consentToShareLogs: currentDraft.consentToShareLogs,
          metadata: getDeviceMetadata(),
        };
        updatedTickets = [...tickets, newTicket];
      }

      await AsyncStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(updatedTickets));
      await AsyncStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(currentDraft));

      setTickets(updatedTickets);
      setDraftSaveStatus("saved");
      setIsSaving(false);
      setTimeout(() => setDraftSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Save draft error:", error);
      setDraftSaveStatus("error");
      setSaveError("Couldn't save draft. Try again.");
      setIsSaving(false);
    }
  }, [currentDraft, tickets]);

  const submitTicket = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!currentDraft.category) return { success: false, error: "Please select a category" };
    if (!currentDraft.subject.trim()) return { success: false, error: "Subject is required" };
    if (!currentDraft.description.trim()) return { success: false, error: "Description is required" };

    try {
      setIsSubmitting(true);

      const now = Date.now();
      const newTicket: SupportTicket = {
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        status: "submitted",
        category: currentDraft.category,
        orderId: currentDraft.orderId || undefined,
        batchId: currentDraft.batchId || undefined,
        priority: currentDraft.priority,
        subject: currentDraft.subject,
        description: currentDraft.description,
        attachments: currentDraft.attachments,
        contactPreference: currentDraft.contactPreference,
        consentToShareLogs: currentDraft.consentToShareLogs,
        metadata: getDeviceMetadata(),
      };

      const updatedTickets = [...tickets, newTicket];
      await AsyncStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(updatedTickets));
      await AsyncStorage.removeItem(STORAGE_KEYS.DRAFT);

      setTickets(updatedTickets);
      setCurrentDraft({ ...initialFormData });
      setIsSubmitting(false);
      setIsNewRequestOpen(false);

      return { success: true };
    } catch (error) {
      console.error("Submit ticket error:", error);
      setIsSubmitting(false);
      return { success: false, error: "Failed to submit. Please try again." };
    }
  }, [currentDraft, tickets]);

  const clearDraft = useCallback(() => {
    setCurrentDraft({ ...initialFormData });
    AsyncStorage.removeItem(STORAGE_KEYS.DRAFT).catch(console.error);
  }, []);

  const loadDraftForEdit = useCallback(
    (ticketId: string) => {
      const ticket = tickets.find((t) => t.id === ticketId);
      if (ticket && ticket.status === "draft") {
        setCurrentDraft({
          category: ticket.category,
          orderId: ticket.orderId || "",
          batchId: ticket.batchId || "",
          subject: ticket.subject,
          description: ticket.description,
          attachments: ticket.attachments,
          contactPreference: ticket.contactPreference,
          consentToShareLogs: ticket.consentToShareLogs,
          priority: ticket.priority,
        });
        setIsNewRequestOpen(true);
        setSelectedTicketId(null);
      }
    },
    [tickets]
  );

  const duplicateTicket = useCallback(
    (ticketId: string) => {
      const ticket = tickets.find((t) => t.id === ticketId);
      if (ticket) {
        setCurrentDraft({
          category: ticket.category,
          orderId: "",
          batchId: "",
          subject: `Copy: ${ticket.subject}`,
          description: ticket.description,
          attachments: [],
          contactPreference: ticket.contactPreference,
          consentToShareLogs: ticket.consentToShareLogs,
          priority: ticket.priority,
        });
        setIsNewRequestOpen(true);
        setSelectedTicketId(null);
      }
    },
    [tickets]
  );

  const closeTicket = useCallback(
    async (ticketId: string) => {
      const updatedTickets = tickets.map((t) =>
        t.id === ticketId ? { ...t, status: "closed" as TicketStatus, updatedAt: Date.now() } : t
      );
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(updatedTickets));
        setTickets(updatedTickets);
        setSelectedTicketId(null);
      } catch (error) {
        console.error("Close ticket error:", error);
        setSaveError("Failed to close ticket");
      }
    },
    [tickets]
  );

  const deleteTicket = useCallback(
    async (ticketId: string) => {
      const ticket = tickets.find((t) => t.id === ticketId);
      if (ticket?.status !== "draft") return;

      const updatedTickets = tickets.filter((t) => t.id !== ticketId);
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(updatedTickets));
        setTickets(updatedTickets);
        setSelectedTicketId(null);
      } catch (error) {
        console.error("Delete ticket error:", error);
        setSaveError("Failed to delete ticket");
      }
    },
    [tickets]
  );

  const submitSafetyTicket = useCallback(
    async (data: { subject: string; description: string; isSafe: boolean }): Promise<{ success: boolean; error?: string }> => {
      if (!data.subject.trim()) return { success: false, error: "Subject is required" };
      if (!data.description.trim()) return { success: false, error: "Description is required" };

      try {
        setIsSubmitting(true);

        const now = Date.now();
        const safetyTicket: SupportTicket = {
          id: generateId(),
          createdAt: now,
          updatedAt: now,
          status: "submitted",
          category: "Safety",
          priority: "High",
          subject: data.subject,
          description: `${data.description}\n\n---\nDriver confirmed safe: ${data.isSafe ? "Yes" : "No"}`,
          attachments: [],
          contactPreference: "Call",
          consentToShareLogs: true,
          metadata: getDeviceMetadata(),
        };

        const updatedTickets = [...tickets, safetyTicket];
        await AsyncStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(updatedTickets));

        setTickets(updatedTickets);
        setIsSubmitting(false);
        setIsSafetyFlowOpen(false);

        return { success: true };
      } catch (error) {
        console.error("Safety ticket error:", error);
        setIsSubmitting(false);
        return { success: false, error: "Failed to submit. Please try again." };
      }
    },
    [tickets]
  );

  // Modal actions
  const openNewRequest = useCallback(() => setIsNewRequestOpen(true), []);
  const closeNewRequest = useCallback(() => setIsNewRequestOpen(false), []);
  const openContactModal = useCallback(() => setIsContactModalOpen(true), []);
  const closeContactModal = useCallback(() => setIsContactModalOpen(false), []);
  const openHistory = useCallback(() => setIsHistoryOpen(true), []);
  const closeHistory = useCallback(() => setIsHistoryOpen(false), []);
  const openSafetyFlow = useCallback(() => setIsSafetyFlowOpen(true), []);
  const closeSafetyFlow = useCallback(() => setIsSafetyFlowOpen(false), []);
  const selectTicket = useCallback((id: string | null) => setSelectedTicketId(id), []);

  const updatePreferences = useCallback(
    async (prefs: Partial<SupportPreferences>) => {
      const updated = { ...preferences, ...prefs };
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
        setPreferences(updated);
      } catch (error) {
        console.error("Update preferences error:", error);
      }
    },
    [preferences]
  );

  return {
    // Data
    tickets,
    faqs,
    preferences,
    currentDraft,

    // UI State
    isHydrated,
    isLoading,
    hydrationError,
    saveError,
    isSaving,
    isSubmitting,
    draftSaveStatus,

    // Search & Filter
    searchQuery,
    expandedFaqId,
    ticketFilter,

    // Modal States
    isNewRequestOpen,
    isContactModalOpen,
    isHistoryOpen,
    isSafetyFlowOpen,
    selectedTicketId,

    // Actions
    hydrate,
    retryHydration: hydrate,
    setSearchQuery,
    setExpandedFaqId,
    getFilteredFaqs,
    setTicketFilter,
    getFilteredTickets,
    getTicketById,
    updateDraft,
    saveDraft,
    submitTicket,
    clearDraft,
    loadDraftForEdit,
    duplicateTicket,
    closeTicket,
    deleteTicket,
    submitSafetyTicket,
    openNewRequest,
    closeNewRequest,
    openContactModal,
    closeContactModal,
    openHistory,
    closeHistory,
    openSafetyFlow,
    closeSafetyFlow,
    selectTicket,
    updatePreferences,
  };
}
