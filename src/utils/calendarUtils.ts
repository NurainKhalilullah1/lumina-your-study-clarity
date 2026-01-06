export const downloadCalendarInvite = (title: string, dueDate: Date, courseName: string) => {
  // Format dates for ICS (YYYYMMDDTHHMMSSZ)
  const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, "");
  
  const start = formatDate(dueDate);
  // End time is 1 hour after start
  const end = formatDate(new Date(dueDate.getTime() + 60 * 60 * 1000));

  // Create the ICS content
  // TRIGGER:-P2D means "Alert 2 Days before"
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Lumina//Student Planner//EN
BEGIN:VEVENT
UID:${Date.now()}@lumina.app
DTSTAMP:${formatDate(new Date())}
DTSTART:${start}
DTEND:${end}
SUMMARY:📚 Due: ${title} (${courseName})
DESCRIPTION:Assignment for ${courseName} is due!
BEGIN:VALARM
TRIGGER:-P2D
ACTION:DISPLAY
DESCRIPTION:Reminder: Assignment due in 2 days
END:VALARM
END:VEVENT
END:VCALENDAR`;

  // Create a blob and trigger download
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", `${title.replace(/\s+/g, "_")}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
