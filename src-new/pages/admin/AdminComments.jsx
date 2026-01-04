import React, { useState, useEffect } from 'react';
import { Trash2, Search, MessageSquare } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import './AdminComments.css';

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
    comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (comment.user && comment.user.name && comment.user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div className="loading">Loading comments...</div>;

  return (
    <div className="admin-comments">
      <div className="comments-header">
        <div className="search-bar">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Search comments..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="stats">
          <span>Total Comments: {comments.length}</span>
        </div>
      </div>

      <div className="comments-table-container">
        <table className="comments-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Content</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredComments.map((comment) => (
              <tr key={comment._id}>
                <td>
                  <div className="user-cell">
                    {comment.user ? (
                      <>
                        <div className="user-avatar-small">
                          {comment.user.avatar ? (
                            <img src={comment.user.avatar} alt={comment.user.name} />
                          ) : (
                            <span>{comment.user.name?.charAt(0)}</span>
                          )}
                        </div>
                        <span>{comment.user.name}</span>
                      </>
                    ) : (
                      <span className="deleted-user">Deleted User</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="content-cell">
                    <p>{comment.content}</p>
                    {comment.parentId && <span className="reply-badge">Reply</span>}
                  </div>
                </td>
                <td>{new Date(comment.createdAt).toLocaleDateString()}</td>
                <td>
                  <button 
                    className="icon-btn delete" 
                    onClick={() => handleDelete(comment._id)}
                    title="Delete Comment"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredComments.length === 0 && (
          <div className="no-results">No comments found matching your search.</div>
        )}
      </div>
    </div>
  );
};

export default AdminComments;
