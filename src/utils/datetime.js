export const convertToIST = (datetime) => {
  const date = new Date(datetime);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    throw new Error("Invalid datetime format");
  }

  // Get the timezone offset in minutes (IST is UTC+5:30 = 330 minutes)
  const istOffset = 330; // 5 hours 30 minutes in minutes
  const localOffset = date.getTimezoneOffset(); // Local timezone offset in minutes

  // Calculate the difference and adjust
  const offsetDiff = istOffset + localOffset;
  const istDate = new Date(date.getTime() + offsetDiff * 60 * 1000);

  return istDate;
};

export const formatToIST = (datetime) => {
  const istDate = convertToIST(datetime);
  return istDate.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

export const parseAndConvertToIST = (datetimeLocal) => {
  if (!datetimeLocal) {
    throw new Error("DateTime is required");
  }
  // Parse the datetime-local format (assumes it's already in IST timezone from user's perspective)
  const date = new Date(datetimeLocal);

  if (isNaN(date.getTime())) {
    throw new Error(
      "Invalid datetime format. Expected format: YYYY-MM-DDTHH:mm"
    );
  }

  return date;
};
