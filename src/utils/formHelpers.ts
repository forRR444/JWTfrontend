/**
 * フォームの文字列フィールドを数値に変換するヘルパー関数
 * 空文字列の場合は undefined を返す
 */
export function convertFormNumerics(
  fields: Record<string, string>
): Record<string, number | undefined> {
  const result: Record<string, number | undefined> = {};
  for (const [key, value] of Object.entries(fields)) {
    result[key] = value ? Number(value) : undefined;
  }
  return result;
}

/**
 * 個別のフィールドを数値に変換
 */
export function toNumber(value: string): number | undefined {
  return value ? Number(value) : undefined;
}
