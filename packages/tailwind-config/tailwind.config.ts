import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'

import type { Config } from 'tailwindcss'

const config: Omit<Config, 'content'> = {
  theme: {},
  plugins: [forms, typography],
}
export default config
