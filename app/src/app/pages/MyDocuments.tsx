import { FileText, Download, Eye, Shield, Upload } from "lucide-react";
import { motion } from "motion/react";

const mockDocuments = [
  {
    id: "1",
    name: "Coronary Angioplasty - Payment Receipt",
    type: "Payment Receipt",
    date: "2026-02-15",
    size: "2.4 MB",
    hospital: "City General Hospital",
    verified: true,
  },
  {
    id: "2",
    name: "Insurance Claim - Blue Cross",
    type: "Insurance Claim",
    date: "2026-02-18",
    size: "1.8 MB",
    hospital: "City General Hospital",
    verified: true,
  },
  {
    id: "3",
    name: "Discharge Summary - Heart Procedure",
    type: "Discharge Summary",
    date: "2026-02-20",
    size: "3.1 MB",
    hospital: "City General Hospital",
    verified: true,
  },
  {
    id: "4",
    name: "Knee Replacement - Payment Receipt",
    type: "Payment Receipt",
    date: "2025-12-10",
    size: "2.7 MB",
    hospital: "Metropolitan Orthopedic Institute",
    verified: true,
  },
];

export function MyDocuments() {
  return (
    <div className="min-h-full bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Documents</h1>
          <p className="text-gray-600 mb-8">
            Securely store and manage your healthcare documents
          </p>
        </motion.div>

        {/* Upload New Document */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
        >
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-1">Upload New Document</h3>
            <p className="text-sm text-gray-600 mb-2">
              Add payment receipts, insurance claims, or medical records
            </p>
            <p className="text-xs text-gray-500">
              All documents are encrypted and stored securely
            </p>
          </div>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3"
        >
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">
              Your documents are secure
            </p>
            <p className="text-sm text-blue-700">
              All files are encrypted end-to-end and only accessible by you. We never share your
              personal health information without explicit consent.
            </p>
          </div>
        </motion.div>

        {/* Documents List */}
        <div className="space-y-3">
          {mockDocuments.map((doc, index) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{doc.name}</h3>
                      {doc.verified && (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{doc.hospital}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{doc.type}</span>
                      <span>•</span>
                      <span>{doc.date}</span>
                      <span>•</span>
                      <span>{doc.size}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Eye className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Download className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {mockDocuments.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center"
          >
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-600">
              Upload your healthcare documents to keep them organized and secure
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
