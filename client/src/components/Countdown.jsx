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
        setStatusColor("gray");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);

      setTimeLeft(`${days}d ${hours}h ${minutes}m`);

      // 🔥 urgency logic
      if (diff < 24 * 60 * 60 * 1000) {
        setStatusColor("red");             // less than 24 hours
      } else if (diff < 3 * 24 * 60 * 60 * 1000) {
        setStatusColor("orange");          // less than 3 days
      } else {
        setStatusColor("green");           // more than 3 days
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "1rem",
        marginBottom: "1rem",
        borderLeft: `6px solid ${statusColor}`,
      }}
    >
      <h3>{title}</h3>
      <p style={{ fontSize: "1.2rem", color: statusColor }}>{timeLeft}</p>
      <p style={{ fontSize: "0.8rem" }}>
        Due: {new Date(targetDate).toLocaleString()}
      </p>
    </div>
  );
}
