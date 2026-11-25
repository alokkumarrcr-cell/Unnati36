import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { AdminPortalPage } from './pages/AdminPortalPage.tsx';
import { LoginPage, OnboardingWizardPage, RegisterPage } from './pages/AuthPages.tsx';
import { CategoryPage } from './pages/CategoryPage.tsx';
import { ExplorePage } from './pages/ExplorePage.tsx';
import { GuidePage } from './pages/GuidePage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { OpportunityDetailPage } from './pages/OpportunityDetailPage.tsx';
import { ProviderPortalPage } from './pages/ProviderPortalPage.tsx';
import { ProviderProfilePage } from './pages/ProviderProfilePage.tsx';
import { AboutPage, ContactPage, LegalPage, PricingPage } from './pages/StaticPages.tsx';
import { UserDashboardPage } from './pages/UserDashboardPage.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/learn" element={<CategoryPage category="learn" />} />
            <Route path="/earn" element={<CategoryPage category="earn" />} />
            <Route path="/grow" element={<CategoryPage category="grow" />} />
            <Route path="/connect" element={<CategoryPage category="connect" />} />
            <Route path="/opportunity/:id" element={<OpportunityDetailPage />} />

            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/guide" element={<GuidePage />} />

            <Route path="/legal/privacy" element={<LegalPage doc="privacy" />} />
            <Route path="/legal/terms" element={<LegalPage doc="terms" />} />
            <Route path="/legal/guidelines" element={<LegalPage doc="guidelines" />} />
            <Route path="/legal/grievance" element={<LegalPage doc="grievance" />} />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/onboarding" element={<OnboardingWizardPage />} />

            {/* User Dashboard */}
            <Route path="/dashboard" element={<UserDashboardPage tab="overview" />} />
            <Route path="/dashboard/discover" element={<UserDashboardPage tab="discover" />} />
            <Route path="/dashboard/applications" element={<UserDashboardPage tab="applications" />} />
            <Route path="/dashboard/saved" element={<UserDashboardPage tab="saved" />} />
            <Route path="/dashboard/enquiries" element={<UserDashboardPage tab="enquiries" />} />
            <Route path="/dashboard/notifications" element={<UserDashboardPage tab="notifications" />} />
            <Route path="/dashboard/profile" element={<UserDashboardPage tab="profile" />} />
            <Route path="/dashboard/settings" element={<UserDashboardPage tab="settings" />} />

            {/* Provider Portal */}
            <Route path="/provider/register" element={<ProviderPortalPage tab="register" />} />
            <Route path="/provider/dashboard" element={<ProviderPortalPage tab="dashboard" />} />
            <Route path="/provider/create-listing" element={<ProviderPortalPage tab="create" />} />
            <Route path="/provider/manage-listings" element={<ProviderPortalPage tab="manage" />} />
            <Route path="/provider/enquiries" element={<ProviderPortalPage tab="enquiries" />} />
            <Route path="/provider/verification" element={<ProviderPortalPage tab="verification" />} />
            <Route path="/provider/analytics" element={<ProviderPortalPage tab="analytics" />} />
            <Route path="/provider/subscription" element={<ProviderPortalPage tab="subscription" />} />
            <Route path="/provider/settings" element={<ProviderPortalPage tab="settings" />} />
            <Route path="/provider/:id" element={<ProviderProfilePage />} />

            {/* Admin Control Center */}
            <Route path="/admin/dashboard" element={<AdminPortalPage tab="overview" />} />
            <Route path="/admin/users" element={<AdminPortalPage tab="users" />} />
            <Route path="/admin/providers" element={<AdminPortalPage tab="providers" />} />
            <Route path="/admin/approvals" element={<AdminPortalPage tab="approvals" />} />
            <Route path="/admin/categories" element={<AdminPortalPage tab="categories" />} />
            <Route path="/admin/reports" element={<AdminPortalPage tab="reports" />} />
            <Route path="/admin/featured" element={<AdminPortalPage tab="featured" />} />
            <Route path="/admin/revenue" element={<AdminPortalPage tab="revenue" />} />
            <Route path="/admin/analytics" element={<AdminPortalPage tab="analytics" />} />
            <Route path="/admin/settings" element={<AdminPortalPage tab="settings" />} />

            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </AppShell>
      </AuthProvider>
    </BrowserRouter>
  );
}
