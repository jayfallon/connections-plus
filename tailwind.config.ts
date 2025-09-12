import heroui from "./hero";

const config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'connections-green': '#a0c35a',
        'connections-blue': '#b0c4ef',
        'connections-purple': '#ba81c5',
      },
    },
  },
  darkMode: "class",
  plugins: [heroui],
  safelist: [
    'bg-amber-200',
    'bg-[#a0c35a]',
    'bg-[#b0c4ef]', 
    'bg-[#ba81c5]',
    'bg-red-500',
  ],
};

export default config;
