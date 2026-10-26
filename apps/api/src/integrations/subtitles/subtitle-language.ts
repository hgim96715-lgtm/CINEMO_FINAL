const LANGUAGE_ALIASES: Record<string, string> = {
  ar: "ar",
  ara: "ar",
  arabic: "ar",
  de: "de",
  deu: "de",
  ger: "de",
  german: "de",
  en: "en",
  eng: "en",
  english: "en",
  es: "es",
  spa: "es",
  spanish: "es",
  fr: "fr",
  fra: "fr",
  fre: "fr",
  french: "fr",
  it: "it",
  ita: "it",
  italian: "it",
  ja: "ja",
  jpn: "ja",
  japanese: "ja",
  "日本語": "ja",
  ko: "ko",
  kor: "ko",
  korean: "ko",
  "한국어": "ko",
  pt: "pt",
  por: "pt",
  portuguese: "pt",
  ru: "ru",
  rus: "ru",
  russian: "ru",
  zh: "zh",
  zho: "zh",
  chi: "zh",
  chinese: "zh",
};

export function normalizeSubtitleLanguage(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim().toLowerCase().replaceAll("_", "-");

  if (!normalized) {
    return null;
  }

  const baseLanguage = normalized.split("-")[0];
  return (
    LANGUAGE_ALIASES[normalized] ??
    LANGUAGE_ALIASES[baseLanguage] ??
    baseLanguage
  );
}

export function isSameSubtitleLanguage(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  const normalizedLeft = normalizeSubtitleLanguage(left);
  const normalizedRight = normalizeSubtitleLanguage(right);

  return Boolean(normalizedLeft && normalizedLeft === normalizedRight);
}
