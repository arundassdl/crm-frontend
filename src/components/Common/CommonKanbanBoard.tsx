import React, { useEffect, useState } from "react";
import {
    Box,
    Paper,
    Typography,
    Stack,
    Button,
    TextField,
    IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
} from "@hello-pangea/dnd";
import { formatDistanceToNow, formatRelative } from "date-fns";
import TripOriginIcon from '@mui/icons-material/TripOrigin';

// Simulated API call for stage update
const updateDealStageAPI = async (dealId: string, newStage: number) => {
    console.log(`Sending API request: deal ${dealId} moved to stage ${newStage}`);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Return success
    return { success: true };
};

// Stage definitions
// const stages = [
//     { label: "Qualification", index: 0, bgColor: "#525252", color: "var(--mui-palette-grey-700)" },
//     { label: "Demo/Making", index: 1, bgColor: "rgb(212 90 8 / var(--tw-text-opacity, 1))", color: "var(--mui-palette-grey-700)" },
//     { label: "Proposal/Quotation", index: 2, bgColor: "rgb(0 123 224 / var(--tw-text-opacity, 1))", color: "var(--mui-palette-grey-700)" },
//     { label: "Negotiation", index: 3, bgColor: "rgb(209 147 13 / var(--tw-text-opacity, 1))", color: "var(--mui-palette-grey-700)" },
//     { label: "Ready to Close", index: 4, bgColor: "rgb(134 66 194 / var(--tw-text-opacity, 1))", color: "var(--mui-palette-grey-700)" },
//     { label: "Won", index: 5, bgColor: "rgb(19 121 73 / var(--tw-text-opacity, 1))", color: "var(--mui-palette-grey-700)" },
//     { label: "Lost", index: 6, bgColor: "rgb(204 41 41 / var(--tw-text-opacity, 1))", color: "var(--mui-palette-grey-700)" },
// ];

