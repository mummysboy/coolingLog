'use client';

import { useState } from 'react';
import { useLogStore } from '@/stores/logStore';
import { MOCK_USERS } from '@/lib/types';

export function AdminReview() {
  const { currentLog, approveLog, rejectLog, updateLogField } = useLogStore();
  const [reviewComments, setReviewComments] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');

  if (!currentLog) return null;

  const adminUser = MOCK_USERS.find(user => user.role === 'admin');
  const supervisorUser = MOCK_USERS.find(user => user.role === 'supervisor');

  const handleReviewSubmit = () => {
    if (!adminUser) return;

    if (reviewAction === 'approve') {
      approveLog(adminUser.initials, reviewComments);
    } else {
      rejectLog(adminUser.initials, reviewComments);
    }
    
    setReviewComments('');
    setShowReviewModal(false);
  };

  const getStatusBadge = () => {
    if (currentLog.isApproved === true) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          ✓ Approved
        </span>
      );
    }
    if (currentLog.isApproved === false) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          ✗ Rejected
        </span>
      );
    }
    if (currentLog.requiresReview) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          ⏳ Pending Review
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
        📝 In Progress
      </span>
    );
  };

  const getRiskBadge = (level: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${colors[level as keyof typeof colors]}`}>
        {level.toUpperCase()} RISK
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Review Status Header */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Review Status</h3>
            <div className="flex items-center gap-3">
              {getStatusBadge()}
              {getRiskBadge(currentLog.riskLevel)}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Log ID: {currentLog.id}</p>
            <p className="text-sm text-gray-600">Employee: {currentLog.employeeName}</p>
            <p className="text-sm text-gray-600">
              Created: {currentLog.date.toLocaleDateString()} at {currentLog.date.toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Review Actions */}
        {currentLog.requiresReview && !currentLog.reviewDate && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setReviewAction('approve');
                setShowReviewModal(true);
              }}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Approve Log
            </button>
            <button
              onClick={() => {
                setReviewAction('reject');
                setShowReviewModal(true);
              }}
              className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Reject Log
            </button>
          </div>
        )}
      </div>

      {/* Supervisor Sign-off */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Supervisor Sign-off</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-2">
              Supervisor Initials
            </label>
            <input
              type="text"
              value={currentLog.supervisorInitials || ''}
              onChange={(e) => updateLogField('supervisorInitials', e.target.value)}
              placeholder={supervisorUser?.initials || 'Enter initials'}
              className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-2">
              Review Date & Time
            </label>
            <p className="text-blue-900 py-2">
              {currentLog.reviewDate 
                ? `${currentLog.reviewDate.toLocaleDateString()} at ${currentLog.reviewDate.toLocaleTimeString()}`
                : 'Not reviewed yet'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Compliance Summary */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-4">Compliance Summary</h3>
        
        {/* HACCP Checklist */}
        <div className="mb-4">
          <h4 className="font-semibold text-yellow-800 mb-2">HACCP Critical Control Points</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              {currentLog.haccp.ccp1Verified ? (
                <span className="text-green-600">✓</span>
              ) : (
                <span className="text-red-600">✗</span>
              )}
              <span className="text-sm">CCP1 Verified</span>
            </div>
            <div className="flex items-center gap-2">
              {currentLog.haccp.ccp2Verified ? (
                <span className="text-green-600">✓</span>
              ) : (
                <span className="text-red-600">✗</span>
              )}
              <span className="text-sm">CCP2 Verified</span>
            </div>
            <div className="flex items-center gap-2">
              {currentLog.haccp.monitoringCompleted ? (
                <span className="text-green-600">✓</span>
              ) : (
                <span className="text-red-600">✗</span>
              )}
              <span className="text-sm">Monitoring Complete</span>
            </div>
            <div className="flex items-center gap-2">
              {currentLog.haccp.correctiveActionsDocumented ? (
                <span className="text-green-600">✓</span>
              ) : (
                <span className="text-red-600">✗</span>
              )}
              <span className="text-sm">Actions Documented</span>
            </div>
          </div>
        </div>

        {/* Compliance Issues */}
        {currentLog.complianceIssues.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Compliance Issues</h4>
            <ul className="list-disc list-inside space-y-1">
              {currentLog.complianceIssues.map((issue, index) => (
                <li key={index} className="text-sm text-yellow-700">{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Stage Completion */}
        <div>
          <h4 className="font-semibold text-yellow-800 mb-2">Stage Completion</h4>
          <div className="flex items-center gap-4">
            <span className="text-sm">Progress:</span>
            <div className="flex-1 bg-yellow-200 rounded-full h-2">
              <div 
                className="bg-yellow-600 h-2 rounded-full transition-all"
                style={{ 
                  width: `${Object.values(currentLog.stages).filter(stage => 
                    stage.temperature !== undefined && stage.time !== undefined
                  ).length / 5 * 100}%` 
                }}
              ></div>
            </div>
            <span className="text-sm">
              {Object.values(currentLog.stages).filter(stage => 
                stage.temperature !== undefined && stage.time !== undefined
              ).length}/5 Complete
            </span>
          </div>
        </div>
      </div>

      {/* Previous Comments */}
      {currentLog.adminComments && (
        <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Admin Comments</h3>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium text-gray-700">
                Reviewed by: {currentLog.reviewedBy}
              </span>
              <span className="text-sm text-gray-500">
                {currentLog.reviewDate?.toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-800">{currentLog.adminComments}</p>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 m-4 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">
              {reviewAction === 'approve' ? 'Approve Log' : 'Reject Log'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments {reviewAction === 'reject' ? '(Required)' : '(Optional)'}
              </label>
              <textarea
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder={
                  reviewAction === 'approve' 
                    ? 'Optional approval comments...'
                    : 'Explain why this log is being rejected...'
                }
                rows={4}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                required={reviewAction === 'reject'}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewSubmit}
                disabled={reviewAction === 'reject' && !reviewComments.trim()}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  reviewAction === 'approve'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                } disabled:bg-gray-400 disabled:cursor-not-allowed`}
              >
                {reviewAction === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
