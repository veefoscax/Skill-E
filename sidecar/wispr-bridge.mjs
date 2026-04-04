#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const CDP_PORT = 9222;
const CDP_BASE = `http://127.0.0.1:${CDP_PORT}`;
const STARTUP_WAIT_MS = 20000;
const POLL_INTERVAL_MS = 250;

function fail(message, details) {
  if (details) {
    console.error(message, details);
  } else {
    console.error(message);
  }
  process.exit(1);
}

function usage() {
  console.error(
    [
      "Usage:",
      "  node wispr-bridge.mjs inject <audio-file.wav>",
      "  node wispr-bridge.mjs transcribe <audio-file.wav>",
      "",
      "Notes:",
      "  - Expects WAV 16 kHz mono PCM16.",
      "  - Requires Wispr Flow to be attachable over CDP.",
      "  - If Wispr is not running, this script launches it with --remote-debugging-port=9222.",
      "  - If Wispr is already running without remote debugging, relaunch it manually first.",
    ].join("\n")
  );
}

async function sleep(ms) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

function runPowerShell(command, options = {}) {
  const result = spawnSync(
    "powershell",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
    {
      encoding: "utf8",
      ...options,
    }
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "PowerShell command failed");
  }

  return result.stdout ?? "";
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.json();
}

async function getCdpTargets() {
  const targets = await fetchJson(`${CDP_BASE}/json/list`);
  return Array.isArray(targets?.value) ? targets.value : targets;
}

async function waitForCdpTargets(deadlineMs = STARTUP_WAIT_MS) {
  const deadline = Date.now() + deadlineMs;
  while (Date.now() < deadline) {
    try {
      const targets = await getCdpTargets();
      if (targets.length > 0) {
        return targets;
      }
    } catch {
      // Ignore until timeout.
    }
    await sleep(300);
  }
  throw new Error("Timed out waiting for CDP targets");
}

function findLatestWisprExe() {
  const baseDir = path.join(process.env.LOCALAPPDATA ?? "", "WisprFlow");
  if (!fs.existsSync(baseDir)) {
    return null;
  }

  const entries = fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name.startsWith("app-"))
    .map(entry => ({
      dir: entry.name,
      fullPath: path.join(baseDir, entry.name, "Wispr Flow.exe"),
    }))
    .filter(entry => fs.existsSync(entry.fullPath))
    .sort((a, b) => b.dir.localeCompare(a.dir, undefined, { numeric: true }));

  return entries[0]?.fullPath ?? null;
}

function isWisprRunning() {
  const result = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      "(Get-Process 'Wispr Flow' -ErrorAction SilentlyContinue | Measure-Object).Count",
    ],
    { encoding: "utf8" }
  );
  return Number(result.stdout?.trim() || "0") > 0;
}

