import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterCustomerPage from './pages/auth/RegisterCustomerPage';
import RegisterProviderPage from './pages/auth/RegisterProviderPage';
import DashboardPage from './pages/DashboardPage';
import SearchPage from './pages/facility/SearchPage';
import CustomerReservationsPage from './pages/customer/CustomerReservationsPage';
import CustomerContractsPage from './pages/CustomerContractsPage';
import FavoriteFacilitiesPage from './pages/customer/FavoriteFacilitiesPage';
import SubmitComplaintPage from './pages/customer/SubmitComplaintPage';
import CustomerComplaintsPage from './pages/customer/CustomerComplaintsPage';
import ProviderReservationsPage from './pages/provider/ProviderReservationsPage';
import FacilityListPage from './pages/facility/FacilityListPage';
import FacilityDetailPage from './pages/facility/FacilityDetailPage';
import ChatPage from './pages/ChatPage';
import ScrollToTop from './components/common/ScrollToTop';

// Component bảo vệ Route yêu cầu Đăng nhập và Quyền
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Đang tải ứng dụng ParkLink...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Nếu route có yêu cầu quyền cụ thể, kiểm tra xem user có quyền đó không
  if (allowedRoles && (!user?.role?.name || !allowedRoles.includes(user.role.name))) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppContent() {
  return (
    <div className="flex flex-col min-h-screen font-sans antialiased text-slate-800 bg-slate-50">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterCustomerPage />} />
          <Route path="/register-provider" element={<RegisterProviderPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/facilities" element={<FacilityListPage />} />
          <Route
            path="/my-reservations"
            element={
              <ProtectedRoute>
                <CustomerReservationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-contracts"
            element={
              <ProtectedRoute>
                <CustomerContractsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-favorites"
            element={
              <ProtectedRoute>
                <FavoriteFacilitiesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit-complaint/:reservationId"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <SubmitComplaintPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-complaints"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerComplaintsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider/reservations"
            element={
              <ProtectedRoute>
                <ProviderReservationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/provider-reservations"
            element={
              <ProtectedRoute>
                <ProviderReservationsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/facility/:id" element={<FacilityDetailPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'PROVIDER']}>
                <ChatPage />
              </ProtectedRoute>
            }
          />
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
