# Mobile Responsiveness Guide

This document outlines how PTV-LML is optimized for mobile devices and provides guidelines for maintaining mobile responsiveness when making changes to the application.

## Mobile-First Approach

PTV-LML follows a mobile-first design approach, meaning:

1. The base styles are designed for mobile devices
2. Media queries are used to enhance the layout for larger screens
3. Core functionality is fully accessible on small screens

## Responsive Design Implementation

### TailwindCSS Configuration

The application uses TailwindCSS with custom breakpoints:

```javascript
// tailwind.config.js
module.exports = {
  // ...
  theme: {
    extend: {
      // ...
      screens: {
        'xs': '480px',
        // Tailwind defaults:
        // 'sm': '640px',
        // 'md': '768px',
        // 'lg': '1024px',
        // 'xl': '1280px',
        // '2xl': '1536px',
      },
    },
  },
  // ...
}
```

### Responsive Layout Components

Key responsive components include:

1. **Header/Navigation**:
   - Mobile: Hamburger menu with slide-in navigation
   - Desktop: Horizontal navigation bar

2. **Grid Layouts**:
   - Mobile: Single column
   - Tablet: Two columns
   - Desktop: Three or more columns

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Content */}
</div>
```

3. **Typography**:
   - Smaller font sizes on mobile
   - Larger font sizes on desktop

```jsx
<h1 className="text-2xl font-bold md:text-3xl">Heading</h1>
```

## Touch-Friendly UI Elements

The application is optimized for touch interaction:

1. **Button Sizes**:
   - Minimum touch target size of 44x44 pixels
   - Adequate spacing between interactive elements

2. **Form Elements**:
   - Larger input fields and controls on mobile
   - Custom styling for better touch interaction

3. **Gestures**:
   - Support for swipe gestures where appropriate
   - Intuitive touch interactions

## Viewport Configuration

The application uses the following viewport meta tag:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```

This ensures:
- The width of the page matches the device width
- The initial zoom level is set to 1.0
- Users cannot zoom in/out (for consistent UI experience)

## Testing Mobile Responsiveness

When making changes to the application, test mobile responsiveness by:

1. Using browser developer tools to simulate different device sizes
2. Testing on actual mobile devices when possible
3. Verifying functionality works on both touch and mouse/keyboard interfaces

## Common Mobile Issues to Avoid

1. **Horizontal Overflow**:
   - Always use relative units (%, rem, em) or viewport units (vw, vh)
   - Set `overflow-x: hidden` on container elements when necessary
   - Use `max-width: 100%` for images and media

2. **Touch Target Size**:
   - Ensure buttons and links are large enough to tap (min 44x44px)
   - Provide adequate spacing between interactive elements

3. **Text Readability**:
   - Use a minimum font size of 16px for body text
   - Ensure sufficient contrast between text and background
   - Avoid long paragraphs on mobile

4. **Performance**:
   - Optimize images and assets for mobile bandwidth
   - Implement code splitting to reduce initial load time
   - Minimize JavaScript execution on mobile

## Mobile-Specific Features

The application includes features specifically designed for mobile users:

1. **Location-Based Services**:
   - Integration with device geolocation
   - Finding nearby stops and events

2. **Offline Support**:
   - Client-side caching of route and stop data
   - Graceful degradation when offline

3. **Performance Optimization**:
   - Lazy loading of images and components
   - Reduced animations on low-power devices

## Maintaining Mobile Responsiveness

When adding new features or components:

1. Always start with mobile layout first
2. Test on multiple screen sizes before committing changes
3. Use Tailwind's responsive utility classes consistently
4. Consider touch interaction for all interactive elements
5. Optimize performance for mobile devices
