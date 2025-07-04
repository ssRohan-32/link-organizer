import { setDoc, updateDoc, collection, getDocs, getDoc, addDoc, deleteDoc, doc } from "firebase/firestore";
import React, { useState, useEffect, useMemo } from "react";
import { auth, db } from "./firebase";
import { signOut } from "firebase/auth";


export default function CourseManager({ onLogout }) {
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
  const selectedCourseObj = courses.find(c => c.id === selectedCourse);

  const [selectedFolder, setSelectedFolder] = useState(null);
  const [setAskToContinue] = useState(false);
  

  // Deleting course
  const confirmDeleteCourse = (course) => {
  setShowConfirm(true);
  setConfirmType("course");
  setConfirmTarget(course); 
};

// Deleting folder
const confirmDeleteFolder = (course, folder) => {
  setShowConfirm(true);
  setConfirmType("folder");
  setConfirmTarget({ course, folder }); 
};

// Deleting link
const confirmDeleteLink = (course, folder, index) => {
  setShowConfirm(true);
  setConfirmType("link");
  setConfirmTarget({ course, folder, index }); 
};


// Adding link from overview
const handleNewLinkFromOverview = (course, folder) => {
  setSelectedCourse(course.id);
  setSelectedFolder(folder);
  setStep(3); // Go to Add Link step
  setAskToContinue(false);
};                            


// Accessing courses/folders from previous step
  useEffect(() => {
  const fetchUserCourses = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const coursesRef = collection(db, "users", user.uid, "courses");
    const snapshot = await getDocs(coursesRef);
    const coursesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCourses(coursesData);

  
    const foldersData = {};
    const linksData = {};
    coursesData.forEach(course => {
      foldersData[course.id] = course.folders || [];
      linksData[course.id] = course.links || {};
    });
    setFolders(foldersData);
    setLinks(linksData);
  };

  fetchUserCourses();
}, []);


  // Confirmation popup state
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmType, setConfirmType] = useState(null); // course, folder or link
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
 const handleAddCourse = async () => {
  const trimmed = newCourse.trim();
  if (!trimmed) return alert("Course name cannot be empty");

  const tempId = `temp-${Date.now()}`;

  // Check in local state
  if (courses.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
    return alert("Course already exists locally. Try a different name or wait.");
  }

  // Update UI Optimistically using tempID
  const newCourseObj = {
    id: tempId,
    name: trimmed,
    folders: [],
    links: {},
  };
  setCourses(prev => [...prev, newCourseObj]);
  setFolders(prev => ({ ...prev, [tempId]: [] }));
  setLinks(prev => ({ ...prev, [tempId]: {} }));
  setNewCourse("");
  setSelectedCourse(tempId);
  setStep(2);


  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Not logged in");

    const coursesRef = collection(db, "users", user.uid, "courses");

    // Checking Firestore for duplicate
    const snapshot = await getDocs(coursesRef);
    const exists = snapshot.docs.find(
      (doc) => doc.data().name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      alert("Course already exists in the database.");

      // Rollback UI
      setCourses(prev => prev.filter(c => c.id !== tempId));
      setFolders(prev => {
        const updated = { ...prev };
        delete updated[tempId];
        return updated;
      });
      setLinks(prev => {
        const updated = { ...prev };
        delete updated[tempId];
        return updated;
      });
      return;
    }

    // If not exist, add to Firestore
    const docRef = await addDoc(coursesRef, {
      name: trimmed,
      folders: [],
      links: {},
    });

    // Replace temp ID with real ID in all places
    setCourses(prev => prev.map(c =>
      c.id === tempId ? { ...c, id: docRef.id } : c
    ));
    setFolders(prev => {
      const updated = { ...prev };
      updated[docRef.id] = updated[tempId];
      delete updated[tempId];
      return updated;
    });
    setLinks(prev => {
      const updated = { ...prev };
      updated[docRef.id] = updated[tempId];
      delete updated[tempId];
      return updated;
    });

    setSelectedCourse(docRef.id);
  } catch (error) {
    alert("Failed to add course: " + error.message);

    // Rollback UI if error
    setCourses(prev => prev.filter(c => c.id !== tempId));
    setFolders(prev => {
      const updated = { ...prev };
      delete updated[tempId];
      return updated;
    });
    setLinks(prev => {
      const updated = { ...prev };
      delete updated[tempId];
      return updated;
    });
  }
};





  // Add folder
  const handleAddFolder = async () => {
  const trimmed = folderTitle.trim();
  if (!trimmed) return alert("Folder name cannot be empty");
  if (!selectedCourse) return alert("No course selected");

  const currentFolders = folders[selectedCourse] || [];
  if (currentFolders.some(f => f.toLowerCase() === trimmed.toLowerCase()))
    return alert("Folder already exists in this course");

  const user = auth.currentUser;
  if (!user) return alert("Not logged in");

  // Updating local state optimistically
  const updatedFolders = [...currentFolders, trimmed];
  const updatedLinks = {
    ...(links[selectedCourse] || {}),
    [trimmed]: [],
  };

  setFolders(prev => ({
    ...prev,
    [selectedCourse]: updatedFolders,
  }));

  setLinks(prev => ({
    ...prev,
    [selectedCourse]: updatedLinks,
  }));

  setFolderTitle(""); // Clear input
  setAskToContinue(true);

  try {
    const docRef = doc(db, "users", user.uid, "courses", selectedCourse);
    await updateDoc(docRef, {
      folders: updatedFolders,
      links: updatedLinks,
    });
  } catch (error) {
    console.error("Failed to sync folder with Firestore:", error);
    alert("Failed to save folder to Firestore. Refresh or try again.");
  }
};




  // Add link
  const handleAddLink = async () => {
  const titleTrimmed = linkTitle.trim();
  const urlTrimmed = linkUrl.trim();
  if (!titleTrimmed || !urlTrimmed) return alert("Title and URL are required");
  if (!selectedCourse || !selectedFolder)
    return alert("Course and folder must be selected");

  const currentLinks = links[selectedCourse]?.[selectedFolder] || [];

  // Check for duplicates
  if (
    currentLinks.some(
      (l) =>
        l.title.toLowerCase() === titleTrimmed.toLowerCase() ||
        l.url === urlTrimmed
    )
  ) {
    return alert("Link with the same title or URL already exists in this folder");
  }

  const newLink = { title: titleTrimmed, url: urlTrimmed };
  const updatedFolderLinks = [...currentLinks, newLink];

  // Updating UI optimistically
  setLinks((prev) => ({
    ...prev,
    [selectedCourse]: {
      ...(prev[selectedCourse] || {}),
      [selectedFolder]: updatedFolderLinks,
    },
  }));

  setLinkTitle("");
  setLinkUrl("");
  setAskToContinue(true);

  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Not logged in");

    const docRef = doc(db, "users", user.uid, "courses", selectedCourse);
    await updateDoc(docRef, {
      [`links.${selectedFolder}`]: updatedFolderLinks,
    });
  } catch (error) {
    console.error("Failed to sync link to Firestore:", error);
    alert("Failed to save link to Firestore.");    
  }
};





  // Confirm delete handlers
  const handleDeleteConfirmed = async () => {
  const user = auth.currentUser;
  if (!user || !confirmType || !confirmTarget) return;

  // Immediately close the confirmation for responsiveness
  setShowConfirm(false);
  setConfirmType(null);
  setConfirmTarget(null);

  try {
    // CASE: DELETE COURSE
    if (confirmType === "course") {
      const course = confirmTarget;

      // Save undo data
      setUndoData({
        type: "course",
        data: {
          course,
          folders: folders[course.id] || [],
          links: links[course.id] || {},
        },
      });
      clearUndoTimer(); // clear previous timer if any
undoTimeoutRef.current = setTimeout(() => {
  setUndoData(null);
}, 10000); // 10 seconds


      // Update UI asap
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
      setFolders((prev) => {
        const copy = { ...prev };
        delete copy[course.id];
        return copy;
      });
      setLinks((prev) => {
        const copy = { ...prev };
        delete copy[course.id];
        return copy;
      });

      // Firestore delete in background
      deleteDoc(doc(db, "users", user.uid, "courses", course.id))
        .catch((err) => {
          console.error("Failed to delete course in Firestore:", err);
          alert("Failed to sync course deletion with Firestore.");
        });
    }

    // CASE: DELETE FOLDER
    else if (confirmType === "folder") {
      const { course, folder } = confirmTarget;
      const docRef = doc(db, "users", user.uid, "courses", course.id);

      const folderLinks = links[course.id]?.[folder] || [];

      setUndoData({
        type: "folder",
        data: {
          course,
          folder,
          links: folderLinks,
        },
      });
      clearUndoTimer(); // clear previous timer if any
undoTimeoutRef.current = setTimeout(() => {
  setUndoData(null);
}, 10000); // 10 seconds


      const updatedFolders = (folders[course.id] || []).filter((f) => f !== folder);
      const updatedLinks = { ...(links[course.id] || {}) };
      delete updatedLinks[folder];

      // Update UI asap
      setFolders((prev) => ({
        ...prev,
        [course.id]: updatedFolders,
      }));
      setLinks((prev) => ({
        ...prev,
        [course.id]: updatedLinks,
      }));

      // Firestore update in background
      updateDoc(docRef, {
        folders: updatedFolders,
        links: updatedLinks,
      }).catch((err) => {
        console.error("Failed to delete folder in Firestore:", err);
        alert("Failed to sync folder deletion with Firestore.");
      });
    }

    // CASE: DELETE LINK
    else if (confirmType === "link") {
      const { course, folder, index } = confirmTarget;
      const currentLinks = links[course.id]?.[folder] || [];
      const deletedLink = currentLinks[index];
      if (!deletedLink) throw new Error("Link not found");

      const updatedFolderLinks = [...currentLinks];
      updatedFolderLinks.splice(index, 1);

      setUndoData({
        type: "link",
        data: {
          course,
          folder,
          link: deletedLink,
        },
      });
      clearUndoTimer(); // clear previous timer if any
undoTimeoutRef.current = setTimeout(() => {
  setUndoData(null);
}, 10000); // 10 seconds


      // Update UI asap
      setLinks((prev) => ({
        ...prev,
        [course.id]: {
          ...(prev[course.id] || {}),
          [folder]: updatedFolderLinks,
        },
      }));

      const docRef = doc(db, "users", user.uid, "courses", course.id);

      // Firestore update in background
      updateDoc(docRef, {
        [`links.${folder}`]: updatedFolderLinks,
      }).catch((err) => {
        console.error("Failed to delete link in Firestore:", err);
        alert("Failed to sync link deletion with Firestore.");
      });
    }
  } catch (err) {
    console.error("Deletion failed:", err);
    alert("Something went wrong during deletion.");
  }
};






  // Undo handler
  const handleUndo = async () => {
  if (!undoData) return;

  try {
    const user = auth.currentUser;
    if (!user) return alert("Not logged in");

    if (undoData.type === "course") {
      const { course, folders: courseFolders, links: courseLinks } = undoData.data;
      const docRef = doc(db, "users", user.uid, "courses", course.id);

      setDoc(docRef, {
        name: course.name,
        folders: courseFolders || [],
        links: courseLinks || {},
      });

      // Update local state
      setCourses((prev) => [...prev, course]);
      setFolders((prev) => ({ ...prev, [course.id]: courseFolders || [] }));
      setLinks((prev) => ({ ...prev, [course.id]: courseLinks || {} }));

    } else if (undoData.type === "folder") {
      const { course, folder, links: folderLinks } = undoData.data;
      const docRef = doc(db, "users", user.uid, "courses", course.id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) throw new Error("Course not found");

      const courseData = docSnap.data();
      const updatedFolders = [...(courseData.folders || []), folder];
      const updatedLinks = { ...(courseData.links || {}) };
      updatedLinks[folder] = folderLinks || [];

      updateDoc(docRef, {
        folders: updatedFolders,
        links: updatedLinks,
      });

      setFolders((prev) => ({
        ...prev,
        [course.id]: [...(prev[course.id] || []), folder],
      }));
      setLinks((prev) => ({
        ...prev,
        [course.id]: { ...(prev[course.id] || {}), [folder]: folderLinks || [] },
      }));

    } else if (undoData.type === "link") {
      const { course, folder, link } = undoData.data;
      const docRef = doc(db, "users", user.uid, "courses", course.id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) throw new Error("Course not found");

      const courseData = docSnap.data();
      const folderLinks = [...((courseData.links && courseData.links[folder]) || [])];

      folderLinks.push(link);

      const updatedLinks = {
        ...courseData.links,
        [folder]: folderLinks,
      };

      updateDoc(docRef, { links: updatedLinks });

      setLinks((prev) => {
        const courseLinks = prev[course.id] || {};
        const updatedFolderLinks = [...(courseLinks[folder] || []), link];
        return {
          ...prev,
          [course.id]: {
            ...courseLinks,
            [folder]: updatedFolderLinks,
          },
        };
      });
    }

    setUndoData(null);
  } catch (error) {
    console.error("Undo failed:", error);
    alert("Something went wrong while restoring data.");
  }
};





