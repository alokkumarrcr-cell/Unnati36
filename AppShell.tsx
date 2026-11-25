import React, { useState } from 'react';
import {
  Award,
  BarChart3,
  Bell,
  Bookmark,
  BookOpen,
  Briefcase,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  CreditCard,
  FileCheck2,
  FolderKanban,
  Home,
  Info,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Menu,
  MessageSquare,
  Phone,
  PlusCircle,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PUBLIC_SIDEBAR: NavItem[] = [
  { label: 'Home', to: '/home', icon: Home },
  { label: 'Explore', to: '/explore', icon: Compass },
  { label: 'Learn', to: '/learn', icon: BookOpen },
  { label: 'Earn', to: '/earn', icon: Briefcase },
  { label: 'Grow', to: '/grow', icon: Award },
  { label: 'Connect', to: '/connect', icon: Users },
  { label: 'About', to: '/about', icon: Info },
  { label: 'Contact', to: '/contact', icon: Phone },
  { label: 'Pricing', to: '/pricing', icon: CreditCard },
  { label: 'Section Guide', to: '/guide', icon: MapIcon },
];

const USER_SIDEBAR: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Discover', to: '/dashboard/discover', icon: Compass },
  { label: 'My Applications', to: '/dashboard/applications', icon: FileCheck2 },
  { label: 'Saved Items', to: '/dashboard/saved', icon: Bookmark },
  { label: 'My Enquiries', to: '/dashboard/enquiries', icon: MessageSquare },
  { label: 'Notifications', to: '/dashboard/notifications', icon: Bell },
  { label: 'My Profile', to: '/dashboard/profile', icon: User },
  { label: 'Settings', to: '/dashboard/settings', icon: Settings },
];

const PROVIDER_SIDEBAR: NavItem[] = [
  { label: 'Provider Overview', to: '/provider/dashboard', icon: LayoutDashboard },
  { label: 'Create Listing', to: '/provider/create-listing', icon: PlusCircle },
  { label: 'Manage Listings', to: '/provider/manage-listings', icon: FolderKanban },
  { label: 'Enquiries', to: '/provider/enquiries', icon: MessageSquare },
  { label: 'Verification', to: '/provider/verification', icon: ShieldCheck },
  { label: 'Analytics', to: '/provider/analytics', icon: BarChart3 },
  { label: 'Subscription', to: '/provider/subscription', icon: CreditCard },
  { label: 'Settings', to: '/provider/settings', icon: Settings },
];

