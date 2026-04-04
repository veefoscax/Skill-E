import { getWorkDiaryHostStatus, transcribeWithWisprBridge } from './providers.mjs'

async function main() {
  const [, , command, audioPath] = process.argv

  if (!command || command === 'status') {
    console.log(JSON.stringify(getWorkDiaryHostStatus(), null, 2))
    return
  }

  if (command === 'wispr-transcribe') {
    if (!audioPath) {
      throw new Error('Usage: pnpm electron:smoke -- wispr-transcribe <audio-path>')
    }

    const result = transcribeWithWisprBridge(audioPath)
    console.log(result.text)
    return
  }

  throw new Error(`Unknown command: ${command}`)
}

main().catch(error => {
  console.error(error.message || String(error))
  process.exit(1)
})
