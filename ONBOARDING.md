# 🚀 Onboarding - Skill-E Setup Guide

## ⚠️ PRÉ-REQUISITOS NÃO ENCONTRADOS

O comando `cargo` não foi encontrado. Você precisa instalar o Rust.

---

## 📋 CHECKLIST DE INSTALAÇÃO

### 1. Instalar Rust (Obrigatório)

**Windows (PowerShell como Administrador):**
```powershell
# Baixar e instalar Rust
winget install Rustlang.Rustup

# Ou manualmente:
# 1. Acesse: https://win.rustup.rs/
# 2. Baixe rustup-init.exe
# 3. Execute e siga as instruções
```

**Após instalar, reinicie o terminal e verifique:**
```powershell
rustc --version
cargo --version
```

Deve mostrar algo como:
```
rustc 1.75.0 (xxx)
cargo 1.75.0 (xxx)
```

---

### 2. Instalar Dependências do Sistema (Windows)

**Visual Studio Build Tools (Obrigatório para Windows):**
```powershell
# Baixe em: https://visualstudio.microsoft.com/visual-cpp-build-tools/
# Durante a instalação, selecione:
# - "Desktop development with C++"
# - Ou pelo menos: "MSVC v143 - VS 2022 C++ x64/x86 build tools"
```

**WebView2 Runtime (geralmente já tem):**
```powershell
# Verifique se já está instalado:
winget list Microsoft.EdgeWebView2Runtime

# Se não estiver:
winget install Microsoft.EdgeWebView2Runtime
```

---

### 3. Instalar Node.js (se ainda não tiver)

```powershell
# Verificar se já tem
node --version

# Se não tiver:
winget install OpenJS.NodeJS.LTS
```

---

### 4. Instalar pnpm

```powershell
npm install -g pnpm
```

---

## 🛠️ SETUP DO PROJETO

### Passo 1: Clonar/Entrar no projeto
```powershell
cd C:\Users\vinif\OneDrive\Documentos\GitHub\claude_ext_re\Skill-E\skill-e
```

### Passo 2: Instalar dependências Node
```powershell
pnpm install
```

### Passo 3: Verificar instalação do Tauri CLI
```powershell
pnpm tauri --version
```

### Passo 4: Rodar em desenvolvimento
```powershell
pnpm tauri dev
```

**Primeira execução vai:**
1. Compilar o Rust (pode demorar 2-5 minutos)
2. Baixar dependências do Cargo
3. Iniciar o app

---

## 🎯 FLUXO DE USO APÓS INSTALAÇÃO

### 1. Gravar uma Sessão
```
[Gravar] → Overlay aparece → Faça ações na tela → Fale algo → [Parar]
```

### 2. Processar
- Automaticamente baixa modelo Whisper (~75MB na 1ª vez)
- Transcreve áudio
- Processa screenshots
- Gera SKILL.md

### 3. Testar
- Abra Chrome: `chrome --remote-debugging-port=9222`
- Clique [Execute in Chrome]
- Veja a automação rodar!

---

## 🔧 TROUBLESHOOTING

### Erro: "cargo not found"
**Solução**: Rust não instalado ou não no PATH
```powershell
# Adicione manualmente ao PATH:
$env:PATH += ";C:\Users\$env:USERNAME\.cargo\bin"
# Ou reinicie o terminal após instalar rustup
```

### Erro: "linker not found"
**Solução**: Visual Studio Build Tools não instalado
- Baixe em: https://visualstudio.microsoft.com/visual-cpp-build-tools/
- Instale "Desktop development with C++"

### Erro: "WebView2 not found"
**Solução**: 
```powershell
winget install Microsoft.EdgeWebView2Runtime
```

### Build muito lento na primeira vez
**Normal**: Primeira compilação do Rust baixa e compila muitas dependências. Pode levar 5-10 minutos.

---

## 📁 ESTRUTURA DO PROJETO

```
Skill-E/
├── skill-e/              # Frontend + Backend
│   ├── src/              # React + TypeScript
│   ├── src-tauri/        # Rust backend
│   │   ├── src/
│   │   │   ├── lib.rs    # Comandos principais
│   │   │   └── commands/ # Comandos específicos
│   │   └── Cargo.toml    # Dependências Rust
│   └── package.json
└── README.md
```

---

## ✅ VERIFICAÇÃO FINAL

Antes de rodar, verifique:

```powershell
# 1. Rust
rustc --version  # ✅ Deve mostrar versão

# 2. Cargo
cargo --version  # ✅ Deve mostrar versão

# 3. Node
node --version   # ✅ v18+ ou v20+

# 4. pnpm
pnpm --version   # ✅ 8+

# 5. Tauri
pnpm tauri --version  # ✅ Deve funcionar
```

Se todos mostrarem versões, está pronto!

---

## 🚀 COMANDOS ÚTEIS

```powershell
# Desenvolvimento (hot reload)
pnpm tauri dev

# Build para produção
pnpm tauri build

# Apenas frontend (sem Rust)
pnpm dev

# Build apenas TypeScript
pnpm build

# Verificar Rust
cd src-tauri
cargo check
```

---

## 📞 SUPORTE

Se encontrar problemas:
1. Verifique se reiniciou o terminal após instalar Rust
2. Confira se Visual Studio Build Tools está instalado
3. Verifique o PATH do sistema

**Links úteis:**
- Instalação Rust: https://www.rust-lang.org/tools/install
- Tauri Prerequisites: https://tauri.app/start/prerequisites/
