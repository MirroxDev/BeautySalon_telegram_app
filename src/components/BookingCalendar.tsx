import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, Calendar } from 'lucide-react';

// Типы данных
interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  bookingId?: string;
  clientName?: string;
}

interface Service {
  id: string;
  name: string;
  duration: number; // в минутах
  price: number;
}

interface Master {
  id: string;
  name: string;
  services: Service[];
  workingHours: {
    [key: number]: { start: string; end: string }; // 0-6 дни недели
  };
}

// Утилиты для работы с датами
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatTime = (time: string): string => {
  return time.slice(0, 5);
};

const getDayOfWeek = (date: Date): number => {
  return date.getDay();
};

const isDateDisabled = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

// Генерация временных слотов на основе рабочих часов мастера и продолжительности услуги
const generateTimeSlots = (
  date: Date,
  master: Master,
  selectedService: Service,
  existingBookings: TimeSlot[] = []
): TimeSlot[] => {
  const dayOfWeek = getDayOfWeek(date);
  const workingHours = master.workingHours[dayOfWeek];
  
  if (!workingHours) return [];

  const slots: TimeSlot[] = [];
  const [startHour, startMinute] = workingHours.start.split(':').map(Number);
  const [endHour, endMinute] = workingHours.end.split(':').map(Number);
  
  const startTime = startHour * 60 + startMinute; // в минутах
  const endTime = endHour * 60 + endMinute;
  const duration = selectedService.duration;
  
  // Генерируем слоты каждые 30 минут (можно настроить)
  const slotInterval = 30;
  
  for (let time = startTime; time + duration <= endTime; time += slotInterval) {
    const slotStart = `${Math.floor(time / 60).toString().padStart(2, '0')}:${(time % 60).toString().padStart(2, '0')}`;
    const slotEnd = `${Math.floor((time + duration) / 60).toString().padStart(2, '0')}:${((time + duration) % 60).toString().padStart(2, '0')}`;
    
    // Проверяем, не занят ли слот
    const isBooked = existingBookings.some(booking => 
      booking.startTime <= slotStart && booking.endTime > slotStart
    );
    
    // Проверяем, не в прошлом ли время (для сегодняшней даты)
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const isPast = isToday && time <= currentTime;
    
    slots.push({
      id: `${date.toISOString().split('T')[0]}-${slotStart}`,
      startTime: slotStart,
      endTime: slotEnd,
      isAvailable: !isBooked && !isPast,
      bookingId: isBooked ? existingBookings.find(b => b.startTime <= slotStart && b.endTime > slotStart)?.bookingId : undefined,
      clientName: isBooked ? existingBookings.find(b => b.startTime <= slotStart && b.endTime > slotStart)?.clientName : undefined
    });
  }
  
  return slots;
};

// Мокданные
const mockMaster: Master = {
  id: '1',
  name: 'Анна Козлова',
  services: [
    { id: '1', name: 'Стрижка', duration: 60, price: 1500 },
    { id: '2', name: 'Окрашивание', duration: 120, price: 3000 },
    { id: '3', name: 'Укладка', duration: 45, price: 1000 },
    { id: '4', name: 'Маникюр', duration: 90, price: 2000 }
  ],
  workingHours: {
    1: { start: '09:00', end: '18:00' }, // Понедельник
    2: { start: '09:00', end: '18:00' }, // Вторник
    3: { start: '09:00', end: '18:00' }, // Среда
    4: { start: '09:00', end: '18:00' }, // Четверг
    5: { start: '09:00', end: '17:00' }, // Пятница
    6: { start: '10:00', end: '16:00' }, // Суббота
    0: { start: '11:00', end: '15:00' }  // Воскресенье
  }
};

const mockBookings: TimeSlot[] = [
  { id: '1', startTime: '10:00', endTime: '11:00', isAvailable: false, bookingId: 'b1', clientName: 'Мария И.' },
  { id: '2', startTime: '14:00', endTime: '16:00', isAvailable: false, bookingId: 'b2', clientName: 'Елена С.' },
  { id: '3', startTime: '16:30', endTime: '17:30', isAvailable: false, bookingId: 'b3', clientName: 'Ольга К.' }
];

const BookingCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedService, setSelectedService] = useState<Service>(mockMaster.services[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // Обновляем временные слоты при изменении даты или услуги
  useEffect(() => {
    const slots = generateTimeSlots(selectedDate, mockMaster, selectedService, mockBookings);
    setTimeSlots(slots);
    setSelectedTimeSlot(null);
  }, [selectedDate, selectedService]);

  // Генерация дней для календаря
  const generateCalendarDays = (month: Date): Date[] => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    const firstDay = new Date(year, monthIndex, 1);
    // const lastDay = new Date(year, monthIndex + 1, 0);
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
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleBooking = () => {
    if (selectedTimeSlot) {
      alert(`Запись на ${formatDate(selectedDate)} в ${selectedTimeSlot.startTime} на услугу "${selectedService.name}" оформлена!`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen text-gray-500">
      {/* Заголовок */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Запись к мастеру</h1>
        <div className="flex items-center text-gray-600">
          <User className="w-4 h-4 mr-2" />
          <span>{mockMaster.name}</span>
        </div>
      </div>

      {/* Выбор услуги */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Выберите услугу</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mockMaster.services.map((service) => (
            <button
              key={service.id}
              onClick={() => setSelectedService(service)}
              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                selectedService.id === service.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{service.name}</div>
              <div className="text-sm text-gray-600">
                {service.duration} мин • {service.price} ₽
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Календарь */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-200 rounded">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold">
              {currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-200 rounded">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Дни недели */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Календарная сетка */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
              const isSelected = date.toDateString() === selectedDate.toDateString();
              const isDisabled = isDateDisabled(date);
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <button
                  key={index}
                  onClick={() => handleDateSelect(date)}
                  disabled={isDisabled}
                  className={`
                    p-2 text-sm rounded transition-colors
                    ${!isCurrentMonth ? 'text-gray-300' : ''}
                    ${isSelected ? 'bg-blue-500 text-white' : ''}
                    ${isToday && !isSelected ? 'bg-blue-100 text-blue-600' : ''}
                    ${isDisabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-200'}
                    ${!isDisabled && !isSelected && !isToday ? 'hover:bg-gray-200' : ''}
                  `}
                >
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

          {timeSlots.length === 0 ? (
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
                    ${selectedTimeSlot?.id === slot.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                    }
                    ${slot.isAvailable 
                      ? 'hover:border-blue-300 cursor-pointer' 
                      : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      <span className="font-medium">
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
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
      {selectedTimeSlot && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-semibold">Детали записи:</h4>
              <p className="text-sm text-gray-600">
                {selectedService.name} • {formatDate(selectedDate)} • {formatTime(selectedTimeSlot.startTime)} - {formatTime(selectedTimeSlot.endTime)}
              </p>
              <p className="text-sm text-gray-600">
                Стоимость: {selectedService.price} ₽
              </p>
            </div>
          </div>
          <button
            onClick={handleBooking}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Записаться на сеанс
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;