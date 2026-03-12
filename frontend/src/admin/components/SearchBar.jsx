import { useState } from "react";
import "../styles/Admin.css";
export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");

  const submit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={submit} className="search-bar">
      <input
        placeholder="Search by Service Number"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <button type="submit">Search</button>
    </form>
  );
}