function getForegroundWindowInfo() {
  const script = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public static class WisprBridgeUser32 {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
}
"@;
$hwnd = [WisprBridgeUser32]::GetForegroundWindow();
$pid = [uint32]0;
[void][WisprBridgeUser32]::GetWindowThreadProcessId($hwnd, [ref]$pid);
$titleBuilder = New-Object System.Text.StringBuilder 512;
[void][WisprBridgeUser32]::GetWindowText($hwnd, $titleBuilder, $titleBuilder.Capacity);
$processName = $null;
try {
  $processName = (Get-Process -Id $pid -ErrorAction Stop).ProcessName
} catch {}
[pscustomobject]@{
  pid = [int]$pid
  title = $titleBuilder.ToString()
  processName = $processName
} | ConvertTo-Json -Compress
`;

  const output = runPowerShell(script).trim();
  return output ? JSON.parse(output) : null;
}

function activateWindow(target) {
  if (!target) {
    return false;
  }

  const identifier =
    typeof target === "number" ? `${target}` : `${target}`.replace(/'/g, "''");
  const expression =
    typeof target === "number"
      ? `$wshell.AppActivate(${identifier})`
      : `$wshell.AppActivate('${identifier}')`;

  const script = `
$wshell = New-Object -ComObject WScript.Shell
[bool](${expression}) | ConvertTo-Json -Compress
`;

  try {
    return JSON.parse(runPowerShell(script).trim());
  } catch {
    return false;
  }
}

function getClipboardText() {
  const script = `
try {
  $value = Get-Clipboard -Raw -Format Text -ErrorAction Stop
  if ($null -eq $value) { '' } else { $value }
} catch {
  ''
}
`;

  return runPowerShell(script);
}

function setClipboardText(text) {
  spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      "Set-Clipboard -Value ([Console]::In.ReadToEnd())",
    ],
    {
      input: text ?? "",
      encoding: "utf8",
    }
  );
}

function launchWisprWithRemoteDebugging() {
  const exePath = findLatestWisprExe();
  if (!exePath) {
    throw new Error("Wispr Flow executable not found");
  }

  const child = spawn(exePath, [`--remote-debugging-port=${CDP_PORT}`], {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}

async function ensureCdp() {
  try {
    return await fetchJson(`${CDP_BASE}/json/version`);
  } catch {
    if (isWisprRunning()) {
      throw new Error(
        "Wispr Flow is already running without remote debugging. Close it and relaunch with --remote-debugging-port=9222."
      );
    }

    launchWisprWithRemoteDebugging();
    await waitForCdpTargets();
    return fetchJson(`${CDP_BASE}/json/version`);
  }
}

function pickTarget(targets, title) {
  const target = targets.find(item => item.type === "page" && item.title === title);
  if (!target?.webSocketDebuggerUrl) {
    throw new Error(`Could not find CDP target '${title}'`);
  }
  return target;
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    if (typeof WebSocket === "undefined") {
      throw new Error("This bridge requires a Node.js runtime with global WebSocket support");
    }

    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });

    this.ws.addEventListener("message", event => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) {
          reject(new Error(JSON.stringify(message.error)));
        } else {
          resolve(message);
        }
      }
    });

    await this.send("Runtime.enable");
  }

  async send(method, params = {}) {
    const id = this.nextId++;
    const payload = JSON.stringify({ id, method, params });
    const response = new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
    this.ws.send(payload);
    return response;
  }

  async evaluate(expression) {
    const response = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });

    if (response.result?.exceptionDetails) {
      throw new Error(JSON.stringify(response.result.exceptionDetails));
    }

    return response.result?.result?.value;
  }

  close() {
    try {
      this.ws?.close();
    } catch {
      // ignore
    }
  }
}

function ensureWavInput(inputPath) {
  const resolvedInput = path.resolve(inputPath);
  if (!fs.existsSync(resolvedInput)) {
    throw new Error(`Audio file not found: ${resolvedInput}`);
  }
  if (path.extname(resolvedInput).toLowerCase() !== ".wav") {
    throw new Error(`Wispr bridge expects a WAV file, received: ${resolvedInput}`);
  }
  return resolvedInput;
}

async function getLatestTranscript(statusClient) {
  const rows = await statusClient.evaluate(
    `(async () => await window.electron.ipc.invoke('history:getLastTranscripts', { numTranscripts: 1 }))()`
  );
  return rows?.[0] ?? null;
}

async function armSyntheticGetUserMedia(hubClient, wavPath) {
  const wavBase64 = fs.readFileSync(wavPath).toString("base64");

  return hubClient.evaluate(`(() => {
    const state = window.__wisprBridge = window.__wisprBridge || {};

    if (!state.originalGetUserMedia) {
      state.originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

      navigator.mediaDevices.getUserMedia = async function(constraints) {
        if (!state.syntheticArmed || !state.wavBase64) {
          state.lastMode = 'native';
          return state.originalGetUserMedia(constraints);
        }

        state.syntheticArmed = false;
        state.lastMode = 'synthetic';

        const bytes = Uint8Array.from(atob(state.wavBase64), ch => ch.charCodeAt(0));
        const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

        const audioContext = new AudioContext({ sampleRate: 16000 });
        await audioContext.resume();
        const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));

        const source = audioContext.createBufferSource();
        source.buffer = decoded;

        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        source.start(audioContext.currentTime + 0.25);

        state.current = {
          durationMs: Math.round(decoded.duration * 1000),
          sampleRate: decoded.sampleRate,
          channels: decoded.numberOfChannels,
          streamId: destination.stream.id
        };

        source.onended = () => {
          if (state.current) {
            state.current.ended = true;
            state.current.endedAt = Date.now();
          }
        };

        state.audioContext = audioContext;
        state.source = source;
        state.destination = destination;

        return destination.stream;
      };
    }

    state.wavBase64 = ${JSON.stringify(wavBase64)};
    state.syntheticArmed = true;

    return {
      armed: state.syntheticArmed,
      hasOriginalGetUserMedia: !!state.originalGetUserMedia
    };
  })()`);
}

async function getBridgeState(hubClient) {
  return hubClient.evaluate(`(() => {
    const state = window.__wisprBridge;
    return state ? {
      lastMode: state.lastMode || null,
      current: state.current || null,
      syntheticArmed: !!state.syntheticArmed
    } : null;
  })()`);
}

async function clickStatus(statusClient, channel) {
  return statusClient.evaluate(`window.electron.ipc.send(${JSON.stringify(channel)}); 'ok'`);
}

async function waitForNewTranscript(statusClient, previousTranscriptId, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const latest = await getLatestTranscript(statusClient);
    if (
      latest &&
      latest.transcriptEntityId &&
      latest.transcriptEntityId !== previousTranscriptId &&
      latest.status &&
      latest.status !== "processing"
    ) {
      return latest;
    }
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error("Timed out waiting for transcript completion");
}

async function runBridge(audioPath) {
  await ensureCdp();
  const targets = await waitForCdpTargets();
  const hubTarget = pickTarget(targets, "Hub");
  const statusTarget = pickTarget(targets, "Status");

  const hubClient = new CdpClient(hubTarget.webSocketDebuggerUrl);
  const statusClient = new CdpClient(statusTarget.webSocketDebuggerUrl);
  await hubClient.connect();
  await statusClient.connect();

  const wavPath = ensureWavInput(audioPath);
  const previous = await getLatestTranscript(statusClient);
  const previousTranscriptId = previous?.transcriptEntityId ?? null;
  const originalClipboard = getClipboardText();
  const previousFocus = getForegroundWindowInfo();

  try {
    const installState = await armSyntheticGetUserMedia(hubClient, wavPath);
    await clickStatus(statusClient, "status:startClicked");
    await sleep(1200);

    const bridgeState = await getBridgeState(hubClient);
    const durationMs = bridgeState?.current?.durationMs ?? 3500;

    await sleep(durationMs + 1800);
    activateWindow("Wispr Flow");
    await sleep(250);
    await clickStatus(statusClient, "status:stopClicked");

    const transcript = await waitForNewTranscript(statusClient, previousTranscriptId);
    await sleep(400);
    setClipboardText(originalClipboard);
    if (previousFocus?.pid) {
      activateWindow(previousFocus.pid);
    }

    return {
      installState,
      bridgeState,
      transcript,
      previousFocus,
    };
  } finally {
    hubClient.close();
    statusClient.close();
  }
}

function formatTranscriptForStdout(transcript) {
  const text =
    transcript?.formattedText ??
    transcript?.asrText ??
    transcript?.editedText ??
    transcript?.pastedText ??
    "";
  return `${text}`.trim();
}

async function main() {
  const [, , command, inputPath] = process.argv;
  if (!command || !inputPath || !["inject", "transcribe"].includes(command)) {
    usage();
    process.exit(1);
  }

  const result = await runBridge(inputPath);

  if (command === "transcribe") {
    const transcriptText = formatTranscriptForStdout(result.transcript);
    if (!transcriptText) {
      throw new Error("Wispr completed without returning transcript text");
    }
    process.stdout.write(transcriptText);
    return;
  }

  process.stdout.write(
    JSON.stringify(
      {
        transcriptEntityId: result.transcript?.transcriptEntityId ?? null,
        status: result.transcript?.status ?? null,
        formattedText: result.transcript?.formattedText ?? null,
        asrText: result.transcript?.asrText ?? null,
        duration: result.transcript?.duration ?? null,
        bridge: result.bridgeState,
      },
      null,
      2
    )
  );
}

main().catch(error => {
  fail(error.message || String(error));
});
