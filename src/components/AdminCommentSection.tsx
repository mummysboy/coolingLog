'use client';

import { useState } from 'react';
import { usePaperFormStore } from '@/stores/paperFormStore';
import { PaperFormEntry, AdminComment } from '@/lib/paperFormTypes';
import { MOCK_USERS } from '@/lib/types';
import { validateForm, generateErrorId } from '@/lib/validation';

interface AdminCommentSectionProps {
  form: PaperFormEntry;
  isAdmin: boolean;
}

export function AdminCommentSection({ form, isAdmin }: AdminCommentSectionProps) {
  const { addAdminComment } = usePaperFormStore();
  const [newComment, setNewComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);

  const adminUser = MOCK_USERS.find(user => user.role === 'admin');
  const validation = validateForm(form);
  const hasUnresolvedErrors = validation.errors.some(error => {
    const errorId = generateErrorId(error);
    return !(form.resolvedErrors || []).includes(errorId);
  });

  const handleAddComment = () => {
    if (newComment.trim() && adminUser) {
      addAdminComment(form.id, adminUser.initials, newComment.trim());
      setNewComment('');
      setShowCommentInput(false);
    }
  };

  // Allow regular users to access the component, but restrict comment functionality to admins
  if (!isAdmin) {
    // For regular users, only show when there are errors
    if (!hasUnresolvedErrors) return null;
    
    return (
      <div className="mt-6 p-4 border-2 border-green-300 bg-green-50 rounded-lg">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-green-800 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Validation Errors
          </h3>
        </div>
        
        <div className="text-sm text-green-700 mb-4">
          <p>This form has validation errors that need attention.</p>
        </div>
      </div>
    );
  }

  // Original admin functionality
  return (
    <div className="mt-6 p-4 border-2 border-blue-300 bg-blue-50 rounded-lg" data-admin-comments>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-blue-800 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Admin Comments
        </h3>
      </div>

      {/* Comment Input */}
      {!showCommentInput ? (
        <button
          onClick={() => setShowCommentInput(true)}
          className="w-full p-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:border-blue-400 hover:text-blue-700 transition-colors text-center"
        >
          + Add Admin Comment
        </button>
      ) : (
        <div className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Enter your comment about this form..."
            className="w-full p-3 border border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
            rows={3}
          />
          <div className="flex space-x-2">
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Add Comment
            </button>
            <button
              onClick={() => {
                setShowCommentInput(false);
                setNewComment('');
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Comments List */}
      {(form.adminComments || []).length > 0 && (
        <div className="mt-4 space-y-3">
          {(form.adminComments || []).map((comment) => (
            <div
              key={comment.id}
              className="p-3 rounded-lg border bg-blue-50 border-blue-200"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">
                    {comment.adminInitial}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.timestamp).toLocaleString()}
                  </span>

                </div>

              </div>
              <p className="text-sm text-gray-700">{comment.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
