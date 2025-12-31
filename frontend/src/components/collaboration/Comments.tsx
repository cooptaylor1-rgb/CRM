'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, Send, MoreVertical, Trash2, Edit2,
  Reply, ThumbsUp, Pin, AlertCircle, Check, X, 
  Paperclip, AtSign, Hash
} from 'lucide-react';
import collaborationService, { Comment } from '@/services/collaboration.service';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: string;
  name: string;
  avatar?: string;
}

interface CommentItemProps {
  comment: Comment;
  currentUserId: string;
  onReply: (comment: Comment) => void;
  onEdit: (comment: Comment) => void;
  onDelete: (id: string) => void;
  onLike: (id: string) => void;
  onPin: (id: string) => void;
  depth?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onLike,
  onPin,
  depth = 0,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwner = comment.userId === currentUserId;
  const hasLiked = comment.likedBy?.includes(currentUserId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveEdit = () => {
    if (editContent.trim()) {
      onEdit({ ...comment, content: editContent });
      setIsEditing(false);
    }
  };

  // Parse @mentions in content
  const renderContent = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="text-blue-600 hover:underline cursor-pointer font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`group relative ${depth > 0 ? 'ml-10 pl-4 border-l-2 border-gray-200 dark:border-gray-700' : ''}`}
    >
      <div className={`flex gap-3 py-3 ${comment.isPinned ? 'bg-amber-50/50 dark:bg-amber-900/10 -mx-4 px-4 rounded-lg' : ''}`}>
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.userAvatar ? (
            <img 
              src={comment.userAvatar} 
              alt={comment.userName || 'User'}
              className="w-9 h-9 rounded-xl object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
              {(comment.userName || comment.user?.firstName || 'U').charAt(0)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white text-sm">
              {comment.userName || `${comment.user?.firstName || ''} ${comment.user?.lastName || ''}`.trim() || 'Unknown'}
            </span>
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-gray-400">(edited)</span>
            )}
            {comment.isPinned && (
              <span className="flex items-center gap-1 text-xs text-amber-600">
                <Pin className="w-3 h-3" /> Pinned
              </span>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-800"
                rows={3}
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => { setIsEditing(false); setEditContent(comment.content); }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
              {renderContent(comment.content)}
            </p>
          )}

          {/* Attachments */}
          {comment.attachments && comment.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {comment.attachments.map((attachment, i) => (
                <a
                  key={i}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <Paperclip className="w-3 h-3" />
                  {attachment.name}
                </a>
              ))}
            </div>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => onLike(comment.id)}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  hasLiked 
                    ? 'text-blue-600' 
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                {(comment.likes ?? 0) > 0 && comment.likes}
              </button>
              
              <button
                onClick={() => onReply(comment)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Reply className="w-3.5 h-3.5" />
                Reply
              </button>

              {/* More menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-20"
                    >
                      {isOwner && (
                        <button
                          onClick={() => { setIsEditing(true); setShowMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Edit2 className="w-4 h-4" /> Edit
                        </button>
                      )}
                      <button
                        onClick={() => { onPin(comment.id); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Pin className="w-4 h-4" /> {comment.isPinned ? 'Unpin' : 'Pin'}
                      </button>
                      {isOwner && (
                        <button
                          onClick={() => { onDelete(comment.id); setShowMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onLike={onLike}
              onPin={onPin}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

interface CommentsProps {
  entityType: 'account' | 'household' | 'person' | 'meeting' | 'task';
  entityId: string;
  currentUserId: string;
}

export const Comments: React.FC<CommentsProps> = ({
  entityType,
  entityId,
  currentUserId,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionUsers, setMentionUsers] = useState<User[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadComments();
  }, [entityType, entityId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await collaborationService.getComments(entityType, entityId);
      // Build threaded structure
      const threaded = buildThreadedComments(data);
      setComments(threaded);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Build threaded comments from flat list
  const buildThreadedComments = (flatComments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>();
    const roots: Comment[] = [];

    // First pass: create map
    flatComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build tree
    flatComments.forEach(comment => {
      const mapped = commentMap.get(comment.id)!;
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies = [...(parent.replies || []), mapped];
        }
      } else {
        roots.push(mapped);
      }
    });

    // Sort by pinned first, then by date
    return roots.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);

    // Check for @mention trigger
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionSearch(query);
      setShowMentions(true);
      // Search for users (you would implement this)
      // const users = await searchUsers(query);
      // setMentionUsers(users);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (user: User) => {
    const cursorPos = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = newComment.substring(0, cursorPos);
    const textAfterCursor = newComment.substring(cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');
    
    const newText = 
      textBeforeCursor.substring(0, lastAtPos) + 
      `@${user.name.replace(/\s/g, '_')} ` + 
      textAfterCursor;
    
    setNewComment(newText);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);
      
      // Extract mentions
      const mentions = [...newComment.matchAll(/@(\w+)/g)].map(m => m[1]);
      
      await collaborationService.addComment({
        entityType,
        entityId,
        content: newComment,
        parentId: replyTo?.id,
        mentions,
      });
      
      setNewComment('');
      setReplyTo(null);
      await loadComments();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await collaborationService.deleteComment(id);
      await loadComments();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleEdit = async (comment: Comment) => {
    try {
      await collaborationService.updateComment(comment.id, { content: comment.content });
      await loadComments();
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleLike = async (id: string) => {
    try {
      await collaborationService.addReaction(id, 'like');
      await loadComments();
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const handlePin = async (id: string) => {
    try {
      await collaborationService.toggleCommentPin(id);
      await loadComments();
    } catch (error) {
      console.error('Failed to pin comment:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Comments
          </h3>
          <span className="text-sm text-gray-500">({comments.length})</span>
        </div>
      </div>

      {/* Comment List */}
      <div className="p-4 max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No comments yet</p>
            <p className="text-gray-400 text-xs">Be the first to add a comment</p>
          </div>
        ) : (
          <AnimatePresence>
            {comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                onReply={setReplyTo}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onLike={handleLike}
                onPin={handlePin}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Reply indicator */}
      {replyTo && (
        <div className="mx-4 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
          <span className="text-sm text-blue-600">
            Replying to <strong>{replyTo.userName}</strong>
          </span>
          <button
            onClick={() => setReplyTo(null)}
            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="relative p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            Y
          </div>
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={newComment}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={replyTo ? `Reply to ${replyTo.userName}...` : 'Add a comment... Use @ to mention'}
              className="w-full px-4 py-3 pr-12 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-800"
              rows={2}
            />
            
            <button
              onClick={handleSubmit}
              disabled={!newComment.trim() || submitting}
              className="absolute right-3 bottom-3 p-2 text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>

            {/* Mention suggestions */}
            <AnimatePresence>
              {showMentions && mentionUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-20"
                >
                  <div className="px-3 py-1 text-xs text-gray-500 font-medium flex items-center gap-1">
                    <AtSign className="w-3 h-3" /> Mention someone
                  </div>
                  {mentionUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => insertMention(user)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                          {user.name.charAt(0)}
                        </div>
                      )}
                      <span className="text-sm text-gray-700 dark:text-gray-300">{user.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <p className="text-xs text-gray-400 mt-2 ml-12">
          Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">Shift + Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
};

export default Comments;
