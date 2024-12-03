// import { defineConfig } from 'vite';
// import fs from 'fs';
// import react from '@vitejs/plugin-react'
// import path from 'path';

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   server: {
//     https: {
//       key: fs.readFileSync(path.resolve(__dirname,'key.pem')),
//       cert: fs.readFileSync(path.resolve(__dirname,'cert.pem'))
//     },
//     host: "0.0.0.0",
//     port: 5173,
//   },
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})