# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-02-03

### 🚀 Major Improvements

#### Next.js App Router Compatibility

- **SSR Safety**: Component now renders `null` during server-side rendering, preventing hydration errors
- **Idempotent Script Loading**: jQuery and Mondial Relay widget scripts load only once globally, even with route changes
- **Proper Cleanup**: DOM elements are properly cleaned up on component unmount
- **Client-Only**: Component is explicitly client-only with comprehensive documentation

#### Brand ID Normalization (Breaking Change)

- **Automatic Padding**: Brand IDs are now automatically normalized to 8 characters
- **Optional Parameter**: `brandIdAPI` is now optional, defaulting to `"BDTEST"`
- **Validation**: Clear error messages when brand ID is invalid (too long or empty)
- **Fixes Most Common Bug**: No more manual padding required - `"BDTEST"` → `"BDTEST  "`

#### Developer Experience

- **Strong TypeScript Types**: Added comprehensive type definitions for widget callbacks
- **Better Error Messages**: Invalid configurations now show inline error UI with helpful messages
- **Safe Defaults**: All parameters have sensible defaults (deliveryMode, country, postcode, etc.)
- **Validation**: Delivery mode validation with console warnings for invalid values

#### Documentation

- **Next.js Guide**: Comprehensive guide for Next.js App Router usage
- **Migration Guide**: Clear migration path from v1.2.x to v2.0.0
- **Troubleshooting**: Common issues and solutions documented
- **Examples**: Added `examples/nextjs-app-router.tsx` with complete working example

### 🔧 Technical Changes

#### Added

- `src/browser/ParcelShopSelector/utils.ts`: Brand normalization and validation utilities
- `src/browser/ParcelShopSelector/types.ts`: Strong TypeScript types for widget
- `examples/nextjs-app-router.tsx`: Complete Next.js App Router example
- Global window flags: `__MR_WIDGET_SCRIPTS_LOADED__` and `__MR_WIDGET_INITIALIZED__`
- Error state rendering with inline error display

#### Changed

- `brandIdAPI` prop is now optional (default: `"BDTEST"`)
- Widget initialization now validates configuration before loading scripts
- Script loading uses promise-based approach with proper error handling
- Component uses multiple `useEffect` hooks for better separation of concerns
- Hidden input now has `position: absolute` and `pointer-events: none` for better accessibility

#### Fixed

- Multiple widget initialization on route changes
- Script loading race conditions
- Duplicate jQuery loading
- SSR hydration mismatches
- Memory leaks from improper cleanup

### 📦 Breaking Changes

1. **`brandIdAPI` is now optional**

   - Before: `<ParcelShopSelector brandIdAPI="BDTEST  " />`
   - After: `<ParcelShopSelector brandIdAPI="BDTEST" />` or omit entirely

2. **Automatic brand ID normalization**
   - The library now automatically pads brand IDs to 8 characters
   - No need to manually add spaces
   - Invalid brand IDs throw errors with clear messages

### 🔄 Migration Guide

**From v1.2.x to v2.0.0:**

```tsx
// Before (v1.2.x)
<ParcelShopSelector
  brandIdAPI="BDTEST  " // Manual padding required
  onParcelShopSelected={handler}
/>

// After (v2.0.0)
<ParcelShopSelector
  brandIdAPI="BDTEST" // Automatic padding
  onParcelShopSelected={handler}
/>

// Or use the default
<ParcelShopSelector
  onParcelShopSelected={handler}
/>
```

**No other changes required** - all existing code continues to work!

### 🎯 Recommended Version Bump

**2.0.0** - Major version due to:

- Breaking API change (brandIdAPI now optional)
- Significant architectural improvements
- Enhanced Next.js App Router compatibility
- This is a production-ready release with substantial improvements

### 🙏 Credits

Improvements based on production feedback and Next.js App Router best practices.

---

## [1.2.56] - Previous Release

Previous stable release with basic Next.js support.
