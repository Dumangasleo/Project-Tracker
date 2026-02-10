/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],

    theme: {
        extend: {
            colors: {
                vortex: {
                    light: '#6366f1',
                    dark: '#4f46e5',
                }
            }
        },
    },


    plugins: [],
}