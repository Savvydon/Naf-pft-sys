import { useEffect, useState } from "react";
import {
  getAllPersonnel,
  deletePersonnel,
  searchPersonnel,
} from "../services/adminApi";

export function useAdminData() {
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPersonnel = async () => {
    try {
      const data = await getAllPersonnel();
      setPersonnel(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removePersonnel = async (id) => {
    if (!window.confirm("Delete this record?")) return;

    try {
      await deletePersonnel(id);
      setPersonnel((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert("Delete failed");
    }
  };

  const search = async (query) => {
    try {
      const data = await searchPersonnel(query);
      setPersonnel(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPersonnel();
  }, []);

  return {
    personnel,
    loading,
    removePersonnel,
    search,
  };
}
