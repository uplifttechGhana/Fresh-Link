import React from 'react';
import { Splash } from './pages/auth/Splash';
import { Onboarding } from './pages/auth/Onboarding';
import { RoleSelect } from './pages/auth/RoleSelect';
import { BuyerHome } from './pages/buyer/Home';
import { ProductDetail } from './pages/buyer/ProductDetail';
import { Cart } from './pages/buyer/Cart';
import { Checkout } from './pages/buyer/Checkout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { LanguageSelect } from './pages/auth/LanguageSelect';
import { OtpVerification } from './pages/auth/OtpVerification';
import { SearchFilters } from './pages/buyer/SearchFilters';
import { FarmerProfile } from './pages/buyer/FarmerProfile';
import { OrderTracking } from './pages/buyer/OrderTracking';
import { Chat } from './pages/buyer/Chat';
import { SavedFarmers } from './pages/buyer/SavedFarmers';
import { Favorites } from './pages/buyer/Favorites';
import { OrderHistory } from './pages/buyer/OrderHistory';
import { Invoice } from './pages/buyer/Invoice';
import { MapView } from './pages/buyer/MapView';
import { PriceCompare } from './pages/buyer/PriceCompare';
import { BuyerNotifications } from './pages/buyer/Notifications';
import { BrowseFarmers } from './pages/buyer/BrowseFarmers';
import { ChatInbox } from './pages/buyer/ChatInbox';
import { ChatContactProfile } from './pages/shared/ChatContactProfile';
import { FarmerDashboard } from './pages/farmer/Dashboard';
import { TransportDashboard } from './pages/transport/Dashboard';
import { MyProduce } from './pages/farmer/MyProduce';
import { AddProduce } from './pages/farmer/AddProduce';
import { EditProduce } from './pages/farmer/EditProduce';
import { OrderRequests } from './pages/farmer/OrderRequests';
import { Wallet } from './pages/farmer/Wallet';
import { Reviews } from './pages/farmer/Reviews';
import { Notifications } from './pages/farmer/Notifications';
import { RequestTransport } from './pages/farmer/RequestTransport';
import { AvailableJobs } from './pages/transport/AvailableJobs';
import { ActiveDelivery } from './pages/transport/ActiveDelivery';
import { Earnings } from './pages/transport/Earnings';
import { CompletedDeliveries } from './pages/transport/CompletedDeliveries';
import { VehicleProfile } from './pages/transport/VehicleProfile';
import { Availability } from './pages/transport/Availability';
import { TransportWallet } from './pages/transport/TransportWallet';
import { TransportRatings } from './pages/transport/Ratings';
import { LiveNavigation } from './pages/transport/Navigation';
import { TransportNotifications } from './pages/transport/Notifications';
import { Settings } from './pages/shared/Settings';
import { AdminDashboard } from './pages/admin/Dashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { AdminRegister } from './pages/admin/Register';
import { ProfileSettings } from './pages/shared/ProfileSettings';
import { PaymentSettings } from './pages/shared/PaymentSettings';
import { SecuritySettings } from './pages/shared/SecuritySettings';
import { NotificationSettings } from './pages/shared/NotificationSettings';
import { HelpCenter } from './pages/shared/HelpCenter';
import { About } from './pages/shared/About';
import { Terms } from './pages/shared/Terms';
import { Privacy } from './pages/shared/Privacy';
import { AddressBookSettings } from './pages/shared/AddressBookSettings';
import { FarmProfileSettings } from './pages/shared/FarmProfileSettings';
import { MarketplaceMonitor } from './pages/admin/MarketplaceMonitor';
import { Reports } from './pages/admin/Reports';
import { Support } from './pages/admin/Support';
import { Payments } from './pages/admin/Payments';
import { Insights } from './pages/farmer/Insights';
import { KnowledgeHub } from './pages/farmer/KnowledgeHub';
import { VideoPlayer } from './pages/farmer/VideoPlayer';
import { FarmerFunding } from './pages/farmer/Funding';
import { InvestorDashboard } from './pages/investor/Dashboard';
import { Invest } from './pages/investor/Invest';
import { UssdSimulation } from './pages/shared/UssdSimulation';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ProtectedRoute, BuyerBrowseRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationProvider } from './components/ui/NotificationProvider';
import { useAuthBootstrap } from './lib/hooks/useAuthBootstrap';
import { PageLoader } from './components/ui/PageLoader';
import { useAuthStore } from './lib/authStore';
import { shouldShowTabTransitionLoader } from './lib/navTabs';
import { useState, useEffect, useRef } from 'react';

function useTabTransition() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [entering, setEntering] = useState(false);
  const prevPathRef = useRef(location.pathname);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const nextPath = location.pathname;
    const prevPath = prevPathRef.current;
    if (nextPath === prevPath) return;

    prevPathRef.current = nextPath;

    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setLoading(false);
    setEntering(false);

    const showLoader = shouldShowTabTransitionLoader(prevPath, nextPath, user?.role);
    if (!showLoader) return;

    setLoading(true);

    const done = setTimeout(() => {
      setLoading(false);
      setEntering(true);
      const reset = setTimeout(() => setEntering(false), 360);
      timersRef.current.push(reset);
    }, 450);
    timersRef.current.push(done);

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [location.pathname, user?.role]);

  return { loading, entering };
}

