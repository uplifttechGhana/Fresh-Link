import type { UserRole } from './authStore';

export type NavTab = {
  id: string;
  labelKey: string;
  route: string;
};

export type RoleNavConfig = {
  tabs: NavTab[];
  getActiveTab: (pathname: string) => string;
  isMessagesScreen: (pathname: string) => boolean;
};

export const BUYER_NAV: RoleNavConfig = {
  tabs: [
    { id: 'home', labelKey: 'nav.home', route: '/buyer/home' },
    { id: 'explore', labelKey: 'common.search', route: '/buyer/search' },
    { id: 'farmers', labelKey: 'buyer.saved', route: '/buyer/saved' },
    { id: 'cart', labelKey: 'buyer.cart', route: '/buyer/cart' },
  ],
  getActiveTab(pathname) {
    if (pathname.startsWith('/buyer/cart') || pathname.startsWith('/buyer/checkout')) return 'cart';
    if (pathname.startsWith('/buyer/saved') || pathname.startsWith('/buyer/farmer/')) return 'farmers';
    if (
      pathname.startsWith('/buyer/search') ||
      pathname.startsWith('/buyer/product/') ||
      pathname.startsWith('/buyer/compare') ||
      pathname.startsWith('/buyer/map') ||
      pathname.startsWith('/buyer/farmers')
    ) {
      return 'explore';
    }
    return 'home';
  },
  isMessagesScreen(pathname) {
    return pathname.startsWith('/buyer/messages') || pathname.startsWith('/buyer/chat/');
  },
};

export const FARMER_NAV: RoleNavConfig = {
  tabs: [
    { id: 'home', labelKey: 'nav.home', route: '/farmer/dashboard' },
    { id: 'produce', labelKey: 'nav.produce', route: '/farmer/produce' },
    { id: 'orders', labelKey: 'nav.orders', route: '/farmer/orders' },
    { id: 'wallet', labelKey: 'nav.wallet', route: '/farmer/wallet' },
  ],
  getActiveTab(pathname) {
    if (pathname.startsWith('/farmer/produce')) return 'produce';
    if (pathname.startsWith('/farmer/orders')) return 'orders';
    if (pathname.startsWith('/farmer/wallet')) return 'wallet';
    return 'home';
  },
  isMessagesScreen(pathname) {
    return pathname.startsWith('/farmer/messages') || pathname.startsWith('/farmer/chat/');
  },
};

export const TRANSPORT_NAV: RoleNavConfig = {
  tabs: [
    { id: 'home', labelKey: 'nav.dashboard', route: '/transport/dashboard' },
    { id: 'jobs', labelKey: 'nav.jobs', route: '/transport/jobs' },
    { id: 'earnings', labelKey: 'nav.earnings', route: '/transport/earnings' },
    { id: 'wallet', labelKey: 'nav.wallet', route: '/transport/wallet' },
  ],
  getActiveTab(pathname) {
    if (pathname.startsWith('/transport/jobs') || pathname.startsWith('/transport/delivery/')) {
      return 'jobs';
    }
    if (pathname.startsWith('/transport/earnings') || pathname.startsWith('/transport/completed')) {
      return 'earnings';
    }
    if (pathname.startsWith('/transport/wallet')) return 'wallet';
    return 'home';
  },
  isMessagesScreen(pathname) {
    return pathname.startsWith('/transport/messages') || pathname.startsWith('/transport/chat/');
  },
};

export const ADMIN_NAV: RoleNavConfig = {
  tabs: [
    { id: 'home', labelKey: 'nav.dashboard', route: '/admin/dashboard' },
    { id: 'users', labelKey: 'nav.users', route: '/admin/users' },
    { id: 'monitor', labelKey: 'nav.monitor', route: '/admin/monitor' },
    { id: 'reports', labelKey: 'nav.reports', route: '/admin/reports' },
  ],
  getActiveTab(pathname) {
    if (pathname.startsWith('/admin/users')) return 'users';
    if (pathname.startsWith('/admin/monitor') || pathname.startsWith('/admin/support')) return 'monitor';
    if (
      pathname.startsWith('/admin/reports') ||
      pathname.startsWith('/admin/payments')
    ) {
      return 'reports';
    }
    return 'home';
  },
  isMessagesScreen() {
    return false;
  },
};

export function navConfigForRole(role: UserRole | undefined): RoleNavConfig | null {
  if (!role || role === 'buyer') return BUYER_NAV;
  if (role === 'farmer') return FARMER_NAV;
  if (role === 'transport') return TRANSPORT_NAV;
  if (role === 'admin') return ADMIN_NAV;
  return null;
}

/** Infer role from route prefix when auth store is not ready yet. */
export function roleFromPath(pathname: string): UserRole | undefined {
  if (pathname.startsWith('/farmer/')) return 'farmer';
  if (pathname.startsWith('/transport/')) return 'transport';
  if (pathname.startsWith('/admin/')) return 'admin';
  if (pathname.startsWith('/buyer/')) return 'buyer';
  return undefined;
}

/** Show the global tab loader only when navigating between bottom-nav tab roots. */
export function shouldShowTabTransitionLoader(
  fromPath: string,
  toPath: string,
  role?: UserRole,
): boolean {
  const resolvedRole = role ?? roleFromPath(toPath) ?? roleFromPath(fromPath) ?? 'buyer';
  const config = navConfigForRole(resolvedRole);
  if (!config) return false;

  const tabRoots = new Set(config.tabs.map((t) => t.route));
  if (!tabRoots.has(toPath)) return false;

  return config.getActiveTab(fromPath) !== config.getActiveTab(toPath);
}
