<div align='center'>
    <img src="doc/package.webp" height="128">
    <h1 align='center'>mondial-relay</h1>
</div>

<div align="center">
    <img src=https://img.shields.io/badge/Created_by-Tom_Blanchet-blue?color=FED205&style=for-the-badge>
    <img src=https://img.shields.io/badge/Maintained%20%3F-yes-green.svg?style=for-the-badge>
</div>
 
<div align="center">
    <img src=https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white>
    <img src=https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB>
</div>
 
<div align="center">
    <a href='https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=&cad=rja&uact=8&ved=2ahUKEwiFmq2GueKEAxXf_7sIHcONCvcQFnoECBEQAQ&url=https%3A%2F%2Ffr.linkedin.com%2Fin%2Ftom-blanchet&usg=AOvVaw2NyolXUeo7ja8PpF4VNmHt&opi=89978449'>
    <img src=https://img.shields.io/badge/Tom_Blanchet-0077B5?logo=linkedin&logoColor=white&style=for-the-badge>
    </a>
</div>

```
An unofficial package that allows you to interact with MondialRelay's API in NodeJS and Typescript.
```

This package provides functions for easy interaction with MondialRelay without having to setup a Prestashop or any ecommerce module, along with a React component to integrate the MondialRelay parcel shop selector. Handy !

# Install

```bash
npm install @polarisdev/mondial-relay
```

# ✨ Features

