import { useState, useCallback } from 'react';

/**
 * Microphone Diagnostic Component
 * 
 * This component helps diagnose microphone permission issues in Tauri.
 * Use this to troubleshoot when audio recording doesn't work.
 */
export function MicrophoneDiagnostic() {
    const [log, setLog] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    const addLog = useCallback((message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLog(prev => [...prev, `[${timestamp}] ${message}`]);
        console.log(message);
    }, []);

    const runDiagnostics = useCallback(async () => {
        setLog([]);
        setIsRunning(true);

        try {
            // Test 1: Check if navigator.mediaDevices exists
            addLog('🔍 Test 1: Checking navigator.mediaDevices...');
            if (!navigator.mediaDevices) {
                addLog('❌ FAIL: navigator.mediaDevices is not available');
                addLog('💡 This might mean the page is not served via HTTPS or localhost');
                setIsRunning(false);
                return;
            }
            addLog('✅ PASS: navigator.mediaDevices is available');

            // Test 2: Check if getUserMedia exists
            addLog('🔍 Test 2: Checking getUserMedia function...');
            if (!navigator.mediaDevices.getUserMedia) {
                addLog('❌ FAIL: getUserMedia is not available');
                addLog('💡 This browser/webview might not support media capture');
                setIsRunning(false);
                return;
            }
            addLog('✅ PASS: getUserMedia function exists');

            // Test 3: Enumerate devices (doesn't require permission)
            addLog('🔍 Test 3: Enumerating media devices...');
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioInputs = devices.filter(d => d.kind === 'audioinput');
                addLog(`✅ Found ${audioInputs.length} audio input device(s)`);

                audioInputs.forEach((device, i) => {
                    const label = device.label || `Microphone ${i + 1} (label hidden until permission granted)`;
                    addLog(`   📢 Device ${i + 1}: ${label}`);
                });

                if (audioInputs.length === 0) {
                    addLog('⚠️ WARNING: No audio input devices found');
                    addLog('💡 Please connect a microphone and try again');
                }
            } catch (err) {
                addLog(`❌ FAIL: enumerateDevices error: ${err}`);
            }

            // Test 4: Request microphone permission
            addLog('🔍 Test 4: Requesting microphone permission...');
            addLog('👆 A permission dialog should appear now...');
            addLog('   (If no dialog appears, permission may be cached)');

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        channelCount: 1,
                        sampleRate: 16000,
                        echoCancellation: true,
                        noiseSuppression: true,
                    },
                });

                addLog('✅ PASS: Microphone permission granted!');
                addLog(`   Stream has ${stream.getTracks().length} track(s)`);

                const track = stream.getAudioTracks()[0];
                if (track) {
                    addLog(`   Track label: ${track.label}`);
                    addLog(`   Track readyState: ${track.readyState}`);
                    const settings = track.getSettings();
                    addLog(`   Sample rate: ${settings.sampleRate || 'unknown'}Hz`);
                    addLog(`   Channel count: ${settings.channelCount || 'unknown'}`);
                }

                // Test 5: Create MediaRecorder
                addLog('🔍 Test 5: Creating MediaRecorder...');
                try {
                    const mediaRecorder = new MediaRecorder(stream, {
                        mimeType: 'audio/webm;codecs=opus',
                    });
                    addLog('✅ PASS: MediaRecorder created successfully');
                    addLog(`   State: ${mediaRecorder.state}`);
                    addLog(`   MIME type: ${mediaRecorder.mimeType}`);
                } catch (mrErr) {
                    addLog(`❌ FAIL: MediaRecorder error: ${mrErr}`);
                    addLog('💡 Try a different MIME type like "audio/webm"');
                }

                // Cleanup
                stream.getTracks().forEach(track => track.stop());
                addLog('🧹 Cleaned up: stopped all tracks');

            } catch (err) {
                const error = err as Error;
                addLog(`❌ FAIL: getUserMedia error`);
                addLog(`   Error name: ${error.name}`);
                addLog(`   Error message: ${error.message}`);

                if (error.name === 'NotAllowedError') {
                    addLog('');
                    addLog('🔧 TROUBLESHOOTING: Permission was denied');
                    addLog('');
                    addLog('📍 For Windows (WebView2):');
                    addLog('   1. The permission may have been denied and cached');
                    addLog('   2. Delete this file to reset permissions:');
                    addLog(`      C:\\Users\\<your-username>\\AppData\\Local\\com.vfoscaches.skill-e\\EBWebView\\Default\\Preferences`);
                    addLog('   3. Restart the application and try again');
                    addLog('');
                    addLog('📍 Alternative: Check Windows Privacy Settings');
                    addLog('   1. Open Windows Settings > Privacy > Microphone');
                    addLog('   2. Ensure "Allow apps to access your microphone" is ON');
                    addLog('   3. Ensure "Allow desktop apps to access your microphone" is ON');
                } else if (error.name === 'NotFoundError') {
                    addLog('');
                    addLog('🔧 TROUBLESHOOTING: No microphone found');
                    addLog('   1. Connect a microphone or headset');
                    addLog('   2. Check if it appears in Windows Sound Settings');
                    addLog('   3. Try a different USB port');
                } else if (error.name === 'NotReadableError') {
                    addLog('');
                    addLog('🔧 TROUBLESHOOTING: Microphone is being used');
                    addLog('   1. Close other apps that might be using the microphone');
                    addLog('   2. Check Discord, Teams, Zoom, etc.');
                    addLog('   3. Restart the application');
                }
            }

        } catch (err) {
            addLog(`❌ Unexpected error: ${err}`);
        }

        addLog('');
        addLog('🏁 Diagnostics complete');
        setIsRunning(false);
    }, [addLog]);

    const clearLog = () => setLog([]);

    return (
        <div className="p-6 space-y-4">
            <h2 className="text-2xl font-bold">🎤 Microphone Diagnostic</h2>
            <p className="text-muted-foreground">
                Run this diagnostic to test if microphone access is working correctly in Tauri.
            </p>

            <div className="flex gap-2">
                <button
                    onClick={runDiagnostics}
                    disabled={isRunning}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {isRunning ? 'Running...' : 'Run Diagnostics'}
                </button>
                <button
                    onClick={clearLog}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                    Clear Log
                </button>
            </div>

            <div className="p-4 bg-gray-900 rounded font-mono text-sm text-gray-200 max-h-96 overflow-y-auto whitespace-pre-wrap">
                {log.length === 0 ? (
                    <span className="text-gray-500">Click "Run Diagnostics" to start...</span>
                ) : (
                    log.map((line, i) => (
                        <div key={i} className={
                            line.includes('✅') ? 'text-green-400' :
                                line.includes('❌') ? 'text-red-400' :
                                    line.includes('⚠️') ? 'text-yellow-400' :
                                        line.includes('💡') ? 'text-cyan-400' :
                                            line.includes('🔧') ? 'text-orange-400' :
                                                ''
                        }>
                            {line}
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 bg-background/50 rounded border border-border">
                <h3 className="font-semibold mb-2">Common Fixes for Windows:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>
                        <strong>Reset WebView2 Permissions:</strong>
                        <br />
                        Delete: <code className="bg-gray-800 px-1 rounded text-xs">%LOCALAPPDATA%\com.vfoscaches.skill-e\EBWebView\Default\Preferences</code>
                    </li>
                    <li>
                        <strong>Check Windows Privacy:</strong>
                        <br />
                        Settings → Privacy → Microphone → Enable for desktop apps
                    </li>
                    <li>
                        <strong>Restart the app</strong> after making changes
                    </li>
                </ol>
            </div>
        </div>
    );
}
