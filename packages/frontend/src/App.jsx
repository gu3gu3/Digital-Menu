import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import DemoPage from './pages/DemoPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminRegisterPage from './pages/AdminRegisterPage'
import EmailVerificationPage from './pages/EmailVerificationPage'
import PublicMenuPage from './pages/PublicMenuPage'
import AdminLayout from './components/AdminLayout'
import AdminDashboard from './pages/AdminDashboard'
import AdminRestaurantPage from './pages/AdminRestaurantPage'
import AdminMenuPage from './pages/AdminMenuPage'
import AdminTablesPage from './pages/AdminTablesPage'
import AdminOrdersPage from './pages/AdminOrdersPage'
import AdminStaffPage from './pages/AdminStaffPage'
import AdminSettingsPage from './pages/AdminSettingsPage'
import NotificationsPage from './pages/NotificationsPage'
import StaffLoginPage from './pages/StaffLoginPage'
import StaffDashboard from './pages/StaffDashboard'
import SuperAdminLoginPage from './pages/SuperAdminLoginPage'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import SuperAdminSettingsPage from './pages/SuperAdminSettingsPage'
import SubscriptionsListPage from './pages/SubscriptionsListPage'
import ExpiringSubscriptionsPage from './pages/ExpiringSubscriptionsPage'
import SendNotificationsPage from './pages/SendNotificationsPage'
import RenewSubscriptionPage from './pages/RenewSubscriptionPage'
import PlansManagementPage from './pages/PlansManagementPage'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/menu/:slug" element={<PublicMenuPage />} />
          
          {/* Admin authentication routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/register" element={<AdminRegisterPage />} />
          
          {/* Staff authentication routes */}
          <Route path="/staff/login" element={<StaffLoginPage />} />
          <Route path="/staff/dashboard" element={<StaffDashboard />} />
          
          {/* Super Admin routes */}
          <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />
          <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
          <Route path="/super-admin/settings" element={<SuperAdminSettingsPage />} />
          <Route path="/super-admin/subscriptions" element={<SubscriptionsListPage />} />
          <Route path="/super-admin/expiring" element={<ExpiringSubscriptionsPage />} />
          <Route path="/super-admin/notifications" element={<SendNotificationsPage />} />
          <Route path="/super-admin/subscriptions/:id/renew" element={<RenewSubscriptionPage />} />
          <Route path="/super-admin/plans" element={<PlansManagementPage />} />
          
          {/* Admin panel routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="restaurant" element={<AdminRestaurantPage />} />
            <Route path="menu" element={<AdminMenuPage />} />
            <Route path="tables" element={<AdminTablesPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="staff" element={<AdminStaffPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
        </Routes>
      </div>
    </Router>
  )
}

export default App
