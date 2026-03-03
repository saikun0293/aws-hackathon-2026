/**
 * Example Component: How to use the AI Search Response
 * This shows how to render hospitals and doctors from the single API call
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  MapPin, 
  Phone, 
  Star, 
  Shield, 
  TrendingUp, 
  IndianRupee,
  Calendar,
  CheckCircle2,
  Award
} from 'lucide-react';
import type { 
  SearchResponse, 
  EnrichedHospital, 
  EnrichedDoctor 
} from '../../api/searchResponseTypes';

// ========================================================================
// MAIN SEARCH RESULTS COMPONENT
// ========================================================================

interface SearchResultsProps {
  data: SearchResponse;
  onHospitalClick?: (hospitalId: string) => void;
  onDoctorClick?: (doctorId: string) => void;
}

export function SearchResults({ data, onHospitalClick, onDoctorClick }: SearchResultsProps) {
  const [hoveredHospitalId, setHoveredHospitalId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Search Intent */}
      {data.userIntent && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Showing results for:</span>{' '}
            {data.userIntent.keywords.join(', ')}
          </p>
          {data.cached && (
            <p className="text-xs text-blue-600 mt-1">
              ⚡ Instant results from cache
            </p>
          )}
        </div>
      )}

      {/* Hospital Cards */}
      <div className="space-y-6">
        {data.results.hospitals.map((hospital) => (
          <div key={hospital.hospitalId} className="relative">
            <HospitalCard
              hospital={hospital}
              isHovered={hoveredHospitalId === hospital.hospitalId}
              onHover={() => setHoveredHospitalId(hospital.hospitalId)}
              onLeave={() => setHoveredHospitalId(null)}
              onClick={() => onHospitalClick?.(hospital.hospitalId)}
              onDoctorClick={onDoctorClick}
            />
          </div>
        ))}
      </div>

      {/* No Results */}
      {data.results.totalMatches === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No hospitals found matching your query.</p>
        </div>
      )}
    </div>
  );
}

// ========================================================================
// HOSPITAL CARD COMPONENT
// ========================================================================

interface HospitalCardProps {
  hospital: EnrichedHospital;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
  onDoctorClick?: (doctorId: string) => void;
}

