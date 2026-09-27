import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { Layout } from "./components/Layout";
import { TooltipProvider } from "./components/ui";
import "./index.css";
import { initFirebase } from "./lib/firebase";
import CaseDetail from "./pages/CaseDetail";
import { CaseAdd, CaseEdit } from "./pages/CaseForms";
import CasePrint from "./pages/CasePrint";
import CasesList from "./pages/CasesList";

initFirebase();
const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } });

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/cases" replace /> },
  {
    element: <Layout />,
    children: [
      { path: "/cases", element: <CasesList /> },
      { path: "/cases/add", element: <CaseAdd /> },
      { path: "/cases/:id", element: <CaseDetail /> },
      { path: "/cases/:id/edit", element: <CaseEdit /> },
      { path: "/cases/:id/print", element: <CasePrint /> },
      { path: "*", element: <Navigate to="/cases" replace /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <TooltipProvider delayDuration={300}>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
