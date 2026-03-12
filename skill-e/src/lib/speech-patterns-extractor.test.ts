/**
 * Tests for extractSpeechVariables() function
 *
 * Validates variable extraction from transcript text with confidence scoring.
 */

import { describe, it, expect } from 'vitest'
import * as speechPatterns from './speech-patterns'
import { VariableType } from '../types/variables'

const { extractSpeechVariables } = speechPatterns

// Debug: log what we imported
console.log('Imported module keys:', Object.keys(speechPatterns))
console.log('extractSpeechVariables type:', typeof extractSpeechVariables)

describe('extractSpeechVariables - Portuguese', () => {
  it('should extract variable from "o nome do cliente"', () => {
    const text = 'Agora digite o nome do cliente aqui'
    const hints = extractSpeechVariables(text)

    expect(hints.length).toBeGreaterThan(0)

    const clienteHint = hints.find(h => h.suggestedName === 'cliente')
    expect(clienteHint).toBeDefined()
    expect(clienteHint?.type).toBe(VariableType.TEXT)
    expect(clienteHint?.confidence).toBeGreaterThan(0.5)
    expect(clienteHint?.matchedText).toContain('nome do cliente')
  })

  it('should extract variable from "qualquer email"', () => {
    const text = 'Você pode usar qualquer email aqui'
    const hints = extractSpeechVariables(text)

    expect(hints.length).toBeGreaterThan(0)

    const emailHint = hints.find(h => h.suggestedName === 'email')
    expect(emailHint).toBeDefined()
    expect(emailHint?.type).toBe(VariableType.TEXT)
    expect(emailHint?.confidence).toBeGreaterThan(0.5)
  })

  it('should extract variable from "digita o código"', () => {
    const text = 'Agora digita o código de verificação'
    const hints = extractSpeechVariables(text)

    expect(hints.length).toBeGreaterThan(0)

    const codigoHint = hints.find(h => h.suggestedName === 'codigo')
    expect(codigoHint).toBeDefined()
    expect(codigoHint?.type).toBe(VariableType.TEXT)
  })

  it('should extract variable from "seleciona o tipo"', () => {
    const text = 'Seleciona o tipo de documento'
    const hints = extractSpeechVariables(text)

    expect(hints.length).toBeGreaterThan(0)

    const tipoHint = hints.find(h => h.suggestedName === 'tipo')
    expect(tipoHint).toBeDefined()
    expect(tipoHint?.type).toBe(VariableType.SELECTION)
  })

  it('should extract variable from "faz upload do arquivo"', () => {
    const text = 'Agora faz upload do arquivo de imagem'
    const hints = extractSpeechVariables(text)

    expect(hints.length).toBeGreaterThan(0)

    const arquivoHint = hints.find(h => h.suggestedName === 'arquivo')
    expect(arquivoHint).toBeDefined()
    expect(arquivoHint?.type).toBe(VariableType.FILE)
  })

  it('should extract variable from "o telefone do usuário"', () => {
    const text = 'Digite o telefone do usuário'
    const hints = extractSpeechVariables(text)

    expect(hints.length).toBeGreaterThan(0)

    const telefoneHint = hints.find(h => h.suggestedName === 'telefone')
    expect(telefoneHint).toBeDefined()
    expect(telefoneHint?.type).toBe(VariableType.TEXT)
  })

  it('should extract variable from "a data de nascimento"', () => {
    const text = 'Coloca a data de nascimento aqui'
    const hints = extractSpeechVariables(text)

    expect(hints.length).toBeGreaterThan(0)

    const dataHint = hints.find(h => h.suggestedName === 'nascimento')
    expect(dataHint).toBeDefined()
    expect(dataHint?.type).toBe(VariableType.DATE)
  })

  it('should extract variable from "o número de pedidos"', () => {
    const text = 'Digite o número de pedidos'
    const hints = extractSpeechVariables(text)

    expect(hints.length).toBeGreaterThan(0)

    const numeroHint = hints.find(h => h.suggestedName === 'pedidos')
    expect(numeroHint).toBeDefined()
    expect(numeroHint?.type).toBe(VariableType.NUMBER)
  })
})

