import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Delivery {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  pickupLocation: string;
  dropoffLocation: string;
  status: "pending" | "in_progress" | "picked_up" | "completed" | "failed";
  eta: string;
  deliveryWindow: string;
  batchId?: string;
  distance?: string;
  startTime?: number;
}

export interface Batch {
  batchId: string;
  deliveryIds: string[];
}

interface DeliveryContextType {
  deliveries: Delivery[];
  batches: Batch[];
  addDelivery: (delivery: Delivery) => void;
  updateDeliveryStatus: (deliveryId: string, newStatus: Delivery["status"]) => void;
}

const initialDeliveries: Delivery[] = [
  // BATCH-001 deliveries
  {
    id: "1",
    orderId: "ORD-12345",
    customerName: "John Doe",
    customerPhone: "+234 801 234 5678",
    pickupLocation: "Tiffsy Kitchen, 25 Adeola Odeku, Victoria Island",
    dropoffLocation: "123 Main Street, Ikeja GRA, Lagos",
    status: "pending",
    eta: "25 mins",
    deliveryWindow: "10:30 AM - 11:00 AM",
    batchId: "BATCH-001",
    distance: "5.2 km",
  },
  {
    id: "2",
    orderId: "ORD-12346",
    customerName: "Jane Smith",
    customerPhone: "+234 802 345 6789",
    pickupLocation: "Tiffsy Kitchen, 25 Adeola Odeku, Victoria Island",
    dropoffLocation: "456 Oak Avenue, Lekki Phase 1",
    status: "in_progress",
    eta: "15 mins",
    deliveryWindow: "10:45 AM - 11:15 AM",
    batchId: "BATCH-001",
    distance: "3.8 km",
    startTime: Date.now() - 600000,
  },
  // BATCH-002 deliveries
  {
    id: "6",
    orderId: "ORD-12350",
    customerName: "Priya Sharma",
    customerPhone: "+234 806 789 0123",
    pickupLocation: "Tiffsy Kitchen, Lekki",
    dropoffLocation: "22 Admiralty Way, Lekki Phase 1",
    status: "pending",
    eta: "20 mins",
    deliveryWindow: "11:30 AM - 12:00 PM",
    batchId: "BATCH-002",
    distance: "4.1 km",
  },
  {
    id: "7",
    orderId: "ORD-12351",
    customerName: "Emeka Obi",
    customerPhone: "+234 807 890 1234",
    pickupLocation: "Tiffsy Kitchen, Lekki",
    dropoffLocation: "15 Freedom Way, Lekki Phase 1",
    status: "pending",
    eta: "25 mins",
    deliveryWindow: "11:45 AM - 12:15 PM",
    batchId: "BATCH-002",
    distance: "4.8 km",
  },
  {
    id: "8",
    orderId: "ORD-12352",
    customerName: "Fatima Bello",
    customerPhone: "+234 808 901 2345",
    pickupLocation: "Tiffsy Kitchen, Lekki",
    dropoffLocation: "8 Chevron Drive, Lekki",
    status: "pending",
    eta: "30 mins",
    deliveryWindow: "12:00 PM - 12:30 PM",
    batchId: "BATCH-002",
    distance: "6.2 km",
  },
  // BATCH-003 deliveries
  {
    id: "9",
    orderId: "ORD-12353",
    customerName: "Chinedu Okoro",
    customerPhone: "+234 809 012 3456",
    pickupLocation: "Tiffsy Kitchen, Ikeja",
    dropoffLocation: "45 Allen Avenue, Ikeja",
    status: "in_progress",
    eta: "12 mins",
    deliveryWindow: "12:30 PM - 1:00 PM",
    batchId: "BATCH-003",
    distance: "2.3 km",
    startTime: Date.now() - 480000,
  },
  {
    id: "10",
    orderId: "ORD-12354",
    customerName: "Aisha Mohammed",
    customerPhone: "+234 810 123 4567",
    pickupLocation: "Tiffsy Kitchen, Ikeja",
    dropoffLocation: "12 Opebi Road, Ikeja",
    status: "pending",
    eta: "18 mins",
    deliveryWindow: "12:45 PM - 1:15 PM",
    batchId: "BATCH-003",
    distance: "3.1 km",
  },
  // Unbatched deliveries
  {
    id: "3",
    orderId: "ORD-12347",
    customerName: "Mike Johnson",
    customerPhone: "+234 803 456 7890",
    pickupLocation: "Tiffsy Kitchen, 25 Adeola Odeku, Victoria Island",
    dropoffLocation: "789 Palm Close, Ikoyi",
    status: "picked_up",
    eta: "10 mins",
    deliveryWindow: "11:00 AM - 11:30 AM",
    distance: "2.5 km",
    startTime: Date.now() - 900000,
  },
  {
    id: "4",
    orderId: "ORD-12348",
    customerName: "Sarah Williams",
    customerPhone: "+234 804 567 8901",
    pickupLocation: "Tiffsy Kitchen, Maryland Mall",
    dropoffLocation: "321 Ring Road, Surulere",
    status: "completed",
    eta: "-",
    deliveryWindow: "9:30 AM - 10:00 AM",
    distance: "7.1 km",
  },
  {
    id: "5",
    orderId: "ORD-12349",
    customerName: "David Brown",
    customerPhone: "+234 805 678 9012",
    pickupLocation: "Tiffsy Kitchen, Yaba",
    dropoffLocation: "654 Herbert Macaulay, Yaba",
    status: "failed",
    eta: "-",
    deliveryWindow: "9:00 AM - 9:30 AM",
    distance: "1.2 km",
  },
  {
    id: "11",
    orderId: "ORD-12355",
    customerName: "Oluwaseun Adeyemi",
    customerPhone: "+234 811 234 5678",
    pickupLocation: "Tiffsy Kitchen, Surulere",
    dropoffLocation: "28 Bode Thomas Street, Surulere",
    status: "pending",
    eta: "22 mins",
    deliveryWindow: "1:00 PM - 1:30 PM",
    distance: "3.5 km",
  },
];

const initialBatches: Batch[] = [
  {
    batchId: "BATCH-001",
    deliveryIds: ["1", "2"],
  },
  {
    batchId: "BATCH-002",
    deliveryIds: ["6", "7", "8"],
  },
  {
    batchId: "BATCH-003",
    deliveryIds: ["9", "10"],
  },
];

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined);

export function DeliveryProvider({ children }: { children: ReactNode }) {
  const [deliveries, setDeliveries] = useState<Delivery[]>(initialDeliveries);
  const [batches] = useState<Batch[]>(initialBatches);

  const addDelivery = useCallback((delivery: Delivery) => {
    setDeliveries(prev => [...prev, delivery]);
  }, []);

  const updateDeliveryStatus = useCallback((deliveryId: string, newStatus: Delivery["status"]) => {
    setDeliveries(prev =>
      prev.map(d =>
        d.id === deliveryId
          ? { ...d, status: newStatus, startTime: newStatus === "in_progress" ? Date.now() : d.startTime }
          : d
      )
    );
  }, []);

  return (
    <DeliveryContext.Provider value={{ deliveries, batches, addDelivery, updateDeliveryStatus }}>
      {children}
    </DeliveryContext.Provider>
  );
}

export function useDeliveryContext() {
  const context = useContext(DeliveryContext);
  if (context === undefined) {
    throw new Error('useDeliveryContext must be used within a DeliveryProvider');
  }
  return context;
}
