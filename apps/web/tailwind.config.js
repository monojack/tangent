import sharedConfig from '@repo/tailwind-config'

/** @type {import("tailwindcss").Config} */
const config = {
  content: ['./app/**/*.tsx'],
  presets: [sharedConfig],
}

export default config
