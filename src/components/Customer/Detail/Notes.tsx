"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Divider,
  Tooltip,
  TextField,
  Paper,
  Button,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

import { deleteResource } from "@/services/api/common-erpnext-api/create-edit-api";
import {
  formatFullDate,
  timeAgo,
} from "@/services/api/common-erpnext-api/libs/utils";
import CreateEditNoteDrawer from "./CreateNote";
import { fetchCommentsWithOwner, fetchNotesWithOwner } from "@/services/api/common-erpnext-api/create-update-custom-api";
import CustomAvatar from "@/@core/components/mui/Avatar";
import { CONSTANTS } from "@/services/config/app-config";
import debounce from "lodash/debounce";
import { set, update } from "lodash";
import ConfirmDialog from "@/components/UI/ConfirmDialog";
import { DeleteOutlineOutlined } from "@mui/icons-material";

interface NoteProps {
  link_name: string;
  doc_type: string;
}
const Notes: React.FC<NoteProps> = ({ link_name, doc_type }) => {
  const [notes, setNotes] = useState<any>([]);
  const [hoveredNote, setHoveredNote] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });
  const [selectedRow, setSelectedRow] = useState<any>([]);
  const [operation, setOperation] = useState("New");
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editedText, setEditedText] = useState<string>("");
  const [submittedData, setSubmittedData] = useState(null); // Store submitted data
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<any | null>(null);

  const [content, setContent] = useState("");
  const [userData, setuserData] = useState<any>([]);
  const bottomRef = useRef<HTMLLIElement | null>(null); // Ref for last item

  const handleAddItem = () => {
    const newItem = `Item ${notes.length + 1}`;
    // setNotes((prevItems) => [...prevItems, newItem]);

    // Wait for the DOM update, then scroll to the bottom
    setTimeout(() => {
      console.log("bottomRef.current",bottomRef.current?.nextElementSibling);
      if (bottomRef.current?.nextElementSibling) {
        bottomRef.current.nextElementSibling.scrollIntoView({ behavior: "smooth" });
      }else{
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("userProfileData") != "undefined") {
        // alert(localStorage.getItem('userData'))
        setuserData(
          JSON.parse(localStorage.getItem("userProfileData") || "[]")
        );
      }
    }
  }, []);
  const handleInput1 = (event: React.FormEvent<HTMLDivElement>) => {
    setContent(event.currentTarget.innerHTML);
    // setEditedText(event.currentTarget.innerHTML);
  };

  // const updateContent = useCallback(
  //   debounce((newContent) => {
  //     // setContent(newContent);
  //     setEditedText(newContent);
  //   }, 1000),
  //   []
  // );

  // const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
  //   updateContent(event.currentTarget.innerHTML);
  // };
  const updateContent = useCallback(
    debounce((newContent) => {
      setEditedText(newContent);
    }, 1000),
    []
  );
  
  const editableRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef(editedText); // Store content outside state to prevent re-render
  
  const handleInput = () => {
    if (editableRef.current) {
      contentRef.current = editableRef.current.innerHTML; // Store content without re-render
    }
  };
  
  const saveContent = () => {
    setOperation("Edit")
    setEditedText(contentRef.current); // Save to state only when necessary
  };
  
  
  

  const setEditable = (value: any) => {
    console.log("herer setEditable note", value);

    
    if (value == null || value == "") {
      console.log("herer setEditable note dddd", value);
      setOperation("New");
      setEditingRow(null);
    }else{
      setEditingRow(value);
    }
  };

  // Handle delete note
  const handleDelete = (id: string) => {
    setDialogOpen(false);
    setNotes(notes.filter((note) => note.name !== id));
    deleteResource("FCRM Note", id, userToken?.access_token);
  };

  const handleDeleteRow = (id: any) => {
    console.log("delet id", id);
    setSelectedRowId(id);
    setDialogOpen(true);
  };

  const handleEdit = (index: number, currentText: string) => {
    setEditingRow(index);
    setEditedText(currentText);
    setContent(currentText);
    setOperation("Edit"); 
  };
  const fetchData = async () => {
    setLoading(true);

    const data = await fetchNotesWithOwner(
      doc_type,
      link_name,
      userToken?.access_token
    );

    setNotes(data);
    setLoading(false);
  };
  useEffect(() => {
    console.log("userData note", userData);

    fetchData();
  }, [link_name]);

  const handleSave = (index: number, note: any) => {
    const updatedNotes = [...notes];
    updatedNotes[index].content = editedText;
    setNotes(updatedNotes);
    const formData = new FormData();
    formData.append("content", editedText);
    formData.append("name", note?.name);
    console.log("selected note", note);
    setSelectedRow(formData);
    setEditingRow(null);
    setOperation("Update");
  };

  const handleCancel = () => {
    setEditingRow(null);
  };

  const handleDeleteClick = (id: any) => () => {
    if (id != undefined) {
      handleDelete(id);
    } else {
      setDialogOpen(false);
    }
  };

  return (
    <Box sx={{ mx: "auto", pt: 3,
    // border: "1px solid #ddd", 
    // borderRadius: 2
     }}>
      <ConfirmDialog
        open={dialogOpen}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        onClose={() => setDialogOpen(false)}
        onConfirm={handleDeleteClick(selectedRowId)}
      />
      {/* Title */}
      {/* <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
        Notes
      </Typography> */}

      {/* Notes List */}
      {notes?.length > 0 ? (
        <List
          sx={{
            maxHeight: 400, // Set max height
            overflowY: "auto", // Enable vertical scrolling
            paddingBottom:"10px"
          }}
        >
          {notes.map((note, index) => (
            <React.Fragment key={note.name}>
              <ListItem
                alignItems="flex-start"
                onMouseEnter={() => setHoveredNote(index)}
                onMouseLeave={() => setHoveredNote(null)}
                sx={{
                  transition: "background 0.2s ease-in-out",
                  "&:hover": {
                    backgroundColor: "var(--mui-palette-background-paper)",
                  },
                }}
                key={note.name || index}
                ref={index === notes.length - 1 ? bottomRef : null}
              >
                {/* User Avatar */}
                <ListItemAvatar>
                  <CustomAvatar
                    alt={note.owner_name}
                    src={`${CONSTANTS.API_BASE_URL}${note.image}`}
                    className="shadow-xs"
                  />
                </ListItemAvatar>

                {/* Note Content */}
                <ListItemText
                  primary={
                    <Typography variant="body1" fontWeight="bold">
                      {note.owner_name}
                    </Typography>
                  }
                  secondary={
                    <>
                      {editingRow === index ? (
                        <Paper
                          elevation={3}
                          sx={{
                            p: 2,
                            // border: "1px solid #3e8ef2",
                            // borderRadius: "8px",
                            boxShadow:"none",
                            minWidth: "1000px",
                          }}
                        >
                          <Typography
                            ref={editableRef}
                            component="div"
                            contentEditable
                            suppressContentEditableWarning
                            onInput={handleInput}
                            onBlur={saveContent} // Save only when editing is done
                            sx={{
                              border: "1px solid #ddd",
                              padding: "8px",
                              minHeight: "100px",
                              borderRadius: "4px",
                            }}
                          >
                            {editedText}
                          </Typography>
                          {/* <Typography
                          component="div"
                            contentEditable
                            suppressContentEditableWarning
                            // dangerouslySetInnerHTML={{ __html: editedText }}
                            onInput={handleInput}
                            sx={{
                              border: "1px solid #ddd",
                              padding: "8px",
                              minHeight: "100px",
                              borderRadius: "4px",
                            }}
                          >
                            {editedText}
                          </Typography> */}

                          {/* Action Buttons */}
                          <Typography
                            component="span"
                            display="flex"
                            justifyContent="flex-end"
                            gap={1}
                            sx={{ mt: 2 }}
                          >
                            <Button onClick={handleCancel} variant="outlined">
                              Cancel
                            </Button>
                            <Button
                              color="primary"
                              onClick={() => handleSave(index, note)}
                              variant="contained"
                              disabled={!editedText.trim()}
                            >
                              Submit
                            </Button>
                          </Typography>
                        </Paper>
                      ) : (
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          component="span"
                          dangerouslySetInnerHTML={{ __html: note.content }}
                        />
                      )}

                      {/* Contact & Timestamp */}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        component="span"
                        className="flex"
                      >
                        <IconButton size="small" sx={{ color: "primary.main" }}>
                          <AccessTimeIcon fontSize="small" />
                        </IconButton>
                        <Tooltip title={formatFullDate(note.creation)} arrow>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            component="span"
                            sx={{marginTop: "8px"}}
                          >
                            {timeAgo(note.creation)}
                          </Typography>
                        </Tooltip>
                      </Typography>
                    </>
                  }
                />

                {/* Actions */}
                {editingRow === index ? (
                  // <Box sx={{ display: "flex", gap: 1 }}>
                  //   <Tooltip title="Save">
                  //     <IconButton size="small" onClick={() => handleSave(index,note)} color="success">
                  //       <CheckIcon fontSize="small" />
                  //     </IconButton>
                  //   </Tooltip>
                  //   <Tooltip title="Cancel">
                  //     <IconButton size="small" onClick={handleCancel} color="error">
                  //       <CloseIcon fontSize="small" />
                  //     </IconButton>
                  //   </Tooltip>
                  // </Box>
                  <></>
                ) : (
                  <>
                    {hoveredNote === index &&
                      userData?.email === note.email && (
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(index, note.content)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteRow(note.name)}
                              color="secondary"
                            >
                              <DeleteOutlineOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                  </>
                )}
              </ListItem>

              {/* Divider Between Notes */}
              {index < notes.length - 1 && <Divider sx={{ my: 1 }} />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <> 
        </>
      )}

      {/* Add Note Section */}
      <CreateEditNoteDrawer
        initialValues={selectedRow}
        link_name={link_name}
        doc_type={doc_type}
        operation={operation}
        loadData={fetchData}
        editRow={setEditable}
        addItem={handleAddItem}
      />
    </Box>
  );
};

export default Notes;
