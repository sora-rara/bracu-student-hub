import React from "react";
import authService from "../services/auth.jsx";

const DeadlinesPage = () => {
  const user = authService.getCurrentUser();
  const email = user?.email || "";
  const iframeSrc = email
    ? `http://localhost:5173/?user=${encodeURIComponent(email)}`
    : "http://localhost:5173/";

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        padding: 0,
        margin: 0,
        overflow: "hidden",
      }}
    >
      <iframe
        src={iframeSrc}
        title="Deadline Manager"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          overflow: "hidden",
        }}
      />
    </div>
  );
};

export default DeadlinesPage;
