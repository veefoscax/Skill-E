/**
 * OnboardingScreen - First-time user guide
 * 
 * Shows step-by-step instructions for:
 * 1. Installing prerequisites
 * 2. Starting the app
 * 3. Recording a session
 * 4. Processing and testing
 */

import { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Download, 
  Terminal, 
  Mic, 
  Monitor, 
  Play,
  Chrome,
  ArrowRight,
  ArrowLeft,
  X
} from 'lucide-react';
import { Button } from './ui/button';

interface OnboardingScreenProps {
  onClose: () => void;
}

type Step = {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
};

export function OnboardingScreen({ onClose }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: Step[] = [
    {
      id: 0,
      title: 'Bem-vindo ao Skill-E!',
      description: 'Crie Agent Skills gravando sua tela e voz',
      icon: <Monitor className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg">
            Skill-E permite criar automações (Skills) apenas demonstrando como fazer:
          </p>
          <ul className="space-y-2 ml-6">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>Grave sua tela e narração</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>IA processa e extrai steps automaticamente</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>Gere um SKILL.md estruturado</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>Execute no Chrome para testar</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 1,
      title: 'Pré-requisitos',
      description: 'Verifique se tem tudo instalado',
      icon: <Download className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <p>Antes de começar, você precisa de:</p>
          
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-mono text-sm">1</div>
                <div>
                  <div className="font-medium">Node.js</div>
                  <div className="text-sm text-gray-500">Versão 18 ou superior</div>
                </div>
              </div>
              <code className="text-xs bg-gray-200 px-2 py-1 rounded">winget install OpenJS.NodeJS.LTS</code>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-mono text-sm">2</div>
                <div>
                  <div className="font-medium">Rust</div>
                  <div className="text-sm text-gray-500">Inclui Cargo</div>
                </div>
              </div>
              <a 
                href="https://win.rustup.rs/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
              >
                Baixar rustup-init.exe
              </a>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-mono text-sm">3</div>
                <div>
                  <div className="font-medium">Visual Studio Build Tools</div>
                  <div className="text-sm text-gray-500">Para compilar Rust no Windows</div>
                </div>
              </div>
              <a 
                href="https://visualstudio.microsoft.com/visual-cpp-build-tools/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
              >
                Baixar
              </a>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm">
            <strong>Dica:</strong> Execute <code>.\setup.ps1</code> no PowerShell para instalar automaticamente.
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: 'Gravando sua primeira sessão',
      description: 'Como usar o Skill-E',
      icon: <Mic className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 flex-shrink-0">1</div>
              <div>
                <div className="font-medium">Clique em &quot;Gravar&quot;</div>
                <div className="text-sm text-gray-600">O overlay aparecerá mostrando o timer</div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 flex-shrink-0">2</div>
              <div>
                <div className="font-medium">Execute a tarefa</div>
                <div className="text-sm text-gray-600">Faça as ações na tela enquanto narra o que está fazendo</div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 flex-shrink-0">3</div>
              <div>
                <div className="font-medium">Clique em &quot;Parar e Processar&quot;</div>
                <div className="text-sm text-gray-600">A IA vai analisar sua gravação</div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm">
            <strong>Atalhos:</strong>
            <ul className="mt-1 ml-4 list-disc">
              <li><kbd className="bg-white px-1 rounded">Ctrl+Shift+R</kbd> - Iniciar/Parar</li>
              <li><kbd className="bg-white px-1 rounded">Esc</kbd> - Parar gravação</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: 'Processamento',
      description: 'Como a IA funciona',
      icon: <Terminal className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <p>Durante o processamento, o Skill-E:</p>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span>Transcreve seu áudio usando Whisper local</span>
            </div>
            <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span>Analisa screenshots com OCR</span>
            </div>
            <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span>Detecta steps automaticamente</span>
            </div>
            <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span>Gera SKILL.md estruturado</span>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <strong>Nota:</strong> Na primeira execução, o modelo Whisper (~75MB) será baixado automaticamente.
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: 'Testando o Skill',
      description: 'Execute no Chrome',
      icon: <Chrome className="w-8 h-8" />,
      content: (
        <div className="space-y-4">
          <p>Para testar o skill gerado:</p>
          
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div>
              <div className="font-medium mb-1">1. Abra o terminal e execute:</div>
              <code className="block bg-gray-900 text-gray-100 p-2 rounded text-sm font-mono">
                chrome --remote-debugging-port=9222
              </code>
            </div>
            
            <div>
              <div className="font-medium mb-1">2. No Skill-E, clique em &quot;Execute in Chrome&quot;</div>
            </div>
            
            <div>
              <div className="font-medium mb-1">3. Veja a automação rodar!</div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 p-3 rounded">
            <strong>🎉 Pronto!</strong> Você criou e executou sua primeira automação.
          </div>
        </div>
      )
    }
  ];

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="text-blue-600">
              {step.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold">{step.title}</h2>
              <p className="text-gray-500">{step.description}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[300px]">
          {step.content}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 pb-4">
          {steps.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentStep 
                  ? 'w-6 bg-blue-600' 
                  : idx < currentStep 
                    ? 'bg-green-500' 
                    : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t bg-gray-50 rounded-b-xl">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={isFirst}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          <div className="text-sm text-gray-500 self-center">
            Passo {currentStep + 1} de {steps.length}
          </div>

          {isLast ? (
            <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Começar!
            </Button>
          ) : (
            <Button onClick={() => setCurrentStep(currentStep + 1)}>
              Próximo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
