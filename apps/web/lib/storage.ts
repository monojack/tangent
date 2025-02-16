import * as json from './json'

import { NAMESPACE, SEPARATOR } from '@/constants'

export const getNamespacedStorageKey = (key: string): string =>
  `${NAMESPACE}${SEPARATOR}${key}`

export const getItem = <T>(key: string, initialValue: T): T =>
  typeof window === 'undefined'
    ? initialValue
    : json.parse(
        window.localStorage.getItem(getNamespacedStorageKey(key)),
        initialValue,
      )

export const setItem = <T>(key: string, value: T): void =>
  typeof window === 'undefined'
    ? void 0
    : value == null
      ? window.localStorage.removeItem(getNamespacedStorageKey(key))
      : window.localStorage.setItem(
          getNamespacedStorageKey(key),
          json.stringify(value),
        )

export const removeItem = (key: string): void =>
  typeof window === 'undefined'
    ? void 0
    : window.localStorage.removeItem(getNamespacedStorageKey(key))

export const subscribe = <T>(
  key: string,
  callback: (nextValue: T) => void | Promise<void>,
  initialValue: T,
) => {
  if (typeof window === 'undefined') return () => {}

  const namespacedKey = getNamespacedStorageKey(key)
  const storageEventCallback = (e: StorageEvent) => {
    if (e.storageArea === window.localStorage && e.key === namespacedKey) {
      let next: T
      try {
        next = json.parse(e.newValue, initialValue)
      } catch {
        next = initialValue
      }
      callback(next)
    }
  }
  window.addEventListener('storage', storageEventCallback)
  return () => {
    window.removeEventListener('storage', storageEventCallback)
  }
}
