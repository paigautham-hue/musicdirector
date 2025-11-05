/**
 * Stripe Products and Pricing Configuration
 * Define all products and prices for album generation credits
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  credits: number;
  price: number; // in cents
  priceId?: string; // Stripe Price ID (will be created)
  popular?: boolean;
  features: string[];
}

/**
 * Album Generation Credit Packages
 */
export const CREDIT_PACKAGES: Product[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    description: 'Perfect for trying out AI album creation',
    credits: 5,
    price: 999, // $9.99
    features: [
      '5 Album Generations',
      'All music platforms supported',
      'High-quality AI artwork',
      'PDF album booklets',
      'Track downloads',
    ],
  },
  {
    id: 'creator',
    name: 'Creator Pack',
    description: 'For serious music creators',
    credits: 15,
    price: 2499, // $24.99
    popular: true,
    features: [
      '15 Album Generations',
      'All music platforms supported',
      'High-quality AI artwork',
      'PDF album booklets',
      'Track downloads',
      'Priority generation queue',
    ],
  },
  {
    id: 'professional',
    name: 'Professional Pack',
    description: 'For professional artists and producers',
    credits: 50,
    price: 7999, // $79.99
    features: [
      '50 Album Generations',
      'All music platforms supported',
      'High-quality AI artwork',
      'PDF album booklets',
      'Track downloads',
      'Priority generation queue',
      'Dedicated support',
    ],
  },
];

/**
 * Get product by ID
 */
export function getProductById(id: string): Product | undefined {
  return CREDIT_PACKAGES.find(p => p.id === id);
}

/**
 * Get all products
 */
export function getAllProducts(): Product[] {
  return CREDIT_PACKAGES;
}

/**
 * Format price for display
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Calculate price per credit
 */
export function getPricePerCredit(product: Product): string {
  const pricePerCredit = product.price / product.credits / 100;
  return `$${pricePerCredit.toFixed(2)}`;
}
