// src/utils/calendarUtils.ts

export const downloadCalendarInvite = (title: string, date: Date, courseName: string) => {
  // Helper to format date as YYYYMMDD for .ics files
  const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "").split("T")[0];

  const eventDate = formatDate(date);
  const now = new Date().toISOString().replace(/-|:|\.\d\d\d/g, "");

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//StudyFlow//Student Planner//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@studyflow.app`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${eventDate}`,
    `SUMMARY:${title} (${courseName})`,
    `DESCRIPTION:Reminder for ${title} in ${courseName}.`,
    // === THE 2-DAY REMINDER LOGIC ===
    "BEGIN:VALARM",
    "TRIGGER:-P2D", // -P2D means "Minus Period 2 Days"
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder: ${title} is due in 2 days!`,
    "END:VALARM",
    // ================================
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  // Trigger the download
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", `${title.replace(/\s+/g, "_")}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadBulkCalendarInvite = (tasks: any[]) => {
  const now = new Date().toISOString().replace(/-|:|\.\d\d\d/g, "");
  
  let events = tasks.map(task => {
    const dateStr = new Date(task.date).toISOString().replace(/-|:|\.\d\d\d/g, "").split("T")[0];
    return [
      "BEGIN:VEVENT",
      `UID:${Math.random().toString(36).substr(2)}@studyflow.app`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${dateStr}`,
      `SUMMARY:${task.title} (${task.course})`,
      "BEGIN:VALARM",
      "TRIGGER:-P2D",
      "ACTION:DISPLAY",
      `DESCRIPTION:Reminder: ${task.title} is due in 2 days!`,
      "END:VALARM",
      "END:VEVENT"
    ].join("\r\n");
  }).join("\r\n");

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//StudyFlow//Student Planner//EN",
    events,
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", `StudyFlow_Bulk_Import.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
