import React from "react";
import TaskDetails from "@/components/Tasks/TaskDetails";


// Multiple versions of this page will be statically generated
// using the `params` returned by `generateStaticParams`
export default async function TaskDetailsPage({ params: paramsPromise }: { params: Promise<{ slug: string}> }) {
  const params = await paramsPromise
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
