export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatTime = (time: string): string => {
  return time.slice(0, 5);
};

export const getDayOfWeek = (date: Date): number => {
  return date.getDay();
};

export const isDateDisabled = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};