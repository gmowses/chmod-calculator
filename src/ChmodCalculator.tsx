import { useState, useCallback, useEffect } from 'react'
import { Copy, Check, Sun, Moon, Languages, Terminal, FileText } from 'lucide-react'

// ── i18n ─────────────────────────────────────────────────────────────────────
const translations = {
  en: {
    title: 'Chmod Calculator',
    subtitle: 'Calculate Linux file permissions visually. Everything runs client-side.',
    permissions: 'Permissions',
    permissionsDesc: 'Toggle checkboxes or enter an octal value',
    owner: 'Owner',
    group: 'Group',
    others: 'Others',
    read: 'Read',
    write: 'Write',
    execute: 'Execute',
    special: 'Special Bits',
    specialDesc: 'Optional 4th octal digit',
    suid: 'SUID (4)',
    sgid: 'SGID (2)',
    sticky: 'Sticky (1)',
    suidHelp: 'Run as owner',
    sgidHelp: 'Run as group',
    stickyHelp: 'Only owner can delete',
    octal: 'Octal',
    symbolic: 'Symbolic',
    command: 'Command',
    preview: 'File Listing Preview',
    presets: 'Common Presets',
    copied: 'Copied!',
    copy: 'Copy',
    octalInput: 'Octal value',
    filename: 'filename',
    builtBy: 'Built by',
    preset644: 'File default',
    preset755: 'Dir default',
    preset600: 'Private file',
    preset777: 'Full access',
    preset400: 'Read-only',
    preset700: 'Owner only',
    preset664: 'Shared file',
    preset775: 'Shared dir',
    invalidOctal: 'Enter 3 or 4 octal digits (0-7)',
  },
  pt: {
    title: 'Calculadora Chmod',
    subtitle: 'Calcule permissoes de arquivos Linux visualmente. Tudo roda no navegador.',
    permissions: 'Permissoes',
    permissionsDesc: 'Marque as caixas ou digite um valor octal',
    owner: 'Dono',
    group: 'Grupo',
    others: 'Outros',
    read: 'Leitura',
    write: 'Escrita',
    execute: 'Execucao',
    special: 'Bits Especiais',
    specialDesc: '4o digito octal opcional',
    suid: 'SUID (4)',
    sgid: 'SGID (2)',
    sticky: 'Sticky (1)',
    suidHelp: 'Executa como dono',
    sgidHelp: 'Executa como grupo',
    stickyHelp: 'Apenas dono pode deletar',
    octal: 'Octal',
    symbolic: 'Simbolico',
    command: 'Comando',
    preview: 'Preview de Listagem',
    presets: 'Presets Comuns',
    copied: 'Copiado!',
    copy: 'Copiar',
    octalInput: 'Valor octal',
    filename: 'arquivo',
    builtBy: 'Criado por',
    preset644: 'Arquivo padrao',
    preset755: 'Dir padrao',
    preset600: 'Arquivo privado',
    preset777: 'Acesso total',
    preset400: 'Somente leitura',
    preset700: 'Somente dono',
    preset664: 'Arquivo compartilhado',
    preset775: 'Dir compartilhado',
    invalidOctal: 'Digite 3 ou 4 digitos octais (0-7)',
  },
} as const

type Lang = keyof typeof translations

// ── Types ─────────────────────────────────────────────────────────────────────
interface TriadBits {
  r: boolean
  w: boolean
  x: boolean
}

interface PermissionState {
  owner: TriadBits
  group: TriadBits
  others: TriadBits
  suid: boolean
  sgid: boolean
  sticky: boolean
}

// ── Permission logic ──────────────────────────────────────────────────────────
function triadToOctal(t: TriadBits): number {
  return (t.r ? 4 : 0) + (t.w ? 2 : 0) + (t.x ? 1 : 0)
}

function octalToTriad(n: number): TriadBits {
  return { r: !!(n & 4), w: !!(n & 2), x: !!(n & 1) }
}

function specialToOctal(suid: boolean, sgid: boolean, sticky: boolean): number {
  return (suid ? 4 : 0) + (sgid ? 2 : 0) + (sticky ? 1 : 0)
}

function permToOctalString(p: PermissionState): string {
  const sp = specialToOctal(p.suid, p.sgid, p.sticky)
  const ow = triadToOctal(p.owner)
  const gr = triadToOctal(p.group)
  const ot = triadToOctal(p.others)
  if (sp > 0) return `${sp}${ow}${gr}${ot}`
  return `${ow}${gr}${ot}`
}

