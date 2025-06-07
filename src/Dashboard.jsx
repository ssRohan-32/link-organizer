import { useState, useEffect } from "react";

export default function Dashboard() {
  const [step, setStep] = useState(1);
  const [courses, setCourses] = useState([]);
  const [folders, setFolders] = useState({});
  const [links, setLinks] = useState({});

  const [courseTitle, setCourseTitle] = useState("");
  const [folderTitle, setFolderTitle] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [askToContinue, setAskToContinue] = useState(false);
  const [selectingCourse, setSelectingCourse] = useState(true);
  const [selectingFolder, setSelectingFolder] = useState(true);

  // Confirmation popup state
  const [showConfirm, setShowConfirm] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState(null); // {course, folder, index}

  useEffect(() => {
    const savedCourses = JSON.parse(localStorage.getItem("courses") || "[]");
    const savedFolders = JSON.parse(localStorage.getItem("folders") || "{}");
    const savedLinks = JSON.parse(localStorage.getItem("links") || "{}");
    setCourses(savedCourses);
    setFolders(savedFolders);
    setLinks(savedLinks);
  }, []);

  useEffect(() => {
    localStorage.setItem("courses", JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem("folders", JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem("links", JSON.stringify(links));
  }, [links]);

  const capitalize = (str) => {
    if (!str) return "";
    str = str.trim();
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const handleAddCourse = () => {
    const normalized = capitalize(courseTitle);
    if (!normalized) return;

    // If course already exists, just proceed to folder selection
    if (courses.some((c) => c.toLowerCase() === normalized.toLowerCase())) {
      setCourseTitle(normalized);
      setStep(2);
      setSelectingCourse(true);
      setSelectingFolder(true);
      return;
    }

    // Add new course and initialize folders and links
    setCourses([...courses, normalized]);
    setFolders({ ...folders, [normalized]: [] });
    setLinks({ ...links, [normalized]: {} });
    setCourseTitle(normalized);
    setStep(2);
    setSelectingCourse(true);
    setSelectingFolder(true);
  };

  const handleAddFolder = () => {
    const course = capitalize(courseTitle);
    const normalized = capitalize(folderTitle);
    if (!normalized) return;

    // If folder already exists, just proceed to add link step
    if ((folders[course] || []).some((f) => f.toLowerCase() === normalized.toLowerCase())) {
      setFolderTitle(normalized);
      setStep(3);
      setSelectingFolder(true);
      return;
    }

    // Add new folder and initialize links
    const newFolders = [...(folders[course] || []), normalized];
    setFolders({ ...folders, [course]: newFolders });
    setLinks({
      ...links,
      [course]: { ...links[course], [normalized]: [] },
    });
    setFolderTitle(normalized);
    setStep(3);
    setSelectingFolder(true);
  };

  const handleAddLink = () => {
    if (!linkTitle.trim() || !linkUrl.trim()) return;
    const course = capitalize(courseTitle);
    const folder = capitalize(folderTitle);
    const updatedLinks = {
      ...links,
      [course]: {
        ...links[course],
        [folder]: [
          ...(links[course]?.[folder] || []),
          { title: linkTitle.trim(), url: linkUrl.trim() },
        ],
      },
    };
    setLinks(updatedLinks);
    setLinkTitle("");
    setLinkUrl("");
    setAskToContinue(true);
  };

  const handleNewLinkFromOverview = (course, folder) => {
    const normalizedCourse = capitalize(course);
    const normalizedFolder = capitalize(folder);
    setCourseTitle(normalizedCourse);
    setFolderTitle(normalizedFolder);
    setSelectingCourse(false);
    setSelectingFolder(false);
    setStep(3);
    setAskToContinue(false);
    setLinkTitle("");
    setLinkUrl("");
  };

  // Show confirm popup to delete link
  const confirmDeleteLink = (course, folder, index) => {
    setLinkToDelete({ course, folder, index });
    setShowConfirm(true);
  };

  // Delete link after confirmation
  const handleDeleteLink = () => {
    if (!linkToDelete) return;
    const { course, folder, index } = linkToDelete;
    const updatedLinksArray = [...(links[course][folder] || [])];
    updatedLinksArray.splice(index, 1);
    setLinks({
      ...links,
      [course]: {
        ...links[course],
        [folder]: updatedLinksArray,
      },
    });
    setShowConfirm(false);
    setLinkToDelete(null);
  };

  // Cancel delete
  const cancelDeleteLink = () => {
    setShowConfirm(false);
    setLinkToDelete(null);
  };

  return (
    <>
      {/* Background blur when confirm popup is active */}
      <div className={showConfirm ? "fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40" : ""}></div>

      <div className={`min-h-screen bg-gray-900 text-white p-6 flex items-center justify-center ${showConfirm ? "pointer-events-none" : ""}`}>
        <div className="w-full max-w-md relative z-50">
          <h1 className="text-5xl font-bold italic text-center mb-10">Dashboard</h1>

          {/* Step 1: Select or Add Course */}
          {step === 1 && (
            <div className="relative bg-white/60 text-black p-8 rounded-lg mx-auto max-w-md text-center">
              <div className="bg-white/40 p-4 rounded shadow-md mb-6">
                {selectingCourse ? (
                  <select
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "new") {
                        setSelectingCourse(false);
                        setCourseTitle("");
                      } else {
                        setCourseTitle(value);
                      }
                    }}
                    className="w-full px-4 py-2 border rounded mb-4"
                    style={{ opacity: 0.7 }}
                    value={selectingCourse ? courseTitle : "new"}
                  >
                    <option value="" disabled>
                      Show Existing Courses
                    </option>
                    {courses.map((c, idx) => (
                      <option key={idx} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="new">Add Course</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="Add New Course Name"
                    className="w-full px-4 py-2 border rounded mb-4"
                  />
                )}
                <button
                  onClick={handleAddCourse}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                >
                  Proceed
                </button>
              </div>
              <div
                onClick={() => setStep(4)}
                className="text-white border border-white px-8 py-4 text-3xl font-bold cursor-pointer hover:bg-white hover:text-black bg-gray-900 shadow-lg transition"
              >
                Go to Overview
              </div>
            </div>
          )}

          {/* Step 2: Select or Add Folder */}
          {step === 2 && (
            <div className="bg-white/60 text-black p-8 rounded-lg mx-auto max-w-md text-center">
              <div className="bg-white/40 p-4 rounded shadow-md mb-6">
                {selectingFolder ? (
                  <select
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "new") {
                        setSelectingFolder(false);
                        setFolderTitle("");
                      } else {
                        setFolderTitle(value);
                      }
                    }}
                    className="w-full px-4 py-2 border rounded mb-4"
                    style={{ opacity: 0.7 }}
                    value={selectingFolder ? folderTitle : "new"}
                  >
                    <option value="" disabled>
                      Show Existing Folders
                    </option>
                    {(folders[capitalize(courseTitle)] || []).map((f, idx) => (
                      <option key={idx} value={f}>
                        {f}
                      </option>
                    ))}
                    <option value="new">Add Folder</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={folderTitle}
                    onChange={(e) => setFolderTitle(e.target.value)}
                    placeholder="Add New Folder Name"
                    className="w-full px-4 py-2 border rounded mb-4"
                  />
                )}
                <button
                  onClick={handleAddFolder}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                >
                  Proceed
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Add Link */}
          {step === 3 && !askToContinue && (
            <div className="bg-white text-black p-8 rounded-lg mx-auto max-w-md text-center">
              <h2 className="text-2xl font-semibold mb-4">Add Link in {folderTitle}</h2>
              <input
                type="text"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Link Title"
                className="w-full px-4 py-2 border rounded mb-4"
              />
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-2 border rounded mb-4"
              />
              <button
                onClick={handleAddLink}
                className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
              >
                Add Link
              </button>
            </div>
          )}

          {/* Step 3: Ask to Continue */}
          {askToContinue && (
            <div className="text-center mt-6 flex justify-center gap-6">
              <button
                className="bg-yellow-400 text-black px-6 py-3 text-lg rounded hover:bg-yellow-300"
                onClick={() => {
                  setAskToContinue(false);
                  setStep(1);
                  setSelectingCourse(true);
                  setSelectingFolder(true);
                }}
              >
                Add More
              </button>
              <button
                className="bg-yellow-400 text-black px-6 py-3 text-lg rounded hover:bg-yellow-300"
                onClick={() => {
                  setAskToContinue(false);
                  setTimeout(() => setStep(4), 0);
                }}
              >
                Show Overview
              </button>
            </div>
          )}

          {/* Step 4: Overview */}
          {step === 4 && (
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl text-center mb-6 font-semibold">All Courses Overview</h2>
              {courses.length === 0 && (
                <p className="text-center text-gray-400 italic">No courses added yet</p>
              )}
              {courses.map((course) => (
                <details
                  key={course}
                  className="mb-4 border rounded bg-white/20 p-3"
                  open={false}
                >
                  <summary className="cursor-pointer font-semibold text-lg">{course}</summary>
                  <div className="pl-6 mt-2">
                    {(folders[course] || []).length === 0 && (
                      <p className="italic text-gray-400">No folders</p>
                    )}
                    {(folders[course] || []).map((folder) => (
                      <details
                        key={folder}
                        className="mb-3 border rounded bg-white/10 p-2"
                        open={false}
                      >
                        <summary className="cursor-pointer font-semibold text-base">{folder}</summary>
                        <ul className="pl-4 mt-1 list-disc relative">
                          {(links[course]?.[folder] || []).length === 0 ? (
                            <li className="italic text-gray-400">No links</li>
                          ) : (
                            links[course][folder].map((link, idx) => (
                              <li
                                key={idx}
                                className="flex justify-between items-center"
                              >
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline hover:text-yellow-400 flex-grow"
                                >
                                  {link.title}
                                </a>
                                <button
                                  onClick={() => confirmDeleteLink(course, folder, idx)}
                                  className="ml-4 text-red-600 hover:text-red-800 font-bold text-lg"
                                  title="Remove Link"
                                  aria-label="Remove Link"
                                >
                                  &times;
                                </button>
                              </li>
                            ))
                          )}
                        </ul>
                        <button
                          onClick={() => handleNewLinkFromOverview(course, folder)}
                          className="mt-2 bg-yellow-400 text-black px-4 py-1 rounded hover:bg-yellow-300"
                        >
                          Add Link Here
                        </button>
                      </details>
                    ))}
                  </div>
                </details>
              ))}
              <div className="text-center mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="bg-green-600 px-6 py-3 rounded text-white hover:bg-green-700"
                >
                  Add New Course / Folder / Link
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Popup */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-auto">
          <div className="bg-white text-black rounded-lg p-6 w-80 max-w-full shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-center">
              Confirm Link Removal
            </h3>
            <p className="mb-6 text-center">
              Are you sure you want to remove this link?
            </p>
            <div className="flex justify-center gap-6">
              <button
                onClick={handleDeleteLink}
                className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
              >
                Yes, Remove
              </button>
              <button
                onClick={cancelDeleteLink}
                className="bg-gray-400 text-black px-6 py-2 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
