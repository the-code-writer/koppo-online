/**
 * String Utility Functions
 * Common functions for text manipulation and formatting
 */

// ==================== CURRENCY FUNCTIONS ====================

/**
 * Convert a number to currency format
 * @param value - Numeric value to convert
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export function convertToCurrency(
  value: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value);
}

/**
 * Format currency with custom options
 * @param value - Numeric value
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  options: {
    currency?: string;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSymbol?: boolean;
  } = {}
): string {
  const {
    currency = 'USD',
    locale = 'en-US',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showSymbol = true,
  } = options;

  if (showSymbol) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(value);
  } else {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(value);
  }
}

/**
 * Convert currency words to digits (e.g., "one hundred twenty-three dollars" -> 123)
 * @param words - Currency words
 * @returns Numeric value
 */
export function currencyWordsToDigits(words: string): number {
  const wordToNumber: { [key: string]: number } = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
    hundred: 100,
    thousand: 1000,
    million: 1000000,
    billion: 1000000000,
  };

  const cleanedWords = words.toLowerCase().replace(/[^a-z\s]/g, '');
  const wordsArray = cleanedWords.split(/\s+/);
  
  let total = 0;
  let current = 0;

  for (const word of wordsArray) {
    if (wordToNumber[word] !== undefined) {
      const num = wordToNumber[word];
      if (num === 100) {
        current *= num;
      } else if (num >= 1000) {
        current *= num;
        total += current;
        current = 0;
      } else {
        current += num;
      }
    }
  }

  return total + current;
}

/**
 * Convert currency digits to words (e.g., 123 -> "one hundred twenty-three dollars")
 * @param value - Numeric value
 * @param currency - Currency name (default: 'dollars')
 * @returns Currency words
 */
export function currencyDigitsToWords(value: number, currency: string = 'dollars'): string {
  if (value === 0) return `zero ${currency}`;

  const numberToWords: { [key: string]: string } = {
    0: 'zero',
    1: 'one',
    2: 'two',
    3: 'three',
    4: 'four',
    5: 'five',
    6: 'six',
    7: 'seven',
    8: 'eight',
    9: 'nine',
    10: 'ten',
    11: 'eleven',
    12: 'twelve',
    13: 'thirteen',
    14: 'fourteen',
    15: 'fifteen',
    16: 'sixteen',
    17: 'seventeen',
    18: 'eighteen',
    19: 'nineteen',
    20: 'twenty',
    30: 'thirty',
    40: 'forty',
    50: 'fifty',
    60: 'sixty',
    70: 'seventy',
    80: 'eighty',
    90: 'ninety',
  };

  const convertLessThanOneThousand = (num: number): string => {
    let result = '';

    if (num >= 100) {
      result += numberToWords[Math.floor(num / 100)] + ' hundred';
      num %= 100;
      if (num > 0) result += ' ';
    }

    if (num > 0) {
      if (num < 20) {
        result += numberToWords[num];
      } else {
        result += numberToWords[Math.floor(num / 10) * 10];
        if (num % 10 > 0) {
          result += '-' + numberToWords[num % 10];
        }
      }
    }

    return result;
  };

  let result = '';
  let remaining = Math.abs(value);

  if (remaining >= 1000000) {
    result += convertLessThanOneThousand(Math.floor(remaining / 1000000)) + ' million ';
    remaining %= 1000000;
  }

  if (remaining >= 1000) {
    result += convertLessThanOneThousand(Math.floor(remaining / 1000)) + ' thousand ';
    remaining %= 1000;
  }

  if (remaining > 0) {
    result += convertLessThanOneThousand(remaining);
  }

  result = result.trim();
  if (value < 0) result = 'negative ' + result;
  
  return result + ' ' + currency;
}

/**
 * Format currency using Intl with advanced options
 * @param value - Numeric value
 * @param options - Intl formatting options
 * @returns Formatted currency string
 */
export function currencyIntl(
  value: number,
  options: Intl.NumberFormatOptions & { currency: string } = { currency: 'USD' }
): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    ...options,
  }).format(value);
}

/**
 * Shorten currency display (e.g., 1500000 -> $1.5M)
 * @param value - Numeric value
 * @param currency - Currency symbol (default: '$')
 * @param decimals - Decimal places (default: 1)
 * @returns Shortened currency string
 */
export function currencyShorten(
  value: number,
  currency: string = '$',
  decimals: number = 1
): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1000000000) {
    return `${sign}${currency}${(absValue / 1000000000).toFixed(decimals)}B`;
  } else if (absValue >= 1000000) {
    return `${sign}${currency}${(absValue / 1000000).toFixed(decimals)}M`;
  } else if (absValue >= 1000) {
    return `${sign}${currency}${(absValue / 1000).toFixed(decimals)}K`;
  } else {
    return `${sign}${currency}${absValue.toFixed(2)}`;
  }
}

// ==================== PHONE NUMBER FUNCTIONS ====================

