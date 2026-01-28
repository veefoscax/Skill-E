import { useOverlayStore, COLORS, getColorHex, redactPassword } from '../stores/overlay';

/**
 * Test component for overlay store functionality
 * Tests all store actions and state management
 */
export function OverlayStoreTest() {
  const store = useOverlayStore();

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Overlay Store Test</h1>

      {/* Overlay Status */}
      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="text-xl font-semibold">Overlay Status</h2>
        <div className="flex gap-2">
          <button
            onClick={store.activate}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Activate
          </button>
          <button
            onClick={store.deactivate}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Deactivate
          </button>
          <button
            onClick={store.reset}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Reset All
          </button>
        </div>
        <p>Active: <strong>{store.isActive ? 'Yes' : 'No'}</strong></p>
      </section>

      {/* Click Tracking */}
      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="text-xl font-semibold">Click Tracking</h2>
        <div className="flex gap-2">
          <button
            onClick={() => store.addClick({ x: Math.random() * 500, y: Math.random() * 500 })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Random Click
          </button>
          <button
            onClick={store.clearClicks}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Clicks
          </button>
        </div>
        <p>Total Clicks: <strong>{store.clicks.length}</strong></p>
        <p>Click Counter: <strong>{store.clickCounter}</strong></p>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {store.clicks.map((click) => (
            <div key={click.id} className="flex items-center gap-2 text-sm">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: getColorHex(click.color) }}
              >
                {click.number}
              </span>
              <span>Position: ({Math.round(click.position.x)}, {Math.round(click.position.y)})</span>
              <span>State: {click.fadeState}</span>
              <button
                onClick={() => store.removeClick(click.id)}
                className="ml-auto px-2 py-1 bg-red-400 text-white text-xs rounded"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Drawing Tools */}
      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="text-xl font-semibold">Drawing Tools</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => store.addDrawing({
              type: 'dot',
              color: store.currentColor,
              startPoint: { x: Math.random() * 500, y: Math.random() * 500 },
              isPinned: store.isPinMode,
            })}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Add Dot
          </button>
          <button
            onClick={() => store.addDrawing({
              type: 'arrow',
              color: store.currentColor,
              startPoint: { x: 100, y: 100 },
              endPoint: { x: 200, y: 200 },
              isPinned: store.isPinMode,
            })}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Add Arrow
          </button>
          <button
            onClick={() => store.addDrawing({
              type: 'rectangle',
              color: store.currentColor,
              startPoint: { x: 50, y: 50 },
              endPoint: { x: 150, y: 100 },
              isPinned: store.isPinMode,
            })}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Add Rectangle
          </button>
          <button
            onClick={store.clearDrawings}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Drawings
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <span>Current Color:</span>
          {(['COLOR_1', 'COLOR_2', 'COLOR_3'] as const).map((color) => (
            <button
              key={color}
              onClick={() => store.setColor(color)}
              className={`w-8 h-8 rounded border-2 ${
                store.currentColor === color ? 'border-black' : 'border-gray-300'
              }`}
              style={{ backgroundColor: COLORS[color] }}
            />
          ))}
          <button
            onClick={store.cycleColor}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cycle
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={store.togglePinMode}
            className={`px-4 py-2 rounded ${
              store.isPinMode
                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            Pin Mode: {store.isPinMode ? 'ON' : 'OFF'}
          </button>
        </div>
        <p>Total Drawings: <strong>{store.drawings.length}</strong></p>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {store.drawings.map((drawing) => (
            <div key={drawing.id} className="flex items-center gap-2 text-sm">
              <span
                className="w-4 h-4 rounded"
                style={{ backgroundColor: getColorHex(drawing.color) }}
              />
              <span>{drawing.type}</span>
              <span>{drawing.isPinned ? '📌 Pinned' : '⏱️ Fading'}</span>
              <span>State: {drawing.fadeState}</span>
              <button
                onClick={() => store.removeDrawing(drawing.id)}
                className="ml-auto px-2 py-1 bg-red-400 text-white text-xs rounded"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Keyboard Display */}
      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="text-xl font-semibold">Keyboard Display</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => store.setKeyboardModifiers({ ctrl: !store.keyboard.modifiers.ctrl })}
            className={`px-3 py-1 rounded ${
              store.keyboard.modifiers.ctrl ? 'bg-blue-500 text-white' : 'bg-gray-300'
            }`}
          >
            Ctrl
          </button>
          <button
            onClick={() => store.setKeyboardModifiers({ shift: !store.keyboard.modifiers.shift })}
            className={`px-3 py-1 rounded ${
              store.keyboard.modifiers.shift ? 'bg-blue-500 text-white' : 'bg-gray-300'
            }`}
          >
            Shift
          </button>
          <button
            onClick={() => store.setKeyboardModifiers({ alt: !store.keyboard.modifiers.alt })}
            className={`px-3 py-1 rounded ${
              store.keyboard.modifiers.alt ? 'bg-blue-500 text-white' : 'bg-gray-300'
            }`}
          >
            Alt
          </button>
          <button
            onClick={() => store.setKeyboardModifiers({ meta: !store.keyboard.modifiers.meta })}
            className={`px-3 py-1 rounded ${
              store.keyboard.modifiers.meta ? 'bg-blue-500 text-white' : 'bg-gray-300'
            }`}
          >
            Meta
          </button>
        </div>
        <div className="space-y-2">
          <input
            type="text"
            value={store.keyboard.currentText}
            onChange={(e) => store.setKeyboardText(e.target.value, false)}
            placeholder="Type text..."
            className="w-full px-3 py-2 border rounded"
          />
          <input
            type="password"
            value={store.keyboard.currentText}
            onChange={(e) => store.setKeyboardText(e.target.value, true)}
            placeholder="Type password..."
            className="w-full px-3 py-2 border rounded"
          />
          <button
            onClick={store.clearKeyboardText}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Text
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={store.toggleKeyboardDisplay}
            className={`px-4 py-2 rounded ${
              store.keyboard.isVisible
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            Display: {store.keyboard.isVisible ? 'Visible' : 'Hidden'}
          </button>
          <select
            value={store.keyboard.displayPosition}
            onChange={(e) => store.setKeyboardPosition(e.target.value as any)}
            className="px-3 py-2 border rounded"
          >
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-right">Bottom Right</option>
            <option value="top-left">Top Left</option>
            <option value="top-right">Top Right</option>
          </select>
        </div>
        <div className="p-3 bg-gray-100 rounded">
          <p>Current Text: <strong>{store.keyboard.currentText}</strong></p>
          <p>Is Password: <strong>{store.keyboard.isPasswordField ? 'Yes' : 'No'}</strong></p>
          {store.keyboard.isPasswordField && (
            <p>Redacted: <strong>{redactPassword(store.keyboard.currentText)}</strong></p>
          )}
          <p>Position: <strong>{store.keyboard.displayPosition}</strong></p>
          <p>Visible: <strong>{store.keyboard.isVisible ? 'Yes' : 'No'}</strong></p>
        </div>
      </section>

      {/* Element Picker */}
      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="text-xl font-semibold">Element Picker</h2>
        <div className="flex gap-2">
          <button
            onClick={store.toggleElementPicker}
            className={`px-4 py-2 rounded ${
              store.elementPickerEnabled
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            Element Picker: {store.elementPickerEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => {
              const mockElement = {
                cssSelector: '#test-element',
                xpath: '//*[@id="test-element"]',
                tagName: 'button',
                textContent: 'Click Me',
                boundingBox: { x: 100, y: 100, width: 120, height: 40 },
                timestamp: Date.now(),
              };
              store.selectElement(mockElement);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Mock Element
          </button>
          <button
            onClick={store.clearSelectedElements}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Elements
          </button>
        </div>
        <p>Selected Elements: <strong>{store.selectedElements.length}</strong></p>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {store.selectedElements.map((element) => (
            <div key={element.timestamp} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
              <div className="flex-1">
                <p><strong>{element.tagName}</strong>: {element.cssSelector}</p>
                <p className="text-xs text-gray-600">{element.textContent}</p>
              </div>
              <button
                onClick={() => store.removeSelectedElement(element.timestamp)}
                className="px-2 py-1 bg-red-400 text-white text-xs rounded"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        {store.hoveredElement && (
          <div className="p-3 bg-yellow-50 border border-yellow-300 rounded">
            <p className="font-semibold">Hovered Element:</p>
            <p className="text-sm">{store.hoveredElement.cssSelector}</p>
          </div>
        )}
      </section>
    </div>
  );
}