// const initialDeals1 = [
//     { id: "1", name: "Deal A", stage: 0 },
//     { id: "2", name: "Deal B", stage: 2 },
//     { id: "3", name: "Deal C", stage: 1 },
//     { id: "4", name: "Deal D", stage: 3 },
//     { id: "5", name: "Deal E", stage: 5 },
// ];
interface CommonKanbanBoardProps {
    deals: Array<{
        lead_name: string;close_date: string; creation: string; email: string; mobile_no: string; modified: string; name: string;
        organization: string; status: string; territory: string; owner: string; annual_revenue: string;stage:number;
    }>;
    stages: Array<{label: string; index: number; bgColor: string; color: string;}>;
    doctype:string;
    fieldname:string;
}
const CommonKanbanBoard: React.FC<CommonKanbanBoardProps> = ({ deals: initialDeals,stages: stages,doctype,fieldname }) => {
    
    const [deals, setDeals] = useState(initialDeals);
    const [newDealName, setNewDealName] = useState<{ [key: string]: string }>({});
    const [userToken, setUserToken] = useState<any>(() => {
        const initialValue = JSON.parse(
        localStorage.getItem("AccessTokenData") || "{}"
        );
        return initialValue || "";
    });
    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) return;
        
        console.log("result", result);

        const { destination, draggableId } = result;
        const newStageIndex = parseInt(destination.droppableId);

        console.log("newStage", newStageIndex);

        const foundStage = stages.find((s) => s.index === newStageIndex);
        if (!foundStage) {
            console.warn("Stage not found for index:", newStageIndex);
            return;
        }

        setDeals((prevDeals) =>
            prevDeals.map((deal) =>
            deal.name === draggableId
                ? {
                    ...deal,
                    status: foundStage.label,
                    stage: newStageIndex, // if you want to track stage index too
                }
                : deal
            )
        );

        // Call API
        // const resp = await updateDealStageAPI(draggableId, newStageIndex);
        const payload = {
            doctype,
            name:draggableId,
            fieldname,
            value: foundStage.label,
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


    //   const handleAddDeal = (stageIndex: number) => {
    //     const name = newDealName[stageIndex];
    //     if (!name) return;

    //     const newDeal = {
    //       id: Date.now().toString(),
    //       name,
    //       stage: stageIndex,
    //     };
    //     setDeals((prev) => [...prev, newDeal]);

    //     // Clear input
    //     setNewDealName((prev) => ({ ...prev, [stageIndex]: "" }));
    //   }; 
useEffect(() => {
  setDeals(initialDeals)
}, [initialDeals]);
    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Box sx={{ display: "flex", overflowX: "auto", gap: 2, p: 2,pl:3,pb:5 }}>
                {stages.map((stage) => (
                    <Droppable droppableId={stage.index.toString()} key={stage.index}>
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
                                    border:"1px solid var(--mui-palette-grey-300)",
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
                                        gap:2,
                                        // backgroundColor: stage.bgColor,
                                        color:stage.color
                                    }}
                                >
                                   <TripOriginIcon sx={{color: stage.bgColor,}} /> {stage.label}
                                </Typography>


                                <Stack spacing={2}>
                                    {deals
                                        .filter((d) => d.status === stage.label)
                                        .map((deal, index) => (
                                            <Draggable
                                                key={deal.name}
                                                draggableId={deal.name}
                                                index={index}
                                            >
                                                {(provided, snapshot) => (
                                                    <Paper
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        sx={{
                                                            p: 1.5,
                                                            pt:3,
                                                            pl:3,                                                            
                                                            backgroundColor: "var(--mui-palette-background-paper)",
                                                            borderRadius: 2,
                                                            boxShadow: snapshot.isDragging ? 3 : 1,
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            gap: 0.5,
                                                        }}
                                                        // onClick={() => alert(`Clicked ${deal.name}`)}
                                                    >
                                                        {/* Deal name + avatar placeholder */}
                                                         {(doctype === 'CRM Lead') && (
                                                        <Typography variant="subtitle2" fontWeight="bold">
                                                            {deal.lead_name}
                                                        </Typography>    
                                                         )}
                                                        <Typography variant="subtitle2" fontWeight="bold">
                                                            {deal.organization}
                                                        </Typography>

                                                        {/* Amount */}
                                                        {(doctype === 'CRM Deal') && (
                                                        <Typography variant="body2" fontWeight="bold">
                                                            ₹ {Number(deal.annual_revenue || 0).toLocaleString()}
                                                        </Typography>
                                                        )}

                                                        {/* Email */}
                                                        {deal.email && (
                                                            <Typography variant="subtitle2">{deal.email}</Typography>
                                                        )}

                                                        {/* Mobile */}
                                                        {deal.mobile_no && (
                                                            <Typography variant="subtitle2">{deal.mobile_no}</Typography>
                                                        )}

                                                        {/* Owner */}
                                                        {deal.owner && (
                                                            <Typography variant="subtitle2">👤 {deal.owner}</Typography>
                                                        )}

                                                        {/* Relative time */}
                                                        {deal.modified && (
                                                            <Typography variant="subtitle2" color="text.secondary">
                                                                {/* {formatRelative(new Date(deal.modified), new Date())} */}
                                                                {formatDistanceToNow(new Date(deal.modified), { addSuffix: true })}
                                                            </Typography>
                                                        )}

                                                        {/* Bottom icons row */}
                                                        <Box mt={1} display="flex" gap={1}>
                                                            {/* <Typography variant="caption">📧</Typography>
                                                            <Typography variant="caption">📄</Typography>
                                                            <Typography variant="caption">✔️</Typography>
                                                            <Typography variant="caption">💬</Typography>
                                                            <Typography variant="caption">➕</Typography> */}
                                                        </Box>
                                                    </Paper>
                                                )}
                                            </Draggable>
                                        ))}
                                    {provided.placeholder}
                                </Stack>


                                {/* <Box mt={1} display="flex" gap={1}>
                  <TextField
                    size="small"
                    variant="outlined"
                    placeholder="New Deal"
                    value={newDealName[stage.index] || ""}
                    onChange={(e) =>
                      setNewDealName((prev) => ({
                        ...prev,
                        [stage.index]: e.target.value,
                      }))
                    }
                    fullWidth
                  />
                  <IconButton
                    color="primary"
                    onClick={() => handleAddDeal(stage.index)}
                  >
                    <AddIcon />
                  </IconButton>
                </Box> */}
                            </Paper>
                        )}
                    </Droppable>
                ))}
            </Box>
        </DragDropContext>
    );
};

export default CommonKanbanBoard;