> You must have an account at [Mondial Relay connect hub](https://connect.mondialrelay.com) to obtain the values required to successfully request Mondial Relay's WebService. You can create an account [here](https://www.mondialrelay.fr/connexion-inscription/).

This package exports various utilities to help you develop an application that communicates with Mondial Relay. The features are separated in two modules: `client` (React component) and `server` (SOAP concerned functions for API v1, REST for API v2). This way, the server imports won't mess with the client code (which can lead to problems in a React application for example).

This package's utilities are separated in three functional domains:

- Client-side only function _(e.g. a React component, needing browser environment)_
- Server-side only function _(e.g. SOAP functions, which require access to fs)_
- Functions available on both environment

## Client

This package exports a React component ready to be integrated on a webpage so that the user can select the relay point they wish. **The component is fully compatible with Next.js App Router and SSR-safe.**

### Next.js App Router Usage (Recommended)

**Important:** The `ParcelShopSelector` component is a client-only component. It must be used in a Client Component (with `'use client'` directive).

#### Basic Example

```tsx
'use client'

import { useState } from 'react'

import { ParcelShopSelector } from '@polarisdev/mondial-relay/browser'
import type { ParcelShopID, ParcelShopSelected } from '@polarisdev/mondial-relay/types'

export default function MondialRelayMapSelector() {
  const [parcelShop, setParcelShop] = useState<(ParcelShopSelected & ParcelShopID) | null>(null)

  return (
    <div>
      <ParcelShopSelector
        brandIdAPI="BDTEST" // automatically normalized to "BDTEST  " (8 chars)
        onParcelShopSelected={setParcelShop}
      />
      {parcelShop && (
        <div>
          <h3>Selected: {parcelShop.Nom}</h3>
          <p>ID: {parcelShop.ParcelShopID}</p>
        </div>
      )}
    </div>
  )
}
```

#### Advanced Example with All Options

```tsx
'use client'

import { ParcelShopSelector } from '@polarisdev/mondial-relay/browser'

export default function AdvancedSelector() {
  return (
    <ParcelShopSelector
      weight={3000} // Package weight in grams (optional)
      nbResults={7} // Number of results (default: 7)
      deliveryMode="24R" // Delivery mode (default: "24R")
      brandIdAPI="BDTEST" // Your Brand ID - automatically padded to 8 chars
      defaultCountry="FR" // Default country (default: "FR")
      defaultPostcode="59000" // Default postal code (default: "59000")
      allowedCountries="FR,BE" // Allowed countries (default: "FR")
      darkMode={false} // Enable dark mode (optional, also auto-detects via prefers-color-scheme)
      onParcelShopSelected={data => {
        console.log('Selected parcel shop:', data)
        // data contains: CP, ID, Nom, Pays, Ville, Adresse1, Adresse2, ParcelShopID
      }}
    />
  )
}
```

### Configuration Best Practices

#### Brand ID Normalization

**The most common bug** is providing an incorrect Brand ID. Mondial Relay requires exactly 8 characters.

✅ **Good news:** This library automatically normalizes your Brand ID!

```typescript
brandIdAPI = 'BDTEST' // ✅ Automatically becomes "BDTEST  "
brandIdAPI = 'CC12345' // ✅ Automatically becomes "CC12345 "
brandIdAPI = 'ABCDEFGH' // ✅ Already 8 chars, used as-is
```

⚠️ **What fails (with helpful error messages):**

```typescript
brandIdAPI = '' // ❌ Error: brandIdAPI cannot be empty
brandIdAPI = 'TOOLONGID' // ❌ Error: brandIdAPI must be at most 8 characters
```

#### Delivery Modes

Supported values: `'LCC'`, `'HOM'`, `'24R'`, `'24L'`, `'XOH'`

- Default: `'24R'` (24h relay point delivery)
- Invalid modes will trigger a console warning and fallback to `'24R'`

### Server vs Client Components

**Server Component (NOT SUPPORTED):**

```tsx
// ❌ This will NOT work - causes hydration errors
import { ParcelShopSelector } from '@polarisdev/mondial-relay/browser'

export default function ServerPage() {
  return <ParcelShopSelector {...} /> // ❌ Error!
}
```

**Client Component (SUPPORTED):**

```tsx
// ✅ This works perfectly
'use client'

import { ParcelShopSelector } from '@polarisdev/mondial-relay/browser'

export default function ClientPage() {
  return <ParcelShopSelector {...} /> // ✅ Works!
}
```

**Using in Server Component (Extract to Client Component):**

```tsx
// app/page.tsx (Server Component)
import MondialRelaySelector from './MondialRelaySelector' // Client Component

export default function Page() {
  return (
    <div>
      <h1>Choose your relay point</h1>
      <MondialRelaySelector />
    </div>
  )
}

// app/MondialRelaySelector.tsx (Client Component)
'use client'

import { ParcelShopSelector } from '@polarisdev/mondial-relay/browser'

export default function MondialRelaySelector() {
  return <ParcelShopSelector brandIdAPI="BDTEST" onParcelShopSelected={...} />
}
```

### Robustness Features

This component includes several hardening improvements:

1. **SSR Safety**: Renders `null` during server-side rendering
2. **Script Loading**: jQuery and Mondial Relay widget loaded once globally
3. **Idempotent**: Safe to remount without duplicate script loads
4. **Error Handling**: Clear error messages for invalid configurations
5. **Cleanup**: Proper DOM cleanup on component unmount
6. **TypeScript**: Full type safety for all widget callbacks

### Dark Mode Support 🌙

The `ParcelShopSelector` component includes comprehensive dark mode support with two activation methods:

1. **Automatic Detection**: Responds to OS-level dark mode via `prefers-color-scheme`
2. **Manual Toggle**: Control via the `darkMode` prop

#### Automatic Dark Mode

```tsx
'use client'

import { ParcelShopSelector } from '@polarisdev/mondial-relay/browser'

export default function Selector() {
  // Automatically detects system dark mode preference
  return <ParcelShopSelector brandIdAPI="BDTEST" onParcelShopSelected={data => console.log(data)} />
}
```

#### Manual Dark Mode Toggle

```tsx
'use client'

import { useState } from 'react'

import { ParcelShopSelector } from '@polarisdev/mondial-relay/browser'

export default function Selector() {
  const [isDark, setIsDark] = useState(false)

  return (
    <>
      <button onClick={() => setIsDark(!isDark)}>Toggle Dark Mode</button>
      <ParcelShopSelector brandIdAPI="BDTEST" darkMode={isDark} onParcelShopSelected={data => console.log(data)} />
    </>
  )
}
```

#### Integration with Theme Providers

Works seamlessly with popular theme libraries like `next-themes`:

```tsx
'use client'

import { ParcelShopSelector } from '@polarisdev/mondial-relay/browser'

import { useTheme } from 'next-themes'

export default function Selector() {
  const { theme } = useTheme()

  return (
    <ParcelShopSelector
      brandIdAPI="BDTEST"
      darkMode={theme === 'dark'}
      onParcelShopSelected={data => console.log(data)}
    />
  )
}
```

**Features:**

- ✅ WCAG AA compliant contrast ratios
- ✅ Smooth transitions between light/dark modes
- ✅ Styled map integration with dark filters
- ✅ No flash of unstyled content (FOUC)
- ✅ Mobile-responsive design preserved
- ✅ Full accessibility maintained

For detailed implementation notes, see [DARK_MODE_IMPLEMENTATION.md](./DARK_MODE_IMPLEMENTATION.md).

### Troubleshooting

**Widget not appearing?**

- Ensure you're using `'use client'` directive
- Check console for error messages
- Verify your Brand ID is correct

**Script load errors?**

- Check network connectivity
- Verify jQuery and MR widget URLs are accessible
- Check browser console for specific error messages

**Configuration errors?**

- All configuration errors are displayed inline with clear messages
- Check console for detailed error information

## Server

❗️**IMPORTANT**: because Mondial Relay does not provide a separated test environement, the library sends requests to the **production** Mondial Relay API endpoint. Be sure to use test credentials for your development stage !

### Create shipment 📤

Here is how to create a shipment and get an etiquette back:

```typescript
import createShipment from '@polarisdev/mondial-relay/node'
import { CreateShipmentResponse } from '@polarisdev/mondial-relay/types'

const data: CreateShipmentResponse = await createShipment({
  // check out examples/createShipment for a complete example of
  // the object that should be passed to this function
  //
  // the parameters you pass are validated by Yup so that you are
  // sure you send correct data to Mondial Relay
})

const { rawResponse, isSandbox, sendingNumber, etiquetteLink } = data
```

To try this function, fill the `Login` and `Password` fields in `/examples/createShipment.ts` with your own keys, then run `npm run demo:create_shipment` to test for your environment.

#### Known bugs

In case you encounter the error `An error happened: "Service_Expedition_EchecRecuperationTarif".`, the fix might be to change the `CollectionMode`from `CCC` to `REL`:

```js
CollectionMode: {
  Mode: 'REL'
}
```

Errors coming from MondialRelay API are often cryptic and hard to understand 🤷🏼‍♂️

### API v1 👴🏼

These are all the functions made available by the Mondial Relay's API v1, using SOAP.
Here is an exhaustive list of the actions you can trigger using this library:

- `getLabels`: get labels
- `createLabel`: create a label
- `getTracking`: get the current tracking for a package
- `getStatMessage`: get statistic message
- `searchZipCodes`: search relay points by zip code
- `searchPointsRelais`: search relay points by zip code

For example:

```typescript
import { getLabels, getTracking } from '@polarisdev/mondial-relay/node'

getLabels().then(labels => console.log(labels))
getTracking().then(trackingInfos => console.log(trackingInfos.Relais_Libelle))
```

### Generate XML

The package exports a little utilitary to transform an object to a XML string, This function is used to generate the XML to be sent to Mondial Relay's API.

```ts
import { generateXML } from '@polarisdev/mondial-relay/node'

const data = {
  // your object
}

const xml = generateXML(data)
```

## Client and server

Functions made available both for client and server environment.

### Get delivery price (including VAT) 🚛

The `getDeliveryPrice` function allows you to calculate your delivery price, based on the destination's country and the package's weight. Please take into consideration that:

1. **Prices are based on professional delivery's price schedule**. There is currently no method to calculate the delivery price for a private individual.
2. Mondial Relay delivers from France to European countries. Therefore, **you cannot calculate delivery price from a country other than France**.

Here is an example of how to get your delivery price (VAT included):

```typescript
import { getDeliveryPrice } from '@polarisdev/mondial-relay'

const deliveryPrice = getDeliveryPrice(
  3000, // the weight in grams
  'FR', // the destination country
)
```

---

## Migration Guide (v1.2.x → v2.0.0)

### Breaking Changes

**`brandIdAPI` is now optional with automatic normalization**

Before (v1.2.x):

```tsx
// You had to manually pad to 8 characters
<ParcelShopSelector brandIdAPI="BDTEST  " {...} />
```

After (v2.0.0):

```tsx
// Automatic normalization - just provide the ID
<ParcelShopSelector brandIdAPI="BDTEST" {...} />

// Or omit entirely to use test default
<ParcelShopSelector onParcelShopSelected={...} />
```

### Non-Breaking Improvements

- ✅ Fully SSR-safe for Next.js App Router
- ✅ Better TypeScript types
- ✅ Improved error messages
- ✅ Idempotent script loading
- ✅ Proper cleanup on unmount
- ✅ Inline error display for invalid config

**No other API changes required** - existing code continues to work!

---

### Support

You can create an issue on this project and I will gladly consider it.
If you prefer, you can contact me on my Linkedin or directly by email (contact@tomblanchet.fr).

### Credit

API v1 integration was heavily influenced by [this code](https://github.com/nooqta/mondial-relay-api). Thank you for your work.

_Tom Blanchet - 2025_
