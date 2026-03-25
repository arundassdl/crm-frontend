"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  TextField,
  Box,
  Button,
  IconButton,
  Typography,
  Paper,
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { Form, FormikProvider, useFormik } from "formik";
import {
  createResource,
  postComment,
  postNote,
  updateResource,
} from "@/services/api/common-erpnext-api/create-edit-api";

interface FormValueType {
  name: string;
  content: string;
}

const formInitialValues: FormValueType = {
  name: "",
  content: "",
};
interface AddEditNoteProps {
  link_name: string;
  doc_type: string;
  initialValues: FormData;
  operation: string;
  loadData: () => void;
  editRow: (value: any) => void;
  addItem: () => void;
}
export default function CreateEditNoteDrawer({
  link_name,
  doc_type,
  initialValues,
  operation,
  loadData,
  editRow,
  addItem
}: AddEditNoteProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [note, setNote] = useState("");
  const [operationType, setOperationType] = useState(operation);
  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });
  const editableRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef(note); // Store content outside state to prevent re-render
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
 const [userData, setuserData] = useState<any>(() => {    
    const initialValue = (localStorage.getItem('userProfileData') != 'undefined')?JSON.parse(localStorage.getItem('userProfileData') || '{}'):'{}';
    return initialValue || "";
  });

  const handleMouseEnter = () => {
    setIsButtonDisabled(false);
    saveContent(); // Save content on hover
    if (note.trim()!="" && note.trim()!="<br>") {
      console.log("note test ",note);
      
    setIsButtonDisabled(false); // Enable button on hover
    }
  };

const handleMouseLeave = () => {
  if(contentRef.current=="" || contentRef.current=="<br>"){
    setNote("")
    setIsButtonDisabled(true); 
    console.log("contentRef.current",contentRef.current);    
  }
};
const handleKeyUp = () => {
  if (editableRef.current) {
    // setNote(editableRef.current.innerHTML); // Update state on keyup
    
    if(editableRef.current.innerHTML=="" || editableRef.current.innerHTML=="<br>"){
      setIsButtonDisabled(true);       
    }else{
      setIsButtonDisabled(false); 
    }
    console.log("editableRef.current.innerHTML",editableRef.current.innerHTML);    
  }
};
  const handleInput = () => {
    if (editableRef.current) {
      contentRef.current = editableRef.current.innerHTML; // Store content without re-render
      if(contentRef.current=="" || contentRef.current=="<br>"){
        setNote("")
        setIsButtonDisabled(true); 
      }
    }
  };
  
  const saveContent = () => {
    console.log("contentRef.current",contentRef.current);
    editRow("")
    setNote(contentRef.current); // Save to state only when necessary
    if(contentRef.current=="" || contentRef.current=="<br>"){
      setNote("")
      setIsButtonDisabled(true); 
      console.log("contentRef.current",contentRef.current);    
    }
  };
  useEffect(() => {
    if (editableRef.current) {
      editableRef.current.innerHTML = note; // Update only when editedText changes
      if(note=="" || note=="<br>"){
        setNote("")
        setIsButtonDisabled(true); 
        console.log("contentRef.current",note);    
      }else{
        setIsButtonDisabled(false); 
      }
    }
    console.log("note here",note);
    
  }, [note]);

  useEffect(() => {
    formik.setValues(formInitialValues);

    if (isExpanded) {
      editRow(null);
    }
 
    console.log("isExpanded",isExpanded);
    if (operation == "Update") { 
      const updateName = initialValues.get("name") as string;
      console.log("initialValues note",initialValues);
      console.log("updateName note",updateName);
      let formData = {
        content:initialValues.get("content")
      }             
      let updatedata = updateResource("FCRM Note",updateName , formData, userToken?.access_token);
      
      
      // loadData();
      // setTimeout(() => {
      //   loadData();
      // }, 500);
    }
  }, [initialValues]);
  useEffect(() => {
   console.log("editRow",operation);
   if(operation=="Edit"){
    setIsExpanded(false);
   }
  },[operation])
  // Handle text change
  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNote(event.target.value);
  };
