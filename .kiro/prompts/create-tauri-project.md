# Prompt para Iniciar Projeto Tauri no Kiro

Copie e cole este prompt no Kiro para iniciar o projeto Skill-E:

---

## Prompt para o Kiro:

```
Crie um novo projeto Tauri 2.0 com as seguintes especificações:

## Projeto: Skill-E

### Stack
- **Framework**: Tauri 2.0
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: CSS Modules ou Tailwind CSS
- **State**: Zustand
- **Package Manager**: pnpm (preferido) ou npm

### Comando de Inicialização
Use o comando oficial do Tauri:
```bash
pnpm create tauri-app Skill-E --template react-ts
```

### Estrutura de Pastas Desejada
Após criar, organize:
```
Skill-E/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   ├── Toolbar/
│   │   └── Overlay/
│   ├── lib/
│   │   ├── providers/
│   │   └── recording/
│   ├── stores/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   └── commands/
│   ├── Cargo.toml
│   └── tauri.conf.json
└── icons/
```

### Configuração tauri.conf.json
```json
{
  "productName": "Skill-E",
  "identifier": "com.skille.app",
  "version": "0.1.0",
  "build": {
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "Skill-E",
        "width": 300,
        "height": 60,
        "decorations": false,
        "transparent": true,
        "alwaysOnTop": true,
        "resizable": false
      }
    ],
    "trayIcon": {
      "iconPath": "icons/icon.png",
      "iconAsTemplate": true
    }
  },
  "bundle": {
    "active": true,
    "targets": ["msi", "dmg", "appimage"],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/icon.ico",
      "icons/icon.icns"
    ]
  }
}
```

### Plugins Tauri Necessários
Adicionar ao Cargo.toml:
- tauri-plugin-global-shortcut
- tauri-plugin-fs
- tauri-plugin-shell
- tauri-plugin-dialog

### Dependências Frontend
- zustand (state management)
- @tauri-apps/api (Tauri IPC)

### Após Criar
1. Copiar a pasta .kiro/ do repositório existente
2. Copiar assets/ (logo)
3. Iniciar desenvolvimento com `pnpm tauri dev`

### Verificação
- [ ] `pnpm tauri dev` inicia sem erros
- [ ] Janela abre corretamente (300x60, sem decorações)
- [ ] Tray icon aparece
- [ ] `pnpm tauri build` gera instalador
```

---

## Comandos Manuais (Alternativa)

Se preferir fazer manualmente:

```bash
# 1. Criar projeto Tauri
pnpm create tauri-app Skill-E --template react-ts

# 2. Entrar na pasta
cd Skill-E

# 3. Instalar dependências extras
pnpm add zustand
pnpm add -D @types/node

# 4. Adicionar plugins Tauri (no Cargo.toml)
# (editar manualmente src-tauri/Cargo.toml)

# 5. Configurar tauri.conf.json
# (copiar configuração acima)

# 6. Copiar .kiro do repo existente
# (copiar pasta manualmente)

# 7. Iniciar desenvolvimento
pnpm tauri dev
```

---

## Notas Importantes

1. **Tauri 2.0** é diferente do 1.x - usar documentação atualizada
2. **Plugins** são diferentes no v2 - usar @tauri-apps/plugin-*
3. **System tray** está built-in no Tauri 2.0
4. **Global shortcuts** requer plugin separado

## Link do Repositório
https://github.com/veefoscax/Skill-E
