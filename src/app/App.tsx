// SGP SENAC - Sistema de Gerenciamento de Portfólio
// Version: 2025-04-01-v2
// Cache-Buster: Updated module imports
import { RouterProvider } from 'react-router';
import { router } from './routes';

export default function App() {
  return <RouterProvider router={router} />;
}
