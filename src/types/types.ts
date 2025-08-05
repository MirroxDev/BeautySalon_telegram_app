interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  bookingId?: string;
  clientName?: string;
}

interface Booking {
  id: number;
  master_id: string;
  service_id: number;
  client_name: string;
  client_phone: string;
  client_telegram: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface Service {
  id: number;
  master_id: string;
  name: string;
  description: string;
  duration: number;
  price: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WorkingHour {
  id: number;
  master_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Master {
  id: string;
  name: string;
  services: Service[];
  workingHours: WorkingHour[];
}
