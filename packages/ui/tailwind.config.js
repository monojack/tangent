import sharedConfig from '@repo/tailwind-config'

/** @type {import("tailwindcss").Config} */
const config = {
  content: ['./lib/**/*.tsx'],
  presets: [sharedConfig],
}

export default config
