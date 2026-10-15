import englishMessages from '../../locales/en.json';

type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

type MessageKey = keyof typeof englishMessages;

/** Message keys as callers use them: plural variants collapse onto their base key. */
export type TranslationKey = MessageKey extends infer K
  ? K extends `${infer Base}_${PluralCategory}` ? Base : K
  : never;

export type FlowTranslations = Partial<typeof englishMessages>;

const FALLBACK_LOCALE = 'en';
const pluralRulesCache = new Map<string, Intl.PluralRules>();

/**
 * Plural rules for a locale tag. Accepts Laravel-style underscores (`pt_BR`),
 * defaults to the document language and falls back to English for invalid tags.
 */
export function resolvePluralRules(locale?: string): Intl.PluralRules {
  const requested = locale ?? (typeof document !== 'undefined' ? document.documentElement.lang : '');
  const tag = requested.trim().replace(/_/g, '-') || FALLBACK_LOCALE;
  let rules = pluralRulesCache.get(tag);
  if (!rules) {
    try {
      rules = new Intl.PluralRules(tag);
    } catch {
      rules = resolvePluralRules(FALLBACK_LOCALE);
    }
    pluralRulesCache.set(tag, rules);
  }
  return rules;
}

function pickMessage(
  dictionary: Record<string, string | undefined>,
  key: string,
  count: number | undefined,
  rules: Intl.PluralRules,
): string | undefined {
  if (count === undefined) return dictionary[key];
  return dictionary[`${key}_${rules.select(count)}`] ?? dictionary[`${key}_other`];
}

/**
 * Resolve a message with English fallback and literal :placeholder substitution.
 * A numeric `count` selects the CLDR plural form (`key_one`, `key_few`, …) using
 * the locale's rules; English fallbacks always use English plural rules.
 */
export function translate(
  translations: FlowTranslations | undefined,
  key: TranslationKey,
  replacements: Record<string, string | number> = {},
  locale?: string,
): string {
  const count = typeof replacements.count === 'number' ? replacements.count : undefined;
  const message = pickMessage(translations ?? {}, key, count, resolvePluralRules(locale))
    ?? pickMessage(englishMessages, key, count, resolvePluralRules(FALLBACK_LOCALE))
    ?? key;
  return message.replace(/:([a-zA-Z]+)\b/g, (placeholder, name: string) =>
    Object.prototype.hasOwnProperty.call(replacements, name) ? String(replacements[name]) : placeholder,
  );
}
