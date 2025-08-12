// Utilitários para formatação de datas no padrão brasileiro (dd/mm/yyyy)

export const formatDateBR = (date: string | Date): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}/${month}/${year}`;
};

export const formatDateTimeBR = (date: string | Date): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  
  return `${day}/${month}/${year} às ${hours}:${minutes}`;
};

export const parseDateBR = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  
  // Aceita formatos: dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd
  let day: string, month: string, year: string;
  
  if (dateStr.includes('/')) {
    [day, month, year] = dateStr.split('/');
  } else if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts[0].length === 4) {
      // Formato yyyy-mm-dd
      [year, month, day] = parts;
    } else {
      // Formato dd-mm-yyyy
      [day, month, year] = parts;
    }
  } else {
    return null;
  }
  
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  if (isNaN(date.getTime())) return null;
  
  return date;
};

export const formatDateForInput = (date: string | Date): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

export const getCurrentDateBR = (): string => {
  return formatDateBR(new Date());
};

export const getDateDaysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDateForInput(date);
};

export const getDateDaysAhead = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDateForInput(date);
};