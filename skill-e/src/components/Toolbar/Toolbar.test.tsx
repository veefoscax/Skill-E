import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '../../test/test-utils'
import { Toolbar } from './Toolbar'
import { useRecordingStore } from '../../stores/recording'

describe('Toolbar Component', () => {
  beforeEach(() => {
    // Reset store to default state before each test
    useRecordingStore.setState({ isRecording: false, steps: [] })
    vi.clearAllMocks()
  })

  it('renders start button when not recording', () => {
    const onStart = vi.fn()
    const onStop = vi.fn()

    render(<Toolbar onStart={onStart} onStop={onStop} />)

    const startButton = screen.getByRole('button', { name: /start recording/i })
    expect(startButton).toBeInTheDocument()
  })

  it('renders stop button when recording', () => {
    useRecordingStore.setState({ isRecording: true })

    const onStart = vi.fn()
    const onStop = vi.fn()

    render(<Toolbar onStart={onStart} onStop={onStop} />)

    const stopButton = screen.getByRole('button', { name: /stop recording/i })
    expect(stopButton).toBeInTheDocument()
  })

  it('calls onStart when start button is clicked', async () => {
    const onStart = vi.fn().mockResolvedValue(undefined)
    const onStop = vi.fn()

    render(<Toolbar onStart={onStart} onStop={onStop} />)

    const startButton = screen.getByRole('button', { name: /start recording/i })
    
    await act(async () => {
      fireEvent.click(startButton)
    })

    await waitFor(() => {
      expect(onStart).toHaveBeenCalledTimes(1)
    })
  })

  it('calls onStop when stop button is clicked', async () => {
    useRecordingStore.setState({ isRecording: true })

    const onStart = vi.fn().mockResolvedValue(undefined)
    const onStop = vi.fn()

    render(<Toolbar onStart={onStart} onStop={onStop} />)

    const stopButton = screen.getByRole('button', { name: /stop recording/i })
    
    await act(async () => {
      fireEvent.click(stopButton)
    })

    await waitFor(() => {
      expect(onStop).toHaveBeenCalledTimes(1)
    }, { timeout: 2000 })
  })
})
