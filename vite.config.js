import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
//import { analyzer } from 'vite-bundle-analyzer'; // Import the analyzer

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        
        // setup the analyzer
        // analyzer({
        //     analyzerMode: 'static',
        //     openAnalyzer: true,
        // }),
    ],

})
