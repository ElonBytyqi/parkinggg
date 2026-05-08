import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
     tailwindcss(),
  ],
  server: {
    host: true, // Dëgjon në të gjitha interfejset (0.0.0.0) - për qasje nga telefoni
    proxy: {
      "/odata": "http://localhost:4004",
    },
  },
})
