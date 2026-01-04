import React, { useState, useEffect, useRef } from 'react';
import { Trash2, User, MoreHorizontal, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './CommentsSection.css';
import { toast } from 'react-toastify';

const StarRating = ({ rating, setRating, readonly = false, size = 14 }) => {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={`star-icon ${star <= rating ? 'filled' : ''} ${!readonly ? 'interactive' : ''}`}
          onClick={() => !readonly && setRating(star)}
          fill={star <= rating ? "#FFD700" : "none"}
          color={star <= rating ? "#FFD700" : "#cbd5e0"}
        />
      ))}
    </div>
  );
};

const CommentItem = ({ comment, onReply, onDelete, currentUser, activeReplyId, setActiveReplyId, onSubmitReply }) => {
  const isOwner = currentUser && currentUser._id === comment.user._id;
  const isAdmin = currentUser && currentUser.isAdmin;
  const canDelete = isOwner || isAdmin;
  const [showMenu, setShowMenu] = useState(false);
  const [replyText, setReplyText] = useState('');
  const menuRef = useRef(null);
  const isReplying = activeReplyId === comment._id;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (replyText.trim()) {
      onSubmitReply(comment._id, replyText);
      setReplyText('');
    }
  };

  return (
    <div className="comment-item">
      <div className="comment-avatar">
        {comment.user.avatar ? (
          <img src={comment.user.avatar} alt={comment.user.name} />
        ) : (
          <div className="avatar-placeholder">
            <User size={16} />
          </div>
        )}
      </div>
      
      <div className="comment-content-wrapper">
        <div className="comment-header">
          <span className="comment-author">{comment.user.name}</span>
          <span className="comment-dot">•</span>
          <span className="comment-date">{new Date(comment.createdAt).toLocaleDateString()}</span>
          
          {currentUser && (
            <button 
              className="action-link reply-trigger"
              onClick={() => setActiveReplyId(isReplying ? null : comment._id)}
            >
              Reply
            </button>
          )}

          {canDelete && (
            <div className="comment-menu-container" ref={menuRef}>
              <button 
                className="action-link menu-trigger"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreHorizontal size={14} />
              </button>
              {showMenu && (
                <div className="comment-dropdown">
                  <button onClick={() => onDelete(comment._id)} className="dropdown-item delete">
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {comment.rating > 0 && (
          <div className="comment-rating-display">
            <StarRating rating={comment.rating} readonly size={12} />
          </div>
        )}

        <p className="comment-text">{comment.content}</p>

        {/* Inline Reply Form */}
        {isReplying && (
          <form className="inline-reply-form" onSubmit={handleReplySubmit}>
            <input 
              type="text" 
              placeholder={`Reply to ${comment.user.name}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              autoFocus
            />
            <button type="submit" disabled={!replyText.trim()}>Reply</button>
          </form>
        )}
      </div>
    </div>
  );
};

const CommentsSection = () => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(0);
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  // Parallax State
  const sectionRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!sectionRef.current) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      // Calculate mouse position relative to center (range -1 to 1)
      const x = (clientX / innerWidth) * 2 - 1;
      const y = (clientY / innerHeight) * 2 - 1;
      
      setOffset({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const fetchComments = async () => {
    try {
      const { data } = await api.get('/comments');
      setComments(data);
    } catch (error) {
      console.error('Failed to fetch comments', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await api.post('/comments', {
        content: newComment,
        rating: rating,
        parentId: null
      });
      
      setNewComment('');
      setRating(0);
      setIsFocused(false);
      toast.success('Review posted');
      fetchComments();
    } catch (error) {
      toast.error('Failed to post review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (parentId, content) => {
    try {
      await api.post('/comments', {
        content,
        parentId
      });
      setActiveReplyId(null);
      toast.success('Reply posted');
      fetchComments();
    } catch (error) {
      toast.error('Failed to post reply');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this comment?')) {
      try {
        await api.delete(`/comments/${id}`);
        toast.success('Deleted');
        fetchComments();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  return (
    <section className="comments-section" ref={sectionRef}>
      {/* Animated Background Elements */}
      <div className="comments-bg-gradient"></div>
      <div className="floating-elements">
        <div 
          className="float-item leaf-1"
          style={{ transform: `translate(${offset.x * -15}px, ${offset.y * -15}px) rotate(${offset.x * 5}deg)` }}
        >🍃</div>
        <div 
          className="float-item berry-1"
          style={{ transform: `translate(${offset.x * 20}px, ${offset.y * 20}px)` }}
        >🍓</div>
        <div 
          className="float-item berry-2"
          style={{ transform: `translate(${offset.x * -25}px, ${offset.y * 15}px)` }}
        >🍇</div>
        <div 
          className="float-item leaf-2"
          style={{ transform: `translate(${offset.x * 25}px, ${offset.y * -10}px) rotate(${offset.y * -5}deg)` }}
        >🌿</div>
      </div>

      <div className="container">
        <div className="comments-layout">
          <h3 className="comments-title">Customer Reviews ({comments.length})</h3>
          
          {/* Compact Review Form */}
          {user ? (
            <div className={`compact-review-form ${isFocused ? 'focused' : ''}`}>
              <div className="review-input-row">
                <div className="user-avatar-small">
                  {user.avatar ? <img src={user.avatar} alt="" /> : <User size={16} />}
                </div>
                <div className="input-wrapper">
                  {isFocused && (
                    <div className="rating-select">
                      <StarRating rating={rating} setRating={setRating} size={16} />
                    </div>
                  )}
                  <form onSubmit={handleSubmit}>
                    {isFocused ? (
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a review..."
                        autoFocus
                        rows={3}
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder="Write a review..."
                        onFocus={() => setIsFocused(true)}
                        value={newComment}
                        readOnly
                      />
                    )}
                    
                    {isFocused && (
                      <div className="form-actions">
                        <button type="button" className="cancel-btn" onClick={() => setIsFocused(false)}>Cancel</button>
                        <button type="submit" className="post-btn" disabled={submitting || !newComment.trim()}>
                          Post
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <p className="login-link"><a href="/login">Log in</a> to write a review</p>
          )}

          {/* Flat List */}
          <div className="comments-list-flat">
            {loading ? (
              <p>Loading...</p>
            ) : comments.length === 0 ? (
              <p className="no-comments">No reviews yet.</p>
            ) : (
              comments.map(comment => (
                <div key={comment._id} className="comment-thread-flat">
                  <CommentItem 
                    comment={comment} 
                    onDelete={handleDelete}
                    currentUser={user}
                    activeReplyId={activeReplyId}
                    setActiveReplyId={setActiveReplyId}
                    onSubmitReply={handleReplySubmit}
                  />
                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="replies-list-flat">
                      {comment.replies.map(reply => (
                        <CommentItem 
                          key={reply._id} 
                          comment={reply} 
                          onDelete={handleDelete}
                          currentUser={user}
                          activeReplyId={activeReplyId}
                          setActiveReplyId={setActiveReplyId}
                          onSubmitReply={handleReplySubmit}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommentsSection;
