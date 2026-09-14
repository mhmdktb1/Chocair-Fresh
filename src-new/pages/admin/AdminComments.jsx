import React, { useState, useEffect } from 'react';
import { Trash2, Search, MessageSquare, X } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import './AdminComments.css';
import './AdminComponents.css';

const AdminComments = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchComments = async () => {
    try {
      const { data } = await api.get('/comments/all');
      setComments(data);
    } catch (error) {
      toast.error('Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await api.delete(`/comments/${id}`);
        setComments(comments.filter(c => c._id !== id));
        toast.success('Comment deleted');
      } catch (error) {
        toast.error('Failed to delete comment');
      }
    }
  };

  const filteredComments = comments.filter(comment => 
    comment.content?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
    (comment.user && comment.user.name && comment.user.name.toLowerCase().includes(searchTerm.toLowerCase().trim()))
  );

  return (
    <div className="admin-comments-page">
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <h2>Product Comments & Reviews</h2>
          <p className="admin-page-subtitle">
            {filteredComments.length} of {comments.length} user comments
          </p>
        </div>
      </div>

      <div className="admin-search-filter-card">
        <div className="admin-search-input-wrap">
          <Search size={18} color="#64748b" />
          <input 
            type="text" 
            placeholder="Search comments by text or user..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm("")}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="admin-empty-state">
          <MessageSquare size={40} color="#cbd5e1" />
          <h4>Loading comments...</h4>
        </div>
      ) : filteredComments.length === 0 ? (
        <div className="admin-empty-state">
          <MessageSquare size={40} color="#cbd5e1" />
          <h4>No comments found</h4>
          <p>Customer feedback on products will appear here.</p>
        </div>
      ) : (
        <div className="comments-mobile-list">
          {filteredComments.map((comment) => (
            <div key={comment._id} className="comment-mobile-card">
              <div className="comment-card-top">
                <div className="user-cell">
                  <div className="user-avatar-small">
                    {comment.user?.avatar ? (
                      <img src={comment.user.avatar} alt={comment.user.name} />
                    ) : (
                      <span>{comment.user?.name?.charAt(0)?.toUpperCase() || '?'}</span>
                    )}
                  </div>
                  <div>
                    <span className="comment-user-name">{comment.user?.name || 'Deleted User'}</span>
                    <span className="comment-date">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <button 
                  className="product-mini-btn btn-delete" 
                  onClick={() => handleDelete(comment._id)}
                  title="Delete Comment"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="comment-text-body">
                <p>{comment.content}</p>
                {comment.parentId && <span className="reply-badge">Reply</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminComments;
