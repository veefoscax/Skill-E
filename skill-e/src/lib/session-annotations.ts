import { useOverlayStore, useRecordingStore, COLORS } from '@/stores'

export interface SessionAnnotations {
  clicks: Array<{
    id: string
    number: number
    position: { x: number; y: number }
    color: string
    timestamp: number
    fadeState: 'visible'
  }>
  drawings: ReturnType<typeof useOverlayStore.getState>['drawings']
  selectedElements: ReturnType<typeof useOverlayStore.getState>['selectedElements']
  keyboardInputs: string[]
}

export function buildSessionAnnotations(): SessionAnnotations {
  const recordingSteps = useRecordingStore.getState().steps
  const overlayState = useOverlayStore.getState()

  const clicks = recordingSteps
    .filter(step => step.type === 'click' && step.data?.position)
    .map((step, index) => ({
      id: step.id,
      number: index + 1,
      position: step.data!.position!,
      color: COLORS.COLOR_1,
      timestamp: step.timestamp,
      fadeState: 'visible' as const,
    }))

  const keyboardInputs = recordingSteps
    .filter(step => step.type === 'keystroke' && step.data?.text)
    .map(step => step.data!.text!)
    .filter(Boolean)

  return {
    clicks,
    drawings: overlayState.drawings || [],
    selectedElements: overlayState.selectedElements || [],
    keyboardInputs,
  }
}
