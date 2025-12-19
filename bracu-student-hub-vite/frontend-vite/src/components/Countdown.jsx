import { useEffect, useState } from "react";

export default function Countdown({ title, targetDate }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [statusColor, setStatusColor] = useState("black");

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft("Time is up!");
        setStatusColor("#6b7280");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);

      setTimeLeft(`${days}d ${hours}h ${minutes}m`);

      if (diff < 24 * 60 * 60 * 1000) {
        setStatusColor("#dc2626"); // red
      } else if (diff < 3 * 24 * 60 * 60 * 1000) {
        setStatusColor("#f97316"); // orange
      } else {
        setStatusColor("#16a34a"); // green
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const dateObj = new Date(targetDate);
  const formattedDate = dateObj.toLocaleString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      style={{
        borderRadius: "10px",
        border: "1px solid #e5e7eb",
        padding: "0.7rem 0.9rem",
        background: "#ffffff",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)",
      }}
    >
      <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#111827" }}>
        {title}
      </div>
      <div
        style={{
          marginTop: "0.3rem",
          fontSize: "1.05rem",
          fontWeight: 600,
          color: statusColor,
        }}
      >
        {timeLeft}
      </div>
      <div
        style={{
          marginTop: "0.1rem",
          fontSize: "0.8rem",
          color: "#6b7280",
        }}
      >
        Due: {formattedDate}
      </div>
    </div>
  );
}