const ADMIN_SIDEBAR: NavItem[] = [
  { label: 'Overview', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'User Management', to: '/admin/users', icon: Users },
  { label: 'Provider Management', to: '/admin/providers', icon: Building2 },
  { label: 'Listing Approvals', to: '/admin/approvals', icon: FileCheck2 },
  { label: 'Categories', to: '/admin/categories', icon: FolderKanban },
  { label: 'Reports & Complaints', to: '/admin/reports', icon: ShieldAlert },
  { label: 'Featured Listings', to: '/admin/featured', icon: Sparkles },
  { label: 'Revenue & Plans', to: '/admin/revenue', icon: CreditCard },
  { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
  { label: 'Platform Settings', to: '/admin/settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout, language, setLanguage, t } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const path = location.pathname;
  const isUserArea = path.startsWith('/dashboard');
  const isProviderArea = path.startsWith('/provider/') && path !== '/provider/register';
  const isAdminArea = path.startsWith('/admin');
  const isWorkspace = isUserArea || isProviderArea || isAdminArea;

  const activeNavList = isAdminArea
    ? ADMIN_SIDEBAR
    : isProviderArea
      ? PROVIDER_SIDEBAR
      : isUserArea
        ? USER_SIDEBAR
        : PUBLIC_SIDEBAR;

  const isActive = (to: string) => {
    if (to === '/home' && (path === '/' || path === '/home')) return true;
    return path === to;
  };

  const breadcrumbLabel =
    activeNavList.find((i) => isActive(i.to))?.label ||
    (path.startsWith('/opportunity/')
      ? 'Opportunity Details'
      : path.startsWith('/provider/')
        ? 'Provider Profile'
        : 'UNNATI');

  return (
    <div className="min-h-screen bg-[#F8F8F2] text-[#202820] flex flex-col">
      {/* Top Bar Contract: 3 Clean Zones */}
      <header className="sticky top-0 z-30 h-16 bg-[#FFFFFF]/95 backdrop-blur border-b border-[#E6EAE6] px-4 lg:px-8 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark (+ Mobile menu trigger) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="lg:hidden p-2 rounded-lg border border-[#E6EAE6] text-[#202820] hover:bg-[#F8F8F2]"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link
            to="/home"
            className="font-display text-xl font-extrabold tracking-tight text-[#145C43] whitespace-nowrap shrink-0"
          >
            UNNATI
          </Link>
        </div>

        {/* Zone 2: 5 concise single-line text links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#78847D]">
          <Link
            to="/home"
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#145C43] ${
              path === '/' || path === '/home' ? 'text-[#145C43] font-semibold' : ''
            }`}
          >
            {t('navHome')}
          </Link>
          <Link
            to="/explore"
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#145C43] ${
              path === '/explore' ? 'text-[#145C43] font-semibold' : ''
            }`}
          >
            {t('navExplore')}
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setCategoriesOpen(true)}
            onMouseLeave={() => setCategoriesOpen(false)}
          >
            <button
              type="button"
              onClick={() => setCategoriesOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors hover:text-[#145C43] ${
                ['/learn', '/earn', '/grow', '/connect'].includes(path)
                  ? 'text-[#145C43] font-semibold'
                  : ''
              }`}
            >
              {t('navCategories')}
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <AnimatePresence>
              {categoriesOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.14 }}
                  className="absolute left-0 top-full pt-2 w-56 z-40"
                >
                  <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-xl shadow-md p-2 flex flex-col gap-1">
                    <Link
                      to="/learn"
                      onClick={() => setCategoriesOpen(false)}
                      className="px-3 py-2 rounded-lg text-sm text-[#202820] hover:bg-[#F8F8F2] hover:text-[#145C43]"
                    >
                      Learn · Courses & Skills
                    </Link>
                    <Link
                      to="/earn"
                      onClick={() => setCategoriesOpen(false)}
                      className="px-3 py-2 rounded-lg text-sm text-[#202820] hover:bg-[#F8F8F2] hover:text-[#145C43]"
                    >
                      Earn · Jobs & Internships
                    </Link>
                    <Link
                      to="/grow"
                      onClick={() => setCategoriesOpen(false)}
                      className="px-3 py-2 rounded-lg text-sm text-[#202820] hover:bg-[#F8F8F2] hover:text-[#145C43]"
                    >
                      Grow · Sports & Arts
                    </Link>
                    <Link
                      to="/connect"
                      onClick={() => setCategoriesOpen(false)}
                      className="px-3 py-2 rounded-lg text-sm text-[#202820] hover:bg-[#F8F8F2] hover:text-[#145C43]"
                    >
                      Connect · Local Providers
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            to="/about"
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#145C43] ${
              path === '/about' ? 'text-[#145C43] font-semibold' : ''
            }`}
          >
            {t('navAbout')}
          </Link>
          <Link
            to="/guide"
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#145C43] ${
              path === '/guide' ? 'text-[#145C43] font-semibold' : ''
            }`}
          >
            {t('navGuide')}
          </Link>
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-lg bg-[#145C43] text-[#FFFFFF] text-xs font-semibold hover:bg-[#0F4934] transition-colors whitespace-nowrap shrink-0"
            >
              {t('dashboard')}
            </Link>
          ) : (
            <Link
              to="/register"
              className="px-4 py-2 rounded-lg bg-[#145C43] text-[#FFFFFF] text-xs font-semibold hover:bg-[#0F4934] transition-colors whitespace-nowrap shrink-0"
            >
              {t('getStarted')}
            </Link>
          )}
        </div>
      </header>

      {/* Main Workspace Grid: Collapsible Desktop Sidebar + Content Viewport */}
      <div className="flex-1 flex min-w-0">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden lg:flex flex-col justify-between border-r border-[#E6EAE6] bg-[#FFFFFF] shrink-0 transition-all duration-200 ${
            sidebarCollapsed ? 'w-[72px]' : 'w-[252px]'
          }`}
        >
          <div className="p-3 flex flex-col gap-5">
            {/* Portal Switcher inside Sidebar */}
            {!sidebarCollapsed && (
              <div className="px-2 pt-1">
                <div className="text-[11px] font-medium text-[#78847D] mb-2">
                  {isWorkspace ? 'Workspace Portals' : 'Platform Sections'}
                </div>
                <div className="grid grid-cols-2 gap-1 p-1 bg-[#F8F8F2] rounded-lg border border-[#E6EAE6]">
                  <Link
                    to="/home"
                    className={`px-2 py-1 text-center text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      !isWorkspace
                        ? 'bg-[#FFFFFF] text-[#145C43] shadow-xs'
                        : 'text-[#78847D] hover:text-[#202820]'
                    }`}
                  >
                    Public
                  </Link>
                  <Link
                    to={user ? '/dashboard' : '/login'}
                    className={`px-2 py-1 text-center text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      isUserArea
                        ? 'bg-[#FFFFFF] text-[#145C43] shadow-xs'
                        : 'text-[#78847D] hover:text-[#202820]'
                    }`}
                  >
                    User
                  </Link>
                  <Link
                    to="/provider/dashboard"
                    className={`px-2 py-1 text-center text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      isProviderArea
                        ? 'bg-[#FFFFFF] text-[#145C43] shadow-xs'
                        : 'text-[#78847D] hover:text-[#202820]'
                    }`}
                  >
                    Provider
                  </Link>
                  <Link
                    to="/admin/dashboard"
                    className={`px-2 py-1 text-center text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      isAdminArea
                        ? 'bg-[#FFFFFF] text-[#145C43] shadow-xs'
                        : 'text-[#78847D] hover:text-[#202820]'
                    }`}
                  >
                    Admin
                  </Link>
                </div>
              </div>
            )}

            <nav className="flex flex-col gap-1" aria-label="Sidebar Navigation">
              {activeNavList.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    title={item.label}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'text-[#145C43] font-semibold'
                        : 'text-[#78847D] hover:text-[#202820] hover:bg-[#F8F8F2]'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="sidebar-active-indicator"
                        className="absolute inset-0 bg-[#145C43]/8 rounded-lg border border-[#145C43]/20"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      />
                    )}
                    <Icon className="w-4 h-4 relative z-10 shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="relative z-10 truncate">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-3 border-t border-[#E6EAE6] flex flex-col gap-2">
            {!sidebarCollapsed && (
              <div className="flex items-center justify-between px-2 py-1.5 bg-[#F8F8F2] rounded-lg border border-[#E6EAE6]">
                <span className="text-xs text-[#78847D]">Language</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                      language === 'en'
                        ? 'bg-[#145C43] text-[#FFFFFF]'
                        : 'text-[#78847D] hover:text-[#202820]'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('kn')}
                    className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                      language === 'kn'
                        ? 'bg-[#145C43] text-[#FFFFFF]'
                        : 'text-[#78847D] hover:text-[#202820]'
                    }`}
                  >
                    ಕನ್ನಡ
                  </button>
                </div>
              </div>
            )}

            {user ? (
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  navigate('/home');
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#78847D] hover:text-[#202820] hover:bg-[#F8F8F2]"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Sign Out</span>}
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#145C43] hover:bg-[#F8F8F2]"
              >
                <User className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>{t('signIn')}</span>}
              </Link>
            )}

            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="flex items-center justify-center p-2 rounded-lg text-[#78847D] hover:text-[#202820] hover:bg-[#F8F8F2]"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 flex flex-col pb-20 lg:pb-0">
          {isWorkspace && (
            <div className="bg-[#FFFFFF] border-b border-[#E6EAE6] px-6 py-3 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[#78847D]">
                <Link to="/home" className="hover:text-[#145C43]">
                  UNNATI
                </Link>
                <span aria-hidden="true">/</span>
                <span className="font-medium text-[#202820]">{breadcrumbLabel}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#78847D]">
                {user && (
                  <span>
                    Signed in as <strong className="text-[#202820]">{user.name}</strong> ·{' '}
                    <span className="capitalize">{user.role}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16 }}
            className="flex-1"
          >
            {children}
          </motion.div>

          {/* Quiet Footer */}
          <footer className="border-t border-[#E6EAE6] bg-[#FFFFFF] px-6 lg:px-10 py-8 mt-12">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-6">
              <div className="max-w-md">
                <div className="font-display font-bold text-base text-[#145C43] mb-1">UNNATI</div>
                <p className="text-xs text-[#78847D] leading-relaxed">
                  {t('closingStatement')}
                </p>
                <p className="text-xs text-[#78847D] mt-2">
                  Raichur Pilot, Karnataka · Listings labeled Sample Pilot represent demonstration records until local providers complete onboarding.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs">
                <div className="flex flex-col gap-2">
                  <span className="font-semibold text-[#202820]">Discover</span>
                  <Link to="/explore" className="text-[#78847D] hover:text-[#145C43]">Explore All</Link>
                  <Link to="/learn" className="text-[#78847D] hover:text-[#145C43]">Learn</Link>
                  <Link to="/earn" className="text-[#78847D] hover:text-[#145C43]">Earn</Link>
                  <Link to="/grow" className="text-[#78847D] hover:text-[#145C43]">Grow</Link>
                  <Link to="/connect" className="text-[#78847D] hover:text-[#145C43]">Connect</Link>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="font-semibold text-[#202820]">Portals</span>
                  <Link to="/dashboard" className="text-[#78847D] hover:text-[#145C43]">User Dashboard</Link>
                  <Link to="/provider/dashboard" className="text-[#78847D] hover:text-[#145C43]">Provider Portal</Link>
                  <Link to="/admin/dashboard" className="text-[#78847D] hover:text-[#145C43]">Admin Center</Link>
                  <Link to="/pricing" className="text-[#78847D] hover:text-[#145C43]">Pricing Plans</Link>
                  <Link to="/guide" className="text-[#78847D] hover:text-[#145C43]">Section Guide</Link>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="font-semibold text-[#202820]">Governance</span>
                  <Link to="/about" className="text-[#78847D] hover:text-[#145C43]">About UNNATI</Link>
                  <Link to="/contact" className="text-[#78847D] hover:text-[#145C43]">Contact</Link>
                  <Link to="/legal/privacy" className="text-[#78847D] hover:text-[#145C43]">Privacy Policy</Link>
                  <Link to="/legal/terms" className="text-[#78847D] hover:text-[#145C43]">Terms & Conditions</Link>
                  <Link to="/legal/guidelines" className="text-[#78847D] hover:text-[#145C43]">Listing Guidelines</Link>
                  <Link to="/legal/grievance" className="text-[#78847D] hover:text-[#145C43]">Grievance Redressal</Link>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#202820]/40 lg:hidden flex"
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.2 }}
              className="w-72 max-w-[82vw] bg-[#FFFFFF] h-full p-4 flex flex-col justify-between overflow-y-auto"
            >
              <div>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E6EAE6]">
                  <span className="font-display font-extrabold text-lg text-[#145C43]">UNNATI</span>
                  <button
                    type="button"
                    onClick={() => setMobileDrawerOpen(false)}
                    aria-label="Close menu"
                    className="p-2 rounded-lg text-[#78847D] hover:bg-[#F8F8F2]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5 mb-4 p-1 bg-[#F8F8F2] rounded-lg border border-[#E6EAE6]">
                  <Link
                    to="/home"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="px-2 py-1.5 text-center text-xs font-medium rounded-md bg-[#FFFFFF] text-[#145C43]"
                  >
                    Public
                  </Link>
                  <Link
                    to={user ? '/dashboard' : '/login'}
                    onClick={() => setMobileDrawerOpen(false)}
                    className="px-2 py-1.5 text-center text-xs font-medium rounded-md text-[#202820]"
                  >
                    User
                  </Link>
                  <Link
                    to="/provider/dashboard"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="px-2 py-1.5 text-center text-xs font-medium rounded-md text-[#202820]"
                  >
                    Provider
                  </Link>
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="px-2 py-1.5 text-center text-xs font-medium rounded-md text-[#202820]"
                  >
                    Admin
                  </Link>
                </div>

                <nav className="flex flex-col gap-1">
                  {activeNavList.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileDrawerOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                          isActive(item.to)
                            ? 'bg-[#145C43]/10 text-[#145C43] font-semibold'
                            : 'text-[#202820] hover:bg-[#F8F8F2]'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-[#E6EAE6] flex flex-col gap-2">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="text-xs text-[#78847D]">Language</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setLanguage('en')}
                      className={`px-2 py-1 text-xs rounded ${
                        language === 'en' ? 'bg-[#145C43] text-[#FFFFFF]' : 'bg-[#F8F8F2]'
                      }`}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('kn')}
                      className={`px-2 py-1 text-xs rounded ${
                        language === 'kn' ? 'bg-[#145C43] text-[#FFFFFF]' : 'bg-[#F8F8F2]'
                      }`}
                    >
                      ಕನ್ನಡ
                    </button>
                  </div>
                </div>
                {user ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      setMobileDrawerOpen(false);
                      navigate('/home');
                    }}
                    className="w-full py-2.5 rounded-lg border border-[#E6EAE6] text-sm font-medium text-[#202820]"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="w-full py-2.5 rounded-lg bg-[#145C43] text-[#FFFFFF] text-center text-sm font-semibold"
                  >
                    Sign In / Register
                  </Link>
                )}
              </div>
            </motion.div>
            <div className="flex-1" onClick={() => setMobileDrawerOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation (compact <= 56px, well under 15% mobile height) */}
      <nav
        aria-label="Mobile quick navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-14 bg-[#FFFFFF] border-t border-[#E6EAE6] grid grid-cols-5 items-center"
      >
        <Link
          to="/home"
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] ${
            path === '/' || path === '/home' ? 'text-[#145C43] font-semibold' : 'text-[#78847D]'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <Link
          to="/explore"
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] ${
            path === '/explore' ? 'text-[#145C43] font-semibold' : 'text-[#78847D]'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Explore</span>
        </Link>
        <Link
          to="/learn"
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] ${
            path === '/learn' ? 'text-[#145C43] font-semibold' : 'text-[#78847D]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Learn</span>
        </Link>
        <Link
          to="/earn"
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] ${
            path === '/earn' ? 'text-[#145C43] font-semibold' : 'text-[#78847D]'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Earn</span>
        </Link>
        <Link
          to={user ? '/dashboard' : '/login'}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] ${
            isUserArea || path === '/login' ? 'text-[#145C43] font-semibold' : 'text-[#78847D]'
          }`}
        >
          <User className="w-4 h-4" />
          <span>{user ? 'Account' : 'Sign In'}</span>
        </Link>
      </nav>
    </div>
  );
}
