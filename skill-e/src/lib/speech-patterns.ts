import { VariableType } from '../types/variables';

export interface VariablePattern {
  pattern: RegExp;
  extract?: number;
  type: VariableType;
  requiresContext?: boolean;
  description: string;
}

export interface ConditionalPattern {
  pattern: RegExp;
  conditionGroup: number;
  thenGroup?: number;
  elseGroup?: number;
  description: string;
}

export interface ContextPattern {
  pattern: RegExp;
  contextType: 'important' | 'explanation' | 'frequency' | 'reason';
  description: string;
}

export const VARIABLE_PATTERNS_PT: VariablePattern[] = [
  { pattern: /o nome (do|da|de) (\w+)/i, extract: 2, type: VariableType.TEXT, description: 'Nome pattern' },
  { pattern: /o (email|e-mail) (do|da|de)?/i, extract: 0, type: VariableType.TEXT, description: 'Email pattern' },
  { pattern: /o (telefone|celular) (do|da|de)?/i, extract: 0, type: VariableType.TEXT, description: 'Phone pattern' },
  { pattern: /o (cpf|cnpj|rg|documento) (do|da|de)?/i, extract: 0, type: VariableType.TEXT, description: 'Document pattern' },
  { pattern: /o (código|id|identificador) (do|da|de)?/i, extract: 0, type: VariableType.TEXT, description: 'ID pattern' },
  { pattern: /qualquer (\w+)/i, extract: 1, type: VariableType.TEXT, description: 'Qualquer pattern' },
  { pattern: /um (\w+) qualquer/i, extract: 1, type: VariableType.TEXT, description: 'Um qualquer pattern' },
  { pattern: /isso (aqui )?(vai|pode|deve) mudar/i, extract: 0, type: VariableType.TEXT, requiresContext: true, description: 'Dynamic content' },
  { pattern: /depende (do|da|de) (\w+)/i, extract: 2, type: VariableType.TEXT, description: 'Depends pattern' },
  { pattern: /digita (aqui )?(o|a) (\w+)/i, extract: 3, type: VariableType.TEXT, description: 'Type instruction' },
  { pattern: /coloca (aqui )?(o|a) (\w+)/i, extract: 3, type: VariableType.TEXT, description: 'Put instruction' },
  { pattern: /seleciona (o|a) (\w+)/i, extract: 2, type: VariableType.SELECTION, description: 'Select instruction' },
  { pattern: /escolhe (o|a) (\w+)/i, extract: 2, type: VariableType.SELECTION, description: 'Choose instruction' },
  { pattern: /faz upload (do|da|de) (\w+)/i, extract: 2, type: VariableType.FILE, description: 'Upload instruction' },
  { pattern: /a data (do|da|de) (\w+)/i, extract: 2, type: VariableType.DATE, description: 'Date mention' },
  { pattern: /o (número|valor|quantidade) (do|da|de) (\w+)/i, extract: 3, type: VariableType.NUMBER, description: 'Number mention' },
];

export const VARIABLE_PATTERNS_EN: VariablePattern[] = [
  { pattern: /the (\w+) name/i, extract: 1, type: VariableType.TEXT, description: 'Name pattern' },
  { pattern: /the (email|e-mail) (address)?/i, extract: 0, type: VariableType.TEXT, description: 'Email pattern' },
  { pattern: /the (phone|telephone|mobile) (number)?/i, extract: 0, type: VariableType.TEXT, description: 'Phone pattern' },
  { pattern: /the (id|identifier|code)/i, extract: 0, type: VariableType.TEXT, description: 'ID pattern' },
  { pattern: /any (\w+)/i, extract: 1, type: VariableType.TEXT, description: 'Any pattern' },
  { pattern: /some (\w+)/i, extract: 1, type: VariableType.TEXT, description: 'Some pattern' },
  { pattern: /a (\w+) of your choice/i, extract: 1, type: VariableType.TEXT, description: 'Choice pattern' },
  { pattern: /this (will|can|might) (change|vary|differ)/i, extract: 0, type: VariableType.TEXT, requiresContext: true, description: 'Dynamic content' },
  { pattern: /depends on (the )?(\w+)/i, extract: 2, type: VariableType.TEXT, description: 'Depends pattern' },
  { pattern: /type (in )?(the )?(\w+)/i, extract: 3, type: VariableType.TEXT, description: 'Type instruction' },
  { pattern: /enter (the )?(\w+)/i, extract: 2, type: VariableType.TEXT, description: 'Enter instruction' },
  { pattern: /select (the )?(\w+)/i, extract: 2, type: VariableType.SELECTION, description: 'Select instruction' },
  { pattern: /choose (the )?(\w+)/i, extract: 2, type: VariableType.SELECTION, description: 'Choose instruction' },
  { pattern: /upload (the )?(\w+)/i, extract: 2, type: VariableType.FILE, description: 'Upload instruction' },
  { pattern: /the date (of|for) (\w+)/i, extract: 2, type: VariableType.DATE, description: 'Date mention' },
  { pattern: /the (number|amount|quantity) (of )?(\w+)/i, extract: 3, type: VariableType.NUMBER, description: 'Number mention' },
];

