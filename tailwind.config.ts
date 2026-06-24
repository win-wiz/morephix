import tailwindcssAnimate from "tailwindcss-animate";

const config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: { extend: {} },
  plugins: [tailwindcssAnimate],
};

export default config;
