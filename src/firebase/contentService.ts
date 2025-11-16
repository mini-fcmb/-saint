import { db } from "./config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const addContent = async (
  title: string,
  type: "note" | "assignment" | "quiz",
  subject: string,
  classLevel: string,
  description: string,
  teacherId: string
) => {
  const docRef = await addDoc(collection(db, "contents"), {
    title,
    type,
    subject,
    classLevel,
    description,
    createdBy: teacherId,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
};
