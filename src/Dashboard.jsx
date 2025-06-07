import React, { useState, useEffect } from "react";

export default function CourseManager() {
  const [step, setStep] = useState(1);

  // Data structure:
  // courses: array of course names
  // folders: { [courseName]: [folderName, ...] }
  // links: { [courseName]: { [folderName]: [{ title, url }] } }
  const [courses, setCourses] = useState([]);
  const [folders, setFolders] = useState({});
  const [links, setLinks] = useState({});

  // Inputs for adding new items
  const [newCourse, setNewCourse] = useState("");
  const [folderTitle, setFolderTitle] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [askToContinue, setAskToContinue] = useState(false);

  // Confirmation popup state
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmType, setConfirmType] = useState(null); // "course", "folder", or "link"
  const [confirmTarget, setConfirmTarget] = useState(null); // Data identifying what to delete

  // Undo data
  const [undoData, setUndoData] = useState(null);
  const undoTimeoutRef = React.useRef(null);

  // Helper to clear undo timer
  const clearUndoTimer = () => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
  };

  // Add course
  const handleAddCourse = () => {
    const trimmed = newCourse.trim();
    if (!trimmed) return alert("Course name cannot be empty");
    if (courses.some(c => c.toLowerCase() === trimmed.toLowerCase())) 
      return alert("Course already exists");
    setCourses((prev) => [...prev, trimmed]);
    setFolders((prev) => ({ ...prev, [trimmed]: [] }));
    setLinks((prev) => ({ ...prev, [trimmed]: {} }));
    setNewCourse("");
    setStep(2);
    setSelectedCourse(trimmed);
  };

  // Add folder
  const handleAddFolder = () => {
    const trimmed = folderTitle.trim();
    if (!trimmed) return alert("Folder name cannot be empty");
    if (!selectedCourse) return alert("No course selected");
    if (folders[selectedCourse].some(f => f.toLowerCase() === trimmed.toLowerCase()))
      return alert("Folder already exists in this course");

    setFolders((prev) => ({
      ...prev,
      [selectedCourse]: [...prev[selectedCourse], trimmed],
    }));
    setLinks((prev) => ({
      ...prev,
      [selectedCourse]: { ...prev[selectedCourse], [trimmed]: [] },
    }));
    setFolderTitle("");
    setAskToContinue(true);
  };

  // Add link
  const handleAddLink = () => {
    const titleTrimmed = linkTitle.trim();
    const urlTrimmed = linkUrl.trim();
    if (!titleTrimmed || !urlTrimmed) return alert("Title and URL are required");
    if (!selectedCourse || !selectedFolder)
      return alert("Course and folder must be selected");

    const existingLinks = links[selectedCourse][selectedFolder] || [];
    // Check for duplicate link title or url in the folder
    if (
      existingLinks.some(
        (l) => l.title === titleTrimmed || l.url === urlTrimmed
      )
    ) {
      return alert("Link with same title or URL already exists in this folder");
    }

    const updatedLinks = {
      ...links,
      [selectedCourse]: {
        ...links[selectedCourse],
        [selectedFolder]: [...existingLinks, { title: titleTrimmed, url: urlTrimmed }],
      },
    };
    setLinks(updatedLinks);
    setLinkTitle("");
    setLinkUrl("");
    setAskToContinue(true);
  };

  // Confirm delete handlers
  const confirmDeleteCourse = (course) => {
    setConfirmType("course");
    setConfirmTarget({ course });
    setShowConfirm(true);
  };
  const confirmDeleteFolder = (course, folder) => {
    setConfirmType("folder");
    setConfirmTarget({ course, folder });
    setShowConfirm(true);
  };
  const confirmDeleteLink = (course, folder, linkIndex) => {
    setConfirmType("link");
    setConfirmTarget({ course, folder, linkIndex });
    setShowConfirm(true);
  };

  // Actual delete logic when confirmed
  const handleDeleteConfirmed = () => {
    if (!confirmType || !confirmTarget) return;

    if (confirmType === "course") {
      const course = confirmTarget.course;
      // Save undo data
      setUndoData({
        type: "course",
        data: {
          course,
          folders: folders[course],
          links: links[course],
        },
      });
      // Remove course and associated folders/links
      setCourses((prev) => prev.filter((c) => c !== course));
      setFolders((prev) => {
        const copy = { ...prev };
        delete copy[course];
        return copy;
      });
      setLinks((prev) => {
        const copy = { ...prev };
        delete copy[course];
        return copy;
      });
    } else if (confirmType === "folder") {
      const { course, folder } = confirmTarget;
      setUndoData({
        type: "folder",
        data: {
          course,
          folder,
          links: links[course][folder],
        },
      });
      // Remove folder
      setFolders((prev) => ({
        ...prev,
        [course]: prev[course].filter((f) => f !== folder),
      }));
      setLinks((prev) => {
        const courseLinks = { ...prev[course] };
        delete courseLinks[folder];
        return { ...prev, [course]: courseLinks };
      });
    } else if (confirmType === "link") {
      const { course, folder, linkIndex } = confirmTarget;
      const linkToRemove = links[course][folder][linkIndex];
      setUndoData({
        type: "link",
        data: { course, folder, link: linkToRemove, linkIndex },
      });
      setLinks((prev) => {
        const newFolderLinks = [...prev[course][folder]];
        newFolderLinks.splice(linkIndex, 1);
        return {
          ...prev,
          [course]: {
            ...prev[course],
            [folder]: newFolderLinks,
          },
        };
      });
    }

    setShowConfirm(false);
    setConfirmType(null);
    setConfirmTarget(null);

    clearUndoTimer();
    undoTimeoutRef.current = setTimeout(() => {
      setUndoData(null);
    }, 10000);
  };

  // Undo handler
  const handleUndo = () => {
    if (!undoData) return;

    if (undoData.type === "course") {
      const { course, folders: courseFolders, links: courseLinks } = undoData.data;
      setCourses((prev) => [...prev, course]);
      setFolders((prev) => ({ ...prev, [course]: courseFolders }));
      setLinks((prev) => ({ ...prev, [course]: courseLinks }));
    } else if (undoData.type === "folder") {
      const { course, folder, links: folderLinks } = undoData.data;
      setFolders((prev) => ({
        ...prev,
        [course]: [...prev[course], folder],
      }));
      setLinks((prev) => ({
        ...prev,
        [course]: { ...prev[course], [folder]: folderLinks },
      }));
    } else if (undoData.type === "link") {
      const { course, folder, link, linkIndex } = undoData.data;
      setLinks((prev) => {
        const newFolderLinks = [...(prev[course][folder] || [])];
        newFolderLinks.splice(linkIndex, 0, link);
        return {
          ...prev,
          [course]: {
            ...prev[course],
            [folder]: newFolderLinks,
          },
        };
      });
    }
    clearUndoTimer();
    setUndoData(null);
  };

  // Add link from overview shortcut
  const handleNewLinkFromOverview = (course, folder) => {
    setSelectedCourse(course);
    setSelectedFolder(folder);
    setStep(3);
    setAskToContinue(false);
    setLinkTitle("");
    setLinkUrl("");
  };

  return (
    <>
      <div className="min-h-screen bg-gray-800 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full bg-gray-900 rounded-lg p-8 text-white shadow-lg">
          {/* Step 1: Add Course */}
{step === 1 && (
  <div className="max-w-md mx-auto text-center">
    <h1 className="text-4xl font-bold mb-6">Add Course</h1>
    <input
      type="text"
      value={newCourse}
      onChange={(e) => setNewCourse(e.target.value)}
      placeholder="Enter course name"
      className="w-full px-4 py-2 rounded mb-4 text-black"
    />
    <button
      onClick={handleAddCourse}
      className="bg-green-600 px-6 py-2 rounded hover:bg-green-700"
    >
      Add Course
    </button>

    {/* Show added courses */}
    {courses.length > 0 && (
      <div className="mt-6 text-left">
        <h2 className="text-2xl font-semibold mb-3">Your Courses:</h2>
        <ul>
          {courses.map((course) => (
            <li key={course}>
              <button
                className="text-blue-400 underline hover:text-blue-600 mb-2"
                onClick={() => {
                  setSelectedCourse(course);
                  setStep(2);
                }}
              >
                {course.toUpperCase()}
              </button>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
)}

{/* Step 2: Add Folder */}
{step === 2 && (
  <div className="max-w-md mx-auto text-center">
    <h2 className="text-3xl font-semibold mb-4">
      Add Folder to: <span className="underline">{selectedCourse}</span>
    </h2>
    <input
      type="text"
      value={folderTitle}
      onChange={(e) => setFolderTitle(e.target.value)}
      placeholder="Add New Folder Name"
      className="w-full px-4 py-2 border rounded mb-4 text-black"
    />
    {/* Remove this single Add Folder button here */}
    {/* <button
      onClick={handleAddFolder}
      className="bg-green-600 px-6 py-2 rounded hover:bg-green-700"
    >
      Add Folder
    </button> */}

    {/* Show existing folders */}
    {(folders[selectedCourse] || []).length > 0 && (
      <div className="mt-6 text-left">
        <h3 className="text-xl font-semibold mb-3">Existing Folders:</h3>
        <ul>
          {folders[selectedCourse].map((folder) => (
            <li key={folder}>
              <button
                className="text-blue-400 underline hover:text-blue-600 mb-2"
                onClick={() => {
                  setSelectedFolder(folder);
                  setStep(3);
                  setAskToContinue(false);
                }}
              >
                {folder}
              </button>
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Add Folder and Go to Overview buttons side by side */}
    <div className="mt-4 flex justify-center gap-4">
      <button
        onClick={handleAddFolder}
        className="flex-1 bg-green-600 hover:bg-green-700 rounded py-2"
      >
        Add Folder
      </button>
      <button
        onClick={() => setStep(4)}
        className="flex-1 bg-gray-500 hover:bg-gray-400 rounded py-2"
      >
        Go to Overview
      </button>
    </div>

    <button
      onClick={() => setStep(1)}
      className="mt-6 w-full bg-gray-900 hover:bg-gray-700 rounded py-3"
    >
      Back to Courses
    </button>
  </div>
)}



          {/* Step 3: Add Link */}
{step === 3 && (
  <div className="max-w-md mx-auto text-center">
    <h2 className="text-3xl font-semibold mb-4">
      Add Link to Folder:{" "}
      <span className="underline">
        {selectedCourse} / {selectedFolder || "Select folder"}
      </span>
    </h2>

    {/* Folder selector if folder not selected */}
    {!selectedFolder && (
      <select
        className="w-full mb-4 px-4 py-2 rounded text-black"
        value={selectedFolder || ""}
        onChange={(e) => setSelectedFolder(e.target.value)}
      >
        <option value="" disabled>
          Folder Not Selected, Select One
        </option>
        {(folders[selectedCourse] || []).map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
    )}

    <input
      type="text"
      value={linkTitle}
      onChange={(e) => setLinkTitle(e.target.value)}
      placeholder="Link Title"
      className="w-full px-4 py-2 border rounded mb-4 text-black"
    />
    <input
      type="url"
      value={linkUrl}
      onChange={(e) => setLinkUrl(e.target.value)}
      placeholder="Link URL"
      className="w-full px-4 py-2 border rounded mb-4 text-black"
    />

    {/* Buttons: Add Link & Go to Overview side by side */}
    <div className="flex justify-center gap-4 mb-4">
      <button
        onClick={handleAddLink}
        className="flex-1 bg-green-600 hover:bg-green-700 rounded py-2"
      >
        Add Link
      </button>
      <button
        onClick={() => setStep(4)}
        className="flex-1 bg-blue-700 hover:bg-blue-600 rounded py-2"
      >
        Go to Overview
      </button>
    </div>

    {/* Buttons: Back to Folder & Back to Courses side by side */}
    <div className="flex justify-center gap-4">
      <button
        onClick={() => setStep(2)}
        className="flex-1 bg-gray-900 hover:bg-gray-700 rounded py-2"
      >
        Back to Folder
      </button>
      <button
        onClick={() => setStep(1)}
        className="flex-1 bg-gray-900 hover:bg-gray-700 rounded py-2"
      >
        Back to Courses
      </button>
    </div>
  </div>
)}


          {/* Step 4: Overview */}
          {step === 4 && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Overview</h2>
              {courses.length === 0 && <p>No courses added yet.</p>}

              {courses.map((course) => (
                <div
                  key={course}
                  className="mb-6 border border-gray-700 rounded p-4 bg-gray-800"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-2xl font-semibold">{course.toUpperCase()}</h3>
                    <button
                      title="Remove Course"
                      onClick={() => confirmDeleteCourse(course)}
                      className="text-red-600 font-bold text-xl hover:text-red-800"
                    >
                      &times;
                    </button>
                  </div>

                  {(folders[course] || []).length === 0 && (
                    <p className="ml-4 italic">No folders added.</p>
                  )}

                  {(folders[course] || []).map((folder) => (
                    <div
                      key={folder}
                      className="ml-6 mb-4 border border-gray-600 rounded p-3 bg-gray-700"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold">{folder}</h4>
                        <button
                          title="Remove Folder"
                          onClick={() => confirmDeleteFolder(course, folder)}
                          className="text-red-600 font-bold text-lg hover:text-red-800"
                        >
                          &times;
                        </button>
                      </div>
                      <div className="ml-4">
                        {(links[course]?.[folder] || []).length === 0 && (
                          <p className="italic text-sm">No links added.</p>
                        )}

                        {(links[course]?.[folder] || []).map((link, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center mb-1"
                          >
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline text-blue-400"
                            >
                              {link.title}
                            </a>
                            <button
                              title="Remove Link"
                              onClick={() => confirmDeleteLink(course, folder, idx)}
                              className="text-red-600 font-bold hover:text-red-800"
                            >
                              &times;
                            </button>
                          </div>
                        ))}

                        <button
                          onClick={() => handleNewLinkFromOverview(course, folder)}
                          className="text-green-500 underline hover:text-green-700 text-sm mt-2"
                        >
                          + Add Link
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              <button
                onClick={() => setStep(1)}
                className="w-full bg-gray-900 hover:bg-gray-700 rounded py-3 text-2xl font-bold"
              >
                Add Course/Folder
              </button>
            </div>
          )}

          {/* Confirmation popup */}
          {showConfirm && (
            <div
              className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50"
              onClick={() => {
                setShowConfirm(false);
                setConfirmType(null);
                setConfirmTarget(null);
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white text-black p-6 rounded-lg max-w-sm w-full shadow-lg"
              >
                <h3 className="text-xl font-bold mb-4">Confirm Deletion</h3>
                <p className="mb-6">
                  Are you sure you want to delete this{" "}
                  {confirmType === "course"
                    ? "course and all its folders & links"
                    : confirmType === "folder"
                    ? "folder and all its links"
                    : "link"}
                  ?
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                    onClick={() => {
                      setShowConfirm(false);
                      setConfirmType(null);
                      setConfirmTarget(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    onClick={handleDeleteConfirmed}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Undo notification */}
          {undoData && (
            <div className="fixed bottom-5 right-5 bg-gray-900 text-white px-6 py-3 rounded shadow-lg flex items-center space-x-4 z-50">
              <span>Deleted {undoData.type}. </span>
              <button
                className="underline text-green-400 hover:text-green-600"
                onClick={handleUndo}
              >
                Undo
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