//Logout
const handleLogout = async () => {
    try {
      await signOut(auth);  // Log out from Firebase
      if (onLogout) onLogout();  // Update state 
    } catch (error) {
      alert("Logout failed: " + error.message);
    }
  };



const overviewContent = useMemo(() => {
  return (courses || []).filter(course => !!course.id && !!course.name)
    .map((course) => (
      <div 
        key={course.id} 
        className="mb-6 border border-gray-700 rounded p-4 bg-gray-800 
                  transition-all duration-300 ease-in-out
                  hover:border-gray-500 hover:shadow-lg hover:-translate-y-1"
      >
        {/* Course header with animation */}
        <div className="flex justify-between items-center mb-3 group">
          <h3 className="text-2xl font-semibold 
                        transition-all duration-300
                        group-hover:text-blue-400">
            {course.name.toUpperCase()}
          </h3>
          <button
            title="Remove Course"
            onClick={() => confirmDeleteCourse(course)}
            className="text-red-600 font-bold text-xl 
                      hover:text-red-800 hover:scale-125
                      transition-transform duration-200"
          >
            &times;
          </button>
        </div>

        {/* Folder items with animation */}
        {(folders[course.id] || []).map((folder) => (
          <div 
            key={folder} 
            className="ml-6 mb-4 border border-gray-600 rounded p-3 bg-gray-700
                      transition-all duration-300 ease-in-out
                      hover:bg-gray-600 hover:border-gray-400 hover:shadow-md"
          >
            <div className="flex justify-between items-center mb-2 group">
              <h4 className="font-semibold 
                            transition-all duration-300
                            group-hover:text-green-400">
                {folder}
              </h4>
              <button
                title="Remove Folder"
                onClick={() => confirmDeleteFolder(course, folder)}
                className="text-red-600 font-bold text-lg 
                          hover:text-red-800 hover:rotate-90
                          transition-transform duration-300"
              >
                &times;
              </button>
            </div>

            {/* Link items with animation */}
            {(links?.[course.id]?.[folder] || []).map((link, idx) => (
              <div 
                key={idx} 
                className="flex justify-between items-center mb-1 group
                          hover:bg-gray-500/30 px-2 py-1 rounded
                          transition-all duration-200"
              >
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-400
                            transition-all duration-300
                            hover:text-blue-300 transform hover:scale-110 hover:no-underline"
                >
                  {link.title}
                </a>
                <button
                  title="Remove Link"
                  onClick={() => confirmDeleteLink(course, folder, idx)}
                  className="text-red-600 font-bold 
                            hover:text-red-800 hover:scale-125
                            transition-transform duration-200"
                >
                  &times;
                </button>
              </div>
            ))}

            <button
              onClick={() => handleNewLinkFromOverview(course, folder)}
              className="text-green-500 hover:text-green-300 text-sm mt-2
                        underline hover:no-underline
                        transition-all duration-300"
            >
              + Add Link
            </button>
          </div>
        ))}
      </div>
    ));
}, [courses, folders, links]);



  return (
    <>
      {/* Logout button */}
    <div className="min-h-screen bg-gray-800 flex items-center justify-center p-4 sm:p-6">
      {/* Logout button for Step 1 */}
      {step === 1 && (
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Logout
        </button>
      )}

      {/* Logout button for Step 4 */}
      {step === 4 && (
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Logout
        </button>
      )}
        <div className="w-full max-w-4xl bg-gray-900 rounded-lg p-4 sm:p-8 text-white shadow-lg transition-all duration-300 ease-in-out">
          
          
          {/* Step 1: Add Course */}
{step === 1 && (
  <div className="max-w-md mx-auto text-center">
    <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center sm:text-center transition-all duration-200">
      Add Course
    </h1>

    <input
      type="text"
      value={newCourse}
      onChange={(e) => setNewCourse(e.target.value)}
      placeholder="Enter course name"
      className="w-full px-6 py-4 border rounded mb-6 text-black focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200 text-xl" 
    />

    <div className="flex gap-4"> 
      <button
        onClick={handleAddCourse}
        className="flex-1 bg-green-700 hover:bg-green-400 text-yellow-100 px-6 py-3 rounded-lg transition-colors duration-200 border border-gray-600"
      >
        Add Course
      </button>
      <button
        onClick={() => setStep(4)}
        className="flex-1 bg-gray-700 hover:bg-gray-400 text-yellow-100 px-6 py-3 rounded-lg transition-colors duration-200 border border-gray-600"
      >
        Go to Overview
      </button>
    </div>

    {/* Show added courses */}
    {courses.length > 0 && (
      <div className="mt-6 text-left">
        <h2 className="text-2xl font-semibold mb-3">Your Courses:</h2>
        <ul>
          {courses.map((course) => (
            <li key={course.id}>
              <button
                className="text-blue-400 underline hover:text-blue-600 mb-2 
            transition-all duration-400 ease-in-out
            transform hover:scale-110 hover:translate-x-1"
                onClick={() => {
                  setSelectedCourse(course.id);
                  setStep(2);
                }}
              >
                {course.name.toUpperCase()}
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
      Add Folder to: <span className="underline">{selectedCourseObj?.name}</span>
    </h2>
    <input
      type="text"
      value={folderTitle}
      onChange={(e) => setFolderTitle(e.target.value)}
      placeholder="Add New Folder Name"
      className="w-full px-4 py-6 border rounded mb-4 text-black text-xl"
    />

    {(folders[selectedCourse] || []).length > 0 && (
  <div className="mt-6 text-left">
    <h3 className="text-xl font-semibold mb-3">Your Folders:</h3>
    <ul>
      {folders[selectedCourse]?.map((folder) => (
        <li key={folder}>
          <button
            className="text-blue-400 underline hover:text-blue-600 mb-2 
            transition-all duration-300 ease-in-out
            transform hover:scale-110 hover:translate-x-1"
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

    {/* Show existing folders */}
    {(folders[selectedCourseObj?.name] || []).length > 0 && (
      <div className="mt-6 text-left">
        <h3 className="text-xl font-semibold mb-3">Existing Folders:</h3>
        <ul>
          {folders[selectedCourse]?.map((folder) => (
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
        className="flex-1 bg-green-700 hover:bg-green-400 text-yellow-100 px-6 py-3 rounded-lg transition-colors duration-200 border border-gray-600"
      >
        Add Folder
      </button>
      <button
        onClick={() => setStep(4)}
        className="flex-1 bg-gray-700 hover:bg-gray-400 text-yellow-100 px-6 py-3 rounded-lg transition-colors duration-200 border border-gray-600"
      >
        Go to Overview
      </button>
    </div>

    <button
      onClick={() => setStep(1)}
      className="mt-6 w-full bg-sky-700 hover:bg-sky-400 text-yellow-100 rounded-lg py-3 transition-colors duration-200 border border-gray-600"
    >
      Back to Courses
    </button>
  </div>
)}




          {/* Step 3: Add Link */}
{step === 3 && (
  <div className="max-w-md mx-auto text-center">
    <h2 className="text-3xl font-semibold mb-4">
      Add Link to Folder:
      <span className="underline">
        {selectedCourseObj?.name} / {selectedFolder || "Select folder"}
      </span>
    </h2>

    {/* Folder selector if folder not selected */}
    {!selectedFolder && (
      <select
        className="w-full mb-8 px-4 py-6 rounded text-black text-xl"
        value={selectedFolder || ""}
        onChange={(e) => setSelectedFolder(e.target.value)}
      >
        <option value="" disabled>
          Folder Not Selected, Select One
        </option>
        {folders[selectedCourse]?.map((f) => (
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
      className="w-full px-4 py-6 border rounded mb-4 text-black text-xl"
    />
    <input
      type="url"
      value={linkUrl}
      onChange={(e) => setLinkUrl(e.target.value)}
      placeholder="Link URL"
      className="w-full px-4 py-6 border rounded mb-4 text-black text-xl"
    />

    {/* Buttons: Add Link & Go to Overview side by side */}
    <div className="flex justify-center gap-4 mb-4">
      <button
        onClick={handleAddLink}
        className="flex-1 bg-green-700 hover:bg-green-400 text-yellow-100 px-6 py-3 rounded-lg transition-colors duration-200 border border-gray-600"
      >
        Add Link
      </button>
      <button
        onClick={() => setStep(4)}
        className="flex-1 bg-gray-700 hover:bg-gray-400 text-yellow-100 px-6 py-3 rounded-lg transition-colors duration-200 border border-gray-600"
      >
        Go to Overview
      </button>
    </div>

    {/* Buttons: Back to Folder & Back to Courses side by side */}
    <div className="flex justify-center gap-4">
      <button
        onClick={() => setStep(2)}
        className="mt-6 w-full bg-sky-700 hover:bg-sky-400 text-yellow-100 rounded-lg py-3 transition-colors duration-200 border border-gray-600"
      >
        Back to Folder
      </button>
      <button
        onClick={() => setStep(1)}
        className="mt-6 w-full bg-sky-700 hover:bg-sky-400 text-yellow-100 rounded-lg py-3 transition-colors duration-200 border border-gray-600"
      >
        Back to Courses
      </button>
    </div>
  </div>
)}



          {/* Step 4: Overview */}
          {step === 4 && (
  <div className="max-w-4xl mx-auto">
    <h2 className="text-3xl font-bold mb-6 text-center">Overview</h2>

    {courses.length === 0 && <p>No courses added yet.</p>}

    {overviewContent}

    <button
      onClick={() => setStep(1)}
      className="w-full bg-black/25 hover:bg-white/50 text-white rounded-lg py-3 text-xl font-bold mt-6 border border-gray-600 transition-colors duration-200"
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
