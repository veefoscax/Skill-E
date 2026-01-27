# Task S04-15: Element Highlighting Test

## Overview
Tests the element highlighting functionality when element picker is enabled.

**Requirements**: FR-4.21
- Inject highlight CSS into page
- Highlight element on hover
- Show selector tooltip

## Implementation Summary

### Files Created/Modified

1. **skill-e/src/components/Overlay/ElementSelector.tsx** (Modified)
   - Added hover tracking with mousemove event listener
   - Injects CSS for element highlighting
   - Shows tooltip with selector information
   - Removes highlights when disabled

2. **skill-e/src/lib/overlay/element-selector.ts** (Created)
   - `generateCSSSelector()` - Generates CSS selector for elements
   - `generateXPath()` - Generates XPath for elements
   - `getElementInfo()` - Captures comprehensive element information
   - `isElementVisible()` - Checks if element is visible
   - `findElement()` - Finds element by CSS selector
   - `findElementByXPath()` - Finds element by XPath

3. **skill-e/src/components/ElementHighlightingTest.tsx** (Created)
   - Comprehensive test component for element highlighting
   - Test elements with various selector types
   - Real-time display of hovered element info

4. **skill-e/src/App.tsx** (Modified)
   - Added route for element highlighting test page

## Test Instructions

### Running the Test

1. **Start the development server**:
   ```bash
   cd skill-e
   pnpm run dev
   ```

2. **Open the test page**:
   - Navigate to: `http://localhost:1420/#/element-highlighting-test`

### Manual Testing Steps

#### Test 1: Enable Element Picker
1. Click "Enable Element Picker" button
2. ✅ Verify blue indicator appears at top center: "Element Picker Active"
3. ✅ Verify indicator shows "Press E to exit" hint

#### Test 2: CSS Injection
1. With element picker enabled, click "Check Highlight CSS"
2. ✅ Verify result shows: "Highlight CSS injected into page"
3. Open browser DevTools → Elements → `<head>`
4. ✅ Verify `<style id="skill-e-element-highlight">` exists

#### Test 3: Element Highlighting
1. Hover over the "Element with ID" test element
2. ✅ Verify element gets red outline (2px solid)
3. ✅ Verify element has semi-transparent red background
4. ✅ Verify outline has pulsing animation

#### Test 4: Selector Tooltip
1. Hover over the "Element with ID" test element
2. ✅ Verify tooltip appears above the element
3. ✅ Verify tooltip shows:
   - Tag name (e.g., "div")
   - CSS selector (e.g., "#test-element-with-id")
   - Element dimensions (e.g., "800 × 60px")
4. ✅ Verify tooltip has dark background with white text

#### Test 5: Hover Detection
1. Hover over different test elements
2. Click "Check Hovered Element" button
3. ✅ Verify result shows current element tag and selector
4. ✅ Verify "Currently Hovered Element" panel updates in real-time

#### Test 6: Selector Generation
Test different selector strategies:

**Element with ID**:
- Hover over "Element with ID"
- ✅ Verify CSS selector is: `#test-element-with-id`

**Element with data-testid**:
- Hover over "Element with data-testid"
- ✅ Verify CSS selector is: `[data-testid="test-button"]`

**Element with unique class**:
- Hover over "Element with unique class"
- ✅ Verify CSS selector is: `.unique-test-class`

**Nested elements**:
- Hover over one of the yellow buttons
- ✅ Verify CSS selector uses nth-child (e.g., `button:nth-child(1)`)

#### Test 7: Tooltip Positioning
1. Hover over elements at different screen positions
2. ✅ Verify tooltip always appears above the element
3. ✅ Verify tooltip doesn't block the element

#### Test 8: Multiple Elements
1. Hover over the nested buttons (Button 1, 2, 3)
2. ✅ Verify only the hovered button is highlighted
3. ✅ Verify previous highlight is removed when hovering new element

#### Test 9: Disable Element Picker
1. Click "Disable Element Picker" button
2. ✅ Verify blue indicator disappears
3. ✅ Verify all highlights are removed
4. ✅ Verify tooltip disappears
5. Open DevTools → Elements → `<head>`
6. ✅ Verify `<style id="skill-e-element-highlight">` is removed

#### Test 10: Crosshair Cursor
1. Enable element picker
2. ✅ Verify cursor changes to crosshair when hovering over elements

## Expected Behavior

### CSS Injection
- Highlight CSS is injected into `<head>` when element picker is enabled
- CSS includes `.skill-e-highlight` class with:
  - Red outline (2px solid #FF4444)
  - Semi-transparent red background (rgba(255, 68, 68, 0.1))
  - Pulsing animation
  - Crosshair cursor

### Element Highlighting
- Elements are highlighted on hover with red outline
- Only one element is highlighted at a time
- Previous highlight is removed when hovering new element
- Highlights are removed when element picker is disabled

### Selector Tooltip
- Tooltip appears above hovered element
- Shows tag name, CSS selector, and dimensions
- Tooltip follows the hovered element
- Tooltip has dark background with white text
- Tooltip is pointer-events: none (doesn't block interaction)

### Selector Generation
- Prefers ID selector (#id)
- Falls back to data-testid ([data-testid="value"])
- Falls back to unique class (.class)
- Falls back to nth-child path (tag:nth-child(n) > tag:nth-child(n))

### Cleanup
- All highlights removed when disabled
- CSS removed from DOM when disabled
- Event listeners cleaned up properly

## Acceptance Criteria

- [x] Inject highlight CSS into page when element picker is enabled
- [x] Highlight element on hover with red outline and background
- [x] Show selector tooltip above hovered element
- [x] Tooltip displays tag name, CSS selector, and dimensions
- [x] Generate CSS selector using ID, data-testid, class, or nth-child
- [x] Generate XPath for elements
- [x] Remove highlights when element picker is disabled
- [x] Remove CSS from DOM when element picker is disabled
- [x] Crosshair cursor when element picker is active

## Notes

- The highlighting uses CSS injection for performance
- The tooltip is positioned absolutely above the element
- The selector generation prefers unique identifiers (ID, data-testid)
- The XPath generation uses position-based indexing
- The implementation is ready for Task 16 (Element Selection)

## Next Steps

After verifying this task:
1. Proceed to Task 16: Element Selection
   - Click captures element info
   - Generate CSS selector and XPath
   - Capture element screenshot
   - Store with recording
