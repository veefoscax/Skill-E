/**
 * Tests for Speech Pattern Definitions
 *
 * Validates that regex patterns correctly match expected speech patterns
 * in both Portuguese and English.
 */

import { describe, it, expect } from 'vitest'
import {
  VARIABLE_PATTERNS_PT,
  VARIABLE_PATTERNS_EN,
  CONDITIONAL_PATTERNS_PT,
  CONDITIONAL_PATTERNS_EN,
  CONTEXT_PATTERNS_PT,
  CONTEXT_PATTERNS_EN,
} from './speech-patterns'
import { VariableType } from '../types/variables'

describe('Speech Patterns - Portuguese Variable Detection', () => {
  it('should detect "o nome do cliente" pattern', () => {
    const text = 'Agora digite o nome do cliente aqui'
    const pattern = VARIABLE_PATTERNS_PT.find(p => p.pattern.test(text))

    expect(pattern).toBeDefined()
    expect(pattern?.type).toBe(VariableType.TEXT)

    const match = text.match(pattern!.pattern)
    expect(match).toBeDefined()
    if (pattern?.extract && pattern.extract > 0) {
      expect(match![pattern.extract]).toBe('cliente')
    }
  })

  it('should detect "qualquer email" pattern', () => {
    const text = 'Você pode usar qualquer email'
    const pattern = VARIABLE_PATTERNS_PT.find(
      p => p.pattern.source.includes('qualquer') && p.pattern.test(text)
    )

    expect(pattern).toBeDefined()
    expect(pattern?.type).toBe(VariableType.TEXT)
  })

  it('should detect "digita o código" pattern', () => {
    const text = 'Agora digita o código de verificação'
    const pattern = VARIABLE_PATTERNS_PT.find(
      p => p.pattern.source.includes('digita') && p.pattern.test(text)
    )

    expect(pattern).toBeDefined()
    expect(pattern?.type).toBe(VariableType.TEXT)
  })

  it('should detect "seleciona o tipo" pattern', () => {
    const text = 'Seleciona o tipo de documento'
    const pattern = VARIABLE_PATTERNS_PT.find(
      p => p.pattern.source.includes('seleciona') && p.pattern.test(text)
    )

    expect(pattern).toBeDefined()
    expect(pattern?.type).toBe(VariableType.SELECTION)
  })

  it('should detect "faz upload do arquivo" pattern', () => {
    const text = 'Agora faz upload do arquivo'
    const pattern = VARIABLE_PATTERNS_PT.find(
      p => p.pattern.source.includes('upload') && p.pattern.test(text)
    )

    expect(pattern).toBeDefined()
    expect(pattern?.type).toBe(VariableType.FILE)
  })
})

describe('Speech Patterns - English Variable Detection', () => {
  it('should detect "the customer name" pattern', () => {
    const text = 'Now enter the customer name here'
    const pattern = VARIABLE_PATTERNS_EN.find(p => p.pattern.test(text))

    expect(pattern).toBeDefined()
    expect(pattern?.type).toBe(VariableType.TEXT)
  })

  it('should detect "any email" pattern', () => {
    const text = 'You can use any email address'
    const pattern = VARIABLE_PATTERNS_EN.find(
      p => p.pattern.source.includes('any') && p.pattern.test(text)
    )

    expect(pattern).toBeDefined()
    expect(pattern?.type).toBe(VariableType.TEXT)
  })

  it('should detect "type the code" pattern', () => {
    const text = 'Now type the verification code'
    const pattern = VARIABLE_PATTERNS_EN.find(
      p => p.pattern.source.includes('type') && p.pattern.test(text)
    )

    expect(pattern).toBeDefined()
    expect(pattern?.type).toBe(VariableType.TEXT)
  })

  it('should detect "select the option" pattern', () => {
    const text = 'Select the document type'
    const pattern = VARIABLE_PATTERNS_EN.find(
      p => p.pattern.source.includes('select') && p.pattern.test(text)
    )

    expect(pattern).toBeDefined()
    expect(pattern?.type).toBe(VariableType.SELECTION)
  })

  it('should detect "upload the file" pattern', () => {
    const text = 'Now upload the document'
    const pattern = VARIABLE_PATTERNS_EN.find(
      p => p.pattern.source.includes('upload') && p.pattern.test(text)
    )

    expect(pattern).toBeDefined()
    expect(pattern?.type).toBe(VariableType.FILE)
  })
})

describe('Speech Patterns - Portuguese Conditionals', () => {
  it('should detect "se X então Y" pattern', () => {
    const text = 'Se for administrador, então clica no botão especial'
    const pattern = CONDITIONAL_PATTERNS_PT.find(p => p.pattern.test(text))

    expect(pattern).toBeDefined()

    const match = text.match(pattern!.pattern)
    expect(match).toBeDefined()
    expect(match![pattern!.conditionGroup]).toContain('administrador')
    if (pattern?.thenGroup) {
      expect(match![pattern.thenGroup]).toContain('clica')
    }
  })

  it('should detect "quando X for Y" pattern', () => {
    const text = 'Quando o status estiver completo, vai para próxima página'
    const pattern = CONDITIONAL_PATTERNS_PT.find(
      p => p.pattern.source.includes('quando') && p.pattern.test(text)
    )

    expect(pattern).toBeDefined()
  })

  it('should detect "dependendo de X" pattern', () => {
    const text = 'Dependendo do tipo de usuário, mostra opções diferentes'
    const pattern = CONDITIONAL_PATTERNS_PT.find(
      p => p.pattern.source.includes('dependendo') && p.pattern.test(text)
    )

    expect(pattern).toBeDefined()
  })
})

