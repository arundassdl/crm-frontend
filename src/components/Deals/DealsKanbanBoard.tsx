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
import Link from "@/components/Link";
// Simulated API call for stage update
const updateDealStageAPI = async (dealId: string, newStage: number) => {
    console.log(`Sending API request: deal ${dealId} moved to stage ${newStage}`);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Return success
    return { success: true };
};

interface DealsKanbanBoardProps {
    deals: Array<{
        close_date: string; creation: string; email: string; mobile_no: string; modified: string; name: string;
        organization: string; status: string; territory: string; owner: string; annual_revenue: string; stage: number;
    }>;
    stages: Array<{ label: string; index: number; bgColor: string; color: string; }>;
    doctype: string;
    fieldname: string;
}
const DealsKanbanBoard: React.FC<DealsKanbanBoardProps> = ({ deals: initialDeals, stages: stages, doctype, fieldname }) => {
    console.log("stages", stages);

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
            name: draggableId,
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

        console.log("resresres", res);
        console.log("payload res", payload);

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

    useEffect(() => {
        setDeals(initialDeals)
    }, [initialDeals]);
    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Box sx={{ display: "flex", overflowX: "auto", gap: 2, p: 5, pl: 5, pb: 5 }}>
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
                                    border: "1px solid var(--mui-palette-grey-300)",
                                    minHeight: 250,
                                }}
                            >
                                <Typography
                                    variant="body1"
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
                                    <TripOriginIcon sx={{ color: stage.bgColor, }} /> {stage.label}
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
                                                    // onClick={() => alert(`Clicked ${deal.name}`)}
                                                    >
                                                        {/* Deal name + avatar placeholder */}
                                                        <Typography variant="subtitle1" fontWeight="bold">
                                                            {doctype === 'CRM Lead' ? (
                                                             <Link
                                                                href={`/leads/detail/${deal.name}`}
                                                                color="inherit"
                                                                rel="noopener noreferrer"
                                                              >
                                                                {deal.organization}
                                                            </Link>
                                                            ): (
                                                                <Link
                                                                href={`/deals/detail/${deal.name}`}
                                                                color="inherit"
                                                                rel="noopener noreferrer"
                                                              >
                                                                {deal.organization}
                                                            </Link>
                                                            )}
                                                            
                                                        </Typography>

                                                        {/* Amount */}
                                                        <Typography variant="body2" fontWeight="bold">
                                                            ₹ {Number(deal.annual_revenue || 0).toLocaleString()}
                                                        </Typography>

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

export default DealsKanbanBoard;
