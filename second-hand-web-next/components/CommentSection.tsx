// components/CommentSection.tsx
"use client";

import { useState } from "react";

// ========== Type Definitions ==========
type Reply = {
  id: string;
  userId: string;
  userName: string;
  userInitial: string;
  content: string;
  createdAt: Date;
};

type Comment = {
  id: string;
  userId: string;
  userName: string;
  userInitial: string;
  content: string;
  createdAt: Date;
  replies: Reply[];
};

// ========== Current User (replace with real auth data) ==========
const CURRENT_USER = {
  id: "me",
  name: "You",
  initial: "Y",
};

// ========== Helper ==========
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

// ========== Component Props ==========
interface CommentSectionProps {
  productId: string; // Reserved for future backend integration
}

export function CommentSection({ productId }: CommentSectionProps) {
  // No mock data – start with empty comments array
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const formatDate = (date: Date) => {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    const newComment: Comment = {
      id: generateId(),
      userId: CURRENT_USER.id,
      userName: CURRENT_USER.name,
      userInitial: CURRENT_USER.initial,
      content: newCommentText.trim(),
      createdAt: new Date(),
      replies: [],
    };
    setComments([newComment, ...comments]);
    setNewCommentText("");
  };

  const handleAddReply = (commentId: string) => {
    const draft = replyDrafts[commentId] || "";
    if (!draft.trim()) return;
    const newReply: Reply = {
      id: generateId(),
      userId: CURRENT_USER.id,
      userName: CURRENT_USER.name,
      userInitial: CURRENT_USER.initial,
      content: draft.trim(),
      createdAt: new Date(),
    };
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, replies: [...c.replies, newReply] } : c
      )
    );
    // Clear reply draft and close reply box
    setReplyDrafts((prev) => {
      const newDrafts = { ...prev };
      delete newDrafts[commentId];
      return newDrafts;
    });
    setOpenReplyId(null);
  };

  const toggleReply = (commentId: string) => {
    if (openReplyId === commentId) {
      setOpenReplyId(null);
      setReplyDrafts((prev) => {
        const newDrafts = { ...prev };
        delete newDrafts[commentId];
        return newDrafts;
      });
    } else {
      setOpenReplyId(commentId);
      if (!replyDrafts[commentId]) {
        setReplyDrafts((prev) => ({ ...prev, [commentId]: "" }));
      }
    }
  };

  const updateReplyDraft = (commentId: string, text: string) => {
    setReplyDrafts((prev) => ({ ...prev, [commentId]: text }));
  };

  return (
    <div className="mt-8">
      {/* No title – removed as requested */}

      {/* New comment form */}
      <div className="flex gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium flex-shrink-0">
          {CURRENT_USER.initial}
        </div>
        <div className="flex-1">
          <textarea
            rows={2}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Ask a question or leave a comment..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleAddComment}
              className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600 transition"
            >
              Post Comment
            </button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-5">
        {comments.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            No comments yet. Be the first to ask!
          </div>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="border-b border-gray-100 pb-4">
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium text-sm">
                {comment.userInitial}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-medium text-gray-800">{comment.userName}</span>
                  <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="text-gray-700 mt-1">{comment.content}</p>
                <button
                  onClick={() => toggleReply(comment.id)}
                  className="text-xs text-blue-500 mt-1 hover:underline"
                >
                  {openReplyId === comment.id ? "Cancel" : "Reply"}
                </button>

                {/* Reply input box */}
                {openReplyId === comment.id && (
                  <div className="mt-3 ml-2 flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium text-xs">
                      {CURRENT_USER.initial}
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-full px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Write a reply..."
                        value={replyDrafts[comment.id] || ""}
                        onChange={(e) => updateReplyDraft(comment.id, e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddReply(comment.id)}
                      />
                    </div>
                    <button
                      onClick={() => handleAddReply(comment.id)}
                      className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs"
                    >
                      Send
                    </button>
                  </div>
                )}

                {/* Existing replies */}
                {comment.replies.length > 0 && (
                  <div className="mt-3 ml-6 space-y-3 border-l-2 border-gray-200 pl-4">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium text-xs">
                          {reply.userInitial}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="font-medium text-gray-800 text-sm">{reply.userName}</span>
                            <span className="text-xs text-gray-400">{formatDate(reply.createdAt)}</span>
                          </div>
                          <p className="text-gray-700 text-sm">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}