/**
 * Format phone number to standard format
 * @param phoneNumber - Phone number string
 * @param format - Format pattern (default: '(xxx) xxx-xxxx')
 * @returns Formatted phone number
 */
export function phoneNumberFormat(
  phoneNumber: string,
  format: string = '(xxx) xxx-xxxx'
): string {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.length === 0) return '';
  
  let formatted = format;
  let digitIndex = 0;
  
  for (let i = 0; i < format.length && digitIndex < cleaned.length; i++) {
    if (format[i] === 'x') {
      formatted = formatted.substring(0, i) + cleaned[digitIndex] + formatted.substring(i + 1);
      digitIndex++;
    }
  }
  
  return formatted;
}

/**
 * Validate phone number format
 * @param phoneNumber - Phone number string
 * @param countryCode - Country code for validation (default: 'US')
 * @returns True if valid phone number
 */
export function validatePhoneNumber(
  phoneNumber: string,
  countryCode: string = 'US'
): boolean {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  const patterns: { [key: string]: RegExp } = {
    US: /^\d{10}$/,
    UK: /^\d{10,11}$/,
    CA: /^\d{10}$/,
    AU: /^\d{9,10}$/,
    DE: /^\d{10,11}$/,
    FR: /^\d{9}$/,
    IT: /^\d{9,11}$/,
    ES: /^\d{9}$/,
    NL: /^\d{9}$/,
    BE: /^\d{9}$/,
    CH: /^\d{9,10}$/,
  };
  
  const pattern = patterns[countryCode] || patterns.US;
  return pattern.test(cleaned);
}

// ==================== EMAIL VALIDATION ====================

/**
 * Validate email address format
 * @param email - Email address string
 * @returns True if valid email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ==================== DECIMAL FUNCTIONS ====================

/**
 * Round number to specified decimal places
 * @param value - Numeric value
 * @param decimals - Number of decimal places
 * @returns Rounded number
 */
export function roundToDecimal(value: number, decimals: number): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Format decimal number with specified precision
 * @param value - Numeric value
 * @param decimals - Number of decimal places
 * @param options - Additional formatting options
 * @returns Formatted decimal string
 */
export function formatDecimal(
  value: number,
  decimals: number,
  options: {
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    useGrouping?: boolean;
  } = {}
): string {
  const {
    locale = 'en-US',
    minimumFractionDigits = decimals,
    maximumFractionDigits = decimals,
    useGrouping = true,
  } = options;

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping,
  }).format(value);
}

// ==================== ADDITIONAL STRING UTILITIES ====================

/**
 * Capitalize first letter of each word
 * @param str - Input string
 * @returns Capitalized string
 */
export function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Convert string to title case
 * @param str - Input string
 * @returns Title case string
 */
export function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Truncate string to specified length
 * @param str - Input string
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add if truncated (default: '...')
 * @returns Truncated string
 */
export function truncateString(str: string, maxLength: number, suffix: string = '...'): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Remove extra whitespace from string
 * @param str - Input string
 * @returns Cleaned string
 */
export function removeExtraWhitespace(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Convert string to slug (URL-friendly)
 * @param str - Input string
 * @returns Slug string
 */
export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Check if string is empty or contains only whitespace
 * @param str - Input string
 * @returns True if empty or whitespace only
 */
export function isEmptyOrWhitespace(str: string): boolean {
  return !str || str.trim().length === 0;
}

/**
 * Generate random string
 * @param length - Length of string to generate
 * @param chars - Characters to use (default: alphanumeric)
 * @returns Random string
 */
export function generateRandomString(
  length: number,
  chars: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Mask sensitive information (e.g., credit card numbers)
 * @param str - Input string
 * @param visibleChars - Number of characters to show at start and end
 * @param maskChar - Character to use for masking (default: '*')
 * @returns Masked string
 */
export function maskString(str: string, visibleChars: number = 4, maskChar: string = '*'): string {
  if (str.length <= visibleChars * 2) return str;
  
  const start = str.substring(0, visibleChars);
  const end = str.substring(str.length - visibleChars);
  const middle = maskChar.repeat(str.length - visibleChars * 2);
  
  return start + middle + end;
}

/**
 * Convert camelCase to snake_case
 * @param str - Input string
 * @returns snake_case string
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case to camelCase
 * @param str - Input string
 * @returns camelCase string
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Check if string contains only numbers
 * @param str - Input string
 * @returns True if numeric only
 */
export function isNumeric(str: string): boolean {
  return /^\d+$/.test(str);
}

/**
 * Check if string contains only alphabetic characters
 * @param str - Input string
 * @returns True if alphabetic only
 */
export function isAlpha(str: string): boolean {
  return /^[a-zA-Z]+$/.test(str);
}

/**
 * Check if string contains only alphanumeric characters
 * @param str - Input string
 * @returns True if alphanumeric only
 */
export function isAlphanumeric(str: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(str);
}