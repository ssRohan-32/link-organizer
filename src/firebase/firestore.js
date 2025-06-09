import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "./firebase";

export async function fetchUserCourses() {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const coursesRef = collection(db, "users", user.uid, "courses");
  const snapshot = await getDocs(coursesRef);

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
