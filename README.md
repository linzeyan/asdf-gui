# asdf-gui

A cross-platform desktop GUI for [asdf](https://github.com/asdf-vm/asdf), the multiple runtime version manager.

Manage plugins, install versions, edit `.tool-versions`, and inspect shims — all from a native app instead of the command line.

## Features

- **Dashboard** — overview of installed plugins, current versions, and quick actions
- **Plugin Management** — add from registry or custom URL, update, remove
- **Version Management** — install/uninstall versions, set local/global, streaming install logs
- **.tool-versions Editor** — visual editor for local, global, and custom `.tool-versions` files
- **Shim Inspector** — look up which plugin provides a command, reshim on demand
- **System Info** — view `asdf info` output and environment variables
- **Settings** — theme (light/dark/system), language, custom asdf binary path
- **i18n** — English and Traditional Chinese (繁體中文)

## Prerequisites

- [asdf](https://asdf-vm.com/guide/getting-started.html) installed and available in your shell PATH

## Install

Download the latest release for your platform from the [Releases](../../releases) page:

| Platform | File |
|---|---|
| macOS (Apple Silicon) | `asdf-gui_x.x.x_arm64.dmg` |
| macOS (Intel) | `asdf-gui_x.x.x_amd64.dmg` |
| Linux (x86_64) | `.deb` / `.AppImage` / `.rpm` |
| Linux (arm64) | `.deb` / `.AppImage` / `.rpm` |
| Windows (x86_64) | `.msi` / `-setup.exe` |
| Windows (arm64) | `.msi` / `-setup.exe` |

### macOS

Open the `.dmg` and drag **asdf-gui** to Applications. On first launch, right-click and choose "Open" to bypass Gatekeeper.

### Linux

```bash
# Debian / Ubuntu
sudo dpkg -i asdf-gui_*.deb

# Or use the AppImage directly
chmod +x asdf-gui_*.AppImage
./asdf-gui_*.AppImage
```

### Windows

Run the `.msi` installer or the `-setup.exe` and follow the prompts.

## Build from Source

Requires: [Node.js](https://nodejs.org/) 22+, [pnpm](https://pnpm.io/) 10+, [Rust](https://rustup.rs/) stable, and platform-specific Tauri v2 [prerequisites](https://v2.tauri.app/start/prerequisites/).

```bash
git clone https://github.com/user/asdf-gui.git
cd asdf-gui
make install   # install frontend + Rust dependencies
make dev       # run in development mode
make build     # production build
```

### Makefile targets

| Target | Description |
|---|---|
| `make dev` | Start development server with hot reload |
| `make build` | Lint, then build production app |
| `make lint` | ESLint + Clippy |
| `make format` | Prettier + cargo fmt |
| `make test` | Vitest + cargo test |
| `make clean` | Remove dist/ and Rust target/ |

## Tech Stack

- **Frontend** — React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Zustand, React Router
- **Backend** — Tauri v2, Rust, tokio
- **Build** — Vite 7, pnpm

## License

MIT
