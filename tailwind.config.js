/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            gridTemplateColumns: {
                '31': 'repeat(31, minmax(0, 1fr))',
                '42': 'repeat(42, minmax(0, 1fr))',
            }
        },
    },
    plugins: [],
}
