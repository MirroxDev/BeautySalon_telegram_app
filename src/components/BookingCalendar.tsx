import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock, User, Calendar } from "lucide-react";
import { formatDate, formatTime, getDayOfWeek, isDateDisabled } from "@/utils/utils";

//Generate time slots
const generateTimeSlots = (
  date: Date,
  master: Master,
  selectedService: Service,
  existingBookings: Booking[] = []
): TimeSlot[] => {
  const dayOfWeek = getDayOfWeek(date);
  
  // Находим рабочие часы для выбранного дня
  const workingHour = master.workingHours.find(wh => wh.day_of_week === dayOfWeek && wh.is_active);
  
  if (!workingHour) return [];

  // Парсим время из ISO строк, игнорируя дату (берем только время)
  const parseTimeFromISO = (isoString: string) => {
    const d = new Date(isoString);
    return { h: d.getUTCHours(), m: d.getUTCMinutes() }; // Используем UTC для избежания проблем с временными зонами
  };

  const { h: startHour, m: startMinute } = parseTimeFromISO(workingHour.start_time);
  const { h: endHour, m: endMinute } = parseTimeFromISO(workingHour.end_time);

  const workStart = startHour * 60 + startMinute; // в минутах от начала дня
  const workEnd = endHour * 60 + endMinute;
  const duration = selectedService.duration;

  const slots: TimeSlot[] = [];

  // Форматируем дату для сравнения с бронированиями (только дата без времени)
  const selectedDateString = date.getFullYear() + '-' + 
    String(date.getMonth() + 1).padStart(2, '0') + '-' + 
    String(date.getDate()).padStart(2, '0');
  
  // Фильтруем активные бронирования только для выбранной даты
  const dayBookings = existingBookings.filter(booking => {
    // Извлекаем дату из booking_date без учета времени
    const bookingDateObj = new Date(booking.booking_date);
    const bookingDateString = bookingDateObj.getFullYear() + '-' + 
      String(bookingDateObj.getMonth() + 1).padStart(2, '0') + '-' + 
      String(bookingDateObj.getDate()).padStart(2, '0');
    
    return bookingDateString === selectedDateString && booking.status === 'active';
  });

  console.log('Selected date:', selectedDateString);
  console.log('Working hours:', workStart, 'to', workEnd, 'minutes');
  console.log('Service duration:', duration, 'minutes');
  console.log('Day bookings:', dayBookings);

  // Генерируем слоты БЕЗ пересечений - каждый следующий начинается после окончания предыдущего
  for (let slotStart = workStart; slotStart + duration <= workEnd; slotStart += duration) {
    const slotEnd = slotStart + duration;
    
    // Форматируем время
    const startTimeStr = `${String(Math.floor(slotStart / 60)).padStart(2, "0")}:${String(slotStart % 60).padStart(2, "0")}`;
    const endTimeStr = `${String(Math.floor(slotEnd / 60)).padStart(2, "0")}:${String(slotEnd % 60).padStart(2, "0")}`;

    // Проверка на бронирование
    const conflictBooking = dayBookings.find(booking => {
      const bookingStart = new Date(booking.start_time);
      const bookingEnd = new Date(booking.end_time);
      
      const bookingStartMinutes = bookingStart.getUTCHours() * 60 + bookingStart.getUTCMinutes();
      const bookingEndMinutes = bookingEnd.getUTCHours() * 60 + bookingEnd.getUTCMinutes();
      
      console.log(`Checking slot ${startTimeStr}-${endTimeStr} (${slotStart}-${slotEnd}) vs booking ${bookingStartMinutes}-${bookingEndMinutes}`);
      
      // Проверяем пересечение временных интервалов
      return (slotStart < bookingEndMinutes && slotEnd > bookingStartMinutes);
    });

    // Проверка на прошлое время
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const isPast = isToday && slotStart <= currentTime;

    slots.push({
      id: `${selectedDateString}-${startTimeStr}`,
      startTime: startTimeStr,
      endTime: endTimeStr,
      isAvailable: !conflictBooking && !isPast,
      bookingId: conflictBooking?.id.toString(),
      clientName: conflictBooking?.client_name,
    });
  }

  console.log('Generated slots:', slots);
  return slots;
};

