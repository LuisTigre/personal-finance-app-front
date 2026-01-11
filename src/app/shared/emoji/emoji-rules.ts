export const DEFAULT_EMOJI = '💸';

export const CATEGORY_EMOJI_MAP: Record<string, string> = {
  // Common categories
  'groceries': '🛒',
  'shopping': '👚',
  'rent': '🏠',
  'housing': '🏠',
  'transport': '🚕',
  'transportation': '🚕',
  'bills': '🧾',
  'utilities': '💡',
  'health': '🏥',
  'medical': '🏥',
  'entertainment': '🎬',
  'dining': '🍽️',
  'food': '🥗',
  'restaurant': '🍽️',
  'salary': '💰',
  'income': '💰',
  'payroll': '💰',
  'transfer': '🔁',
  'savings': '🏦',
  'investment': '📈',
  'education': '🎓',
  'travel': '✈️',
  'personal': '👤',
  'gift': '🎁',
  'charity': '🤝',
  'insurance': '🛡️',
  'subscriptions': '🔄',
  'tech': '💻',
};

export const EMOJI_RULES: Array<{ keywords: string[]; emoji: string }> = [
  // Transport
  { keywords: ['uber', 'lyft', 'bolt', 'taxi', 'cab'], emoji: '🚕' },
  { keywords: ['bus', 'train', 'metro', 'subway', 'tram', 'rail'], emoji: '🚍' },
  { keywords: ['fuel', 'gas', 'petrol', 'shell', 'bp', 'circle k'], emoji: '⛽' },
  { keywords: ['parking', 'garage'], emoji: '🅿️' },
  { keywords: ['airline', 'flight', 'ticket', 'ryanair', 'wizz', 'lufthansa'], emoji: '✈️' },

  // Food & Drink
  { keywords: ['market', 'supermarket', 'lidl', 'aldi', 'tesco', 'auchan', 'carrefour', 'walmart', 'grocery'], emoji: '🛒' },
  { keywords: ['restaurant', 'cafe', 'coffee', 'starbucks', 'costa', 'bistro', 'burger', 'pizza', 'sushi', 'mcdonalds', 'kfc'], emoji: '🍽️' },
  { keywords: ['bar', 'pub', 'beer', 'wine', 'liquor'], emoji: '🍺' },
  
  // Shopping
  { keywords: ['amazon', 'ebay', 'aliexpress', 'temu'], emoji: '📦' },
  { keywords: ['clothing', 'zara', 'h&m', 'uniqlo', 'nike', 'adidas', 'fashion'], emoji: '👚' },
  { keywords: ['tech', 'apple', 'samsung', 'microsoft', 'google', 'electronics'], emoji: '💻' },
  { keywords: ['pharmacy', 'drugstore', 'medicine', 'doctor', 'clinic', 'dentist'], emoji: '🏥' },

  // Entertainment / Subs
  { keywords: ['netflix', 'spotify', 'hbo', 'disney', 'prime video', 'youtube', 'subscription'], emoji: '📺' },
  { keywords: ['cinema', 'movie', 'theater', 'theatre', 'film'], emoji: '🎬' },
  { keywords: ['game', 'steam', 'playstation', 'xbox', 'nintendo'], emoji: '🎮' },

  // Housing / Utilities
  { keywords: ['rent', 'landlord', 'apartment', 'mortgage'], emoji: '🏠' },
  { keywords: ['electric', 'power', 'water', 'gas', 'bill', 'utility'], emoji: '💡' },
  { keywords: ['internet', 'wifi', 'broadband', 'telecom', 'phone', 'mobile'], emoji: '📱' },

  // Financial
  { keywords: ['salary', 'payroll', 'wage', 'income', 'earning'], emoji: '💰' },
  { keywords: ['tax', 'irs', 'revenue'], emoji: '🏛️' },
  
  // Work
  { keywords: ['upwork', 'fiverr', 'freelance'], emoji: '💼' },

  // Banking & Wallets
  { keywords: ['revolut', 'monzo', 'n26', 'starling', 'nubank', 'chase', 'hsbc', 'barclays', 'santander', 'bank'], emoji: '🏦' },
  { keywords: ['paypal', 'wise', 'venmo', 'cashapp', 'klarna'], emoji: '💸' },
  { keywords: ['cash', 'pocket', 'hand'], emoji: '💵' },
  { keywords: ['savings', 'reserve', 'vault', 'emergency'], emoji: '🐖' },
  { keywords: ['credit', 'visa', 'mastercard', 'amex', 'platinum', 'gold'], emoji: '💳' },
  { keywords: ['crypto', 'bitcoin', 'btc', 'eth', 'binance', 'coinbase', 'kraken'], emoji: '🪙' },
];

export function resolveEmoji(category: string | null | undefined, description: string | null | undefined): string {
  // 1. Check exact category match (normalized)
  const normCategory = (category || '').trim().toLowerCase();
  
  if (normCategory && CATEGORY_EMOJI_MAP[normCategory]) {
    return CATEGORY_EMOJI_MAP[normCategory];
  }

  // 2. Check keywords in description/category
  const text = `${normCategory} ${description || ''}`.toLowerCase();
  
  for (const rule of EMOJI_RULES) {
    if (rule.keywords.some(k => text.includes(k))) {
      return rule.emoji;
    }
  }

  // 3. Last efforts on partial category match if no rule matched
  // e.g. "Monthly Rent" -> "matches key 'rent'" logic if we wanted strictly keys, 
  // but the RULES array usually covers this better. 
  
  // Fallback
  return DEFAULT_EMOJI;
}
