 import { format, subMinutes } from 'date-fns';
 import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

  export const isGridValidDate = (dateString) => {
    if (typeof dateString === "string") return false; // Ensure input is a string
  
    // Check if the input matches known date formats
    const isoFormat = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
    const usFormat = /^\d{2}\/\d{2}\/\d{4}$/; // MM/DD/YYYY
    const longFormat = /^[A-Za-z]{3} \w{3} \d{1,2} \d{4} \d{2}:\d{2}:\d{2}/; // "Mon Feb 17 2025 05:30:00 GMT+0530"
  
    if ((isoFormat.test(dateString)==true || usFormat.test(dateString)==true || longFormat.test(dateString)==true)) {
      const date = new Date((dateString));
   
      if (date instanceof Date && !isNaN(date.getTime())) {     
        return true; // The date is valid
      }else{
        return false; 
      }
    }   
  };
  
  export function convertDate(dateString) {
    // Convert the date string to a JavaScript Date object
    const dateObject = new Date(dateString);    
    // To format the date to "YYYY-MM-DD" or any desired format, you can use:
    const formattedDate = dateObject.toISOString().split('T')[0]; // "2025-02-10" 
    // Now return the adjusted Date object (instead of formatted string)
    return formattedDate;
  }


export function formatToCalDate(date: Date | string | null | undefined) {
  if (!date) return null;
  
  // If already a Date object, convert directly
  if (date instanceof Date) {
    return dayjs(date)?.toDate();
  }

  // If string, parse with MM/DD/YYYY
  return dayjs(date, "MM/DD/YYYY")?.toDate() || null;
}
 


export function formatCalDate(dateString) {

  const date = new Date(dateString);
  const adjusted = subMinutes(date, date.getTimezoneOffset());

  const formatted = format(adjusted, 'yyyy-MM-dd');
  console.log(formatted); // "2025-06-19"
  return formatted
}

  
  export function timeAgo(dateString: string) {
    if (!dateString) return "Invalid date";
  
    // Convert to valid ISO format
    const validDateString = dateString.replace(" ", "T");
    const date = new Date(validDateString);
    const now = new Date();
  
    // Ensure the date is valid
    if (isNaN(date.getTime())) return "Invalid date";
  
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  
    if (diffInSeconds < 60) return rtf.format(-diffInSeconds, "second");
    if (diffInSeconds < 3600) return rtf.format(-Math.floor(diffInSeconds / 60), "minute");
    if (diffInSeconds < 86400) return rtf.format(-Math.floor(diffInSeconds / 3600), "hour");
    return rtf.format(-Math.floor(diffInSeconds / 86400), "day");
  }

  // Function to format full date & time for tooltip
export function formatFullDate(dateString: string) {

  const validDateString = (dateString!=undefined)?dateString.replace(" ", "T"):"invalid";
  const date = new Date(validDateString);

  if (isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}