/**
 * Statistics Dashboard Component
 * Shows platform impact - great for hackathon demos!
 */

import { motion } from "motion/react";
import { Users, FileCheck, Shield, IndianRupee, TrendingUp, Award } from "lucide-react";
import { useEffect, useState } from "react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  color: string;
  delay: number;
}

function StatCard({ icon, label, value, suffix = "", prefix = "", color, delay }: StatCardProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        <TrendingUp className="w-5 h-5 text-green-500" />
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold text-gray-900">
          {prefix}{count.toLocaleString('en-IN')}{suffix}
        </p>
        <p className="text-sm text-gray-600">{label}</p>
      </div>
    </motion.div>
  );
}

export function StatsDashboard() {
  return (
    <div className="py-12 px-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Platform Impact
          </h2>
          <p className="text-lg text-gray-600">
            Empowering patients with transparent healthcare information
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            icon={<Users className="w-6 h-6 text-blue-600" />}
            label="Patients Helped"
            value={12456}
            color="bg-blue-100"
            delay={0.1}
          />
          <StatCard
            icon={<FileCheck className="w-6 h-6 text-green-600" />}
            label="Reviews Verified"
            value={10110}
            color="bg-green-100"
            delay={0.2}
          />
          <StatCard
            icon={<Shield className="w-6 h-6 text-purple-600" />}
            label="Fake Reviews Blocked"
            value={892}
            color="bg-purple-100"
            delay={0.3}
          />
          <StatCard
            icon={<IndianRupee className="w-6 h-6 text-emerald-600" />}
            label="Money Saved"
            value={450}
            suffix=" Cr"
            prefix="₹"
            color="bg-emerald-100"
            delay={0.4}
          />
          <StatCard
            icon={<Award className="w-6 h-6 text-orange-600" />}
            label="Hospitals Rated"
            value={29}
            color="bg-orange-100"
            delay={0.5}
          />
          <StatCard
            icon={<Users className="w-6 h-6 text-pink-600" />}
            label="Doctors Reviewed"
            value={976}
            color="bg-pink-100"
            delay={0.6}
          />
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-12 bg-white rounded-xl p-8 shadow-lg border border-gray-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-blue-600 mb-2">96%</div>
              <div className="text-gray-600">Document Verification Accuracy</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-green-600 mb-2">4.8</div>
              <div className="text-gray-600">Average Platform Rating</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-purple-600 mb-2">87%</div>
              <div className="text-gray-600">Claim Approval Rate</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
