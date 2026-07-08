import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItemType = {
  id: number;
  title: string;
  farmer: string;
  pricePerUnit: number;
  qty: number;
  image: string;
};

export type ProduceItemType = {
  id: number;
  title: string;
  price: number;
  unit: string;
  stock: number;
  status: 'Active' | 'Draft' | 'Out of Stock';
  image: string;
};

export type OrderRequestType = {
  id: number;
  buyer: string;
  items: string;
  total: number;
  status: 'Pending' | 'Accepted' | 'Completed' | 'Rejected';
  time: string;
  image: string;
};

export type TransportJobType = {
  id: number;
  pickup: string;
  dropoff: string;
  distance: string;
  fee: number;
  status: 'Available' | 'Accepted' | 'Completed';
};

export type TransactionType = {
  id: number;
  type: 'Credit' | 'Debit';
  title: string;
  amount: number;
  date: string;
  status: 'Completed' | 'Pending';
};

export type PaymentMethodType = {
  id: number;
  provider: string;
  detail: string;
  isDefault: boolean;
};

export type BankAccountType = {
  id: number;
  bank: string;
  account: string;
};

export type ReviewType = {
  id: number;
  buyer: string;
  avatar: string;
  rating: number;
  date: string;
  comment: string;
};

export type NotificationType = {
  id: number;
  type:
  'New Order' |
  'Payment Received' |
  'Delivery Update' |
  'Price Alert' |
  'Weather Alert' |
  'Harvest Reminder' |
  'Inventory Reminder' |
  'Order accepted' |
  'Out for delivery' |
  'Price drop' |
  'New produce from followed farmer' |
  'Payment receipt';
  title: string;
  description: string;
  time: string;
  read: boolean;
};

export type BuyerOrderType = {
  id: number;
  date: string;
  items: string;
  total: number;
  status: 'Delivered' | 'In Transit' | 'Cancelled';
  farmer: string;
  paymentMethod: string;
  deliveryFee: number;
};

export type DriverType = {
  id: number;
  name: string;
  vehicle: 'Motorbike' | 'Van' | 'Truck';
  rating: number;
  eta: string;
  fee: number;
};

export type SupportTicketType = {
  id: number;
  userName: string;
  userRole: string;
  subject: string;
  priority: 'Low' | 'Med' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved';
  time: string;
  messages: {from: 'user' | 'admin';text: string;time: string;}[];
};

export type KnowledgeVideoType = {
  id: number;
  title: string;
  category: string;
  duration: string;
  thumbnail: string;
  url: string;
};

export type FundingRequestType = {
  id: number;
  farmerName: string;
  farmerAvatar: string;
  farmSize: string;
  crop: string;
  amountNeeded: number;
  amountRaised: number;
  returnRate: number;
  durationMonths: number;
  status: 'Funding' | 'Active' | 'Completed';
  verified: boolean;
};

export type InvestmentType = {
  id: number;
  requestId: number;
  amount: number;
  expectedReturn: number;
  startDate: string;
  status: 'Active' | 'Completed';
};

export type AdminPaymentType = {
  id: number;
  parties: string;
  amount: number;
  type: 'Payment' | 'Escrow' | 'Payout' | 'Refund';
  status: 'Completed' | 'Pending' | 'Released' | 'Refunded';
  date: string;
};

type StoreState = {
  cart: CartItemType[];
  addToCart: (item: Omit<CartItemType, 'qty'> & {qty?: number;}) => void;
  updateCartQty: (id: number, delta: number) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;

  produce: ProduceItemType[];
  addProduce: (item: Omit<ProduceItemType, 'id'>) => void;
  updateProduce: (id: number, item: Partial<ProduceItemType>) => void;
  deleteProduce: (id: number) => void;
  toggleProduceStatus: (id: number) => void;

  orders: OrderRequestType[];
  updateOrderStatus: (id: number, status: OrderRequestType['status']) => void;

  profile: {
    name: string;
    phone: string;
    email: string;
    location: string;
    avatar: string;
  };
  updateProfile: (data: Partial<StoreState['profile']>) => void;

  jobs: TransportJobType[];
  acceptJob: (id: number) => void;

  transportOnline: boolean;
  toggleTransportOnline: () => void;

  darkMode: boolean;
  toggleDarkMode: () => void;
  language: string;
  toggleLanguage: () => void;
  setLanguage: (lang: string) => void;
  offlineSync: boolean;
  toggleOfflineSync: () => void;

  walletBalance: number;
  transactions: TransactionType[];
  withdraw: (amount: number) => void;

  paymentMethods: PaymentMethodType[];
  addPaymentMethod: (
  method: Omit<PaymentMethodType, 'id' | 'isDefault'>)
  => void;

  banks: BankAccountType[];
  addBank: (bank: Omit<BankAccountType, 'id'>) => void;

  followedFarmers: number[];
  toggleFollowFarmer: (id: number) => void;

  userRole: string | null;
  setUserRole: (role: string | null) => void;

  farmerReviews: ReviewType[];
  farmerNotifications: NotificationType[];
  markAllNotificationsRead: () => void;
  availableDrivers: DriverType[];

  favoriteProducts: number[];
  toggleFavorite: (id: number) => void;
  buyerOrders: BuyerOrderType[];
  buyerNotifications: NotificationType[];
  markBuyerNotificationsRead: () => void;

  completedDeliveries: any[];
  transportWalletBalance: number;
  transportTransactions: TransactionType[];
  withdrawTransport: (amount: number) => void;
  transportRatings: ReviewType[];
  transportNotifications: NotificationType[];
  markTransportNotificationsRead: () => void;

  supportTickets: SupportTicketType[];
  resolveTicket: (id: number) => void;
  adminPayments: AdminPaymentType[];
  releaseEscrow: (id: number) => void;
  refundPayment: (id: number) => void;

  knowledgeVideos: KnowledgeVideoType[];
  fundingRequests: FundingRequestType[];
  investments: InvestmentType[];
  investInFarmer: (requestId: number, amount: number) => void;
  requestFunding: (
  request: Omit<
    FundingRequestType,
    'id' | 'amountRaised' | 'status' | 'verified'>)

  => void;

  ussdMode: boolean;
  toggleUssdMode: () => void;
};

