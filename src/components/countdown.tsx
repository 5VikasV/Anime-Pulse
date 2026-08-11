"use client";

export function Countdown({ target }: { target: string }) {
  const targetDate = new Date(target);
  const isPast = !isNaN(targetDate.getTime()) && targetDate.getTime() <= Date.now();
  
  const formatted = !isNaN(targetDate.getTime())
    ? targetDate.toLocaleString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      })
    : "SCHEDULED";

  return (
    <span className={isPast ? "text-status-monitoring font-medium" : "text-white/70"}>
      {isPast ? "MONITORING RELEASE" : formatted}
    </span>
  );
}