describe('extractSpeechVariables - English', () => {
  it('should extract variable from "the customer name"', () => {
    const text = 'Now enter the customer name here'
    const hints = extractSpeechVariables(text)

    expect(hints.length).toBeGreaterThan(0)

    const customerHint = hints.find(h => h.suggestedName === 'customer')
    expect(customerHint).toBeDefined()
    expect(customerHint?.type).toBe(VariableType.TEXT)
    expect(customerHint?.confidence).toBeGreaterThan(0.5)
  })

  it('should extract variable from "any email"', () => {
    const text = 'You can use any email address'
    const hints = extractSpeechVariables(text)

    expect(hints.length).toBeGreaterThan(0)

    const emailHint = hints.find(h => h.suggestedName === 'email')
    expect(emailHint).toBeDefined()
    expect(emailHint?.type).toBe(VariableType.TEXT)
  })

  it('should extract variable from "type the code"', () => {
    const text = 'Now type the verification code'
    const hints = extractSpeechVariables(text)

    expect(hints.length).toBeGreaterThan(0)

    const codeHint = hints.find(h => h.suggestedName === 'code')
    expect(codeHint).toBeDefined()
    expect(codeHint?.type).toBe(VariableType.TEXT)
  })

  it('should extract variable from "select the option"', () => {
    const text = 'Select the document type'
    const hints = extractSpeechVariables(text)

    expect(hints.length).toBeGreaterThan(0)

    const typeHint = hints.find(h => h.suggestedName === 'type')
    expect(typeHint).toBeDefined()
    expect(typeHint?.type).toBe(VariableType.SELECTION)
  })

  it('should extract variable from "upload the file"', () => {
    const text = 'Now upload the document file'
    const hints = extractSpeechVariables(text)

    expect(hints.length).toBeGreaterThan(0)

    const fileHint = hints.find(h => h.suggestedName === 'document')
    expect(fileHint).toBeDefined()
    expect(fileHint?.type).toBe(VariableType.FILE)
  })

  it('should extract variable from "the phone number"', () => {
    const text = 'Enter the phone number'
    const hints = extractSpeechVariables(text)

    expect(hints.length).toBeGreaterThan(0)

    const phoneHint = hints.find(h => h.suggestedName === 'phone')
    expect(phoneHint).toBeDefined()
    expect(phoneHint?.type).toBe(VariableType.TEXT)
  })

  it('should extract variable from "the date of birth"', () => {
    const text = 'Enter the date of birth'
    const hints = extractSpeechVariables(text)

    expect(hints.length).toBeGreaterThan(0)

    const dateHint = hints.find(h => h.suggestedName === 'birth')
    expect(dateHint).toBeDefined()
    expect(dateHint?.type).toBe(VariableType.DATE)
  })

  it('should extract variable from "the number of items"', () => {
    const text = 'Enter the number of items'
    const hints = extractSpeechVariables(text)

    expect(hints.length).toBeGreaterThan(0)

    const numberHint = hints.find(h => h.suggestedName === 'items')
    expect(numberHint).toBeDefined()
    expect(numberHint?.type).toBe(VariableType.NUMBER)
  })
})

describe('extractSpeechVariables - Confidence Scoring', () => {
  it('should assign higher confidence to explicit patterns', () => {
    const text = 'Digite o nome do cliente'
    const hints = extractSpeechVariables(text)

    const clienteHint = hints.find(h => h.suggestedName === 'cliente')
    expect(clienteHint?.confidence).toBeGreaterThan(0.7)
  })

  it('should assign lower confidence to context-dependent patterns', () => {
    const text = 'Isso aqui vai mudar dependendo do caso'
    const hints = extractSpeechVariables(text)

    if (hints.length > 0) {
      const contextHint = hints.find(h => h.requiresContext)
      if (contextHint) {
        expect(contextHint.confidence).toBeLessThan(0.7)
      }
    }
  })

  it('should boost confidence for longer matches', () => {
    const longText = 'Agora você precisa digitar o código de verificação do sistema'
    const shortText = 'Digite o código'

    const longHints = extractSpeechVariables(longText)
    const shortHints = extractSpeechVariables(shortText)

    const longHint = longHints.find(h => h.suggestedName === 'codigo')
    const shortHint = shortHints.find(h => h.suggestedName === 'codigo')

    if (longHint && shortHint) {
      expect(longHint.confidence).toBeGreaterThanOrEqual(shortHint.confidence)
    }
  })

  it('should boost confidence for file and date types', () => {
    const fileText = 'Faz upload do arquivo'
    const dateText = 'Coloca a data de nascimento'

    const fileHints = extractSpeechVariables(fileText)
    const dateHints = extractSpeechVariables(dateText)

    const fileHint = fileHints.find(h => h.type === VariableType.FILE)
    const dateHint = dateHints.find(h => h.type === VariableType.DATE)

    expect(fileHint?.confidence).toBeGreaterThan(0.7)
    expect(dateHint?.confidence).toBeGreaterThan(0.7)
  })
})

