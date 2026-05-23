// app/(client)/client/home/_utils/emoji.ts

const EMOJI_KEYS: [string, string][] = [
  ['hair', '💇'], ['blow', '💨'], ['color', '🎨'], ['scalp', '🧠'],
  ['facial', '✨'], ['hydra', '💧'], ['cleanup', '🫧'], ['threading', '🧵'],
  ['skin', '✨'], ['makeup', '💄'], ['bridal', '👰'], ['party', '🎉'],
  ['nail', '💅'], ['manicure', '🤲'], ['pedicure', '🦶'], ['gel', '💅'],
  ['massage', '🧖'], ['aroma', '🌸'], ['spa', '🛁'], ['head', '🧠'],
  ['wax', '🪒'], ['body', '🛁'],
];

export function getEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of EMOJI_KEYS) {
    if (lower.includes(key)) return emoji;
  }
  return '🌸';
}