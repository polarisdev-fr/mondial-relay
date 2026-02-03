/**
 * Mondial Relay requires brandIdAPI to be exactly 8 characters.
 * This function normalizes the brand by padding with spaces.
 *
 * @param brand - The brand ID (can be 1-8 characters)
 * @returns An 8-character brand ID padded with spaces
 * @throws Error in development if brand is longer than 8 characters
 *
 * @example
 * normalizeBrandId('BDTEST') // => 'BDTEST  '
 * normalizeBrandId('BDTEST  ') // => 'BDTEST  '
 * normalizeBrandId('CC123456') // => 'CC123456'
 */
export function normalizeBrandId(brand: string): string {
  if (!brand) {
    throw new Error('[ParcelShopSelector] brandIdAPI is required and must be a string')
  }

  const trimmed = brand.trim()

  if (trimmed.length > 8) {
    throw new Error(
      `[ParcelShopSelector] brandIdAPI must be at most 8 characters (got ${trimmed.length}). ` +
        `Received: "${trimmed}"`,
    )
  }

  if (trimmed.length === 0) {
    throw new Error('[ParcelShopSelector] brandIdAPI cannot be empty')
  }

  // Pad with spaces to reach exactly 8 characters
  return trimmed.padEnd(8, ' ')
}

/**
 * Validates that delivery mode is one of the supported values
 */
export function validateDeliveryMode(mode?: string): void {
  const validModes = ['LCC', 'HOM', '24R', '24L', 'XOH']

  if (mode && !validModes.includes(mode)) {
    console.error(
      `[ParcelShopSelector] Invalid deliveryMode: "${mode}". ` +
        `Valid modes are: ${validModes.join(', ')}. Defaulting to "24R".`,
    )
  }
}

/**
 * Checks if we're running in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}