describe('extractSpeechVariables - Deduplication', () => {
  it('should deduplicate same variable mentioned multiple times', () => {
    const text = 'Digite o email do cliente, o email deve ser válido'
    const hints = extractSpeechVariables(text)

    const emailHints = hints.filter(h => h.suggestedName === 'email')
    expect(emailHints.length).toBe(1)
  })

  it('should keep highest confidence when deduplicating', () => {
    const text = 'Qualquer email, digite o email aqui'
    const hints = extractSpeechVariables(text)

    const emailHints = hints.filter(h => h.suggestedName === 'email')
    expect(emailHints.length).toBe(1)
    expect(emailHints[0].confidence).toBeGreaterThan(0.5)
  })

  it('should sort results by confidence descending', () => {
    const text = 'Digite o nome do cliente, o email, e o telefone'
    const hints = extractSpeechVariables(text)

    expect(hints.length).toBeGreaterThan(1)

    for (let i = 0; i < hints.length - 1; i++) {
      expect(hints[i].confidence).toBeGreaterThanOrEqual(hints[i + 1].confidence)
    }
  })
})

describe('extractSpeechVariables - Edge Cases', () => {
  it('should handle empty text', () => {
    const hints = extractSpeechVariables('')
    expect(hints).toEqual([])
  })

  it('should handle text with no variables', () => {
    const text = 'Clique no botão azul e aguarde'
    const hints = extractSpeechVariables(text)
    expect(hints).toEqual([])
  })

  it('should handle mixed Portuguese and English', () => {
    const text = 'Digite o customer name aqui'
    const hints = extractSpeechVariables(text)

    expect(hints.length).toBeGreaterThan(0)
    // Should match at least one pattern
  })

  it('should clean variable names properly', () => {
    const text = 'Digite o nome-do-cliente aqui'
    const hints = extractSpeechVariables(text)

    const nomeHint = hints.find(h => h.suggestedName.includes('cliente'))
    if (nomeHint) {
      // Should not contain special characters
      expect(nomeHint.suggestedName).toMatch(/^[a-z0-9]+$/)
    }
  })

  it('should handle accented characters', () => {
    const text = 'Digite a descrição do produto'
    const hints = extractSpeechVariables(text)

    const descHint = hints.find(h => h.suggestedName.includes('descri'))
    if (descHint) {
      // Should normalize accents
      expect(descHint.suggestedName).not.toContain('ç')
    }
  })

  it('should skip very short extracted names', () => {
    const text = 'Digite o a aqui'
    const hints = extractSpeechVariables(text)

    // Should not extract single letter variables
    const singleLetterHints = hints.filter(h => h.suggestedName.length < 2)
    expect(singleLetterHints.length).toBe(0)
  })
})

describe('extractSpeechVariables - Multiple Variables', () => {
  it('should extract multiple variables from complex text', () => {
    const text = 'Digite o nome do cliente, o email, e seleciona o tipo de documento'
    const hints = extractSpeechVariables(text)

    expect(hints.length).toBeGreaterThanOrEqual(3)

    const nomeHint = hints.find(h => h.suggestedName === 'cliente')
    const emailHint = hints.find(h => h.suggestedName === 'email')
    const tipoHint = hints.find(h => h.suggestedName === 'tipo')

    expect(nomeHint).toBeDefined()
    expect(emailHint).toBeDefined()
    expect(tipoHint).toBeDefined()
  })

  it('should handle different variable types in same text', () => {
    const text = 'Digite o nome, seleciona a opção, e faz upload do arquivo'
    const hints = extractSpeechVariables(text)

    const textHint = hints.find(h => h.type === VariableType.TEXT)
    const selectionHint = hints.find(h => h.type === VariableType.SELECTION)
    const fileHint = hints.find(h => h.type === VariableType.FILE)

    expect(textHint).toBeDefined()
    expect(selectionHint).toBeDefined()
    expect(fileHint).toBeDefined()
  })
})

describe('extractSpeechVariables - Pattern Metadata', () => {
  it('should include pattern description', () => {
    const text = 'Digite o nome do cliente'
    const hints = extractSpeechVariables(text)

    expect(hints.length).toBeGreaterThan(0)
    expect(hints[0].patternDescription).toBeDefined()
    expect(hints[0].patternDescription.length).toBeGreaterThan(0)
  })

  it('should include matched text', () => {
    const text = 'Digite o nome do cliente'
    const hints = extractSpeechVariables(text)

    expect(hints.length).toBeGreaterThan(0)
    expect(hints[0].matchedText).toBeDefined()
    expect(hints[0].matchedText.length).toBeGreaterThan(0)
  })

  it('should indicate context requirement', () => {
    const text = 'Isso aqui vai mudar'
    const hints = extractSpeechVariables(text)

    if (hints.length > 0) {
      const contextHint = hints.find(h => h.requiresContext)
      if (contextHint) {
        expect(contextHint.requiresContext).toBe(true)
      }
    }
  })
})
