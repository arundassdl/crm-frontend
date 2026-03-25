const FormatDate = ({ date }: { date?: string | number | Date }) => {
  // Check if the date is undefined or invalid
  if (!date) {
    return <span>Invalid date</span>;
  }

  // Create a new Date instance
  const dateInstance = new Date(date);

  // Check if the dateInstance is valid
  if (isNaN(dateInstance.getTime())) {
    return <span>Invalid date</span>;
  }

  // Format the date
  const formatted = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(dateInstance);

  return <span>{formatted}</span>; // Return as JSX
};

export default FormatDate;
