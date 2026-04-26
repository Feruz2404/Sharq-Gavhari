import { AnimatePresence, motion } from 'framer-motion';

const fadeHidden    = { opacity: 0 };
const fadeVisible   = { opacity: 1 };
const dialogHidden  = { scale: 0.95, opacity: 0 };
const dialogVisible = { scale: 1,    opacity: 1 };

export default function ConfirmDialog({ open, title = 'Are you sure?', onCancel, onConfirm }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          initial={fadeHidden} animate={fadeVisible} exit={fadeHidden}
          onClick={onCancel}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={dialogHidden} animate={dialogVisible} exit={dialogHidden}
            className="glass-strong rounded-2xl p-5 max-w-sm w-full grid gap-3"
          >
            <h3 className="font-display text-lg gold-text">{title}</h3>
            <div className="flex justify-end gap-2">
              <button onClick={onCancel} className="btn-ghost">Cancel</button>
              <button onClick={onConfirm} className="btn-gold">Confirm</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
