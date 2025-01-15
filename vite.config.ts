import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
	root: 'client', // Set the root directory to 'client'
	plugins: [react()],
	server: {
		host: '0.0.0.0',
		port: 7777, // Set the desired port
	},
	build: {
		outDir: '../dist', // Output directory for the build
	},
})