const stripHtml = (htmlString) => {
  return htmlString.replace(/<[^>]*>?/gm, '');
};
  const handleSave = ( note: any) => {
    if (!note?.trim()) return; // Prevent saving empty notes
  console.log("Saving note:", note);

    
    const formData = new FormData();
    formData.append("doctype", "FCRM Note");
    formData.append("reference_doctype", doc_type);
    formData.append("reference_docname", link_name);
    formData.append("content", note);
    formData.append("title", stripHtml(note));
    formData.append("owner", userData?.full_name);
    formData.append("modified_by", userData?.full_name);
    postNote(formData, userToken?.access_token);
    if(editableRef.current){
      contentRef.current = "";
      editableRef.current.innerHTML = "";
    }
    setNote(""); // Clear note after saving
   
    // Simulate API call or processing delay
    setTimeout(() => {
      
     
      setIsButtonDisabled(true); // Re-disable after clearing note
      
      loadData();
      addItem();
    }, 500);
    setNote("")
  };
  // Reset state on cancel
  const handleCancel = () => {
    setIsExpanded(false);
    setNote("");
  };

  const formik = useFormik({
    initialValues: formInitialValues || initialValues,
    // validationSchema: NoteFormValidation,
    enableReinitialize: true,
    isInitialValid: true,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, action) => {
      // alert(JSON.stringify(values, null, 2));
      const requestParams = {
        value: { ...values },
        token: userToken?.access_token,
      };

      handlesubmit(values, action);
    },
  });

  const handlesubmit: any = async (values, action) => {
    // if(!Boolean(formik.errors.custom_error))
    if (formik.isValid) {
      const formData = new FormData();
      Object.keys(values).forEach(function (key) {
        console.log(key, "============", values[key]);
        formData.append(key, values[key]);
      });
      // formData.append("link_name", link_name);
      if(note){
        formData.append("content", note);
      }
      // formData.append("comment_type", "FCRM Note");
      formData.append("reference_doctype", doc_type);
      formData.append("reference_docname", link_name);

      
      console.log("values form Data ", formData);
      console.log("values form Data operation", operation);

      return false;
      if (operation == "New") {
        action.resetForm();
        setNote("");
        createResource("FCRM Note", formData, userToken?.access_token);
        setNote("");
      } else if (operation == "Edit") {
        // createResource("FCRM Note",formData,userToken?.access_token);
      }      
      loadData();
     
      setTimeout(() => {
        loadData();
        addItem();
      }, 500);
      // alert(JSON.stringify(values))
      action.setSubmitting(false);
    }
    // }
  };

  return (
    <Paper
      elevation={isExpanded ? 3 : 0}
      sx={{
        p: isExpanded ? 2 : 1,
        // border: isExpanded ? "1px solid #3e8ef2" : "1px solid #ddd",
        // borderRadius: "8px",
        boxShadow:"none",
        minWidth: "800px",
      }}
    >
      {/* Clickable Input */}
      {!isExpanded && (
        <TextField
          fullWidth
          placeholder="Add a note"
          onFocus={() => setIsExpanded(true)}
          variant="outlined"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
            },
          }}
        />
      )}
      <FormikProvider value={formik}>
        <Form>
          {/* Expanded Text Area */}
          {isExpanded && (
            <>
              {/* <TextField
                onFocus={() => editRow(null)}
                fullWidth
                multiline
                minRows={3}
                name="content"
                placeholder="Add a note"
                value={formik.values?.content}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.content && Boolean(formik.errors.content)}
                helperText={formik.touched.content && formik.errors.content}
                autoFocus
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                  },
                }}
              /> */}
               <Typography
                  ref={editableRef}
                  component="div"
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleInput}
                  onBlur={saveContent} // Save only when editing is done
                  onKeyUp={handleKeyUp} 
                  sx={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    minHeight: "100px",
                    borderRadius: "4px",
                  }}
                >
                  {note}
                </Typography>

              {/* Attachment Option */}
              {/* <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
            <IconButton color="primary">
              <AttachFileIcon />
            </IconButton>
            <Typography variant="body2" color="text.secondary">
              Add a title
            </Typography>
          </Box> */}

              {/* Action Buttons */}
              <Box
                display="flex"
                justifyContent="flex-end"
                gap={1}
                sx={{ mt: 2 }}
              >
                <Button onClick={handleCancel} variant="outlined">
                  Cancel
                </Button>
                <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                 <Button
                  color="primary"
                  onClick={() => handleSave(note)}
                  onMouseEnter={handleMouseEnter} // Enable button on hover
                  onMouseLeave={() => handleMouseLeave()} // Restore disable state if needed
                  variant="contained"
                  disabled={isButtonDisabled} 
                >
                  Submit
                </Button>
                </div>
                {/* <Button
                  color="primary"
                  type="submit"
                  variant="contained"
                  disabled={!note.trim()}
                >
                  Submit
                </Button> */}
              </Box>
            </>
          )}
        </Form>
      </FormikProvider>
    </Paper>
  );
}
