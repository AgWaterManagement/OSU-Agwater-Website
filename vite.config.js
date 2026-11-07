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

    // server: {
    //     proxy: {
    //         // Proxies the local MapServer WFS test instance so the browser can fetch it
    //         // same-origin (avoids CORS and the self-signed https://localhost:6001 cert).
    //         "/wotus-mapserver": {
    //             target: "https://localhost:6001",
    //             changeOrigin: true,
    //             secure: false,
    //             rewrite: (path) => path.replace(/^\/wotus-mapserver/, "/mapserver/mapserv"),
    //         },
    //     },
    // },

})
