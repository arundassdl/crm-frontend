"use client";

import React from "react";
import TaskDetailDashboard from "@/components/Tasks/Detail/TaskDetailDashboard";

const TaskDetails: any = (slug: any) => {
  const task_name = slug?.name;

  if (!task_name) return null;

  return (
    <div className="w-full">
      <TaskDetailDashboard name={task_name} />
    </div>
  );
};

export default TaskDetails;