export const CONDITIONAL_PATTERNS_PT: ConditionalPattern[] = [
  { pattern: /se (for|tiver|houver|o|a) (.+?),?\s*(então|aí|daí)\s+(.+)/i, conditionGroup: 2, thenGroup: 4, description: 'Se então' },
  { pattern: /quando (o|a) (.+?)\s+(for|estiver|tiver)\s+(.+?),?\s+(.+)/i, conditionGroup: 2, thenGroup: 5, description: 'Quando' },
  { pattern: /dependendo (do|da|de) (.+?),?\s+(.+)/i, conditionGroup: 2, thenGroup: 3, description: 'Dependendo' },
  { pattern: /caso (o|a) (.+?)\s+(seja|esteja|tenha)\s+(.+?),?\s+(.+)/i, conditionGroup: 2, thenGroup: 5, description: 'Caso' },
  { pattern: /se não (tiver|houver|for) (.+?),?\s+(.+)/i, conditionGroup: 2, thenGroup: 3, description: 'Se não' },
  { pattern: /só (faz|faça|fazer) (.+?)\s+se\s+(.+)/i, conditionGroup: 3, thenGroup: 2, description: 'Só se' },
];

export const CONDITIONAL_PATTERNS_EN: ConditionalPattern[] = [
  { pattern: /if (the |there is |there are )?(.+?),?\s*(then |you )(.+)/i, conditionGroup: 2, thenGroup: 4, description: 'If then' },
  { pattern: /when (the )?(.+?)\s+(is|are|has|have)\s+(.+?),?\s+(.+)/i, conditionGroup: 2, thenGroup: 5, description: 'When' },
  { pattern: /depending on (the )?(.+?),?\s+(.+)/i, conditionGroup: 2, thenGroup: 3, description: 'Depending' },
  { pattern: /in case (the )?(.+?)\s+(is|are|has|have)\s+(.+?),?\s+(.+)/i, conditionGroup: 2, thenGroup: 5, description: 'In case' },
  { pattern: /if (there is no|there are no|not) (.+?),?\s+(.+)/i, conditionGroup: 2, thenGroup: 3, description: 'If not' },
  { pattern: /only (.+?)\s+if\s+(.+)/i, conditionGroup: 2, thenGroup: 1, description: 'Only if' },
];

export const CONTEXT_PATTERNS_PT: ContextPattern[] = [
  { pattern: /isso é importante porque/i, contextType: 'important', description: 'Important' },
  { pattern: /presta atenção (aqui|nisso|nessa parte)/i, contextType: 'important', description: 'Pay attention' },
  { pattern: /o motivo (é|disso|dessa)/i, contextType: 'reason', description: 'Reason' },
  { pattern: /geralmente|normalmente|na maioria das vezes/i, contextType: 'frequency', description: 'Frequency' },
  { pattern: /isso (acontece|é) porque/i, contextType: 'explanation', description: 'Explanation' },
  { pattern: /cuidado (com|que)/i, contextType: 'important', description: 'Warning' },
  { pattern: /sempre (faz|faça|fazer)/i, contextType: 'frequency', description: 'Always' },
];

export const CONTEXT_PATTERNS_EN: ContextPattern[] = [
  { pattern: /this is important because/i, contextType: 'important', description: 'Important' },
  { pattern: /pay attention (to|here)/i, contextType: 'important', description: 'Pay attention' },
  { pattern: /the reason (is|for this)/i, contextType: 'reason', description: 'Reason' },
  { pattern: /usually|normally|typically|most of the time/i, contextType: 'frequency', description: 'Frequency' },
  { pattern: /this (happens|is) because/i, contextType: 'explanation', description: 'Explanation' },
  { pattern: /be careful (with|about|that)/i, contextType: 'important', description: 'Warning' },
  { pattern: /always (do|make sure)/i, contextType: 'frequency', description: 'Always' },
];

