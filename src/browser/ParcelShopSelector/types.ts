/**
 * Mondial Relay Widget Configuration Types
 * These types ensure type safety when interacting with the Mondial Relay ParcelShopPicker widget
 */
import type { ParcelShopSelected } from '../../types/parcel-shop'

/**
 * Delivery modes supported by Mondial Relay
 */
export type DeliveryMode = 'LCC' | 'HOM' | '24R' | '24L' | 'XOH'

/**
 * Country codes supported by Mondial Relay
 */
export type CountryCode =
  | 'FR' // France
  | 'BE' // Belgium
  | 'ES' // Spain
  | 'NL' // Netherlands
  | 'LU' // Luxembourg
  | 'PT' // Portugal
  | 'DE' // Germany
  | 'IT' // Italy
  | 'AT' // Austria
  | 'GB' // United Kingdom

/**
 * Configuration object for the Mondial Relay ParcelShopPicker widget
 */
export interface MRWidgetConfig {
  /** Target input element selector */
  Target: string
  /** Brand ID (must be exactly 8 characters) */
  Brand: string
  /** Default country code */
  Country: string
  /** Default postal code */
  PostCode: string
  /** Delivery mode */
  ColLivMod: string
  /** Number of results to display */
  NbResults: string
  /** Show results on map */
  ShowResultsOnMap: boolean
  /** Display map info */
  DisplayMapInfo: boolean
  /** Comma-separated list of allowed countries */
  AllowedCountries: string
  /** Apply default CSS */
  CSS: string
  /** Package weight in grams (optional) */
  Weight?: number
  /** Callback when parcel shop is selected */
  OnParcelShopSelected: (data: ParcelShopSelected) => void
}

/**
 * jQuery object with Mondial Relay plugin method
 */
export interface JQueryMRPlugin {
  MR_ParcelShopPicker(config: MRWidgetConfig): void
}

/**
 * Global window interface with jQuery and Mondial Relay widget
 */
declare global {
  interface Window {
    $?: ((selector: string) => JQueryMRPlugin) & {
      ajax?: any
    }
    jQuery?: any
    __MR_WIDGET_SCRIPTS_LOADED__?: boolean
    __MR_WIDGET_INITIALIZED__?: boolean
  }
}