describe('Speech Patterns - English Conditionals', () => {
  it('should detect "if X then Y" pattern', () => {
    const text = 'If the user is admin, then click the special button'
    const pattern = CONDITIONAL_PATTERNS_EN.find(p => p.pattern.test(text))

    expect(pattern).toBeDefined()

    const match = text.match(pattern!.pattern)
    expect(match).toBeDefined()
    expect(match![pattern!.conditionGroup]).toContain('user')
  })

  it('should detect "when X is Y" pattern', () => {
    const text = 'When the status is complete, go to next page'
    const pattern = CONDITIONAL_PATTERNS_EN.find(
      p => p.pattern.source.includes('when') && p.pattern.test(text)
    )

    expect(pattern).toBeDefined()
  })

  it('should detect "depending on X" pattern', () => {
    const text = 'Depending on the user type, show different options'
    const pattern = CONDITIONAL_PATTERNS_EN.find(
      p => p.pattern.source.includes('depending') && p.pattern.test(text)
    )

    expect(pattern).toBeDefined()
  })
})

describe('Speech Patterns - Portuguese Context', () => {
  it('should detect "isso é importante porque" pattern', () => {
    const text = 'Isso é importante porque afeta o resultado'
    const pattern = CONTEXT_PATTERNS_PT.find(p => p.pattern.test(text))

    expect(pattern).toBeDefined()
    expect(pattern?.contextType).toBe('important')
  })

  it('should detect "presta atenção" pattern', () => {
    const text = 'Presta atenção nessa parte aqui'
    const pattern = CONTEXT_PATTERNS_PT.find(
      p => p.pattern.source.includes('presta') && p.pattern.test(text)
    )

    expect(pattern).toBeDefined()
    expect(pattern?.contextType).toBe('important')
  })

  it('should detect "geralmente" pattern', () => {
    const text = 'Geralmente isso funciona assim'
    const pattern = CONTEXT_PATTERNS_PT.find(
      p => p.pattern.source.includes('geralmente') && p.pattern.test(text)
    )

    expect(pattern).toBeDefined()
    expect(pattern?.contextType).toBe('frequency')
  })
})

describe('Speech Patterns - English Context', () => {
  it('should detect "this is important because" pattern', () => {
    const text = 'This is important because it affects the result'
    const pattern = CONTEXT_PATTERNS_EN.find(p => p.pattern.test(text))

    expect(pattern).toBeDefined()
    expect(pattern?.contextType).toBe('important')
  })

  it('should detect "pay attention" pattern', () => {
    const text = 'Pay attention to this part here'
    const pattern = CONTEXT_PATTERNS_EN.find(
      p => p.pattern.source.includes('attention') && p.pattern.test(text)
    )

    expect(pattern).toBeDefined()
    expect(pattern?.contextType).toBe('important')
  })

  it('should detect "usually" pattern', () => {
    const text = 'Usually this works like this'
    const pattern = CONTEXT_PATTERNS_EN.find(
      p => p.pattern.source.includes('usually') && p.pattern.test(text)
    )

    expect(pattern).toBeDefined()
    expect(pattern?.contextType).toBe('frequency')
  })
})

describe('Pattern Coverage', () => {
  it('should have at least 10 Portuguese variable patterns', () => {
    expect(VARIABLE_PATTERNS_PT.length).toBeGreaterThanOrEqual(10)
  })

  it('should have at least 10 English variable patterns', () => {
    expect(VARIABLE_PATTERNS_EN.length).toBeGreaterThanOrEqual(10)
  })

  it('should have at least 5 Portuguese conditional patterns', () => {
    expect(CONDITIONAL_PATTERNS_PT.length).toBeGreaterThanOrEqual(5)
  })

  it('should have at least 5 English conditional patterns', () => {
    expect(CONDITIONAL_PATTERNS_EN.length).toBeGreaterThanOrEqual(5)
  })

  it('should have at least 5 Portuguese context patterns', () => {
    expect(CONTEXT_PATTERNS_PT.length).toBeGreaterThanOrEqual(5)
  })

  it('should have at least 5 English context patterns', () => {
    expect(CONTEXT_PATTERNS_EN.length).toBeGreaterThanOrEqual(5)
  })

  it('all patterns should have descriptions', () => {
    const allPatterns = [
      ...VARIABLE_PATTERNS_PT,
      ...VARIABLE_PATTERNS_EN,
      ...CONDITIONAL_PATTERNS_PT,
      ...CONDITIONAL_PATTERNS_EN,
      ...CONTEXT_PATTERNS_PT,
      ...CONTEXT_PATTERNS_EN,
    ]

    allPatterns.forEach(pattern => {
      expect(pattern.description).toBeDefined()
      expect(pattern.description.length).toBeGreaterThan(0)
    })
  })
})
