import { useState } from "react";
import MonthNavigation from "../MonthNavigation";

export default function MonthNavigationExample() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrevMonth = () => {
    console.log("Previous month");
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    console.log("Next month");
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleToday = () => {
    console.log("Today");
    setCurrentDate(new Date());
  };

  return (
    <div className="p-4 bg-background">
      <MonthNavigation
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />
    </div>
  );
}
