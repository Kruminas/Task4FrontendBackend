import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:5000/api/login",
        { email, password },
        { withCredentials: true }
      );

      console.log("Login response:", response.data);

      if (response.data.lastLogin) {
        console.log("User last login time:", new Date(response.data.lastLogin));
      }

      localStorage.setItem("token", response.data.token);
      navigate("/user-management");
    } catch (error) {
      console.error(
        "Login failed:",
        error.response ? error.response.data : error
      );
      setError("Invalid email or password");
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-dark">
      <div
        className="login-form p-4 shadow bg-white rounded"
        style={{ width: "100%", maxWidth: "400px" }}
      >
        <div className="text-center mb-4">
          <h2>Sign In to The App</h2>
          <p>Start your journey</p>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <div className="input-group">
              <input
                type="email"
                className="form-control"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
                <span className="input-group-text">
                  <i className="bi bi-envelope"></i>
                </span>
            </div>
          </div>
          <div className="form-group">
            <label>Password:</label>
            <div className="input-group">
            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              style={{ fontSize: "1rem" }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="input-group-text">
            <i class="bi bi-eye"></i>
                </span>
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-block mt-3"
            style={{
              borderRadius: "30px",
              backgroundColor: "#007bff",
              width: "100%",
              fontSize: "1.25rem",
              padding: "10px 0"
            }}
          >
            Sign In
          </button>
          <div className="text-center mt-3">
            <a href="/register">Don't have an account? Sign up</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;