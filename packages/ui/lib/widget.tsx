import clsx from 'clsx'

import type { PropsWithChildren } from 'react'

export function Widget(props: PropsWithChildren) {
  return (
    <div
      {...props}
      className={clsx(
        'rounded-lg p-4',
        'bg-light-surface dark:bg-dark-surface',
        'shadow-sm',
      )}
    />
  )
}
