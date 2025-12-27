import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { 
    port: 5173,
    host: true,
    strictPort: true
  },
  resolve: {
    alias: {
      // Ensure pdfmake resolves correctly
    }
  },
  optimizeDeps: {
    include: ['pdfmake/build/pdfmake', 'pdfmake/build/vfs_fonts', 'pdfmake-rtl/build/pdfmake', 'pdfmake-rtl/build/vfs_fonts']
  }
});
