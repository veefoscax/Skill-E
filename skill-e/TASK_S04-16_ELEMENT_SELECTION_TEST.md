# Task S04-16: Element Selection Test

## Overview
Testing element selection functionality that captures element information, generates selectors, and captures screenshots when clicking on elements in element picker mode.

## Requirements
- FR-4.22: Generate CSS selector (prefer ID, data-testid)
- FR-4.23: Generate XPath as fallback
- FR-4.24: Capture element screenshot

## Test URL
Navigate to: `http://localhost:1420/#/element-selection-test`

## Test Instructions

### 1. Enable Element Picker
- Click the "Enable Element Picker" button
- Verify the button changes to "🎯 Element Picker Active"
- Verify a blue indicator appears at the top center saying "Element Picker Active"
- Verify the indicator shows "Press E to exit"

### 2. Test Element Highlighting
- Hover over the test elements on the page
- Verify each element gets a red outline when hovered
- Verify a tooltip appears above the element showing:
  - Tag name (e.g., "div")
  - Text content (if any)
  - CSS selector
  - Element dimensions

### 3. Test Element Selection - ID Priority
- Click on the element labeled "Element with ID: #test-button-1"
- Verify the element flashes green briefly
- Verify it appears in the "Selected Elements" section below
- Verify the CSS selector is: `#test-button-1`
- Verify XPath is generated
- Verify a screenshot is captured and displayed

### 4. Test Element Selection - data-testid Priority
- Click on the element labeled "Element with data-testid: submit-form"
- Verify it appears in the "Selected Elements" section
- Verify the CSS selector is: `[data-testid="submit-form"]`
- Verify XPath is generated
- Verify a screenshot is captured

### 5. Test Element Selection - Unique Class
- Click on the element labeled "Element with unique class"
- Verify the CSS selector is: `.unique-test-element`
- Verify XPath is generated
- Verify a screenshot is captured

### 6. Test Element Selection - Nested Element
- Click on the nested element (yellow background)
- Verify the CSS selector uses nth-child notation
- Verify XPath is generated with position-based indexing
- Verify a screenshot is captured

### 7. Test Different Element Types
- Click on the "Click Me Button" button
- Verify button element is captured correctly
- Click on the input field
- Verify input element is captured correctly

### 8. Test Screenshot Capture
For each selected element, verify:
- Screenshot shows the actual element appearance
- Screenshot is displayed in the "Selected Elements" section
- Screenshot has reasonable quality (not blurry)
- Screenshot shows "✅ Screenshot captured successfully"

### 9. Test Element Information
For each selected element, verify the following information is captured:
- **Tag name**: Correct HTML tag (div, button, input, etc.)
- **CSS Selector**: Follows priority (ID > data-testid > unique class > nth-child)
- **XPath**: Absolute path from root
- **Text content**: Visible text inside the element
- **Position**: x, y, width, height in pixels
- **Timestamp**: Time when element was selected

### 10. Test Toggle Off
- Press the `E` key on your keyboard
- Verify element picker is disabled
- Verify the blue indicator disappears
- Verify hovering over elements no longer highlights them
- Verify clicking on elements no longer selects them

### 11. Test Clear Selected Elements
- Enable element picker again
- Select a few elements
- Click "Clear Selected Elements" button
- Verify all selected elements are removed from the list
- Verify the counter shows (0)

### 12. Test Storage with Recording
- Open browser console (F12)
- Enable element picker and select an element
- Check console for log: "Element selected: {element data}"
- Verify the element is stored in the overlay store
- Verify selectedElements array contains the element

## Expected Results

### ✅ Pass Criteria
- [ ] Element picker can be toggled on/off with button and E key
- [ ] Elements highlight with red outline on hover
- [ ] Tooltip shows element information on hover
- [ ] Clicking element captures all required information
- [ ] CSS selector follows priority: ID > data-testid > unique class > nth-child
- [ ] XPath is generated for all elements
- [ ] Screenshots are captured successfully
- [ ] Selected elements are stored in overlay store
- [ ] Multiple elements can be selected
- [ ] Selected elements can be cleared
- [ ] Element picker can be toggled off

### ❌ Fail Criteria
- Element picker doesn't enable/disable
- Elements don't highlight on hover
- Clicking element doesn't capture information
- CSS selector is incorrect or missing
- XPath is incorrect or missing
- Screenshot fails to capture
- Selected elements not stored in store

## Troubleshooting

### Issue: Screenshot not capturing
**Possible causes:**
- html2canvas library not loaded
- CORS issues with images in the element
- Element is hidden or has zero dimensions

**Solution:**
- Check browser console for errors
- Verify html2canvas is installed: `pnpm list html2canvas`
- Try selecting simpler elements without images

### Issue: Element picker not highlighting
**Possible causes:**
- CSS not injected properly
- Z-index conflicts
- Pointer events not working

**Solution:**
- Check browser console for errors
- Inspect element to verify .skill-e-highlight class is applied
- Check if other overlays are blocking mouse events

### Issue: CSS selector not following priority
**Possible causes:**
- Element has ID but selector uses class
- data-testid not detected

**Solution:**
- Inspect the element in browser DevTools
- Verify ID and data-testid attributes are present
- Check generateCSSSelector function logic

## Implementation Status

### ✅ Completed
- Element picker toggle functionality
- Element highlighting on hover
- CSS selector generation (ID > data-testid > unique class > nth-child)
- XPath generation
- Element screenshot capture with html2canvas
- Element information capture (tag, text, position)
- Storage in overlay store
- Visual feedback (flash on selection)
- Tooltip with element information
- Clear selected elements functionality

### 📝 Notes
- html2canvas is already installed as a dependency
- Screenshot capture is asynchronous and may take a moment
- Element picker uses capture phase for click events to prevent interference
- Selected elements are stored with timestamp for ordering

## Next Steps
After verifying all tests pass:
1. Mark task 16 as complete
2. Update DEVLOG.md with completion status
3. Proceed to Phase 6: State Management (if not already complete)
