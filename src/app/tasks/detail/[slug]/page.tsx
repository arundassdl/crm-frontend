import React from "react";
import TaskDetails from "@/components/Tasks/TaskDetails";


// Multiple versions of this page will be statically generated
// using the `params` returned by `generateStaticParams`
export default function TaskDetailsPage({ params }: { params: { slug: string} }) {
  const name  = params.slug
  
  const taskComp = <TaskDetails name={name} />;

  return (
    <>
    <div>
      {taskComp}
      </div>
    </>
  );
  
  
}