function triadToSymbolic(t: TriadBits, isExec: boolean, suid: boolean, sgid: boolean, sticky: boolean, isOthers: boolean): string {
  const r = t.r ? 'r' : '-'
  const w = t.w ? 'w' : '-'
  let x: string
  if (isOthers) {
    x = sticky ? (t.x ? 't' : 'T') : (t.x ? 'x' : '-')
  } else if (suid || sgid) {
    x = isExec ? (t.x ? 's' : 'S') : (t.x ? 's' : 'S')
  } else {
    x = t.x ? 'x' : '-'
  }
  return r + w + x
}

function permToSymbolic(p: PermissionState): string {
  const ownerStr = triadToSymbolic(p.owner, true, p.suid, false, false, false)
  const groupStr = triadToSymbolic(p.group, true, false, p.sgid, false, false)
  const othersStr = triadToSymbolic(p.others, true, false, false, p.sticky, true)
  return ownerStr + groupStr + othersStr
}

function octalStringToPerm(raw: string): PermissionState | null {
  const s = raw.trim()
  if (!/^[0-7]{3,4}$/.test(s)) return null

  let sp = 0, ow = 0, gr = 0, ot = 0
  if (s.length === 4) {
    sp = parseInt(s[0], 8)
    ow = parseInt(s[1], 8)
    gr = parseInt(s[2], 8)
    ot = parseInt(s[3], 8)
  } else {
    ow = parseInt(s[0], 8)
    gr = parseInt(s[1], 8)
    ot = parseInt(s[2], 8)
  }

  return {
    owner: octalToTriad(ow),
    group: octalToTriad(gr),
    others: octalToTriad(ot),
    suid: !!(sp & 4),
    sgid: !!(sp & 2),
    sticky: !!(sp & 1),
  }
}

// ── Presets ───────────────────────────────────────────────────────────────────
const PRESETS = [
  { octal: '644', key: 'preset644' },
  { octal: '755', key: 'preset755' },
  { octal: '600', key: 'preset600' },
  { octal: '777', key: 'preset777' },
  { octal: '400', key: 'preset400' },
  { octal: '700', key: 'preset700' },
  { octal: '664', key: 'preset664' },
  { octal: '775', key: 'preset775' },
] as const

const DEFAULT_PERM: PermissionState = {
  owner: { r: true, w: true, x: false },
  group: { r: true, w: false, x: false },
  others: { r: true, w: false, x: false },
  suid: false,
  sgid: false,
  sticky: false,
}

// ── Copy hook ─────────────────────────────────────────────────────────────────
function useCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    })
  }, [])
  return { copiedKey, copy }
}

// ── Sub-components ────────────────────────────────────────────────────────────
function PermissionChar({ char, colored }: { char: string; colored: boolean }) {
  const colorMap: Record<string, string> = {
    r: 'text-lime-500',
    w: 'text-yellow-400',
    x: 'text-blue-400',
    s: 'text-purple-400',
    S: 'text-purple-300',
    t: 'text-pink-400',
    T: 'text-pink-300',
  }
  if (!colored || char === '-') return <span className="text-zinc-500">{char}</span>
  return <span className={colorMap[char] ?? ''}>{char}</span>
}

function SymbolicDisplay({ symbolic }: { symbolic: string }) {
  return (
    <span className="font-mono text-base">
      {symbolic.split('').map((c, i) => (
        <PermissionChar key={i} char={c} colored={c !== '-'} />
      ))}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ChmodCalculator() {
  const [lang, setLang] = useState<Lang>(() => (navigator.language.startsWith('pt') ? 'pt' : 'en'))
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [perm, setPerm] = useState<PermissionState>(DEFAULT_PERM)
  const [octalInput, setOctalInput] = useState('644')
  const [octalError, setOctalError] = useState(false)
  const { copiedKey, copy } = useCopy()

  const t = translations[lang]

  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])

  // Sync octal input display when checkboxes change
  const octalStr = permToOctalString(perm)
  const symbolic = permToSymbolic(perm)
  const command = `chmod ${octalStr} ${t.filename}`
  const fileType = '-'
  const listingLine = `${fileType}${symbolic} 1 user group  4096 Jan  1 00:00 ${t.filename}`

  const applyOctal = useCallback((val: string) => {
    setOctalInput(val)
    if (/^[0-7]{3,4}$/.test(val.trim())) {
      const parsed = octalStringToPerm(val)
      if (parsed) {
        setPerm(parsed)
        setOctalError(false)
      }
    } else if (val.length >= 3) {
      setOctalError(true)
    } else {
      setOctalError(false)
    }
  }, [])

  // Keep the octal text field in sync when checkboxes change
  useEffect(() => {
    setOctalInput(octalStr)
    setOctalError(false)
  }, [octalStr])

  const handleCheckbox = (
    role: 'owner' | 'group' | 'others',
    bit: 'r' | 'w' | 'x',
    val: boolean,
  ) => {
    setPerm(prev => ({ ...prev, [role]: { ...prev[role], [bit]: val } }))
  }

  const handleSpecial = (bit: 'suid' | 'sgid' | 'sticky', val: boolean) => {
    setPerm(prev => ({ ...prev, [bit]: val }))
  }

  const applyPreset = (octal: string) => {
    const parsed = octalStringToPerm(octal)
    if (parsed) setPerm(parsed)
  }

  const roles: { key: 'owner' | 'group' | 'others'; label: string }[] = [
    { key: 'owner', label: t.owner },
    { key: 'group', label: t.group },
    { key: 'others', label: t.others },
  ]
  const bits: { key: 'r' | 'w' | 'x'; label: string; val: number }[] = [
    { key: 'r', label: t.read, val: 4 },
    { key: 'w', label: t.write, val: 2 },
    { key: 'x', label: t.execute, val: 1 },
  ]

  const bitColor: Record<string, string> = {
    r: 'accent-lime-500',
    w: 'accent-yellow-400',
    x: 'accent-blue-400',
  }

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copy(text, id)}
      title={t.copy}
      className="ml-2 shrink-0 rounded-md p-1.5 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
    >
      {copiedKey === id ? <Check size={14} className="text-lime-500" /> : <Copy size={14} />}
    </button>
  )

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-lime-500 rounded-lg flex items-center justify-center">
              <Terminal size={16} className="text-white" />
            </div>
            <span className="font-semibold">Chmod Calculator</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(l => l === 'en' ? 'pt' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Toggle language"
            >
              <Languages size={14} />
              {lang.toUpperCase()}
            </button>
            <button
              onClick={() => setDark(d => !d)}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Toggle theme"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a
              href="https://github.com/gmowses/chmod-calculator"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 py-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t.subtitle}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left column: permission grid + octal input + special bits */}
            <div className="space-y-6">
              {/* Permission grid */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                <div className="mb-4">
                  <h2 className="font-semibold">{t.permissions}</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.permissionsDesc}</p>
                </div>

                {/* Octal input */}
                <div className="mb-5">
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">
                    {t.octalInput}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={octalInput}
                    onChange={e => applyOctal(e.target.value)}
                    className={`w-32 rounded-lg border px-3 py-2 font-mono text-2xl font-bold tabular-nums bg-zinc-50 dark:bg-zinc-800 outline-none transition-colors ${
                      octalError
                        ? 'border-red-400 dark:border-red-600 text-red-500'
                        : 'border-zinc-300 dark:border-zinc-700 text-lime-600 dark:text-lime-400 focus:border-lime-500 dark:focus:border-lime-500'
                    }`}
                  />
                  {octalError && (
                    <p className="mt-1 text-xs text-red-500">{t.invalidOctal}</p>
                  )}
                </div>

                {/* 3x3 checkbox grid */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left font-medium text-zinc-400 pb-2 pr-4 w-20"></th>
                        {bits.map(b => (
                          <th key={b.key} className="text-center font-medium text-zinc-500 dark:text-zinc-400 pb-2 px-2">
                            <span className="text-xs uppercase tracking-wide">{b.label}</span>
                            <div className="text-[10px] text-zinc-400">({b.val})</div>
                          </th>
                        ))}
                        <th className="text-center font-medium text-zinc-500 dark:text-zinc-400 pb-2 pl-4 w-12">
                          <span className="text-xs uppercase tracking-wide">{t.octal}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map((role, ri) => (
                        <tr key={role.key} className={ri < roles.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-800' : ''}>
                          <td className="py-3 pr-4 font-medium text-sm">{role.label}</td>
                          {bits.map(b => (
                            <td key={b.key} className="py-3 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={perm[role.key][b.key]}
                                onChange={e => handleCheckbox(role.key, b.key, e.target.checked)}
                                className={`h-5 w-5 cursor-pointer rounded ${bitColor[b.key]}`}
                              />
                            </td>
                          ))}
                          <td className="py-3 pl-4 text-center font-mono text-lg font-bold text-lime-600 dark:text-lime-400 tabular-nums">
                            {triadToOctal(perm[role.key])}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Special bits */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                <div className="mb-4">
                  <h2 className="font-semibold">{t.special}</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.specialDesc}</p>
                </div>
                <div className="space-y-3">
                  {[
                    { key: 'suid' as const, label: t.suid, help: t.suidHelp },
                    { key: 'sgid' as const, label: t.sgid, help: t.sgidHelp },
                    { key: 'sticky' as const, label: t.sticky, help: t.stickyHelp },
                  ].map(({ key, label, help }) => (
                    <label key={key} className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={perm[key]}
                        onChange={e => handleSpecial(key, e.target.checked)}
                        className="h-4 w-4 cursor-pointer accent-lime-500 rounded"
                      />
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-xs text-zinc-400">{help}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column: output + presets */}
            <div className="space-y-6">
              {/* Output card */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
                {/* Octal */}
                <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wide text-zinc-400">{t.octal}</span>
                    <CopyBtn text={octalStr} id="octal" />
                  </div>
                  <span className="font-mono text-3xl font-bold text-lime-600 dark:text-lime-400 tabular-nums">
                    {octalStr}
                  </span>
                </div>

                {/* Symbolic */}
                <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wide text-zinc-400">{t.symbolic}</span>
                    <CopyBtn text={symbolic} id="symbolic" />
                  </div>
                  <SymbolicDisplay symbolic={symbolic} />
                </div>

                {/* Command */}
                <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wide text-zinc-400">{t.command}</span>
                    <CopyBtn text={command} id="command" />
                  </div>
                  <span className="font-mono text-sm text-zinc-700 dark:text-zinc-300">
                    <span className="text-lime-600 dark:text-lime-400">$</span>{' '}
                    <span className="text-blue-500">chmod</span>{' '}
                    <span className="text-amber-500">{octalStr}</span>{' '}
                    <span className="text-zinc-600 dark:text-zinc-400">{t.filename}</span>
                  </span>
                </div>

                {/* File listing preview */}
                <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-zinc-400">
                      <FileText size={11} />
                      {t.preview}
                    </span>
                    <CopyBtn text={listingLine} id="listing" />
                  </div>
                  <div className="font-mono text-xs text-zinc-600 dark:text-zinc-400 overflow-x-auto whitespace-nowrap">
                    <span className="text-zinc-500">-</span>
                    <SymbolicDisplay symbolic={symbolic} />
                    <span> 1 </span>
                    <span className="text-lime-600 dark:text-lime-400">user</span>
                    <span> </span>
                    <span className="text-blue-400">group</span>
                    <span>  4096 Jan  1 00:00 </span>
                    <span className="text-zinc-700 dark:text-zinc-300">{t.filename}</span>
                  </div>
                </div>
              </div>

              {/* Presets */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                <h2 className="font-semibold mb-4">{t.presets}</h2>
                <div className="grid grid-cols-2 gap-2">
                  {PRESETS.map(({ octal, key }) => (
                    <button
                      key={octal}
                      onClick={() => applyPreset(octal)}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${
                        octalStr === octal
                          ? 'border-lime-500 bg-lime-50 dark:bg-lime-500/10 text-lime-700 dark:text-lime-400'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-lime-400 dark:hover:border-lime-600 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <span className="font-mono font-bold text-sm">{octal}</span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 text-right leading-tight ml-2">
                        {t[key as keyof typeof t]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-zinc-400">
          <span>
            {t.builtBy}{' '}
            <a
              href="https://github.com/gmowses"
              className="text-zinc-600 dark:text-zinc-300 hover:text-lime-500 transition-colors"
            >
              Gabriel Mowses
            </a>
          </span>
          <span>MIT License</span>
        </div>
      </footer>
    </div>
  )
}
