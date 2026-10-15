import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import ForceChangePasswordPage from './pages/auth/ForceChangePasswordPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import RegisterCustomerPage from './pages/auth/RegisterCustomerPage';
import RegisterProviderPage from './pages/auth/RegisterProviderPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage';
import SearchPage from './pages/facility/SearchPage';
import CustomerReservationsPage from './pages/customer/CustomerReservationsPage';
import CustomerReservationDetailPage from './pages/customer/CustomerReservationDetailPage';
import CustomerContractsPage from './pages/CustomerContractsPage';
import ContractDetailPage from './pages/ContractDetailPage';
import FavoriteFacilitiesPage from './pages/customer/FavoriteFacilitiesPage';
import SubmitComplaintPage from './pages/customer/SubmitComplaintPage';
import CustomerComplaintsPage from './pages/customer/CustomerComplaintsPage';
import CreateReservationPage from './pages/customer/CreateReservationPage';
import ProviderReservationsPage from './pages/provider/ProviderReservationsPage';
import ProviderReservationDetailPage from './pages/provider/ProviderReservationDetailPage';
import ProviderCreateContractPage from './pages/provider/ProviderCreateContractPage';
import FacilityListPage from './pages/facility/FacilityListPage';
import FacilityDetailPage from './pages/facility/FacilityDetailPage';
import ChatPage from './pages/ChatPage';
import AdminFacilityEditPage from './pages/admin/AdminFacilityEditPage';
import AdminRegistrationDetailPage from './pages/admin/AdminRegistrationDetailPage';
import ScrollToTop from './components/common/ScrollToTop';

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-600 font-medium">Đang tải ứng dụng ParkLink...</p>
    </div>
  </div>
);

// Chỉ cho khách (Guest). Nếu cần đổi mật khẩu lần đầu → /change-password-first-time
const GuestOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return children;
  if (user?.requires_password_change) {
    return <Navigate to="/change-password-first-time" replace />;
  }
  return <Navigate to={user?.role?.name === 'CUSTOMER' ? '/' : '/dashboard'} replace />;
};

// Chỉ cho tài khoản cần đổi mật khẩu lần đầu
const ForcePasswordRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.requires_password_change) {
    return <Navigate to={user?.role?.name === 'CUSTOMER' ? '/' : '/dashboard'} replace />;
  }
  return children;
};

// Yêu cầu đăng nhập
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user?.requires_password_change) {
    return <Navigate to="/change-password-first-time" replace />;
  }
  return children;
};

// Yêu cầu đúng Role
const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user?.requires_password_change) {
    return <Navigate to="/change-password-first-time" replace />;
  }
  if (!allowedRoles.includes(user?.role?.name)) return <Navigate to="/dashboard" replace />;
  return children;
};

