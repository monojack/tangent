import baseConfig from '@repo/prettier-config/base'

/** @type {import("prettier").Config} */
const config = {
  ...baseConfig,
  tailwindConfig: './tailwind.config.js',
  tailwindFunctions: ['clsx'],
  plugins: ['prettier-plugin-tailwindcss'],
}

export default config
