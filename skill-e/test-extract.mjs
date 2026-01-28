// Quick manual test of extractSpeechVariables
import { extractSpeechVariables } from './src/lib/speech-patterns.ts';

const text = 'Digite o nome do cliente aqui';
console.log('Testing:', text);

try {
  const hints = extractSpeechVariables(text);
  console.log('Result:', JSON.stringify(hints, null, 2));
  console.log('✓ Function works!');
} catch (error) {
  console.error('✗ Error:', error.message);
}
