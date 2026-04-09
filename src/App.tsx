import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { AuthGuard } from "@/components/layout/auth-guard";
import { AdminLayout } from "@/components/layout/admin-layout";
import { PublicLayout } from "@/components/layout/public-layout";
import { LoginPage } from "@/pages/auth/login";
import { ResetPasswordPage } from "@/pages/auth/reset-password";
import { OffersListPage } from "@/pages/admin/offers-list";
import { OfferNewPage } from "@/pages/admin/offer-new";
import { OfferEditPage } from "@/pages/admin/offer-edit";
import { ProposalDiffPage } from "@/pages/admin/proposal-diff";
import { DishesListPage } from "@/pages/admin/dishes-list";
import { ServicesListPage } from "@/pages/admin/services-list";
import { DishCategoriesPage } from "@/pages/admin/dish-categories";
import { DishNewPage } from "@/pages/admin/dish-new";
import { DishEditPage } from "@/pages/admin/dish-edit";
import { ClientsListPage } from "@/pages/admin/clients-list";
import { LeadsListPage } from "@/pages/admin/leads-list";
import { LeadDetailPage } from "@/pages/admin/lead-detail";
import { SettingsPage } from "@/pages/admin/settings";
import { EventProfilesListPage } from "@/pages/admin/event-profiles-list";
import { EventProfileEditPage } from "@/pages/admin/event-profile-edit";
import { PublicOfferPage } from "@/pages/public/offer";
import { OfferFindPage } from "@/pages/public/offer-find";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Auth */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Public offer */}
              <Route element={<PublicLayout />}>
                <Route path="/offer/find" element={<OfferFindPage />} />
                <Route path="/offer/:publicToken" element={<PublicOfferPage />} />
              </Route>

              {/* Admin (protected) */}
              <Route
                path="/admin"
                element={
                  <AuthGuard>
                    <AdminLayout />
                  </AuthGuard>
                }
              >
                <Route index element={<Navigate to="/admin/offers" replace />} />
                <Route path="offers" element={<OffersListPage />} />
                <Route path="offers/new" element={<OfferNewPage />} />
                <Route path="offers/:id/edit" element={<OfferEditPage />} />
                <Route path="offers/:id/proposals/:proposalId" element={<ProposalDiffPage />} />
                <Route path="dishes" element={<DishesListPage />} />
                <Route path="dishes/categories" element={<DishCategoriesPage />} />
                <Route path="dishes/new" element={<DishNewPage />} />
                <Route path="dishes/:id/edit" element={<DishEditPage />} />
                <Route path="services" element={<ServicesListPage />} />
                <Route path="clients" element={<ClientsListPage />} />
                <Route path="leads" element={<LeadsListPage />} />
                <Route path="leads/:id" element={<LeadDetailPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="notifications" element={<NotificationsListPage />} />
                <Route path="settings/event-profiles" element={<EventProfilesListPage />} />
                <Route path="settings/event-profiles/:eventTypeId" element={<EventProfileEditPage />} />
              </Route>

              {/* Root redirect */}
              <Route path="/" element={<Navigate to="/admin" replace />} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </MotionConfig>
  </QueryClientProvider>
);

export default App;
