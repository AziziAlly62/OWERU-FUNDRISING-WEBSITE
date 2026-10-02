import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { I18nProvider } from './i18n'
import { AuthProvider, useAuth } from './auth'
import ErrorBoundary from './components/ErrorBoundary'
import { PageLoader } from './components/LoadingSpinner'
import Layout from './components/Layout'
import { ROLES } from './auth'

// Public pages
const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Courses = lazy(() => import('./pages/Courses'))
const CourseDetail = lazy(() => import('./pages/CourseDetail'))
const FundingDetails = lazy(() => import('./pages/FundingDetails'))
// Only the tokenised link still works. The public "/track" page was removed;
// two applicants already hold OWR- links, so /track/:token must keep running.
const TrackRequest = lazy(() => import('./pages/TrackRequest'))
const Ledger = lazy(() => import('./pages/Ledger'))
const Reports = lazy(() => import('./pages/Reports'))
const Safeguarding = lazy(() => import('./pages/Safeguarding'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Complaints = lazy(() => import('./pages/Complaints'))
// Apply page removed: applications are made from the applicant portal
// Partner, volunteer and donate-goods pages removed: all three now go through
// the contact form, which records the intent and the answers for it.

// Auth page
const Login = lazy(() => import('./pages/Login'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))

// Admin
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminRequests = lazy(() => import('./pages/admin/AdminRequests'))
const AdminItems = lazy(() => import('./pages/admin/AdminItems'))
const AdminDonations = lazy(() => import('./pages/admin/AdminDonations'))
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments'))
const AdminSuppliers = lazy(() => import('./pages/admin/AdminSuppliers'))
const AdminInvoices = lazy(() => import('./pages/admin/AdminInvoices'))
const AdminEquipment = lazy(() => import('./pages/admin/AdminEquipment'))
const AdminReports = lazy(() => import('./pages/admin/AdminReports'))
const AdminQuotes = lazy(() => import('./pages/admin/AdminQuotes'))
const AdminLedger = lazy(() => import('./pages/admin/AdminLedger'))
const AdminAudit = lazy(() => import('./pages/admin/AdminAudit'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminChurches = lazy(() => import('./pages/admin/AdminChurches'))

// Portal
const DonorDashboard = lazy(() => import('./pages/portal/DonorDashboard'))
const ChurchPortal = lazy(() => import('./pages/portal/ChurchPortal'))
const ApplicantPortal = lazy(() => import('./pages/portal/ApplicantPortal'))
const BoardReview = lazy(() => import('./pages/portal/BoardReview'))

function RequireRole({ children, role }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (!ROLES[user.role]) return <Navigate to="/" replace />
  if (role) {
    const allowed = Array.isArray(role) ? role : [role]
    if (!allowed.includes(user.role)) {
      return <Navigate to={ROLES[user.role]?.path || '/login'} replace />
    }
  }
  return children
}

function PortalLanding() {
  const { user } = useAuth()
  const path = user ? ROLES[user.role]?.path || '/login' : '/login'
  return <Navigate to={path} replace />
}

/* /courses was the old name for the public request/causes list. Links all
   over the site pointed at /courses#causes, so it stays as a redirect that
   keeps the hash and query string rather than dropping the anchor. */
function CoursesAlias() {
  const { search, hash } = useLocation()
  return <Navigate to={{ pathname: '/requests', search, hash }} replace />
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

const RouteLoader = ({ children }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
)

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <ErrorBoundary>
          <ScrollToTop />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<RouteLoader><Home /></RouteLoader>} />
              <Route path="/about" element={<RouteLoader><About /></RouteLoader>} />
              <Route path="/contact" element={<RouteLoader><Contact /></RouteLoader>} />
          <Route path="/requests" element={<RouteLoader><Courses /></RouteLoader>} />
          <Route path="/requests/:id" element={<RouteLoader><FundingDetails /></RouteLoader>} />
          <Route path="/courses" element={<CoursesAlias />} />
          <Route path="/courses/:slug" element={<RouteLoader><CourseDetail /></RouteLoader>} />
          <Route path="/track/:token" element={<RouteLoader><TrackRequest /></RouteLoader>} />

          {/* The three removed pages have live inbound links from search
              engines and bookmarks. Send them to the contact form rather
              than a 404, since that is where that kind of request goes now. */}
          <Route path="/partner" element={<Navigate to="/contact" replace />} />
          <Route path="/volunteer" element={<Navigate to="/contact" replace />} />
          <Route path="/donate-goods" element={<Navigate to="/contact" replace />} />
          <Route path="/track" element={<Navigate to="/contact" replace />} />

          <Route path="/ledger" element={<RouteLoader><Ledger /></RouteLoader>} />
              <Route path="/reports" element={<RouteLoader><Reports /></RouteLoader>} />
              <Route path="/safeguarding" element={<RouteLoader><Safeguarding /></RouteLoader>} />
              <Route path="/privacy" element={<RouteLoader><Privacy /></RouteLoader>} />
              <Route path="/complaints" element={<RouteLoader><Complaints /></RouteLoader>} />
              <Route path="*" element={<RouteLoader><NotFound /></RouteLoader>} />
            </Route>

            <Route path="/login" element={<RouteLoader><Login /></RouteLoader>} />
            <Route path="/forgot-password" element={<RouteLoader><ResetPassword /></RouteLoader>} />
            <Route path="/reset-password" element={<RouteLoader><ResetPassword /></RouteLoader>} />
            <Route path="/apply" element={<Navigate to="/portal" replace />} />

            <Route path="/portal" element={<RequireRole><PortalLanding /></RequireRole>} />

            <Route path="/portal/requests" element={<RequireRole role={['admin', 'manager']}><AdminLayout /></RequireRole>}>
              <Route index element={<RouteLoader><AdminRequests /></RouteLoader>} />
            </Route>

            <Route path="/portal/dashboard" element={<RequireRole role={['admin', 'manager']}><AdminLayout /></RequireRole>}>
              <Route index element={<RouteLoader><AdminDashboard /></RouteLoader>} />
            </Route>
            <Route path="/portal" element={<RequireRole role={['admin', 'manager']}><AdminLayout /></RequireRole>}>
              <Route path="items" element={<RouteLoader><AdminItems /></RouteLoader>} />
              <Route path="quotes" element={<RouteLoader><AdminQuotes /></RouteLoader>} />
              <Route path="suppliers" element={<RouteLoader><AdminSuppliers /></RouteLoader>} />
              <Route path="equipment" element={<RouteLoader><AdminEquipment /></RouteLoader>} />
              <Route path="reports" element={<RouteLoader><AdminReports /></RouteLoader>} />
              <Route path="churches" element={<RouteLoader><AdminChurches /></RouteLoader>} />
            </Route>
            <Route path="/portal" element={<RequireRole role="admin"><AdminLayout /></RequireRole>}>
              <Route path="donations" element={<RouteLoader><AdminDonations /></RouteLoader>} />
              <Route path="payments" element={<RouteLoader><AdminPayments /></RouteLoader>} />
              <Route path="invoices" element={<RouteLoader><AdminInvoices /></RouteLoader>} />
              <Route path="ledger" element={<RouteLoader><AdminLedger /></RouteLoader>} />
              <Route path="audit-logs" element={<RouteLoader><AdminAudit /></RouteLoader>} />
              <Route path="users" element={<RouteLoader><AdminUsers /></RouteLoader>} />
            </Route>

            <Route path="/portal/donor" element={<RequireRole role="donor"><RouteLoader><DonorDashboard /></RouteLoader></RequireRole>} />
            <Route path="/portal/church" element={<RequireRole role="endorser"><RouteLoader><ChurchPortal /></RouteLoader></RequireRole>} />
            <Route path="/portal/applicant" element={<RequireRole role="applicant"><RouteLoader><ApplicantPortal /></RouteLoader></RequireRole>} />
            <Route path="/portal/review" element={<RequireRole role="reviewer"><RouteLoader><BoardReview /></RouteLoader></RequireRole>} />
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </I18nProvider>
  )
}