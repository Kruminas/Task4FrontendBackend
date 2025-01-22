import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const UserTable = () => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/users', { withCredentials: true })
      .then(response => {
        setUsers(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching users:', error);
        setLoading(false);
      });
  }, []);

  const handleCheckboxChange = (event, userId) => {
    if (event.target.checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedUsers(users.map(user => user._id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleBlock = () => {
    axios.post('http://localhost:5000/api/block', { userIds: selectedUsers })
      .then(() => {
        setUsers(users.map(user => 
          selectedUsers.includes(user._id) 
            ? { ...user, blocked: true } 
            : user
        ));
        setSelectedUsers([]);
      })
      .catch(error => {
        console.error('Error blocking users:', error);
      });
  };
  
  const handleUnblock = () => {
    axios.post('http://localhost:5000/api/unblock', { userIds: selectedUsers })
      .then(() => {
        setUsers(users.map(user => 
          selectedUsers.includes(user._id) 
            ? { ...user, blocked: false } 
            : user
        ));
        setSelectedUsers([]);
      })
      .catch(error => {
        console.error('Error unblocking users:', error);
      });
  };

  const handleDelete = () => {
    axios.post('http://localhost:5000/api/users/delete', { userIds: selectedUsers })
      .then(() => {
        setUsers(users.filter(user => !selectedUsers.includes(user._id)));
        setSelectedUsers([]);
      })
      .catch(error => {
        console.error('Error deleting users:', error);
      });
  };

  return (
    <div className="container mt-5">
      <h2>User Management</h2>
      <div className="toolbar mb-3">
        <button className="btn btn-danger mr-2" onClick={handleBlock} disabled={selectedUsers.length === 0}>
          Block
        </button>
        <button className="btn btn-success mr-2" onClick={handleUnblock} disabled={selectedUsers.length === 0}>
          Unblock
        </button>
        <button className="btn btn-danger" onClick={handleDelete} disabled={selectedUsers.length === 0}>
          Delete
        </button>
      </div>
      {loading ? (
        <div>Loading users...</div>
      ) : (
        <table className="table table-striped table-hover">
          <thead className="thead-dark">
            <tr>
              <th>
                <input type="checkbox" onChange={handleSelectAll} />
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>
                  <input
                    type="checkbox"
                    onChange={(e) => handleCheckboxChange(e, user._id)}
                    checked={selectedUsers.includes(user._id)}
                  />
                </td>
                <td>
                  <div>{user.name}</div>
                  {user.blocked && <div className="small text-danger">Blocked</div>}
                </td>
                <td>{user.email}</td>
                <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}</td>
                <td>{user.blocked ? "Blocked" : "Active"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserTable;