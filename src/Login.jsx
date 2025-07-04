import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./firebase"; 

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (onLogin) onLogin(); // optional: for app-wide login state
      navigate("/dashboard");
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      alert("Please enter your email address");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
      setTimeout(() => {
        setIsResetting(false);
        setResetSent(false);
      }, 5000);
    } catch (error) {
      alert("Password reset failed: " + error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4">
      <h1 className="text-gray-300 text-6xl font-extrabold mb-12 text-center">
        Link Organizer
      </h1>

      <div className="bg-green-300 bg-opacity-90 p-8 rounded-lg shadow-lg max-w-md w-full">
        {isResetting ? (
          <>
            <h2 className="text-2xl font-extrabold mb-6 text-center text-gray-900">
              Reset Password
            </h2>
            {resetSent ? (
              <div className="text-center text-green-800 mb-4">
                Password reset email sent! Check your inbox.
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div>
                  <label htmlFor="resetEmail" className="block text-gray-900 mb-1 font-bold">
                    Email
                  </label>
                  <input
                    type="email"
                    id="resetEmail"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-700 text-white py-2 rounded-md hover:bg-green-800 transition font-bold"
                >
                  Send Reset Link
                </button>
                <button
                  type="button"
                  onClick={() => setIsResetting(false)}
                  className="w-full bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 transition font-bold"
                >
                  Back to Login
                </button>
              </form>
            )}
          </>
        ) : (
          <>
            <h2 className="text-2xl font-extrabold mb-6 text-center text-gray-900">
              Login to Your Account
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-gray-900 mb-1 font-bold">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-gray-900 mb-1 font-bold">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-700 text-white py-2 rounded-md hover:bg-green-800 transition font-bold"
              >
                Login
              </button>
            </form>
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => navigate("/signup")}
                className="text-blue-600 underline hover:text-blue-800 text-sm"
                type="button"
              >
                Don't have an account? Sign Up
              </button>
              <button
                onClick={() => setIsResetting(true)}
                className="text-blue-600 underline hover:text-blue-800 text-sm"
                type="button"
              >
                Forgot Password?
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}