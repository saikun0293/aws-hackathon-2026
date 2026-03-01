/**
 * Success Animation Component
 * Shows delightful animations after important actions
 */

import { motion } from "motion/react";
import { CheckCircle2, Sparkles } from "lucide-react";

interface SuccessAnimationProps {
  title: string;
  message: string;
  onClose?: () => void;
}

export function SuccessAnimation({ title, message, onClose }: SuccessAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, times: [0, 0.5, 1] }}
          className="absolute inset-0 pointer-events-none"
        >
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -20, x: Math.random() * 100 - 50, opacity: 1 }}
              animate={{ 
                y: 300, 
                x: Math.random() * 200 - 100,
                opacity: 0,
                rotate: Math.random() * 360
              }}
              transition={{ duration: 1.5, delay: Math.random() * 0.5 }}
              className="absolute top-0 left-1/2"
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </motion.div>
          ))}
        </motion.div>

        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 15,
            delay: 0.2 
          }}
          className="flex justify-center mb-4"
        >
          <div className="relative">
            <CheckCircle2 className="w-20 h-20 text-green-500" />
            <motion.div
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-green-500"
            />
          </div>
        </motion.div>

        {/* Text */}
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-900 mb-2"
        >
          {title}
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600"
        >
          {message}
        </motion.p>

        {/* Close button */}
        {onClose && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={onClose}
            className="mt-6 px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            Continue
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}

// Verification Progress Component
export function VerificationProgress({ progress, stage }: { progress: number; stage: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{stage}</span>
        <span className="text-blue-600 font-medium">{progress}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
        />
      </div>
    </div>
  );
}
