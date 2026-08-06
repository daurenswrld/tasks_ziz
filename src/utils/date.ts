export const formatDeadlineDate = (deadlineStr?: string): string => {
  if (!deadlineStr) return 'Без дедлайна';
  if (/^\d{4}-\d{2}-\d{2}$/.test(deadlineStr)) {
    const [year, month, day] = deadlineStr.split('-');
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    const monthIdx = parseInt(month, 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${parseInt(day, 10)} ${months[monthIdx]} ${year} г.`;
    }
  }
  return deadlineStr;
};

export const formatDeadlineShort = (deadlineStr?: string): string => {
  if (!deadlineStr) return 'Без дедлайна';
  if (/^\d{4}-\d{2}-\d{2}$/.test(deadlineStr)) {
    const [year, month, day] = deadlineStr.split('-');
    const months = [
      'янв', 'февр', 'мар', 'апр', 'мая', 'июн',
      'июл', 'авг', 'сент', 'окт', 'нояб', 'дек'
    ];
    const monthIdx = parseInt(month, 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${parseInt(day, 10)} ${months[monthIdx]} ${year}`;
    }
  }
  return deadlineStr;
};