function AppRoutes() {
  useAuthBootstrap();
  const { loading, entering } = useTabTransition();

  return (
    <div className="app-shell">
      {loading && <PageLoader />}
      <div className={`app-routes${entering ? ' app-routes--tab-enter' : ''}`}>
      <Routes>
            {/* ── Public / Auth ── */}
            <Route path="/" element={<Splash />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/language" element={<LanguageSelect />} />
            <Route path="/role-select" element={<RoleSelect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/otp" element={<OtpVerification />} />

            {/* ── Buyer (browse — no login required) ── */}
            <Route path="/buyer/home" element={<BuyerBrowseRoute><BuyerHome /></BuyerBrowseRoute>} />
            <Route path="/buyer/search" element={<BuyerBrowseRoute><SearchFilters /></BuyerBrowseRoute>} />
            <Route path="/buyer/product/:id" element={<BuyerBrowseRoute><ProductDetail /></BuyerBrowseRoute>} />
            <Route path="/buyer/farmer/:id" element={<BuyerBrowseRoute><FarmerProfile /></BuyerBrowseRoute>} />
            <Route path="/buyer/compare" element={<BuyerBrowseRoute><PriceCompare /></BuyerBrowseRoute>} />
            <Route path="/buyer/map" element={<BuyerBrowseRoute><MapView /></BuyerBrowseRoute>} />
            <Route path="/buyer/cart" element={<BuyerBrowseRoute><Cart /></BuyerBrowseRoute>} />
            <Route path="/buyer/farmers" element={<BuyerBrowseRoute><BrowseFarmers /></BuyerBrowseRoute>} />

            {/* ── Buyer (actions — login required) ── */}
            <Route path="/buyer/checkout" element={<ProtectedRoute roles={['buyer']}><Checkout /></ProtectedRoute>} />
            <Route path="/buyer/orders" element={<ProtectedRoute roles={['buyer']}><OrderHistory /></ProtectedRoute>} />
            <Route path="/buyer/favorites" element={<ProtectedRoute roles={['buyer']}><Favorites /></ProtectedRoute>} />
            <Route path="/buyer/notifications" element={<ProtectedRoute roles={['buyer']}><BuyerNotifications /></ProtectedRoute>} />
            <Route path="/buyer/saved" element={<ProtectedRoute roles={['buyer']}><SavedFarmers /></ProtectedRoute>} />
            <Route path="/buyer/tracking/:id" element={<ProtectedRoute roles={['buyer']}><OrderTracking /></ProtectedRoute>} />
            <Route path="/buyer/chat/:id" element={<ProtectedRoute roles={['buyer', 'farmer']}><Chat /></ProtectedRoute>} />
            <Route path="/buyer/chat/:id/contact" element={<ProtectedRoute roles={['buyer', 'farmer', 'transport']}><ChatContactProfile /></ProtectedRoute>} />
            <Route path="/buyer/messages" element={<ProtectedRoute roles={['buyer']}><ChatInbox /></ProtectedRoute>} />
            <Route path="/buyer/invoice/:id" element={<ProtectedRoute roles={['buyer']}><Invoice /></ProtectedRoute>} />

            {/* ── Farmer ── */}
            <Route path="/farmer/dashboard" element={<ProtectedRoute roles={['farmer']}><FarmerDashboard /></ProtectedRoute>} />
            <Route path="/farmer/produce" element={<ProtectedRoute roles={['farmer']}><MyProduce /></ProtectedRoute>} />
            <Route path="/farmer/produce/add" element={<ProtectedRoute roles={['farmer']}><AddProduce /></ProtectedRoute>} />
            <Route path="/farmer/produce/edit/:id" element={<ProtectedRoute roles={['farmer']}><EditProduce /></ProtectedRoute>} />
            <Route path="/farmer/orders" element={<ProtectedRoute roles={['farmer']}><OrderRequests /></ProtectedRoute>} />
            <Route path="/farmer/wallet" element={<ProtectedRoute roles={['farmer']}><Wallet /></ProtectedRoute>} />
            <Route path="/farmer/reviews" element={<ProtectedRoute roles={['farmer']}><Reviews /></ProtectedRoute>} />
            <Route path="/farmer/notifications" element={<ProtectedRoute roles={['farmer']}><Notifications /></ProtectedRoute>} />
            <Route path="/farmer/messages" element={<ProtectedRoute roles={['farmer']}><ChatInbox /></ProtectedRoute>} />
            <Route path="/farmer/chat/:id" element={<ProtectedRoute roles={['farmer', 'buyer']}><Chat /></ProtectedRoute>} />
            <Route path="/farmer/chat/:id/contact" element={<ProtectedRoute roles={['buyer', 'farmer', 'transport']}><ChatContactProfile /></ProtectedRoute>} />
            <Route path="/farmer/transport/request" element={<ProtectedRoute roles={['farmer']}><RequestTransport /></ProtectedRoute>} />
            <Route path="/farmer/insights" element={<ProtectedRoute roles={['farmer']}><Insights /></ProtectedRoute>} />
            <Route path="/farmer/knowledge" element={<ProtectedRoute roles={['farmer']}><KnowledgeHub /></ProtectedRoute>} />
            <Route path="/farmer/knowledge/video/:id" element={<ProtectedRoute roles={['farmer']}><VideoPlayer /></ProtectedRoute>} />
            <Route path="/farmer/funding" element={<ProtectedRoute roles={['farmer']}><FarmerFunding /></ProtectedRoute>} />

            {/* ── Investor ── */}
            <Route path="/investor/dashboard" element={<ProtectedRoute roles={['investor']}><InvestorDashboard /></ProtectedRoute>} />
            <Route path="/investor/invest/:id" element={<ProtectedRoute roles={['investor']}><Invest /></ProtectedRoute>} />

            {/* ── Transport ── */}
            <Route path="/transport/dashboard" element={<ProtectedRoute roles={['transport']}><TransportDashboard /></ProtectedRoute>} />
            <Route path="/transport/jobs" element={<ProtectedRoute roles={['transport']}><AvailableJobs /></ProtectedRoute>} />
            <Route path="/transport/delivery/:id" element={<ProtectedRoute roles={['transport']}><ActiveDelivery /></ProtectedRoute>} />
            <Route path="/transport/earnings" element={<ProtectedRoute roles={['transport']}><Earnings /></ProtectedRoute>} />
            <Route path="/transport/completed" element={<ProtectedRoute roles={['transport']}><CompletedDeliveries /></ProtectedRoute>} />
            <Route path="/transport/vehicle" element={<ProtectedRoute roles={['transport']}><VehicleProfile /></ProtectedRoute>} />
            <Route path="/transport/availability" element={<ProtectedRoute roles={['transport']}><Availability /></ProtectedRoute>} />
            <Route path="/transport/wallet" element={<ProtectedRoute roles={['transport']}><TransportWallet /></ProtectedRoute>} />
            <Route path="/transport/ratings" element={<ProtectedRoute roles={['transport']}><TransportRatings /></ProtectedRoute>} />
            <Route path="/transport/navigation/:id" element={<ProtectedRoute roles={['transport']}><LiveNavigation /></ProtectedRoute>} />
            <Route path="/transport/messages" element={<ProtectedRoute roles={['transport']}><ChatInbox /></ProtectedRoute>} />
            <Route path="/transport/chat/:id" element={<ProtectedRoute roles={['transport']}><Chat /></ProtectedRoute>} />
            <Route path="/transport/chat/:id/contact" element={<ProtectedRoute roles={['buyer', 'farmer', 'transport']}><ChatContactProfile /></ProtectedRoute>} />
            <Route path="/transport/notifications" element={<ProtectedRoute roles={['transport']}><TransportNotifications /></ProtectedRoute>} />

            {/* ── Settings (all authenticated users) ── */}
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/settings/profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
            <Route path="/settings/payments" element={<ProtectedRoute><PaymentSettings /></ProtectedRoute>} />
            <Route path="/settings/security" element={<ProtectedRoute><SecuritySettings /></ProtectedRoute>} />
            <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
            <Route path="/settings/help" element={<HelpCenter />} />
            <Route path="/settings/about" element={<About />} />
            <Route path="/settings/terms" element={<Terms />} />
            <Route path="/settings/privacy" element={<Privacy />} />
            <Route path="/settings/addresses" element={<ProtectedRoute roles={['buyer']}><AddressBookSettings /></ProtectedRoute>} />
            <Route path="/settings/farm-profile" element={<ProtectedRoute roles={['farmer']}><FarmProfileSettings /></ProtectedRoute>} />

            {/* ── Admin ── */}
            {/* Public — protected by ADMIN_SETUP_CODE, not by auth */}
            <Route path="/admin/register" element={<AdminRegister />} />
            <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><ErrorBoundary label="Admin dashboard"><AdminDashboard /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><ErrorBoundary label="User management"><UserManagement /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/admin/monitor" element={<ProtectedRoute roles={['admin']}><ErrorBoundary label="Marketplace monitor"><MarketplaceMonitor /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><ErrorBoundary label="Reports"><Reports /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/admin/support" element={<ProtectedRoute roles={['admin']}><ErrorBoundary label="Support"><Support /></ErrorBoundary></ProtectedRoute>} />
            <Route path="/admin/payments" element={<ProtectedRoute roles={['admin']}><ErrorBoundary label="Payments"><Payments /></ErrorBoundary></ProtectedRoute>} />

            {/* ── USSD simulator ── */}
            <Route path="/ussd" element={<UssdSimulation />} />

            <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </HashRouter>
    </QueryClientProvider>
  );
}