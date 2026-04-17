import { motion } from 'framer-motion';

const variants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '-30%', opacity: 0 },
};

export default function PageTransition({ children }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: 'spring', damping: 28, stiffness: 240, mass: 0.8 }}
      style={{ willChange: 'transform' }}
    >
      {children}
    </motion.div>
  );
}