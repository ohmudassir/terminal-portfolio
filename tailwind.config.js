/** @type {import('tailwindcss').Config} */
export default {
  // YEH HISSA ZAROORI HAI:
  // Yeh Tailwind ko batata hai ke aap ki class names
  // 'src' folder ke andar .jsx, .js, .ts, ya .tsx files mein milengi.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // ... baaki config
  theme: {
    extend: {},
  },
  plugins: [],
}
