import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import LoadingLogo from '../../components/common/LoadingLogo.jsx';

// Branded splash that plays on first arrival and then fades into /menu.
// Two-phase timing keeps the fade-out visible: at ~1500ms we trigger the
// exit animation; at ~1900ms (after the 0.45s motion exit) we navigate.

const splashFade = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
  transition: { duration: 0.45, ease: 'easeInOut' },
};

export default function LoadingPage() {
  const nav = useNavigate();
  const [show, setShow] = useState(true);
  useEffect(() => {
    const fade = setTimeout(() => setShow(false), 1500);
    const go   = setTimeout(() => nav('/menu', { replace: true }), 1900);
    return () => { clearTimeout(fade); clearTimeout(go); };
  }, [nav]);
  return (
    <AnimatePresence>
      {show && (
        <motion.div key="sg-splash" {...splashFade}>
          <LoadingLogo fullscreen />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
