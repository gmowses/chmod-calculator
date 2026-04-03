# Chmod Calculator

Linux file permission calculator with visual checkboxes, octal/symbolic notation and common presets. Everything runs client-side -- no data is sent to any server.

**[Live Demo](https://gmowses.github.io/chmod-calculator)**

## Features

- **3x3 checkbox grid** -- Owner / Group / Others with Read / Write / Execute toggles
- **Octal input** -- type any 3 or 4-digit octal value and checkboxes update instantly
- **Symbolic notation** -- live `rwxr-xr-x` display with color-coded permission chars
- **chmod command** -- ready-to-paste `chmod 755 filename` with syntax highlighting
- **File listing preview** -- `ls -l`-style output showing how the file would appear
- **Special bits** -- SUID, SGID and Sticky Bit support (4th octal digit)
- **Common presets** -- 644, 755, 600, 777, 400, 700, 664, 775 with one click
- **Copy to clipboard** -- copy octal, symbolic or full command individually
- **Dark / Light mode** -- toggle or auto-detect from system preference
- **i18n** -- English and Portuguese (auto-detect from browser language)
- **Zero backend** -- pure client-side, works offline after first load

## Tech Stack

- React 19
- TypeScript
- Tailwind CSS v4
- Vite
- Lucide icons

## Getting Started

```bash
git clone https://github.com/gmowses/chmod-calculator.git
cd chmod-calculator
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Build

```bash
npm run build
```

Static files are generated in `dist/`.

## Permission Reference

### Octal Notation

Each permission group (Owner, Group, Others) maps to a single octal digit:

| Bit | Value | Meaning |
|-----|-------|---------|
| r   | 4     | Read    |
| w   | 2     | Write   |
| x   | 1     | Execute |

Example: `755` = Owner `rwx` (7) + Group `r-x` (5) + Others `r-x` (5)

### Special Bits (4th digit)

| Bit    | Value | Effect                                      |
|--------|-------|---------------------------------------------|
| SUID   | 4     | Execute as file owner                       |
| SGID   | 2     | Execute as file group                       |
| Sticky | 1     | Only owner or root can delete/rename files  |

Example: `4755` = SUID + `755`

### Common Presets

| Octal | Symbolic   | Use case                      |
|-------|------------|-------------------------------|
| 644   | rw-r--r--  | Regular files                 |
| 755   | rwxr-xr-x  | Directories and executables   |
| 600   | rw-------  | Private files (SSH keys etc.) |
| 777   | rwxrwxrwx  | Full access (avoid in prod)   |
| 400   | r--------  | Read-only (backups)           |
| 700   | rwx------  | Owner-only directory          |
| 664   | rw-rw-r--  | Shared group editing          |
| 775   | rwxrwxr-x  | Shared group directory        |

## License

[MIT](LICENSE) -- Gabriel Mowses
