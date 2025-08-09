'use client';

import { useState, useEffect } from 'react';
import { useLogStore } from '@/stores/logStore';
import { MOCK_USERS, LogEntry } from '@/lib/types';
import { createMockLog, createFailedMockLog, createPendingReviewLog, SAMPLE_LOGS } from '@/lib/mockData';

export default function AdminDashboard() {
  const { logs, currentLog, approveLog, rejectLog } = useLogStore();
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [reviewComments, setReviewComments] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const adminUser = MOCK_USERS.find(user => user.role === 'admin');
  
  // Load sample data if no logs exist
  useEffect(() => {
    if (logs.length === 0) {
      const { logs: currentLogs } = useLogStore.getState();
      useLogStore.setState({ logs: [...currentLogs, ...SAMPLE_LOGS] });
    }
  }, [logs.length]);

  const filteredLogs = logs.filter(log => {
    switch (filter) {
      case 'pending':
        return log.requiresReview && log.isApproved === undefined;
      case 'approved':
        return log.isApproved === true;
      case 'rejected':
        return log.isApproved === false;
      default:
        return true;
    }
  });

  const handleReview = (log: LogEntry, action: 'approve' | 'reject') => {
    setSelectedLog(log);
    setReviewAction(action);
    setShowReviewModal(true);
    setReviewComments('');
  };

  const submitReview = () => {
    if (!selectedLog || !adminUser) return;

    if (reviewAction === 'approve') {
      approveLog(adminUser.initials, reviewComments);
    } else {
      if (!reviewComments.trim()) {
        alert('Comments are required when rejecting a log');
        return;
      }
      rejectLog(adminUser.initials, reviewComments);
    }

    setShowReviewModal(false);
    setSelectedLog(null);
    setReviewComments('');
  };

  const getStatusBadge = (log: LogEntry) => {
    if (log.isApproved === true) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">✓ Approved</span>;
    }
    if (log.isApproved === false) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">✗ Rejected</span>;
    }
    if (log.requiresReview) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">⏳ Pending</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">📝 Draft</span>;
  };

  const getRiskBadge = (level: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${colors[level as keyof typeof colors]}`}>
        {level.toUpperCase()}
      </span>
    );
  };

  const addSampleLogs = () => {
    const newSampleLogs = [
      createMockLog({ id: `sample-complete-${Date.now()}` }),
      createFailedMockLog(),
      createPendingReviewLog(),
    ];
    
    const { logs: currentLogs } = useLogStore.getState();
    useLogStore.setState({ logs: [...currentLogs, ...newSampleLogs] });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Food Safety Log Management</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-medium text-gray-900">{adminUser?.name}</p>
              <p className="text-sm text-gray-600">{adminUser?.role}</p>
            </div>
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">{adminUser?.initials}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <div className="text-2xl font-bold text-gray-900">{logs.length}</div>
              <div className="text-gray-600">Total Logs</div>
            </div>
            <div className="bg-white rounded-xl border-2 border-yellow-200 p-6">
              <div className="text-2xl font-bold text-yellow-800">
                {logs.filter(log => log.requiresReview && log.isApproved === undefined).length}
              </div>
              <div className="text-yellow-700">Pending Review</div>
            </div>
            <div className="bg-white rounded-xl border-2 border-green-200 p-6">
              <div className="text-2xl font-bold text-green-800">
                {logs.filter(log => log.isApproved === true).length}
              </div>
              <div className="text-green-700">Approved</div>
            </div>
            <div className="bg-white rounded-xl border-2 border-red-200 p-6">
              <div className="text-2xl font-bold text-red-800">
                {logs.filter(log => log.isApproved === false).length}
              </div>
              <div className="text-red-700">Rejected</div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  All Logs
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Pending Review
                </button>
                <button
                  onClick={() => setFilter('approved')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    filter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setFilter('rejected')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Rejected
                </button>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={addSampleLogs}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
                >
                  Add Sample Logs
                </button>
                <a
                  href="/log"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  New Log Entry
                </a>
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Log Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Compliance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.product}</div>
                          <div className="text-sm text-gray-500">
                            {log.date.toLocaleDateString()} • {log.shift}
                          </div>
                          <div className="text-sm text-gray-500">
                            Lot: {log.lotNumber} • Therm: {log.thermometerNumber}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.employeeName}</div>
                          <div className="text-sm text-gray-500">{log.employeeId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(log)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRiskBadge(log.riskLevel)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {log.complianceIssues.length > 0 ? (
                            <span className="text-red-600">{log.complianceIssues.length} issues</span>
                          ) : (
                            <span className="text-green-600">No issues</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {log.requiresReview && log.isApproved === undefined ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleReview(log, 'approve')}
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReview(log, 'reject')}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              // View log details
                              useLogStore.setState({ currentLog: log });
                              window.open('/log', '_blank');
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border-2 border-gray-200 mt-6">
              <p className="text-gray-500">No logs found for the selected filter.</p>
            </div>
          )}
        </div>
      </main>

      {/* Review Modal */}
      {showReviewModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 m-4 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              {reviewAction === 'approve' ? 'Approve Log' : 'Reject Log'}
            </h3>
            
            {/* Log Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-2">Log Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Product:</strong> {selectedLog.product}</div>
                <div><strong>Employee:</strong> {selectedLog.employeeName}</div>
                <div><strong>Date:</strong> {selectedLog.date.toLocaleDateString()}</div>
                <div><strong>Risk Level:</strong> {selectedLog.riskLevel}</div>
              </div>
              {selectedLog.complianceIssues.length > 0 && (
                <div className="mt-2">
                  <strong>Issues:</strong> {selectedLog.complianceIssues.join(', ')}
                </div>
              )}
            </div>

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
                onClick={submitReview}
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
