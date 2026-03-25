import React, { useEffect, useState } from "react";
import {
    Box,
    Paper,
    Typography,
    Stack,
    IconButton,
} from "@mui/material";
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
} from "@hello-pangea/dnd";
import { formatDistanceToNow } from "date-fns";
import TripOriginIcon from "@mui/icons-material/TripOrigin";

import CircleIcon from '@mui/icons-material/Circle';
import DonutLargeIcon from '@mui/icons-material/DonutLarge'; //Backlog
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import {
    Refresh,
    HourglassBottom,
    CheckCircle,
    Cancel,
    Edit,
    Delete,
} from '@mui/icons-material';


interface Task {
    name: string;
    title: string;
    description?: string;
    assigned_to: string;
    owner: string;
    due_date?: string;
    priority: "Low" | "Medium" | "High";
    status: string;
    modified?: string;
}

interface StatusOption {
    value: string;
    index: number;
    icon: React.ReactNode;
    color?: string;
    bgColor?: string;
}

interface TasksKanbanViewProps {
    tasks: Task[];
    statusOptions: StatusOption[];
    userData: any;
    onStatusChange: (taskId: string, newStatus: string) => void;
    openEditModal: (index: any) => void;
    handleDeleteRow: (taskId: string) => void;
    doctype:string;
    fieldname:string;
}

const TasksKanbanView: React.FC<TasksKanbanViewProps> = ({
    tasks,
    statusOptions,
    userData,
    onStatusChange,
    openEditModal,
    handleDeleteRow,
    doctype,
    fieldname,
}) => {
    // const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
    const [localTasks, setLocalTasks] =  useState<Task[]>(tasks);
    const [newDealName, setNewDealName] = useState<{ [key: string]: string }>({});
    const [userToken, setUserToken] = useState<any>(() => {
        const initialValue = JSON.parse(
        localStorage.getItem("AccessTokenData") || "{}"
        );
        return initialValue || "";
    });

    useEffect(() => {
        setLocalTasks(tasks);
    }, [tasks]);

    // const onDragEnd = (result: DropResult) => {
    //     if (!result.destination) return;

    //     const { destination, draggableId } = result;
    //     const newStatus = statusOptions[parseInt(destination.droppableId)]?.value;

    //     if (!newStatus) return;

    //     setLocalTasks((prevTasks) =>
    //         prevTasks.map((task) =>
    //             task.title === draggableId ? { ...task, status: newStatus } : task
    //         )
    //     );

    //     onStatusChange(draggableId, newStatus);
    // };
    const onDragEnd = async (result: DropResult) => {
            if (!result.destination) return;
            
            console.log("result", result);
    
            const { destination, draggableId } = result;
            const newStageIndex = (destination.droppableId);
    
            console.log("newStage", newStageIndex);
    
            const foundStage = statusOptions.find((s) => s.value === newStageIndex);
            console.log("foundStage",foundStage);
            
            if (!foundStage) {
                console.warn("Stage not found for index:", newStageIndex);
                return;
            }
 
            setLocalTasks((prevTasks) =>
                prevTasks.map((task) =>
                parseInt(task.name) === parseInt(draggableId)
                    ? {
                        ...task,
                        status: foundStage.value,
                        stage: newStageIndex, // if you want to track stage index too
                    }
                    : task
                )
            );
    
            // Call API
            // const resp = await updateDealStageAPI(draggableId, newStageIndex);
            const payload = {
                doctype,
                name:parseInt(draggableId),
                fieldname,
                value: foundStage.value,
            };
            const res = await fetch("/api/set-value", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `${userToken?.access_token}`,
            },
            body: JSON.stringify(payload),
          });
           
          console.log("resresres",res);
          console.log("payload res",payload);
          
          if (!res.ok) throw new Error('Failed to update stage');
          
          // Optionally handle response
          const data = await res.json();
          console.log('Stage updated:', data);

        if (res.ok) {
            console.log(`Deal ${draggableId} updated successfully.`);
        } else {
            console.error(`Failed to update deal ${draggableId}`);
        }
    };
    console.log("localTasks",localTasks);
    

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Box sx={{ display: "flex", overflowX: "auto", gap: 2, p: 2, pl: 3, pb: 5 }}>
                {statusOptions.map((stage) => (
                    <Droppable droppableId={stage.value.toString()} key={stage.index}>
                        {(provided, snapshot) => (
                            <Paper
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                sx={{
                                    minWidth: 250,
                                    flexShrink: 0,
                                    p: 2,
                                    backgroundColor: snapshot.isDraggingOver
                                        ? "#e0f7fa"
                                        : "var(--mui-palette-background-default)",
                                    borderRadius: 2,
                                    border: "1px solid var(--mui-palette-grey-300)",
                                    minHeight: 250,
                                }}
                            >
                                <Typography
                                    variant="subtitle1"
                                    sx={{
                                        fontWeight: "bold",
                                        mb: 2,
                                        p: 1,
                                        borderRadius: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 2,
                                        // backgroundColor: stage.bgColor,
                                        color: stage.color
                                    }}
                                >
                                    {stage.icon}
                                    {/* <TripOriginIcon sx={{ color: stage.bgColor, }} />  */}
                                    {stage.value}
                                </Typography>


                                <Stack spacing={2}>
                                    {localTasks
                                        .filter((d) => d.status === stage.value)
                                        .map((task, index) => (
                                            <Draggable
                                                key={task.title}
                                                draggableId={String(task.name)}
                                                index={index}
                                            >
                                                {(provided, snapshot) => (
                                                    <Paper
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        sx={{
                                                            p: 1.5,
                                                            pt: 3,
                                                            pl: 3,
                                                            backgroundColor: "var(--mui-palette-background-paper)",
                                                            borderRadius: 2,
                                                            boxShadow: snapshot.isDragging ? 3 : 1,
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            gap: 0.5,
                                                        }}
                                                        // onClick={() => alert(`Clicked ${task.title}`)}
                                                    >
                                                        <Typography variant="subtitle2" fontWeight="bold">
                                                            {task.title}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {task.assigned_to || "Unassigned"}
                                                        </Typography>
                                                        {task.due_date && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                Due: {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
                                                            </Typography>
                                                        )}
                                                        {task.modified && (
                                                            <Typography variant="caption" color="text.secondary">
                                                                Updated {formatDistanceToNow(new Date(task.modified), { addSuffix: true })}
                                                            </Typography>
                                                        )}
                                                        {task.owner === userData?.email && (
                                                            <Box mt={1} display="flex" justifyContent="flex-end" gap={1}>
                                                                <IconButton size="small" onClick={() => openEditModal(task.name)}>
                                                                    <Edit fontSize="small" />
                                                                </IconButton>
                                                                <IconButton size="small" onClick={() => handleDeleteRow(task.name)}>
                                                                    <Delete fontSize="small" />
                                                                </IconButton>
                                                            </Box>
                                                        )}
                                                    </Paper>
                                                )}
                                            </Draggable>
                                        ))}
                                    {provided.placeholder}
                                </Stack>


                            </Paper>
                        )}
                    </Droppable>
                ))}
            </Box>
        </DragDropContext>
    );
};

export default TasksKanbanView;
