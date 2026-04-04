const checkedAtElement = document.querySelector('#checked-at')
const summaryElement = document.querySelector('#status-summary')
const providersElement = document.querySelector('#providers')
const transcriptOutputElement = document.querySelector('#transcript-output')
const audioPathInput = document.querySelector('#audio-path')
const refreshButton = document.querySelector('#refresh-button')
const transcribeButton = document.querySelector('#transcribe-button')

function renderProvider(provider) {
  const card = document.createElement('article')
  card.className = 'provider-card'

  const title = document.createElement('div')
  title.className = 'provider-card__title'
  title.textContent = provider.label

  const badge = document.createElement('span')
  badge.className = `badge badge--${provider.health}`
  badge.textContent = provider.health

  const header = document.createElement('div')
  header.className = 'provider-card__header'
  header.append(title, badge)

  const detail = document.createElement('p')
  detail.className = 'provider-card__detail'
  detail.textContent = provider.detail || 'No detail'

  const meta = document.createElement('div')
  meta.className = 'provider-card__meta'
  meta.textContent = `available=${provider.available} running=${provider.running}`

  card.append(header, detail, meta)
  return card
}

async function refreshStatus() {
  summaryElement.textContent = 'Loading host status…'
  providersElement.replaceChildren()

  try {
    const status = await window.skillEHost.getStatus()
    checkedAtElement.textContent = new Date(status.checkedAt).toLocaleString()
    summaryElement.textContent = `shell=${status.shell} collector=${status.collectorProvider} transcript=${status.transcriptProvider} fallback=${status.transcriptFallback}`

    for (const provider of status.providers) {
      providersElement.append(renderProvider(provider))
    }
  } catch (error) {
    summaryElement.textContent = `Failed to load status: ${error instanceof Error ? error.message : String(error)}`
  }
}

async function runWisprTranscribe() {
  const audioPath = audioPathInput.value.trim()
  transcriptOutputElement.textContent = 'Running Wispr bridge…'

  try {
    const result = await window.skillEHost.wisprTranscribe(audioPath)
    transcriptOutputElement.textContent = result.text || '(empty transcript)'
  } catch (error) {
    transcriptOutputElement.textContent = `Failed: ${error instanceof Error ? error.message : String(error)}`
  }
}

refreshButton.addEventListener('click', refreshStatus)
transcribeButton.addEventListener('click', runWisprTranscribe)

refreshStatus()
