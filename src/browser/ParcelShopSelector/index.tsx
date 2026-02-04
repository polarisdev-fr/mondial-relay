'use client'

import { useEffect, useRef, useState } from 'react'
import React from 'react'

import { ParcelShopID, ParcelShopSelected } from '../../types'
import { DeliveryMode } from './types'
import { isBrowser, normalizeBrandId, validateDeliveryMode } from './utils'

interface Props {
  /** Package weight in grams (optional, filters parcel shops by weight capacity) */
  weight?: number
  /** Number of results to display (default: 7) */
  nbResults?: number
  /**
   * Brand ID from Mondial Relay (will be automatically normalized to 8 characters)
   * @example "BDTEST" becomes "BDTEST  "
   * @default "BDTEST" (test environment)
   */
  brandIdAPI?: string
  /** Default country code (default: "FR") */
  defaultCountry?: string
  /** Default postal code (default: "59000") */
  defaultPostcode?: string
  /** Comma-separated list of allowed countries (default: "FR") */
  allowedCountries?: string
  /** Delivery mode (default: "24R") */
  deliveryMode?: DeliveryMode
  /**
   * Enable dark mode manually (optional, also auto-detects via prefers-color-scheme)
   * When true, adds the 'dark' class to the widget container
   */
  darkMode?: boolean
  /** Callback invoked when a parcel shop is selected */
  onParcelShopSelected(data: ParcelShopSelected & ParcelShopID): void
}

/**
 * ParcelShopSelector - A React component for Mondial Relay parcel shop selection
 *
 * This component is designed to work with Next.js App Router and is fully SSR-safe.
 * It loads jQuery and the Mondial Relay widget dynamically and handles cleanup properly.
 *
 * @example
 * ```tsx
 * 'use client'
 *
 * import { ParcelShopSelector } from '@polarisdev/mondial-relay/browser'
 *
 * export default function MyComponent() {
 *   return (
 *     <ParcelShopSelector
 *       brandIdAPI="BDTEST"
 *       onParcelShopSelected={(data) => console.log(data)}
 *     />
 *   )
 * }
 * ```
 */
