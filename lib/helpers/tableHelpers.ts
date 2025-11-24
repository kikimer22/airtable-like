/**
 * Get sort icon based on sorting state
 */
export const getSortIcon = (sortState: 'asc' | 'desc' | false | null): string | null => {
  if (sortState === 'asc') return '🔼';
  if (sortState === 'desc') return '🔽';
  return null;
};

/**
 * Browser detection helper for Firefox
 */
export const isFirefox = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return navigator.userAgent.indexOf('Firefox') !== -1;
};

