// 文字列フィールドを数値に変換（空はundefined）
export function convertFormNumerics(
  fields: Record<string, string>
): Record<string, number | undefined> {
  const result: Record<string, number | undefined> = {};
  for (const [key, value] of Object.entries(fields)) {
    result[key] = value ? Number(value) : undefined;
  }
  return result;
}

// 単一値を数値に変換（空はundefined）
export function toNumber(value: string): number | undefined {
  return value ? Number(value) : undefined;
}