export default function ParcelShopSelector(props: Props) {
  const {
    weight,
    nbResults = 7,
    brandIdAPI = 'BDTEST',
    deliveryMode = '24R',
    defaultCountry = 'FR',
    defaultPostcode = '59000',
    allowedCountries = 'FR',
    darkMode,
    onParcelShopSelected,
  } = props

  const targetRef = useRef<HTMLInputElement>(null)
  const widgetInitialized = useRef(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Validate configuration on mount
  useEffect(() => {
    if (!isBrowser()) {
      return
    }

    try {
      // Validate brand ID immediately
      normalizeBrandId(brandIdAPI)

      // Validate delivery mode
      validateDeliveryMode(deliveryMode)

      setIsReady(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error(errorMessage)
    }
  }, [brandIdAPI, deliveryMode])

  useEffect(() => {
    // Skip if not in browser or not ready or already initialized
    if (!isBrowser() || !isReady || widgetInitialized.current || error) {
      return
    }

    widgetInitialized.current = true

    const initializeWidget = async () => {
      try {
        injectCSS()
        await loadScripts()
        initWidget()
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize widget'
        setError(errorMessage)
        console.error('[ParcelShopSelector]', errorMessage)
        widgetInitialized.current = false
      }
    }

    initializeWidget()

    return () => {
      // Cleanup widget DOM on unmount
      if (isBrowser()) {
        const zone = document.getElementById('Zone_Widget')
        if (zone) {
          zone.innerHTML = ''
        }
        // Reset initialization flag to allow remounting
        widgetInitialized.current = false
      }
    }
  }, [isReady, error, weight, nbResults, brandIdAPI, deliveryMode, defaultCountry, defaultPostcode, allowedCountries])

  function injectCSS() {
    // Only inject CSS once globally
    if (document.getElementById('mr-widget-style')) return

    const style = document.createElement('style')
    style.id = 'mr-widget-style'
    style.innerHTML = `
      /* ========================================
         BASE STYLES (Light Mode)
         ======================================== */
      
      .Zone_Widget > div { width: 100%; }
      .Target_Widget { visibility: hidden; position: absolute; pointer-events: none; }

      @media (max-width: 425px) {
        .MR-Widget .MRW-Results {
          height: unset !important;
        }
      }

      /* ========================================
         DARK MODE OVERRIDES
         Triggered by: prefers-color-scheme OR .dark class on parent
         ======================================== */

      /* 1. MAIN WIDGET CONTAINER - Background and borders */
      @media (prefers-color-scheme: dark) {
        .MR-Widget {
          background-color: #1a1a1a !important;
          color: #e4e4e7 !important;
          border-color: #3f3f46 !important;
        }
      }
      .dark .MR-Widget {
        background-color: #1a1a1a !important;
        color: #e4e4e7 !important;
        border-color: #3f3f46 !important;
      }

      /* 2. SEARCH FORM - Input fields and labels */
      @media (prefers-color-scheme: dark) {
        .MR-Widget .MRW-Search,
        .MR-Widget .MRW-Search-Form {
          background-color: #27272a !important;
          border-color: #3f3f46 !important;
        }
        
        .MR-Widget .MRW-Search input[type="text"],
        .MR-Widget .MRW-Search select,
        .MR-Widget .MRW-Search input {
          background-color: #18181b !important;
          color: #e4e4e7 !important;
          border-color: #52525b !important;
        }
        
        .MR-Widget .MRW-Search input::placeholder {
          color: #a1a1aa !important;
        }
        
        .MR-Widget .MRW-Search label {
          color: #d4d4d8 !important;
        }
      }
      .dark .MR-Widget .MRW-Search,
      .dark .MR-Widget .MRW-Search-Form {
        background-color: #27272a !important;
        border-color: #3f3f46 !important;
      }
      .dark .MR-Widget .MRW-Search input[type="text"],
      .dark .MR-Widget .MRW-Search select,
      .dark .MR-Widget .MRW-Search input {
        background-color: #18181b !important;
        color: #e4e4e7 !important;
        border-color: #52525b !important;
      }
      .dark .MR-Widget .MRW-Search input::placeholder {
        color: #a1a1aa !important;
      }
      .dark .MR-Widget .MRW-Search label {
        color: #d4d4d8 !important;
      }

      /* 3. SEARCH BUTTON - Primary action button */
      @media (prefers-color-scheme: dark) {
        .MR-Widget .MRW-Search-Button,
        .MR-Widget .MRW-Search button,
        .MR-Widget button[type="submit"] {
          background-color: #3b82f6 !important;
          color: #ffffff !important;
          border-color: #2563eb !important;
        }
        
        .MR-Widget .MRW-Search-Button:hover,
        .MR-Widget .MRW-Search button:hover,
        .MR-Widget button[type="submit"]:hover {
          background-color: #2563eb !important;
          border-color: #1d4ed8 !important;
        }
        
        .MR-Widget .MRW-Search-Button:active,
        .MR-Widget .MRW-Search button:active {
          background-color: #1d4ed8 !important;
        }
      }
      .dark .MR-Widget .MRW-Search-Button,
      .dark .MR-Widget .MRW-Search button,
      .dark .MR-Widget button[type="submit"] {
        background-color: #3b82f6 !important;
        color: #ffffff !important;
        border-color: #2563eb !important;
      }
      .dark .MR-Widget .MRW-Search-Button:hover,
      .dark .MR-Widget .MRW-Search button:hover,
      .dark .MR-Widget button[type="submit"]:hover {
        background-color: #2563eb !important;
        border-color: #1d4ed8 !important;
      }
      .dark .MR-Widget .MRW-Search-Button:active,
      .dark .MR-Widget .MRW-Search button:active {
        background-color: #1d4ed8 !important;
      }

      /* 4. RESULTS LIST - Parcel shop results panel */
      @media (prefers-color-scheme: dark) {
        .MR-Widget .MRW-Results {
          background-color: #27272a !important;
          border-color: #3f3f46 !important;
        }
        
        .MR-Widget .MRW-Result-Item,
        .MR-Widget .MRW-Results li {
          background-color: #18181b !important;
          border-color: #3f3f46 !important;
          color: #e4e4e7 !important;
        }
        
        .MR-Widget .MRW-Result-Item:hover,
        .MR-Widget .MRW-Results li:hover {
          background-color: #27272a !important;
          border-color: #52525b !important;
        }
        
        .MR-Widget .MRW-Result-Item.selected,
        .MR-Widget .MRW-Results li.selected {
          background-color: #1e3a5f !important;
          border-color: #3b82f6 !important;
        }
      }
      .dark .MR-Widget .MRW-Results {
        background-color: #27272a !important;
        border-color: #3f3f46 !important;
      }
      .dark .MR-Widget .MRW-Result-Item,
      .dark .MR-Widget .MRW-Results li {
        background-color: #18181b !important;
        border-color: #3f3f46 !important;
        color: #e4e4e7 !important;
      }
      .dark .MR-Widget .MRW-Result-Item:hover,
      .dark .MR-Widget .MRW-Results li:hover {
        background-color: #27272a !important;
        border-color: #52525b !important;
      }
      .dark .MR-Widget .MRW-Result-Item.selected,
      .dark .MR-Widget .MRW-Results li.selected {
        background-color: #1e3a5f !important;
        border-color: #3b82f6 !important;
      }

      /* 5. RESULT ITEM DETAILS - Name, address, hours */
      @media (prefers-color-scheme: dark) {
        .MR-Widget .MRW-Result-Name,
        .MR-Widget .MRW-Result-Item h3,
        .MR-Widget .MRW-Result-Item strong {
          color: #f4f4f5 !important;
        }
        
        .MR-Widget .MRW-Result-Address,
        .MR-Widget .MRW-Result-Distance,
        .MR-Widget .MRW-Result-Item .address,
        .MR-Widget .MRW-Result-Item .distance {
          color: #d4d4d8 !important;
        }
        
        .MR-Widget .MRW-Result-Hours,
        .MR-Widget .MRW-Result-Item .hours {
          color: #a1a1aa !important;
        }
      }
      .dark .MR-Widget .MRW-Result-Name,
      .dark .MR-Widget .MRW-Result-Item h3,
      .dark .MR-Widget .MRW-Result-Item strong {
        color: #f4f4f5 !important;
      }
      .dark .MR-Widget .MRW-Result-Address,
      .dark .MR-Widget .MRW-Result-Distance,
      .dark .MR-Widget .MRW-Result-Item .address,
      .dark .MR-Widget .MRW-Result-Item .distance {
        color: #d4d4d8 !important;
      }
      .dark .MR-Widget .MRW-Result-Hours,
      .dark .MR-Widget .MRW-Result-Item .hours {
        color: #a1a1aa !important;
      }

      /* 6. MAP CONTAINER - Google Maps integration */
      @media (prefers-color-scheme: dark) {
        .MR-Widget .MRW-Map {
          background-color: #18181b !important;
          border-color: #3f3f46 !important;
        }
        
        /* Filter Google Maps to dark theme */
        .MR-Widget .MRW-Map iframe,
        .MR-Widget .MRW-Map img {
          filter: invert(0.9) hue-rotate(180deg) brightness(0.9) contrast(0.9);
        }
      }
      .dark .MR-Widget .MRW-Map {
        background-color: #18181b !important;
        border-color: #3f3f46 !important;
      }
      .dark .MR-Widget .MRW-Map iframe,
      .dark .MR-Widget .MRW-Map img {
        filter: invert(0.9) hue-rotate(180deg) brightness(0.9) contrast(0.9);
      }

      /* 7. MAP INFO WINDOW - Popup on map markers */
      @media (prefers-color-scheme: dark) {
        .gm-style .gm-style-iw,
        .gm-style-iw-c {
          background-color: #27272a !important;
          color: #e4e4e7 !important;
        }
        
        .gm-style .gm-style-iw-d {
          color: #e4e4e7 !important;
        }
        
        .gm-style-iw-t::after {
          background: #27272a !important;
        }
        
        /* Info window close button */
        .gm-ui-hover-effect {
          filter: brightness(0.8) !important;
        }
      }
      .dark .gm-style .gm-style-iw,
      .dark .gm-style-iw-c {
        background-color: #27272a !important;
        color: #e4e4e7 !important;
      }
      .dark .gm-style .gm-style-iw-d {
        color: #e4e4e7 !important;
      }
      .dark .gm-style-iw-t::after {
        background: #27272a !important;
      }
      .dark .gm-ui-hover-effect {
        filter: brightness(0.8) !important;
      }

      /* 8. ACTION BUTTONS - Select parcel shop button */
      @media (prefers-color-scheme: dark) {
        .MR-Widget .MRW-Select-Button,
        .MR-Widget .MRW-Result-Item button,
        .MR-Widget .MRW-Result-Select {
          background-color: #16a34a !important;
          color: #ffffff !important;
          border-color: #15803d !important;
        }
        
        .MR-Widget .MRW-Select-Button:hover,
        .MR-Widget .MRW-Result-Item button:hover,
        .MR-Widget .MRW-Result-Select:hover {
          background-color: #15803d !important;
          border-color: #166534 !important;
        }
      }
      .dark .MR-Widget .MRW-Select-Button,
      .dark .MR-Widget .MRW-Result-Item button,
      .dark .MR-Widget .MRW-Result-Select {
        background-color: #16a34a !important;
        color: #ffffff !important;
        border-color: #15803d !important;
      }
      .dark .MR-Widget .MRW-Select-Button:hover,
      .dark .MR-Widget .MRW-Result-Item button:hover,
      .dark .MR-Widget .MRW-Result-Select:hover {
        background-color: #15803d !important;
        border-color: #166534 !important;
      }

      /* 9. LOADING STATE - Spinner and loading indicators */
      @media (prefers-color-scheme: dark) {
        .MR-Widget .MRW-Loading,
        .MR-Widget .loader {
          background-color: rgba(39, 39, 42, 0.8) !important;
          color: #e4e4e7 !important;
        }
        
        .MR-Widget .MRW-Loading-Spinner {
          border-color: #52525b !important;
          border-top-color: #3b82f6 !important;
        }
      }
      .dark .MR-Widget .MRW-Loading,
      .dark .MR-Widget .loader {
        background-color: rgba(39, 39, 42, 0.8) !important;
        color: #e4e4e7 !important;
      }
      .dark .MR-Widget .MRW-Loading-Spinner {
        border-color: #52525b !important;
        border-top-color: #3b82f6 !important;
      }

      /* 10. ERROR MESSAGES - Validation and error states */
      @media (prefers-color-scheme: dark) {
        .MR-Widget .MRW-Error,
        .MR-Widget .error-message {
          background-color: #3f1f1f !important;
          color: #fca5a5 !important;
          border-color: #991b1b !important;
        }
      }
      .dark .MR-Widget .MRW-Error,
      .dark .MR-Widget .error-message {
        background-color: #3f1f1f !important;
        color: #fca5a5 !important;
        border-color: #991b1b !important;
      }

      /* 11. SCROLLBARS - Custom scrollbar styling for results list */
      @media (prefers-color-scheme: dark) {
        .MR-Widget .MRW-Results::-webkit-scrollbar {
          width: 12px;
          background-color: #18181b !important;
        }
        
        .MR-Widget .MRW-Results::-webkit-scrollbar-thumb {
          background-color: #52525b !important;
          border-radius: 6px;
          border: 2px solid #18181b;
        }
        
        .MR-Widget .MRW-Results::-webkit-scrollbar-thumb:hover {
          background-color: #71717a !important;
        }
      }
      .dark .MR-Widget .MRW-Results::-webkit-scrollbar {
        width: 12px;
        background-color: #18181b !important;
      }
      .dark .MR-Widget .MRW-Results::-webkit-scrollbar-thumb {
        background-color: #52525b !important;
        border-radius: 6px;
        border: 2px solid #18181b;
      }
      .dark .MR-Widget .MRW-Results::-webkit-scrollbar-thumb:hover {
        background-color: #71717a !important;
      }

      /* 12. TABS / NAVIGATION - If widget has view mode tabs */
      @media (prefers-color-scheme: dark) {
        .MR-Widget .MRW-Tab,
        .MR-Widget .tabs {
          background-color: #27272a !important;
          border-color: #3f3f46 !important;
        }
        
        .MR-Widget .MRW-Tab-Item,
        .MR-Widget .tab-item {
          background-color: #18181b !important;
          color: #a1a1aa !important;
          border-color: #3f3f46 !important;
        }
        
        .MR-Widget .MRW-Tab-Item.active,
        .MR-Widget .tab-item.active {
          background-color: #27272a !important;
          color: #f4f4f5 !important;
          border-bottom-color: #3b82f6 !important;
        }
      }
      .dark .MR-Widget .MRW-Tab,
      .dark .MR-Widget .tabs {
        background-color: #27272a !important;
        border-color: #3f3f46 !important;
      }
      .dark .MR-Widget .MRW-Tab-Item,
      .dark .MR-Widget .tab-item {
        background-color: #18181b !important;
        color: #a1a1aa !important;
        border-color: #3f3f46 !important;
      }
      .dark .MR-Widget .MRW-Tab-Item.active,
      .dark .MR-Widget .tab-item.active {
        background-color: #27272a !important;
        color: #f4f4f5 !important;
        border-bottom-color: #3b82f6 !important;
      }

      /* 13. DIVIDERS AND SEPARATORS */
      @media (prefers-color-scheme: dark) {
        .MR-Widget hr,
        .MR-Widget .divider,
        .MR-Widget .separator {
          border-color: #3f3f46 !important;
          background-color: #3f3f46 !important;
        }
      }
      .dark .MR-Widget hr,
      .dark .MR-Widget .divider,
      .dark .MR-Widget .separator {
        border-color: #3f3f46 !important;
        background-color: #3f3f46 !important;
      }

      /* 14. LINKS - Anchor elements within widget */
      @media (prefers-color-scheme: dark) {
        .MR-Widget a {
          color: #60a5fa !important;
        }
        
        .MR-Widget a:hover {
          color: #93c5fd !important;
        }
        
        .MR-Widget a:visited {
          color: #a78bfa !important;
        }
      }
      .dark .MR-Widget a {
        color: #60a5fa !important;
      }
      .dark .MR-Widget a:hover {
        color: #93c5fd !important;
      }
      .dark .MR-Widget a:visited {
        color: #a78bfa !important;
      }

      /* 15. DROPDOWN / SELECT MENUS */
      @media (prefers-color-scheme: dark) {
        .MR-Widget select option {
          background-color: #18181b !important;
          color: #e4e4e7 !important;
        }
      }
      .dark .MR-Widget select option {
        background-color: #18181b !important;
        color: #e4e4e7 !important;
      }

      /* 16. FOCUS STATES - Accessibility */
      @media (prefers-color-scheme: dark) {
        .MR-Widget input:focus,
        .MR-Widget select:focus,
        .MR-Widget button:focus {
          outline: 2px solid #3b82f6 !important;
          outline-offset: 2px;
        }
      }
      .dark .MR-Widget input:focus,
      .dark .MR-Widget select:focus,
      .dark .MR-Widget button:focus {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px;
      }

      /* 17. DISABLE STATE - Disabled inputs and buttons */
      @media (prefers-color-scheme: dark) {
        .MR-Widget input:disabled,
        .MR-Widget select:disabled,
        .MR-Widget button:disabled {
          background-color: #27272a !important;
          color: #52525b !important;
          border-color: #3f3f46 !important;
          cursor: not-allowed;
          opacity: 0.6;
        }
      }
      .dark .MR-Widget input:disabled,
      .dark .MR-Widget select:disabled,
      .dark .MR-Widget button:disabled {
        background-color: #27272a !important;
        color: #52525b !important;
        border-color: #3f3f46 !important;
        cursor: not-allowed;
        opacity: 0.6;
      }

      /* 18. TOOLTIPS - Hover information popups */
      @media (prefers-color-scheme: dark) {
        .MR-Widget .tooltip,
        .MR-Widget [data-tooltip] {
          background-color: #18181b !important;
          color: #e4e4e7 !important;
          border: 1px solid #3f3f46 !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5) !important;
        }
      }
      .dark .MR-Widget .tooltip,
      .dark .MR-Widget [data-tooltip] {
        background-color: #18181b !important;
        color: #e4e4e7 !important;
        border: 1px solid #3f3f46 !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5) !important;
      }

      /* 19. BADGES / TAGS - Status indicators (e.g., "Open", "Closed") */
      @media (prefers-color-scheme: dark) {
        .MR-Widget .badge,
        .MR-Widget .tag,
        .MR-Widget .status {
          background-color: #3f3f46 !important;
          color: #e4e4e7 !important;
          border-color: #52525b !important;
        }
        
        .MR-Widget .badge.success,
        .MR-Widget .status.open {
          background-color: #15803d !important;
          color: #dcfce7 !important;
        }
        
        .MR-Widget .badge.error,
        .MR-Widget .status.closed {
          background-color: #991b1b !important;
          color: #fecaca !important;
        }
      }
      .dark .MR-Widget .badge,
      .dark .MR-Widget .tag,
      .dark .MR-Widget .status {
        background-color: #3f3f46 !important;
        color: #e4e4e7 !important;
        border-color: #52525b !important;
      }
      .dark .MR-Widget .badge.success,
      .dark .MR-Widget .status.open {
        background-color: #15803d !important;
        color: #dcfce7 !important;
      }
      .dark .MR-Widget .badge.error,
      .dark .MR-Widget .status.closed {
        background-color: #991b1b !important;
        color: #fecaca !important;
      }

      /* 20. PREVENT FOUC (Flash of Unstyled Content) */
      .MR-Widget {
        transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
      }
      
      .MR-Widget * {
        transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
      }
    `
    document.head.appendChild(style)
  }

  function loadScripts(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if scripts are already loaded globally
      if (window.__MR_WIDGET_SCRIPTS_LOADED__ && window.$) {
        resolve()
        return
      }

      // If jQuery is already present
      if (window.$) {
        loadMRWidget(resolve, reject)
        return
      }

      // Load jQuery first
      const jquery = document.createElement('script')
      jquery.src = 'https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js'
      jquery.onerror = () => reject(new Error('Failed to load jQuery'))
      jquery.onload = () => {
        loadMRWidget(resolve, reject)
      }
      document.body.appendChild(jquery)
    })
  }

  function loadMRWidget(resolve: () => void, reject: (err: Error) => void) {
    // Check if MR widget is already loaded
    if (window.__MR_WIDGET_SCRIPTS_LOADED__) {
      resolve()
      return
    }

    const mr = document.createElement('script')
    mr.src = 'https://widget.mondialrelay.com/parcelshop-picker/jquery.plugin.mondialrelay.parcelshoppicker.min.js'
    mr.onerror = () => reject(new Error('Failed to load Mondial Relay widget'))
    mr.onload = () => {
      window.__MR_WIDGET_SCRIPTS_LOADED__ = true
      resolve()
    }
    document.body.appendChild(mr)
  }

  function initWidget() {
    if (!window.$ || typeof window.$ !== 'function') {
      console.error('[ParcelShopSelector] jQuery not available')
      return
    }

    // Prevent multiple initializations
    if (window.__MR_WIDGET_INITIALIZED__) {
      // Clear previous widget instance
      const zone = document.getElementById('Zone_Widget')
      if (zone) zone.innerHTML = ''
    }

    try {
      const normalizedBrand = normalizeBrandId(brandIdAPI)

      window.$('#Zone_Widget').MR_ParcelShopPicker({
        Target: '#Target_Widget',
        Brand: normalizedBrand,
        Country: defaultCountry,
        PostCode: defaultPostcode,
        ColLivMod: deliveryMode,
        NbResults: String(nbResults),

        ShowResultsOnMap: true,
        DisplayMapInfo: true,

        AllowedCountries: allowedCountries,
        CSS: '1',

        ...(weight && { Weight: weight }),

        OnParcelShopSelected: (data: ParcelShopSelected) => {
          onParcelShopSelected({
            ...data,
            ParcelShopID: targetRef.current?.value ?? '',
          })
        },
      })

      window.__MR_WIDGET_INITIALIZED__ = true
    } catch (err) {
      console.error('[ParcelShopSelector] Failed to initialize widget:', err)
      throw err
    }
  }

  // SSR safety: render nothing if not in browser
  if (!isBrowser()) {
    return null
  }

  // Show error state if configuration is invalid
  if (error) {
    return (
      <div
        style={{
          padding: '1rem',
          border: '1px solid #dc3545',
          borderRadius: '4px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
        }}
      >
        <strong>ParcelShopSelector Error:</strong>
        <p style={{ margin: '0.5rem 0 0 0' }}>{error}</p>
      </div>
    )
  }

  return (
    <>
      <div id="Zone_Widget" className={darkMode ? 'Zone_Widget dark' : 'Zone_Widget'} />
      <input ref={targetRef} id="Target_Widget" className="Target_Widget" />
    </>
  )
}