function HospitalCard({ 
  hospital, 
  isHovered, 
  onHover, 
  onLeave, 
  onClick,
  onDoctorClick 
}: HospitalCardProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Hospital Info (2/3 width) */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        onHoverStart={onHover}
        onHoverEnd={onLeave}
        onClick={onClick}
        className="lg:col-span-2 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow cursor-pointer overflow-hidden border border-gray-200"
      >
        {/* Match Score Badge */}
        {hospital.aiInsights && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 flex items-center justify-between">
            <span className="text-white text-sm font-semibold">
              {hospital.aiInsights.matchScore}% Match
            </span>
            <VerificationBadge level={hospital.trustIndicators.verificationBadge} />
          </div>
        )}

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {hospital.hospitalName}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {hospital.location.distance && (
                    <span>{hospital.location.distance}km away</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  <span>{hospital.phoneNumber}</span>
                </div>
              </div>
            </div>

            {/* Rating */}
            <div className="text-right">
              <div className="flex items-center gap-1 text-2xl font-bold text-gray-900">
                <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                {hospital.stats.averageRating.toFixed(1)}
              </div>
              <p className="text-xs text-gray-500">
                {hospital.stats.verifiedReviews} verified reviews
              </p>
            </div>
          </div>

          {/* AI Explanation (Key Feature!) */}
          {hospital.aiInsights && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <div className="mt-1">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    AI Recommendation
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {hospital.aiInsights.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Key Strengths */}
          {hospital.aiInsights && hospital.aiInsights.keyStrengths.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-700 mb-2">Key Strengths:</p>
              <div className="flex flex-wrap gap-2">
                {hospital.aiInsights.keyStrengths.map((strength, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {strength}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
            <StatItem
              icon={<Shield className="w-4 h-4 text-blue-600" />}
              label="Claim Approval"
              value={`${(hospital.stats.claimApprovalRate * 100).toFixed(0)}%`}
            />
            <StatItem
              icon={<IndianRupee className="w-4 h-4 text-green-600" />}
              label="Avg. Cost"
              value={`₹${(hospital.stats.averageCost / 100000).toFixed(1)}L`}
            />
            <StatItem
              icon={<Calendar className="w-4 h-4 text-purple-600" />}
              label="Wait Time"
              value={`${hospital.stats.averageWaitTime}d`}
            />
          </div>

          {/* Insurance Match (if user is logged in) */}
          {hospital.insuranceInfo.userInsuranceMatch?.isAccepted && (
            <CostPredictor match={hospital.insuranceInfo.userInsuranceMatch} />
          )}

          {/* Services */}
          <div className="flex flex-wrap gap-2">
            {hospital.services.slice(0, 5).map((service, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {service}
              </span>
            ))}
            {hospital.services.length > 5 && (
              <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                +{hospital.services.length - 5} more
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Right: Top Doctors (1/3 width) - Shows on hover */}
      <div className="lg:col-span-1">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ 
            opacity: isHovered ? 1 : 0.7, 
            x: isHovered ? 0 : 10,
            scale: isHovered ? 1 : 0.98
          }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden h-full"
        >
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3">
            <h4 className="text-white font-semibold text-sm flex items-center gap-2">
              <Award className="w-4 h-4" />
              Top Doctors
            </h4>
          </div>
          
          <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
            {hospital.topDoctors.slice(0, 3).map((doctor) => (
              <DoctorMiniCard
                key={doctor.doctorId}
                doctor={doctor}
                onClick={() => onDoctorClick?.(doctor.doctorId)}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ========================================================================
// DOCTOR MINI CARD (Shown in sidebar)
// ========================================================================

interface DoctorMiniCardProps {
  doctor: EnrichedDoctor;
  onClick: () => void;
}

function DoctorMiniCard({ doctor, onClick }: DoctorMiniCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      onClick={onClick}
      className="p-3 bg-gradient-to-br from-gray-50 to-purple-50 rounded-lg border border-purple-200 cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Doctor Name & Rating */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h5 className="font-semibold text-gray-900 text-sm leading-tight">
            {doctor.doctorName}
          </h5>
          <p className="text-xs text-gray-600">{doctor.specialty}</p>
          <p className="text-xs text-gray-500">{doctor.experience}</p>
        </div>
        <div className="flex items-center gap-1 text-sm font-bold">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          {doctor.stats.averageRating.toFixed(1)}
        </div>
      </div>

      {/* AI Summary (truncated) */}
      {doctor.aiReview && (
        <p className="text-xs text-gray-700 leading-relaxed line-clamp-3 mb-2">
          {doctor.aiReview.summary}
        </p>
      )}

      {/* Key Highlights */}
      {doctor.aiReview && doctor.aiReview.keyHighlights.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {doctor.aiReview.keyHighlights.slice(0, 2).map((highlight, idx) => (
            <span
              key={idx}
              className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded"
            >
              {highlight}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="mt-2 pt-2 border-t border-purple-200 flex items-center justify-between text-xs">
        <span className="text-gray-600">
          {doctor.stats.verifiedReviews} reviews
        </span>
        {doctor.stats.successRate && (
          <span className="text-green-600 font-semibold">
            {(doctor.stats.successRate * 100).toFixed(0)}% success
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ========================================================================
// HELPER COMPONENTS
// ========================================================================

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-lg font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-600">{label}</div>
    </div>
  );
}

function VerificationBadge({ level }: { level: 'bronze' | 'silver' | 'gold' | 'platinum' }) {
  const badges = {
    bronze: { color: 'bg-orange-100 text-orange-700', icon: '🥉' },
    silver: { color: 'bg-gray-100 text-gray-700', icon: '🥈' },
    gold: { color: 'bg-yellow-100 text-yellow-700', icon: '🥇' },
    platinum: { color: 'bg-purple-100 text-purple-700', icon: '💎' },
  };
  
  const badge = badges[level];
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
      <span>{badge.icon}</span>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

function CostPredictor({ match }: { match: { estimatedCoverage: number; estimatedOutOfPocket: number } }) {
  return (
    <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
      <p className="text-xs font-semibold text-green-900 mb-2 flex items-center gap-1">
        <IndianRupee className="w-4 h-4" />
        Cost Estimate with Your Insurance
      </p>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Insurance Covers</p>
          <p className="text-lg font-bold text-green-600">
            ₹{(match.estimatedCoverage / 1000).toFixed(0)}K
          </p>
        </div>
        <div>
          <p className="text-gray-600">You Pay</p>
          <p className="text-lg font-bold text-blue-600">
            ₹{(match.estimatedOutOfPocket / 1000).toFixed(0)}K
          </p>
        </div>
      </div>
    </div>
  );
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
    </svg>
  );
}
