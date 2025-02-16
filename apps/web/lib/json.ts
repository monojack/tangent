type Reviver = (key: string, value: unknown) => unknown
type Replacer = (key: string, value: unknown) => unknown

export function parse<T>(value: string | null): T
export function parse<T>(value: string | null, fallbackData: T): T
export function parse<T>(
  value: string | null,
  fallbackData: T,
  reviver: Reviver,
): T
export function parse<T>(
  value: string | null,
  fallbackData?: T,
  reviver?: Reviver,
) {
  if (typeof value !== 'string') {
    return fallbackData
  }

  try {
    return JSON.parse(value ?? '', reviver) ?? fallbackData
  } catch (e) {
    console.debug('json.parse', e)
    return value as unknown as T
  }
}

export function stringify<T>(value: T, replacer?: Replacer): string {
  if (typeof value === 'string') return value

  try {
    return JSON.stringify(value, replacer)
  } catch (e) {
    console.debug('json.stringify', e)
    throw e
  }
}
