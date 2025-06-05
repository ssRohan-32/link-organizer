import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";

// Your existing Login component (slightly adapted for navigation)
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, mock login success and go to dashboard
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4">
      {/* Title without box */}
      <h1 className="text-gray-300 text-6xl font-extrabold mb-12 text-center">
        Link Organizer
      </h1>

      {/* Green login box */}
      <div className="bg-green-300 bg-opacity-90 p-8 rounded-lg shadow-lg max-w-md w-full">
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
      </div>
    </div>
  );
}

// Dashboard component with link add/view, adapted styling to match
function Dashboard() {
  const [links, setLinks] = useState(() => {
    const saved = localStorage.getItem("links");
    return saved ? JSON.parse(saved) : [];
  });

  const [newLink, setNewLink] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const addLink = (e) => {
    e.preventDefault();
    if (!newTitle || !newLink) return;
    const updatedLinks = [...links, { title: newTitle, url: newLink }];
    setLinks(updatedLinks);
    localStorage.setItem("links", JSON.stringify(updatedLinks));
    setNewLink("");
    setNewTitle("");
  };

  const removeLink = (index) => {
    const updatedLinks = links.filter((_, i) => i !== index);
    setLinks(updatedLinks);
    localStorage.setItem("links", JSON.stringify(updatedLinks));
  };

  return (
    <div className="min-h-screen bg-black p-6 text-gray-300">
      <div className="max-w-3xl mx-auto bg-green-300 bg-opacity-90 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-extrabold mb-6 text-center text-gray-900">Dashboard</h1>

        <form onSubmit={addLink} className="mb-6 space-y-4 text-gray-900">
          <div>
            <label htmlFor="title" className="block mb-1 font-bold">
              Title/Description
            </label>
            <input
              id="title"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Example: Google Classroom Notes"
              className="w-full px-4 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label htmlFor="link" className="block mb-1 font-bold">
              Link or File Path
            </label>
            <input
              id="link"
              type="text"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="https:// or file path"
              className="w-full px-4 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <button
            type="submit"
            className="bg-green-700 text-white px-6 py-2 rounded-md hover:bg-green-800 transition font-bold"
          >
            Add Link
          </button>
        </form>

        <div>
          {links.length === 0 ? (
            <p className="text-center text-gray-900">No links added yet.</p>
          ) : (
            <ul className="space-y-3">
              {links.map(({ title, url }, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center border p-3 rounded-md bg-green-50 bg-opacity-50 text-gray-900"
                >
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-900 hover:underline max-w-xs truncate"
                    title={url}
                  >
                    {title}
                  </a>
                  <button
                    onClick={() => removeLink(index)}
                    className="text-red-700 hover:text-red-900 font-bold"
                    aria-label="Delete link"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
