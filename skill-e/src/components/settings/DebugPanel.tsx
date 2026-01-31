import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettingsStore } from '@/stores/settings';
import { fetchOllamaModels } from '@/lib/ollama';
import { checkModelExists, getModelsDirectory } from '@/lib/whisper-real';
import { Loader2, CheckCircle, XCircle, Terminal, Bug, FolderOpen, ShieldCheck, AlertCircle } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { appDataDir, tempDir, join } from '@tauri-apps/api/path';

export function DebugPanel() {
    const settings = useSettingsStore();

    const [ollamaStatus, setOllamaStatus] = useState<{ status: 'idle' | 'loading' | 'success' | 'error', message: string, details?: string }>({ status: 'idle', message: '' });
    const [whisperStatus, setWhisperStatus] = useState<{ status: 'idle' | 'loading' | 'success' | 'error', message: string, path?: string }>({ status: 'idle', message: '' });
    const [logsPath, setLogsPath] = useState<string>('');

    const testOllama = async () => {
        setOllamaStatus({ status: 'loading', message: 'Testing connection...' });
        try {
            const models = await fetchOllamaModels(settings.llmBaseUrl);
            if (models.length > 0) {
                setOllamaStatus({
                    status: 'success',
                    message: `Connected! Found ${models.length} models.`,
                    details: `Models: ${models.slice(0, 3).join(', ')}${models.length > 3 ? '...' : ''}`
                });
            } else {
                setOllamaStatus({ status: 'error', message: 'Connected but no models found.' });
            }
        } catch (e) {
            setOllamaStatus({
                status: 'error',
                message: 'Connection Failed',
                details: e instanceof Error ? e.message : String(e)
            });
        }
    };

    const testWhisper = async () => {
        setWhisperStatus({ status: 'loading', message: 'Checking model...' });
        try {
            const modelsDir = await getModelsDirectory();
            const exists = await checkModelExists(settings.whisperModel);

            if (exists) {
                setWhisperStatus({
                    status: 'success',
                    message: `Model '${settings.whisperModel}' found!`,
                    path: modelsDir
                });
            } else {
                setWhisperStatus({
                    status: 'error',
                    message: `Model '${settings.whisperModel}' NOT found.`,
                    path: modelsDir
                });
            }
        } catch (e) {
            setWhisperStatus({
                status: 'error',
                message: 'Check failed',
                path: e instanceof Error ? e.message : String(e)
            });
        }
    };

    const openDevTools = async () => {
        try {
            // In Tauri v2, we need to use the webview window API
            // For now, use keyboard shortcut F12 or Ctrl+Shift+I in the app
            // Or we can emit an event to open devtools
            const { invoke } = await import('@tauri-apps/api/core');
            await invoke('open_devtools');
        } catch (e) {
            console.error('Failed to open DevTools:', e);
            // Fallback: show message
            alert('Press F12 or Ctrl+Shift+I to open DevTools');
        }
    };

    const openLogsFolder = async () => {
        try {
            const temp = await tempDir();
            const logsDir = await join(temp, 'skill-e-logs');
            await invoke('open_folder', { path: logsDir });
        } catch (e) {
            console.error('Failed to open logs folder:', e);
            // Fallback: try to get the path and show it
            const temp = await tempDir();
            const logsDir = await join(temp, 'skill-e-logs');
            alert(`Logs folder:\n${logsDir}`);
        }
    };

    const openModelsFolder = async () => {
        try {
            const modelsDir = await getModelsDirectory();
            await invoke('open_folder', { path: modelsDir });
        } catch (e) {
            console.error('Failed to open models folder:', e);
            const modelsDir = await getModelsDirectory();
            alert(`Models folder:\n${modelsDir}`);
        }
    };

    return (
        <Card className="border-dashed">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-gray-500" />
                    <CardTitle className="text-base">System Diagnostics</CardTitle>
                </div>
                <CardDescription>Verify your environment before recording</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

                {/* Permission Info */}
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 rounded-md p-3">
                    <div className="flex items-start gap-2">
                        <ShieldCheck className="h-4 w-4 text-green-600 mt-0.5" />
                        <div className="text-xs text-green-800">
                            <p className="font-semibold">No Admin Required</p>
                            <p className="opacity-80 mt-1">
                                Skill-E runs in user space only. All files (models, logs, sessions) are stored in your user profile (%LOCALAPPDATA%).
                            </p>
                        </div>
                    </div>
                </div>

                {/* Debug Tools */}
                <div className="border rounded-md p-3 bg-blue-50/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm flex items-center gap-2">
                            <Bug className="h-4 w-4" />
                            Debug Tools
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={openDevTools}
                            className="text-xs"
                        >
                            <Terminal className="h-3 w-3 mr-1" />
                            Open Console
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={openLogsFolder}
                            className="text-xs"
                        >
                            <FolderOpen className="h-3 w-3 mr-1" />
                            Open Logs
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={openModelsFolder}
                            className="text-xs col-span-2"
                        >
                            <FolderOpen className="h-3 w-3 mr-1" />
                            Open Models Folder
                        </Button>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">
                        Logs are saved in %TEMP%\skill-e-logs\ even in portable mode
                    </p>
                </div>

                {/* Ollama Check */}
                <div className="border rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Ollama Connection</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={testOllama}
                            disabled={ollamaStatus.status === 'loading'}
                        >
                            {ollamaStatus.status === 'loading' ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                            Test Connection
                        </Button>
                    </div>
                    <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                        URL: {settings.llmBaseUrl || 'Not set'}
                    </div>
                    {ollamaStatus.status !== 'idle' && (
                        <div className={`mt-2 text-xs flex items-start gap-2 ${ollamaStatus.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {ollamaStatus.status === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
                            <div>
                                <p className="font-bold">{ollamaStatus.message}</p>
                                {ollamaStatus.details && <p className="mt-1 opacity-80">{ollamaStatus.details}</p>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Whisper Check */}
                <div className="border rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Whisper Local</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={testWhisper}
                            disabled={whisperStatus.status === 'loading'}
                        >
                            {whisperStatus.status === 'loading' ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                            Check Model
                        </Button>
                    </div>
                    <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                        Target: {settings.whisperModel} (GPU: {settings.useGpu ? 'ON' : 'OFF'})
                    </div>
                    {whisperStatus.status !== 'idle' && (
                        <div className={`mt-2 text-xs flex items-start gap-2 ${whisperStatus.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {whisperStatus.status === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
                            <div>
                                <p className="font-bold">{whisperStatus.message}</p>
                                {whisperStatus.path && <p className="mt-1 opacity-80 break-all">Dir: {whisperStatus.path}</p>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Debug: Force Reprocess */}
                <div className="border rounded-md p-3 bg-red-50 dark:bg-red-900/10 border-red-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm text-red-800 dark:text-red-300">Force Reprocess</span>
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="w-full text-xs"
                        onClick={async () => {
                            try {
                                const { invoke } = await import('@tauri-apps/api/core');
                                const path = 'C:\\Users\\vinif\\AppData\\Local\\Temp\\skill-e-sessions\\session-1769816995636/audio-1769817009486.wav';

                                // Clean up path for display
                                const displayPath = path.split('temp')[1] || path;
                                alert(`Reprocessing:\n...${displayPath.substring(0, 50)}`);

                                const res = await invoke('transcribe_local', {
                                    audioPath: path,
                                    model: 'turbo',
                                    _use_gpu: true
                                });
                                console.log('[REPROCESS RESULT]', res);
                                alert('Success! Transcription generated.');
                            } catch (e) {
                                console.error(e);
                                alert('Error: ' + String(e));
                            }
                        }}
                    >
                        🔄 Reprocess Last Recording
                    </Button>
                </div>

            </CardContent>
        </Card>
    );
}
