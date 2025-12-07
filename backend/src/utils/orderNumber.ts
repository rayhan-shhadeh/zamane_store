// Generate unique order number
// Format: ZPS-YYYYMMDD-XXXX (e.g., ZPS-20240115-A3B7)
export const generateOrderNumber = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ZPS-${dateStr}-${random}`;
};

// Generate SKU
// Format: CAT-NAME-XXXX
export const generateSKU = (category: string, name: string): string => {
  const catCode = category.substring(0, 3).toUpperCase();
  const nameCode = name.substring(0, 3).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${catCode}-${nameCode}-${random}`;
};

// Generate slug from string
export const generateSlug = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Format currency
export const formatCurrency = (amount: number, currency: string = 'ILS'): string => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency,
  }).format(amount);
};
