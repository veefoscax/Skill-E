# 🚀 Como Buildar o Skill-E para Windows

## ⚡ MÉTODO RÁPIDO (Recomendado)

### Opção 1: Script Completo (Faz Tudo)

```powershell
# Execute no PowerShell como Administrador
cd C:\Users\vinif\OneDrive\Documentos\GitHub\claude_ext_re\Skill-E
.\setup-and-build.ps1
```

Este script vai:
1. ✅ Verificar/Instalar Rust
2. ✅ Verificar/Instalar LLVM (libclang)
3. ✅ Instalar dependências Node
4. ✅ Buildar o projeto
5. ✅ Gerar instalador Windows (.msi)

**Tempo estimado:** 15-30 minutos (1ª vez)

---

## 🔧 MÉTODO PASSO A PASSO

### Se o script acima falhar, execute passo a passo:

#### Passo 1: Instalar Rust

```powershell
.\install-rust.ps1
```

**Siga as instruções:**
- Selecione opção `1` (Default Installation)
- Aguarde completar
- **Feche o PowerShell**
- Abra um **NOVO** PowerShell como Administrador

#### Passo 2: Corrigir PATH (se necessário)

```powershell
.\fix-path.ps1
```

#### Passo 3: Instalar LLVM (Obrigatório para Whisper)

```powershell
.\install-llvm.ps1
```

Ou baixe manualmente:
- https://github.com/llvm/llvm-project/releases
- Baixe: `LLVM-17.0.6-win64.exe`
- Instale marcando "Add to PATH"

#### Passo 4: Build

```powershell
.\build-windows.ps1
```

---

## 📦 Resultado do Build

Após sucesso, os arquivos estarão em:

```
skill-e\src-tauri\target\release\bundle\
├── msi\
│   └── Skill-E_0.1.0_x64_en-US.msi      ← Instalador Windows (recomendado)
├── nsis\
│   └── Skill-E_0.1.0_x64-setup.exe      ← Instalador alternativo
└── ..
    └── Skill-E.exe                       ← Executável portable
```

---

## 🎯 Instalação nos Jurados

### Para distribuir aos jurados, use:

**Opção 1:** `Skill-E_0.1.0_x64_en-US.msi`
- Clique duplo → Instalação padrão Windows
- Aparece no Menu Iniciar

**Opção 2:** `Skill-E.exe` (portable)
- Copie e execute
- Não requer instalação

---

## 🐛 Troubleshooting

### "cargo not found" mesmo após instalar

Execute no PowerShell atual:
```powershell
$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"
```

Ou execute:
```powershell
.\fix-path.ps1
```

### "Unable to find libclang"

LLVM não instalado. Execute:
```powershell
.\install-llvm.ps1
```

### Build trava no "Compiling whisper-rs"

Normal na 1ª vez. Aguarde 10-30 minutos.

Se falhar, verifique:
- Visual Studio Build Tools instalado
- LLVM instalado corretamente

---

## ✅ Checklist Antes do Build

- [ ] PowerShell como **Administrador**
- [ ] Node.js instalado (`node --version`)
- [ ] Rust instalado (`rustc --version`)
- [ ] LLVM instalado (opcional, mas recomendado)

---

## 📝 Comandos Úteis

```powershell
# Verificar versões
node --version
rustc --version
cargo --version
clang --version  # Se LLVM instalado

# Apenas build TypeScript (rápido)
cd skill-e
pnpm build

# Build completo com Tauri (lento, 1ª vez)
pnpm tauri build
```

---

**Pronto! Execute `setup-and-build.ps1` e aguarde o instalador ser gerado! 🎉**
