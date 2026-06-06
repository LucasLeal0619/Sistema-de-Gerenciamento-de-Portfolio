// SGP SENAC - Sistema de Gerenciamento de Portfólio
// Version: 2025-04-01-v2
// Cache-Buster: Updated module imports
import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { preloadPdfFont } from "./utils/pdfFont";
import { router } from "./routes";

export default function App() {
  useEffect(() => {
    preloadPdfFont();
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" closeButton />
    </>
  );
}