//FF
const BookingCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  const [master, setMaster] = useState<Master | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const masterId = "cmdyrqen70000vfi04mimiq5v";
        const masterRes = await fetch(
          `http://localhost:5000/masters/${masterId}/services/working`
        );
        if (!masterRes.ok) throw new Error("Failed to fetch master data");
        const masterData: Master = await masterRes.json();
        
        const bookingsRes = await fetch(
          `http://localhost:5000/bookings/master/${masterId}`
        );
        if (!bookingsRes.ok) throw new Error("Failed to fetch bookings");
        const bookingsData: Booking[] = await bookingsRes.json();
        
        setMaster(masterData);
        setBookings(bookingsData);
        
        // Устанавливаем первую активную услугу по умолчанию
        const firstActiveService = masterData.services.find(service => service.is_active);
        if (firstActiveService) {
          setSelectedService(firstActiveService);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Обновляем временные слоты при изменении даты или услуги
  useEffect(() => {
    if (master && selectedService) {
      const slots = generateTimeSlots(
        selectedDate,
        master,
        selectedService,
        bookings
      );
      setTimeSlots(slots);
      setSelectedTimeSlot(null);
    }
  }, [selectedDate, selectedService, master, bookings]);

  // Генерация дней для календаря
  const generateCalendarDays = (month: Date): Date[] => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();

    const firstDay = new Date(year, monthIndex, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: Date[] = [];
    const current = new Date(startDate);

    for (let week = 0; week < 6; week++) {
      for (let day = 0; day < 7; day++) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    }

    return days;
  };

  const calendarDays = generateCalendarDays(currentMonth);

  const handleDateSelect = (date: Date) => {
    if (!isDateDisabled(date)) {
      setSelectedDate(date);
    }
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    if (slot.isAvailable) {
      setSelectedTimeSlot(slot);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const handleBooking = () => {
    if (selectedTimeSlot && selectedService) {
      alert(
        `Запись на ${formatDate(selectedDate)} в ${
          selectedTimeSlot.startTime
        } на услугу "${selectedService.name}" оформлена!`
      );
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><p>Загрузка...</p></div>;
  if (error) return <div className="flex justify-center items-center min-h-screen"><p>Ошибка: {error}</p></div>;
  if (!master) return <div className="flex justify-center items-center min-h-screen"><p>Мастер не найден</p></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen text-gray-500">
      {/* Заголовок */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Запись к мастеру
        </h1>

        <div className="flex items-center text-gray-600">
          <User className="w-4 h-4 mr-2" />
          <span>{master.name}</span>
        </div>
      </div>

      {/* Выбор услуги */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Выберите услугу</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {master.services.filter(service => service.is_active).map((service) => (
            <button
              key={service.id}
              onClick={() => setSelectedService(service)}
              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                selectedService?.id === service.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}>
              <div className="font-medium">{service.name}</div>
              <div className="text-sm text-gray-600">
                {service.duration} мин • {service.price} ₽
              </div>
              {service.description && (
                <div className="text-xs text-gray-500 mt-1">{service.description}</div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Календарь */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-200 rounded">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold">
              {currentMonth.toLocaleDateString("ru-RU", {
                month: "long",
                year: "numeric",
              })}
            </h3>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-200 rounded">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Дни недели */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Календарная сетка */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              const isCurrentMonth =
                date.getMonth() === currentMonth.getMonth();
              const isSelected =
                date.toDateString() === selectedDate.toDateString();
              const isDisabled = isDateDisabled(date);
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <button
                  key={index}
                  onClick={() => handleDateSelect(date)}
                  disabled={isDisabled}
                  className={`
                    p-2 text-sm rounded transition-colors
                    ${!isCurrentMonth ? "text-gray-300" : ""}
                    ${isSelected ? "bg-blue-500 text-white" : ""}
                    ${isToday && !isSelected ? "bg-blue-100 text-blue-600" : ""}
                    ${
                      isDisabled
                        ? "text-gray-300 cursor-not-allowed"
                        : "hover:bg-gray-200"
                    }
                    ${
                      !isDisabled && !isSelected && !isToday
                        ? "hover:bg-gray-200"
                        : ""
                    }
                  `}>
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Временные слоты */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-4">
            <Calendar className="w-5 h-5 mr-2" />
            <h3 className="text-lg font-semibold">
              Доступное время на {formatDate(selectedDate)}
            </h3>
          </div>

          {!selectedService ? (
            <div className="text-center text-gray-500 py-8">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Сначала выберите услугу</p>
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>В этот день мастер не работает</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {timeSlots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => handleTimeSlotSelect(slot)}
                  disabled={!slot.isAvailable}
                  className={`
                    w-full p-3 rounded-lg text-left transition-colors border
                    ${
                      selectedTimeSlot?.id === slot.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }
                    ${
                      slot.isAvailable
                        ? "hover:border-blue-300 cursor-pointer"
                        : "bg-gray-100 text-gray-500 cursor-not-allowed"
                    }
                  `}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      <span className="font-medium">
                        {formatTime(slot.startTime)} -{" "}
                        {formatTime(slot.endTime)}
                      </span>
                    </div>
                    {!slot.isAvailable && slot.clientName && (
                      <span className="text-xs text-gray-500">
                        Занято: {slot.clientName}
                      </span>
                    )}
                  </div>
                  {selectedTimeSlot?.id === slot.id && (
                    <div className="mt-2 text-sm text-blue-600">
                      Выбрано для записи
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Кнопка записи */}
      {selectedTimeSlot && selectedService && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-semibold">Детали записи:</h4>
              <p className="text-sm text-gray-600">
                {selectedService.name} • {formatDate(selectedDate)} •{" "}
                {formatTime(selectedTimeSlot.startTime)} -{" "}
                {formatTime(selectedTimeSlot.endTime)}
              </p>
              <p className="text-sm text-gray-600">
                Стоимость: {selectedService.price} ₽
              </p>
            </div>
          </div>
          <button
            onClick={handleBooking}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
            Записаться на сеанс
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;