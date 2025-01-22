import React, { useState, useEffect } from "react";
import axios from "axios";
import './UserManagement1.css';
import { Table, Container, Alert, Button, Form, OverlayTrigger, Tooltip, } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [isBlocking, setIsBlocking] = useState(false);
  const [isUnblocking, setIsUnblocking] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/users", {
        withCredentials: true,
      });
      const sortedUsers = response.data.sort((a, b) => {
        const dateA = new Date(a.lastLogin);
        const dateB = new Date(b.lastLogin);
        return dateB - dateA;
      });
      setUsers(sortedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Error fetching users");
    }
  };

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return "Not available";
    const now = new Date();
    const timeDiff = Math.floor((now - new Date(timestamp)) / 1000);

    if (timeDiff < 60) return "less than a minute ago";
    if (timeDiff < 3600) return `${Math.floor(timeDiff / 60)} minutes ago`;
    if (timeDiff < 86400) return `${Math.floor(timeDiff / 3600)} hours ago`;
    if (timeDiff < 604800) return `${Math.floor(timeDiff / 86400)} days ago`;

    return `${Math.floor(timeDiff / 604800)} weeks ago`;
  };

  const handleBlock = () => {
    if (selectedUsers.size === 0) {
      setError("Please select at least one user to block.");
      return;
    }

    setIsBlocking(true);
    const userIdsArray = Array.from(selectedUsers);

    axios
      .post("http://localhost:5000/api/block", { userIds: userIdsArray })
      .then((response) => {
        console.log("Block response:", response.data);

        setUsers(
          users.map((user) =>
            selectedUsers.has(user._id) ? { ...user, blocked: true } : user
          )
        );

        setSelectedUsers(new Set());

        const allBlocked = users.every((user) =>
          selectedUsers.has(user._id) ? true : user.blocked
        );

        if (allBlocked) {
          navigate("/login");
        }
      })
      .catch((error) => {
        console.error("Error blocking users:", error);
        setError("Error blocking selected users");
      })
      .finally(() => {
        setIsBlocking(false);
      });
  };

  const handleUnblock = () => {
    if (selectedUsers.size === 0) {
      setError("Please select at least one user to unblock.");
      return;
    }

    setIsUnblocking(true);
    const userIdsArray = Array.from(selectedUsers);
    axios
      .post("http://localhost:5000/api/unblock", { userIds: userIdsArray })
      .then((response) => {
        console.log("Unblock response:", response.data);
        setUsers(
          users.map((user) =>
            selectedUsers.has(user._id) ? { ...user, blocked: false } : user
          )
        );
        setSelectedUsers(new Set());
      })
      .catch((error) => {
        console.error("Error unblocking users:", error);
        setError("Error unblocking selected users");
      })
      .finally(() => {
        setIsUnblocking(false);
      });
  };

  const handleDelete = async () => {
    if (selectedUsers.size === 0) {
      setError("Please select at least one user to delete.");
      return;
    }

    try {
      const userIdsToDelete = Array.from(selectedUsers);
      await axios.post(
        "http://localhost:5000/api/users/delete",
        { userIds: userIdsToDelete },
        { withCredentials: true }
      );
      setUsers((prevUsers) =>
        prevUsers.filter((user) => !userIdsToDelete.includes(user._id))
      );
      setSelectedUsers(new Set());
    } catch (error) {
      console.error("Error deleting users:", error);
      setError("Error deleting selected users");
    }
  };

  const handleCheckboxChange = (userId) => {
    setSelectedUsers((prevSelected) => {
      const updatedSelected = new Set(prevSelected);
      if (updatedSelected.has(userId)) {
        updatedSelected.delete(userId);
      } else {
        updatedSelected.add(userId);
      }
      return updatedSelected;
    });
  };

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <Container className="mt-5 bg-dark text-white rounded shadow">
      <div>
        <h2 className="mb-4 text-center">User Management</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        <div className="d-flex justify-content-start mb-3">
          <Button
            variant="outline-primary"
            className="d-flex align-items-center me-2"
            onClick={handleBlock}
            disabled={selectedUsers.size === 0 || isBlocking}
          >
            <i className="bi bi-lock-fill me-2"></i>
            {isBlocking ? "Blocking..." : "Block"}
          </Button>
          <Button
            variant="outline-primary"
            className="d-flex align-items-center me-2"
            onClick={handleUnblock}
            disabled={selectedUsers.size === 0 || isUnblocking}
            aria-label="Unblock"
          >
            <i className="bi bi-unlock-fill"></i>
          </Button>
          <Button
            variant="outline-danger"
            className="d-flex align-items-center"
            onClick={handleDelete}
            disabled={selectedUsers.size === 0}
            aria-label="Delete"
          >
            <i className="bi bi-trash-fill"></i>
          </Button>
          <Button
            variant="secondary"
            className="ms-auto"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>

        <Table className="table-dark" striped bordered hover responsive>
          <thead>
            <tr>
              <th>
                <Form.Check
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(new Set(users.map((user) => user._id)));
                    } else {
                      setSelectedUsers(new Set());
                    }
                  }}
                  checked={selectedUsers.size === users.length}
                />
              </th>
              <th>Name</th>
              <th>
                Email <i class="bi bi-arrow-down"></i>
              </th>
              <th>Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>
                  <Form.Check
                    type="checkbox"
                    checked={selectedUsers.has(user._id)}
                    onChange={() => handleCheckboxChange(user._id)}
                  />
                </td>
                <td>
                  <div>{user.name}</div>
                  {user.blocked && (
                    <div className="small text-danger">Blocked</div>
                  )}
                </td>
                <td>{user.email}</td>
                <td>
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip>
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleString()
                          : "Not available"}
                      </Tooltip>
                    }
                  >
                    <span>{getRelativeTime(user.lastLogin)}</span>
                  </OverlayTrigger>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Container>
  );
}

export default UserManagement;