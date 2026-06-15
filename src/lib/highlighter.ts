import { createHighlighterCore, type HighlighterCore, type LanguageInput } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

const THEME = 'github-light'

// Explicit per-language loaders — NOT a template-literal dynamic import (that over-bundles
// and can break under file://). Each becomes its own lazy chunk.
const LANG_LOADERS: Record<string, () => Promise<unknown>> = {
  typescript: () => import('@shikijs/langs/typescript'),
  tsx: () => import('@shikijs/langs/tsx'),
  javascript: () => import('@shikijs/langs/javascript'),
  jsx: () => import('@shikijs/langs/jsx'),
  json: () => import('@shikijs/langs/json'),
  jsonc: () => import('@shikijs/langs/jsonc'),
  css: () => import('@shikijs/langs/css'),
  scss: () => import('@shikijs/langs/scss'),
  less: () => import('@shikijs/langs/less'),
  html: () => import('@shikijs/langs/html'),
  markdown: () => import('@shikijs/langs/markdown'),
  python: () => import('@shikijs/langs/python'),
  rust: () => import('@shikijs/langs/rust'),
  go: () => import('@shikijs/langs/go'),
  yaml: () => import('@shikijs/langs/yaml'),
  bash: () => import('@shikijs/langs/bash'),
  sql: () => import('@shikijs/langs/sql'),
  toml: () => import('@shikijs/langs/toml'),
}

let hlPromise: Promise<HighlighterCore> | null = null
function getHighlighter(): Promise<HighlighterCore> {
  if (!hlPromise) {
    hlPromise = createHighlighterCore({
      themes: [import('@shikijs/themes/github-light')],
      langs: [],
      engine: createJavaScriptRegexEngine(),
    })
  }
  return hlPromise
}

/** Highlight code to HTML. Unknown/unsupported langs render as plain text (no grammar load). */
export async function highlight(code: string, lang: string): Promise<string> {
  const hl = await getHighlighter()
  let useLang = 'text'
  const loader = LANG_LOADERS[lang]
  if (loader) {
    if (!hl.getLoadedLanguages().includes(lang)) {
      // loadLanguage accepts a LanguageInput (Awaitable<MaybeModule<MaybeArray<LanguageRegistration>>>)
      // The dynamic-import promise matches that shape — cast to LanguageInput explicitly.
      await hl.loadLanguage(loader() as LanguageInput)
    }
    useLang = lang
  }
  return hl.codeToHtml(code, { lang: useLang, theme: THEME })
}