// Trang công cộng
const PublicBrowseRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <LoadingScreen />;
  if (isAuthenticated && user?.requires_password_change) {
    return <Navigate to="/change-password-first-time" replace />;
  }
  const role = user?.role?.name;
  if (isAuthenticated && (role === 'ADMIN' || role === 'FIELD_INSPECTOR')) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen font-sans antialiased text-slate-800 bg-slate-50">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* Public */}
          <Route path="/" element={<PublicBrowseRoute><HomePage /></PublicBrowseRoute>} />
          <Route path="/search" element={<PublicBrowseRoute><SearchPage /></PublicBrowseRoute>} />
          <Route path="/facilities" element={<PublicBrowseRoute><FacilityListPage /></PublicBrowseRoute>} />
          <Route path="/facility/:id" element={<PublicBrowseRoute><FacilityDetailPage /></PublicBrowseRoute>} />

          {/* Guest only */}
          <Route path="/login" element={<GuestOnlyRoute><LoginPage /></GuestOnlyRoute>} />
          <Route path="/forgot-password" element={<GuestOnlyRoute><ForgotPasswordPage /></GuestOnlyRoute>} />
          <Route path="/register" element={<GuestOnlyRoute><RegisterCustomerPage /></GuestOnlyRoute>} />
          <Route path="/register-provider" element={<GuestOnlyRoute><RegisterProviderPage /></GuestOnlyRoute>} />

          {/* Bắt buộc đổi mật khẩu lần đầu (Force Change Password) */}
          <Route path="/change-password-first-time" element={
            <ForcePasswordRoute>
              <ForceChangePasswordPage />
            </ForcePasswordRoute>
          } />

          {/* Mọi role đã login */}
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/admin/users/:id" element={
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <AdminUserDetailPage />
            </RoleProtectedRoute>
          } />
          <Route path="/admin/facilities/:id/edit" element={
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <AdminFacilityEditPage />
            </RoleProtectedRoute>
          } />
          <Route path="/admin/registrations/:id" element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'FIELD_INSPECTOR']}>
              <AdminRegistrationDetailPage />
            </RoleProtectedRoute>
          } />
          <Route path="/admin/approvals/:id" element={
            <RoleProtectedRoute allowedRoles={['ADMIN', 'FIELD_INSPECTOR']}>
              <AdminRegistrationDetailPage />
            </RoleProtectedRoute>
          } />
          <Route path="/inspector/registrations/:id" element={
            <RoleProtectedRoute allowedRoles={['FIELD_INSPECTOR', 'ADMIN']}>
              <AdminRegistrationDetailPage />
            </RoleProtectedRoute>
          } />

          {/* Customer only */}
          <Route path="/facilities/:facilityId/reserve" element={
            <RoleProtectedRoute allowedRoles={['CUSTOMER']}>
              <CreateReservationPage />
            </RoleProtectedRoute>
          } />
          <Route path="/reserve/:facilityId" element={
            <RoleProtectedRoute allowedRoles={['CUSTOMER']}>
              <CreateReservationPage />
            </RoleProtectedRoute>
          } />
          <Route path="/my-reservations" element={
            <RoleProtectedRoute allowedRoles={['CUSTOMER']}>
              <CustomerReservationsPage />
            </RoleProtectedRoute>
          } />
          <Route path="/my-reservations/:id" element={
            <RoleProtectedRoute allowedRoles={['CUSTOMER']}>
              <CustomerReservationDetailPage />
            </RoleProtectedRoute>
          } />
          <Route path="/my-contracts" element={
            <RoleProtectedRoute allowedRoles={['CUSTOMER']}>
              <CustomerContractsPage />
            </RoleProtectedRoute>
          } />
          <Route path="/my-contracts/:id" element={
            <RoleProtectedRoute allowedRoles={['CUSTOMER']}>
              <ContractDetailPage />
            </RoleProtectedRoute>
          } />
          <Route path="/contracts/:id" element={
            <RoleProtectedRoute allowedRoles={['CUSTOMER', 'PROVIDER']}>
              <ContractDetailPage />
            </RoleProtectedRoute>
          } />
          <Route path="/my-favorites" element={
            <RoleProtectedRoute allowedRoles={['CUSTOMER']}>
              <FavoriteFacilitiesPage />
            </RoleProtectedRoute>
          } />
          <Route path="/submit-complaint/:reservationId" element={
            <RoleProtectedRoute allowedRoles={['CUSTOMER']}>
              <SubmitComplaintPage />
            </RoleProtectedRoute>
          } />
          <Route path="/my-complaints" element={
            <RoleProtectedRoute allowedRoles={['CUSTOMER']}>
              <CustomerComplaintsPage />
            </RoleProtectedRoute>
          } />

          {/* Provider only */}
          <Route path="/provider/reservations" element={
            <RoleProtectedRoute allowedRoles={['PROVIDER']}>
              <ProviderReservationsPage />
            </RoleProtectedRoute>
          } />
          <Route path="/provider/reservations/:id" element={
            <RoleProtectedRoute allowedRoles={['PROVIDER']}>
              <ProviderReservationDetailPage />
            </RoleProtectedRoute>
          } />
          <Route path="/provider-reservations" element={
            <RoleProtectedRoute allowedRoles={['PROVIDER']}>
              <ProviderReservationsPage />
            </RoleProtectedRoute>
          } />
          <Route path="/provider-reservations/:id" element={
            <RoleProtectedRoute allowedRoles={['PROVIDER']}>
              <ProviderReservationDetailPage />
            </RoleProtectedRoute>
          } />
          <Route path="/provider/reservations/:id/create-contract" element={
            <RoleProtectedRoute allowedRoles={['PROVIDER']}>
              <ProviderCreateContractPage />
            </RoleProtectedRoute>
          } />
          <Route path="/provider-reservations/:id/create-contract" element={
            <RoleProtectedRoute allowedRoles={['PROVIDER']}>
              <ProviderCreateContractPage />
            </RoleProtectedRoute>
          } />
          <Route path="/contracts/create/:reservationId" element={
            <RoleProtectedRoute allowedRoles={['PROVIDER']}>
              <ProviderCreateContractPage />
            </RoleProtectedRoute>
          } />

          {/* Customer + Provider */}
          <Route path="/chat" element={
            <RoleProtectedRoute allowedRoles={['CUSTOMER', 'PROVIDER']}>
              <ChatPage />
            </RoleProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