const INITIAL_KNOWLEDGE_VIDEOS: KnowledgeVideoType[] = [
{
  id: 1,
  title: 'Modern Drip Irrigation Techniques',
  category: 'Farming Practices',
  duration: '12:45',
  thumbnail: "/original-ce576c08fad8c5133a2351e4262643c1-2.webp",

  url: '#'
},
{
  id: 2,
  title: 'Organic Fertilizer Preparation',
  category: 'Fertilizers',
  duration: '08:20',
  thumbnail: "/original-ce576c08fad8c5133a2351e4262643c1-3.webp",

  url: '#'
},
{
  id: 3,
  title: 'Pest Control for Tomatoes',
  category: 'Crop Protection',
  duration: '15:10',
  thumbnail: "/original-ce576c08fad8c5133a2351e4262643c1-2.webp",

  url: '#'
}];




export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      cart: [],
      addToCart: (item) =>
      set((state) => {
        const existing = state.cart.find((i) => i.id === item.id);
        if (existing) {
          return {
            cart: state.cart.map((i) =>
            i.id === item.id ? { ...i, qty: i.qty + (item.qty || 1) } : i
            )
          };
        }
        return { cart: [...state.cart, { ...item, qty: item.qty || 1 }] };
      }),
      updateCartQty: (id, delta) =>
      set((state) => ({
        cart: state.cart.map((item) =>
        item.id === id ?
        { ...item, qty: Math.max(1, item.qty + delta) } :
        item
        )
      })),
      removeFromCart: (id) =>
      set((state) => ({ cart: state.cart.filter((i) => i.id !== id) })),
      clearCart: () => set({ cart: [] }),

      produce: [],
      addProduce: (item) =>
      set((state) => ({
        produce: [...state.produce, { ...item, id: Date.now() }]
      })),
      updateProduce: (id, item) =>
      set((state) => ({
        produce: state.produce.map((p) =>
        p.id === id ? { ...p, ...item } : p
        )
      })),
      deleteProduce: (id) =>
      set((state) => ({ produce: state.produce.filter((p) => p.id !== id) })),
      toggleProduceStatus: (id) =>
      set((state) => ({
        produce: state.produce.map((p) => {
          if (p.id === id) {
            const newStatus =
            p.status === 'Active' ? 'Out of Stock' : 'Active';
            return { ...p, status: newStatus };
          }
          return p;
        })
      })),

      orders: [],
      updateOrderStatus: (id, status) =>
      set((state) => ({
        orders: state.orders.map((o) => o.id === id ? { ...o, status } : o)
      })),

      profile: {
        name: '',
        phone: '',
        email: '',
        location: '',
        avatar: '',
      },
      updateProfile: (data) =>
      set((state) => ({ profile: { ...state.profile, ...data } })),

      jobs: [],
      acceptJob: (id) =>
      set((state) => ({
        jobs: state.jobs.map((j) =>
        j.id === id ? { ...j, status: 'Accepted' } : j
        )
      })),

      transportOnline: false,
      toggleTransportOnline: () =>
      set((state) => ({ transportOnline: !state.transportOnline })),

      darkMode: false,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      language: 'English',
      toggleLanguage: () =>
      set((state) => ({
        language: state.language === 'English' ? 'Twi' : 'English'
      })),
      setLanguage: (lang) => set({ language: lang }),
      offlineSync: false,
      toggleOfflineSync: () =>
      set((state) => ({ offlineSync: !state.offlineSync })),

      walletBalance: 0,
      transactions: [],
      withdraw: (amount) =>
      set((state) => {
        if (state.walletBalance >= amount) {
          return {
            walletBalance: state.walletBalance - amount,
            transactions: [
            {
              id: Date.now(),
              type: 'Debit',
              title: 'Withdrawal to Bank',
              amount,
              date: 'Just now',
              status: 'Pending'
            },
            ...state.transactions]

          };
        }
        return state;
      }),

      paymentMethods: [],

      addPaymentMethod: (method) =>
      set((state) => ({
        paymentMethods: [
        ...state.paymentMethods,
        { ...method, id: Date.now(), isDefault: false }]

      })),

      banks: [],
      addBank: (bank) =>
      set((state) => ({
        banks: [...state.banks, { ...bank, id: Date.now() }]
      })),

      followedFarmers: [],
      toggleFollowFarmer: (id) =>
      set((state) => ({
        followedFarmers: state.followedFarmers.includes(id) ?
        state.followedFarmers.filter((f) => f !== id) :
        [...state.followedFarmers, id]
      })),

      userRole: null,
      setUserRole: (role) => set({ userRole: role }),

      farmerReviews: [],
      farmerNotifications: [],
      markAllNotificationsRead: () =>
      set((state) => ({
        farmerNotifications: state.farmerNotifications.map((n) => ({
          ...n,
          read: true
        }))
      })),
      availableDrivers: [],

      favoriteProducts: [],
      toggleFavorite: (id) =>
      set((state) => ({
        favoriteProducts: state.favoriteProducts.includes(id) ?
        state.favoriteProducts.filter((f) => f !== id) :
        [...state.favoriteProducts, id]
      })),
      buyerOrders: [],
      buyerNotifications: [],
      markBuyerNotificationsRead: () =>
      set((state) => ({
        buyerNotifications: state.buyerNotifications.map((n) => ({
          ...n,
          read: true
        }))
      })),

      completedDeliveries: [],
      transportWalletBalance: 0,
      transportTransactions: [],
      withdrawTransport: (amount) =>
      set((state) => {
        if (state.transportWalletBalance >= amount) {
          return {
            transportWalletBalance: state.transportWalletBalance - amount,
            transportTransactions: [
            {
              id: Date.now(),
              type: 'Debit',
              title: 'Withdrawal to Bank',
              amount,
              date: 'Just now',
              status: 'Pending'
            },
            ...state.transportTransactions]

          };
        }
        return state;
      }),
      transportRatings: [],
      transportNotifications: [],
      markTransportNotificationsRead: () =>
      set((state) => ({
        transportNotifications: state.transportNotifications.map((n) => ({
          ...n,
          read: true
        }))
      })),

      supportTickets: [],
      resolveTicket: (id) =>
      set((state) => ({
        supportTickets: state.supportTickets.map((t) =>
        t.id === id ? { ...t, status: 'Resolved' } : t
        )
      })),
      adminPayments: [],
      releaseEscrow: (id) =>
      set((state) => ({
        adminPayments: state.adminPayments.map((p) =>
        p.id === id ? { ...p, status: 'Released' } : p
        )
      })),
      refundPayment: (id) =>
      set((state) => ({
        adminPayments: state.adminPayments.map((p) =>
        p.id === id ? { ...p, status: 'Refunded' } : p
        )
      })),

      knowledgeVideos: INITIAL_KNOWLEDGE_VIDEOS,
      fundingRequests: [],
      investments: [],
      investInFarmer: (requestId, amount) =>
      set((state) => {
        const request = state.fundingRequests.find((r) => r.id === requestId);
        if (!request) return state;
        const newInvestment: InvestmentType = {
          id: Date.now(),
          requestId,
          amount,
          expectedReturn: amount * (1 + request.returnRate / 100),
          startDate: new Date().toISOString().split('T')[0],
          status: 'Active'
        };
        return {
          investments: [newInvestment, ...state.investments],
          fundingRequests: state.fundingRequests.map((r) =>
          r.id === requestId ?
          {
            ...r,
            amountRaised: r.amountRaised + amount,
            status:
            r.amountRaised + amount >= r.amountNeeded ?
            'Active' :
            r.status
          } :
          r
          )
        };
      }),
      requestFunding: (request) =>
      set((state) => ({
        fundingRequests: [
        {
          ...request,
          id: Date.now(),
          amountRaised: 0,
          status: 'Funding',
          verified: false
        },
        ...state.fundingRequests]

      })),

      ussdMode: false,
      toggleUssdMode: () => set((state) => ({ ussdMode: !state.ussdMode }))
    }),
    {
      name: 'freshlink-app-v3',
    }
  )
);