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
      .Zone_Widget > div { width: 100%; }
      .Target_Widget { visibility: hidden; position: absolute; pointer-events: none; }

      @media (max-width: 425px) {
        .MR-Widget .MRW-Results {
          height: unset !important;
        }
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
      <div id="Zone_Widget" className="Zone_Widget" />
      <input ref={targetRef} id="Target_Widget" className="Target_Widget" />
    </>
  )
}
