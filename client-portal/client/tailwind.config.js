/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                navy: "#0f2540",
                "navy-dark": "#0a1a2e",
                "navy-light": "#1a3a5c",

                brand: "#0f7b8a",
                "brand-dark": "#0a5d6a",
                "brand-light": "#14919b",

                canvas: "#f4f6f8",

                dangerBg: "#fde8e8",
                dangerText: "#c53030",
            },
            boxShadow: {
                card: "0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.03)",
                cardHover: "0 4px 12px 0 rgba(0,0,0,0.06)",
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
            },
        },
    },
    plugins: [],
};