import { AnimatePresence, motion } from 'framer-motion';
import Icon from '../common/Icon.jsx';

const overlay = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
const dialog  = { initial: { scale: 0.96, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.96, opacity: 0 } };

export default function ConfirmDialog({ open, title = 'Are you sure?', description, onCancel, onConfirm, danger = true }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          {...overlay}
          onClick={onCancel}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            {...dialog}
            transition= type: 'spring', stiffness: 380, damping: 30 
            className="glass-strong rounded-2xl p-5 max-w-sm w-full grid gap-3"
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl grid place-items-center ${danger ? 'bg-red-500/15 text-red-300 border border-red-500/30' : 'bg-gold/15 text-gold border border-gold/30'}`}>
                <Icon name={danger ? 'alert' : 'check'} size={18} />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg gold-text">{title}</h3>
                {description && <p className="text-white/60 text-sm mt-1">{description}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={onCancel} className="btn-ghost">Cancel</button>
              <button onClick={onConfirm} className={danger ? 'btn-gold !bg-red-500 !text-white hover:!bg-red-600 !shadow-none' : 'btn-gold'}>Confirm</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