export const ALL_VARIABLE_PATTERNS: VariablePattern[] = [...VARIABLE_PATTERNS_PT, ...VARIABLE_PATTERNS_EN];
export const ALL_CONDITIONAL_PATTERNS: ConditionalPattern[] = [...CONDITIONAL_PATTERNS_PT, ...CONDITIONAL_PATTERNS_EN];
export const ALL_CONTEXT_PATTERNS: ContextPattern[] = [...CONTEXT_PATTERNS_PT, ...CONTEXT_PATTERNS_EN];

/**
 * Result of extracting a variable from speech
 */
export interface SpeechVariableHint {
  suggestedName: string;
  type: VariableType;
  confidence: number;
  patternDescription: string;
  matchedText: string;
  requiresContext: boolean;
}

/**
 * Extracts variable hints from transcript text using pattern matching
 */
export function extractSpeechVariables(text: string): SpeechVariableHint[] {
  const hints: SpeechVariableHint[] = [];
  
  for (const pattern of ALL_VARIABLE_PATTERNS) {
    const match = text.match(pattern.pattern);
    
    if (match) {
      let suggestedName = '';
      
      if (pattern.extract !== undefined && pattern.extract > 0) {
        suggestedName = match[pattern.extract] || '';
      } else if (pattern.extract === 0) {
        suggestedName = match[1] || deriveNameFromPattern(pattern, text);
      } else {
        suggestedName = deriveNameFromPattern(pattern, text);
      }
      
      suggestedName = cleanVariableName(suggestedName);
      
      if (!suggestedName || suggestedName.length < 2) {
        continue;
      }
      
      const confidence = calculateConfidence(pattern, match, text);
      
      hints.push({
        suggestedName,
        type: pattern.type,
        confidence,
        patternDescription: pattern.description,
        matchedText: match[0],
        requiresContext: pattern.requiresContext || false,
      });
    }
  }
  
  return deduplicateHints(hints);
}

function deriveNameFromPattern(pattern: VariablePattern, text: string): string {
  const keywords = ['email', 'e-mail', 'telefone', 'celular', 'cpf', 'cnpj', 
                    'rg', 'documento', 'código', 'id', 'identificador',
                    'phone', 'telephone', 'mobile', 'code', 'identifier'];
  
  for (const keyword of keywords) {
    if (text.toLowerCase().includes(keyword)) {
      return keyword.replace(/-/g, '');
    }
  }
  
  if (pattern.requiresContext) {
    return 'dynamicValue';
  }
  
  switch (pattern.type) {
    case VariableType.TEXT:
      return 'textValue';
    case VariableType.NUMBER:
      return 'numberValue';
    case VariableType.SELECTION:
      return 'selection';
    case VariableType.FILE:
      return 'file';
    case VariableType.DATE:
      return 'date';
    default:
      return 'value';
  }
}

function cleanVariableName(name: string): string {
  let cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúâêôãõç]/gi, '')
    .replace(/\s+/g, '');
  
  if (cleaned.length > 0) {
    cleaned = cleaned
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
  
  return cleaned;
}

function calculateConfidence(
  pattern: VariablePattern,
  match: RegExpMatchArray,
  fullText: string
): number {
  let confidence = 0.7;
  
  if (pattern.extract !== undefined && pattern.extract > 0) {
    confidence += 0.1;
  }
  
  if (pattern.requiresContext) {
    confidence -= 0.2;
  }
  
  const matchLength = match[0].length;
  if (matchLength > 20) {
    confidence += 0.1;
  } else if (matchLength < 10) {
    confidence -= 0.05;
  }
  
  if (pattern.type === VariableType.FILE || pattern.type === VariableType.DATE) {
    confidence += 0.05;
  }
  
  const matchIndex = fullText.indexOf(match[0]);
  if (matchIndex < fullText.length * 0.3) {
    confidence += 0.05;
  }
  
  return Math.max(0, Math.min(1, confidence));
}

function deduplicateHints(hints: SpeechVariableHint[]): SpeechVariableHint[] {
  const hintMap = new Map<string, SpeechVariableHint>();
  
  for (const hint of hints) {
    const existing = hintMap.get(hint.suggestedName);
    
    if (!existing || hint.confidence > existing.confidence) {
      hintMap.set(hint.suggestedName, hint);
    }
  }
  
  return Array.from(hintMap.values())
    .sort((a, b) => b.confidence - a.confidence);
}
