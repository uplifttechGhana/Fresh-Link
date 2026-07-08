import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../lib/authStore';
import splashScreen from '../../assets/splash-screen.png';

const ROLE_HOME: Record<string, string> = {
  buyer: '/buyer/home',
  farmer: '/farmer/dashboard',
  transport: '/transport/dashboard',
  investor: '/investor/dashboard',
  admin: '/admin/dashboard',
};

export function Splash() {
  const navigate = useNavigate();
  const { user, accessToken, guestRole } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user && accessToken) {
        navigate(ROLE_HOME[user.role] ?? '/buyer/home', { replace: true });
      } else if (guestRole === 'buyer') {
        navigate('/buyer/home', { replace: true });
      } else {
        navigate('/onboarding');
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate, user, accessToken, guestRole]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-forest">
      <motion.img
        src={splashScreen}
        alt="Fresh Link — Delivering Freshness"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
    </div>
  );
}
