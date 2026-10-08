import englishMessages from '../../locales/en.json';

export type FlowTranslations = Partial<typeof englishMessages>;

/** Resolve a message with English fallback and literal :placeholder substitution. */
export function translate(
  translations: FlowTranslations | undefined,
  key: keyof typeof englishMessages,
  replacements: Record<string, string | number> = {},
): string {
  const message = translations?.[key] ?? englishMessages[key];
  return message.replace(/:([a-zA-Z]+)\b/g, (placeholder, name: string) =>
    Object.prototype.hasOwnProperty.call(replacements, name) ? String(replacements[name]) : placeholder,
  );
}
