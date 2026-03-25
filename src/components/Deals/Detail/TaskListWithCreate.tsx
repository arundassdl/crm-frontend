'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
    Box,
    Typography,
    Avatar,
    IconButton,
    Stack,
    Tooltip,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    TextField,
    MenuItem,
    Select,
    SelectChangeEvent,
    Divider,
    Pagination,
    Menu,
    FormControl,
    InputLabel,
    Grid,
    Card,
    CardContent,
    ToggleButtonGroup,
    ToggleButton,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import {
    Refresh,
    HourglassBottom,
    CheckCircle,
    Cancel,
    Edit,
    Delete,
} from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import { GridAddIcon } from '@mui/x-data-grid';
import { fetchTasksWithOwner, Task } from '@/services/api/common-erpnext-api/create-update-custom-api';
// import DOMPurify from 'dompurify';
import 'react-quill/dist/quill.snow.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { deleteCustomDocument, deleteResource, postNote, updateResource } from '@/services/api/common-erpnext-api/create-edit-api';

import DonutLargeIcon from '@mui/icons-material/DonutLarge'; //Backlog

import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CircleIcon from '@mui/icons-material/Circle';
import * as Yup from 'yup';
import { Formik } from 'formik';
import ConfirmDialog from '@/components/UI/ConfirmDialog';
import CustomAvatar from '@/@core/components/mui/Avatar';
import { CONSTANTS } from '@/services/config/app-config';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import AddIcon from '@mui/icons-material/Add';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckIcon from '@mui/icons-material/Check';
import ViewSelector from '@/components/Common/ViewSelector';
import TasksListView from './TasksListView';
import TasksGridView from './TasksGridView';
import TasksKanbanView from './TasksKanbanView';
import AddEditTaskDrawer from '@/components/Tasks/CreateEdit';

const TaskSchema = Yup.object().shape({
    title: Yup.string().required('Title is required'),
    description: Yup.string().required('Description is required'),
    status: Yup.string().required(),
    priority: Yup.string().oneOf(['Low', 'Medium', 'High']).required(),
    // due_date: Yup.string().required('Due date is required'),
});



const priorityOptions = [
    { value: 'Low', icon: <CircleIcon fontSize="small" sx={{ color: 'gray' }} /> },
    { value: 'Medium', icon: <CircleIcon fontSize="small" sx={{ color: 'orange' }} /> },
    { value: 'High', icon: <CircleIcon fontSize="small" sx={{ color: 'red' }} /> },
];
const priorityColors = {
    Low: 'gray',
    Medium: 'orange',
    High: 'red',
};

const statusOptions = [
    { value: 'Backlog', index: 0, icon: <DonutLargeIcon fontSize="small" /> },
    { value: 'Todo', index: 1, icon: <RadioButtonUncheckedIcon fontSize="small" sx={{ color: 'orange' }} /> },
    { value: 'In Progress', index: 2, icon: <HourglassBottom fontSize="small" sx={{ color: '#f6c4bc' }} /> },
    { value: 'Done', index: 3, icon: <CheckCircle fontSize="small" sx={{ color: 'green' }} /> },
    { value: 'Canceled', index: 4, icon: <Cancel fontSize="small" sx={{ color: 'red' }} /> },
];
interface TaskProps {
    link_name: string;
    doc_type: string;
    limit?: number;
}
const TaskListWithCreate: React.FC<TaskProps> = ({ link_name, doc_type, limit }) => {
    // export default function TaskListWithEdit() {
    const [tasks, setTasks] = useState<Task[]>([]);

    const [modalOpen, setModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        title: '',
        description: '',
        status: 'Backlog',
        priority: 'Low',
        assigned_to: 'Administrator',
        due_date: '',
    });
    const [loading, setLoading] = useState(false);
    const [userToken, setUserToken] = useState<any>(() => {
        const initialValue = JSON.parse(
            localStorage.getItem("AccessTokenData") || "{}"
        );
        return initialValue || "";
    });
    const editableRef = useRef<HTMLDivElement | null>(null);
    const [userData, setuserData] = useState<any>(() => {
        const initialValue = (localStorage.getItem('userProfileData') != 'undefined') ? JSON.parse(localStorage.getItem('userProfileData') || '{}') : '{}';
        return initialValue || "";
    });
    // Add pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalTasks, setTotalTasks] = useState(0);
    let [tasksPerPage, setTasksPerPage] = useState(limit || 6);
    // Add menu state
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuIndex, setMenuIndex] = useState<number | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedRowId, setSelectedRowId] = useState<any | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban'>('grid');
    const [view, setView] = useState('list');

    const [anchorsEl, setAnchorsEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorsEl);
    const initialValues = {
        title: isEdit ? formData.title : '',
        description: isEdit ? formData.description : '',
        status: isEdit ? formData.status : 'Backlog',
        priority: isEdit ? formData.priority : 'Low',
        due_date: isEdit ? formData.due_date : '',
    }
    const [selectedRow, setSelectedRow] = useState<any>([]);
    const [operation, setOperation] = useState("");


    const CloseDialog = () => {
        setSelectedRow([]);
        setModalOpen(false);
        setTimeout(() => {
            setCurrentPage(1);
            fetchData(1);
        }, 2000);
    };
    const handleRowEdit = async (rowData: any) => {

        // rowData.due_date = formatCalDate(rowData.due_date);
        console.log('Row Data--->', rowData)
        setSelectedRow(rowData);
        // OpenDialog();
        setOperation("Edit");
        return false;
    };



    const openEditModal = (index: any) => {
        const task = tasks.filter((task) => task.name === index)[0]
        // const task = tasks[index];
        console.log("task",task);
         setSelectedRow(task);
        // if (task?.owner !== userData?.email) return
        // setFormData({
        //     name: task.name,
        //     title: task.title,
        //     description: task.description, // You can store this if needed
        //     status: task.status,
        //     priority: task.priority,
        //     assigned_to: task.assigned_to,
        //     due_date: task.due_date || '',
        // });
        setIsEdit(true);
        setEditIndex(index);
        setModalOpen(true);
         setOperation("Edit");
    };

    const openCreateModal = () => {
         setOperation("New");
        setFormData({
            name: '',
            title: '',
            description: '',
            status: 'Backlog',
            priority: 'Low',
            assigned_to: 'Administrator',
            due_date: '',
        });
        setIsEdit(false);
        setEditIndex(null);
        setModalOpen(true);
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, index: number) => {
        setAnchorEl(event.currentTarget);
        setMenuIndex(index);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuIndex(null);
    };

    const handleDelete = async(id: string) => {
        setDialogOpen(false);
        setTasks(tasks.filter((task) => task.name !== id));
        handleMenuClose();
        // await deleteResource("CRM Task", id, userToken?.access_token);
        await deleteCustomDocument("CRM Task", id, userToken?.access_token);
         setTimeout(() => {
            setCurrentPage(1);
            fetchData(1);
        }, 2000);
    };
    const handleFormSubmit = () => {

        CloseDialog();
    };

    const handleSave = async (values) => {
        const safePriority = values.priority as 'Low' | 'Medium' | 'High';

        const newTask: Task = {
            ...values,
            priority: safePriority,
            completed: values.status === 'Done',
        };
        const dataupdate = new FormData();
        dataupdate.append("doctype", "CRM Task");
        dataupdate.append("reference_doctype", doc_type);
        dataupdate.append("reference_docname", link_name);
        dataupdate.append("title", newTask?.title);
        dataupdate.append("description", newTask?.description);
        dataupdate.append("priority", newTask?.priority);
        dataupdate.append("status", newTask?.status);
        dataupdate.append("owner", userData?.full_name);
        dataupdate.append("assigned_to", userData?.email);
        dataupdate.append("modified_by", userData?.full_name);
        dataupdate.append("due_date", newTask.due_date);

        if (isEdit && editIndex !== null) {
            const updated = [...tasks];
            newTask.assigned_to = userData?.email;
            newTask.name = formData?.name;
            updated[editIndex] = newTask;


            const updateName = newTask?.name;
            let updatedata = updateResource("CRM Task", updateName, newTask, userToken?.access_token);
            console.log("updatedata", newTask);

            setTasks(updated);
        } else {
            postNote(dataupdate, userToken?.access_token);
            setTasks((prev) => [...prev, newTask]);

        }
        // await fetchData(currentPage);
        setTimeout(() => {
            setCurrentPage(1);
            fetchData(1);
        }, 2000);

        setModalOpen(false);
    };

    const fetchData = async (page = 1) => {
        if (view === 'kanban') {
            tasksPerPage = 100000
            page = 1
        }
        setLoading(true);
        let offset = (page - 1) * tasksPerPage;

        const { data, total } = await fetchTasksWithOwner(
            doc_type,
            link_name,
            userToken?.access_token,
            tasksPerPage,
            offset
        );
        console.log("datadatadata", data);

        setTasks(data);
        setTotalTasks(total);
        setLoading(false);
    };


    useEffect(() => {
        fetchData(currentPage);
    }, [currentPage, link_name, view]);

    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ list: 'bullet' }],
            ['clean'],
        ],
    };

    const handleDeleteClick = (id: any) => () => {
        if (id != undefined) {
            handleDelete(id);
        } else {
            setDialogOpen(false);
        }
    };
    const handleDeleteRow = (id: any) => {
        console.log("delet id", id);
        setSelectedRowId(id);
        setDialogOpen(true);
    };

    const handleViewModeChange = (
        event: React.MouseEvent<HTMLElement>,
        newView: 'grid' | 'list' | null
    ) => {
        if (newView !== null) setViewMode(newView);
    };


    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorsEl(event.currentTarget);
    };

    const handleClose = (value?: string) => {
        if (value && value !== 'create') {
            setView(value);
        }
        setAnchorsEl(null);
    };
    const handleStatusChange = (taskId: string, newStatus: string) => {
        const updatedTasks = tasks.map(task =>
            task.name === taskId ? { ...task, status: newStatus } : task
        );
        setTasks(updatedTasks);

        updateResource("CRM Task", taskId, { status: newStatus }, userToken?.access_token);
    };


    return (
        <Box sx={{ mx: 'auto', mt: 4, ml: 5 }}>
            <Box
                sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 1100,
                    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.1)",
                    borderBottom: "1px solid var(--DataGrid-rowBorderColor)",
                    paddingBottom: 2,
                    //   px: 5,
                    pb: 5,
                    backgroundColor: 'background.paper',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 2,
                    }}
                >
                    {/* Left Side: Title + View Selector */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h5">Tasks</Typography>
                        <ViewSelector view={view} setView={setView} />
                    </Box>

                    {/* Right Side: Button */}
                    <Tooltip title={`New Task`}>
                        <Button
                            variant="contained"
                            size="medium"
                            startIcon={<GridAddIcon fontSize="small" />}
                            onClick={openCreateModal}
                        >
                            {`New Task`}
                        </Button>
                    </Tooltip>
                </Box>
            </Box>

            <Divider sx={{ borderBottomWidth: "2px", mb: 5 }} />

            <ConfirmDialog
                open={dialogOpen}
                title="Delete Item"
                message="Are you sure you want to delete this item? This action cannot be undone."
                onClose={() => setDialogOpen(false)}
                onConfirm={handleDeleteClick(selectedRowId)}
            />
            {Array.isArray(tasks) && tasks.length > 0 ? (
                <>
                    {view === 'list' && (
                        <>
                            <TasksListView
                                tasks={tasks}
                                userData={userData}
                                openEditModal={openEditModal}
                                handleMenuOpen={handleMenuOpen}
                                anchorEl={anchorEl}
                                menuIndex={menuIndex}
                                handleMenuClose={handleMenuClose}
                                handleDeleteRow={handleDeleteRow}
                            />
                            {/* Pagination Controls */}
                            <Stack direction="row" justifyContent="center" mt={4}>
                                <Pagination
                                    count={Math.ceil(totalTasks / tasksPerPage)}
                                    page={currentPage}
                                    onChange={(e, value) => setCurrentPage(value)}
                                    color="primary"
                                />
                            </Stack>
                        </>
                    )}

                    {view === 'grid' && (
                        <>
                            <TasksGridView
                                tasks={tasks}
                                userData={userData}
                                openEditModal={openEditModal}
                                handleDeleteRow={handleDeleteRow}
                            />
                            {/* Pagination Controls */}
                            <Stack direction="row" justifyContent="center" mt={4}>
                                <Pagination
                                    count={Math.ceil(totalTasks / tasksPerPage)}
                                    page={currentPage}
                                    onChange={(e, value) => setCurrentPage(value)}
                                    color="primary"
                                />
                            </Stack>
                        </>
                    )}

                    {view === 'kanban' && (
                        <TasksKanbanView
                            tasks={tasks}
                            statusOptions={statusOptions}
                            userData={userData}
                            onStatusChange={handleStatusChange}
                            openEditModal={openEditModal}
                            handleDeleteRow={handleDeleteRow}
                            doctype="CRM Task"
                            fieldname="status"
                        />
                    )}

                </>
            ) : (
                <Typography variant="body2">No tasks found</Typography>
            )}
            {modalOpen && (
                <AddEditTaskDrawer
                    initialValues={selectedRow}
                    open={modalOpen}
                    onClose={CloseDialog}
                    operation={operation}
                    onSubmit={handleFormSubmit}
                    reference_doctype={doc_type}
                    reference_docname={link_name}
                />
            )}
            {/* Modal: Create / Edit */}
            {/* <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth>
                <DialogTitle sx={{ m: 0, p: 5 }}>
                    {isEdit ? 'Edit Task' : 'Create Task'}
                    <IconButton
                        aria-label="close"
                        onClick={() => setModalOpen(false)}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent>
                    <Formik
                        initialValues={{
                            title: isEdit ? formData.title : '',
                            description: isEdit ? formData.description : '',
                            status: isEdit ? formData.status : 'Backlog',
                            priority: isEdit ? formData.priority : 'Low',
                            due_date: isEdit ? formData.due_date : '',
                        }}
                        validationSchema={TaskSchema}
                        onSubmit={(values) => {
                            const newTask = {
                                ...values,
                                assignee: 'Administrator',
                                completed: values.status === 'Done',
                            };

                            // if (isEdit && editIndex !== null) {
                            //   const updated = [...tasks];
                            //   updated[editIndex] = newTask;
                            //   setTasks(updated);
                            // } else {
                            //   setTasks((prev) => [...prev, newTask]);
                            // }
                            handleSave(values);

                            setModalOpen(false);
                        }}
                    >
                        {({
                            values,
                            errors,
                            touched,
                            handleChange,
                            handleSubmit,
                            setFieldValue,
                        }) => (
                            <form onSubmit={handleSubmit}>
                                <Stack spacing={4} mt={1}>
                                    <TextField
                                        label="Title"
                                        name="title"
                                        value={values.title}
                                        onChange={handleChange}
                                        error={touched.title && Boolean(errors.title)}
                                        helperText={touched.title && errors.title}
                                        fullWidth
                                    />

                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Description
                                        </Typography>
                                        <ReactQuill
                                            theme="snow"
                                            value={values.description}
                                            onChange={(value) => setFieldValue('description', value)}
                                            modules={{ toolbar: false }}
                                        />
                                        {touched.description && errors.description && (
                                            <Typography variant="caption" color="error">
                                                {errors.description}
                                            </Typography>
                                        )}
                                    </Box>

                                    <FormControl fullWidth error={touched.status && Boolean(errors.status)}>
                                        <InputLabel id="status-label">Status</InputLabel>
                                        <Select
                                            labelId="status-label"
                                            name="status"
                                            value={values.status}
                                            onChange={handleChange}
                                            label="Status"
                                        >
                                            {statusOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        {option.icon}
                                                        <Typography>{option.value}</Typography>
                                                    </Stack>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl fullWidth error={touched.priority && Boolean(errors.priority)}>
                                        <InputLabel id="priority-label">Priority</InputLabel>
                                        <Select
                                            labelId="priority-label"
                                            name="priority"
                                            value={values.priority}
                                            onChange={handleChange}
                                            label="Priority"
                                        >
                                            {priorityOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        {option.icon}
                                                        <Typography>{option.value}</Typography>
                                                    </Stack>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <TextField
                                        label="Due Date"
                                        type="datetime-local"
                                        name="due_date"
                                        value={values.due_date}
                                        onChange={handleChange}
                                        InputLabelProps={{ shrink: true }}
                                        error={touched.due_date && Boolean(errors.due_date)}
                                        helperText={touched.due_date && errors.due_date}
                                        fullWidth
                                    />

                                    <Button variant="contained" type="submit">
                                        {isEdit ? 'Update' : 'Create'}
                                    </Button>
                                </Stack>

                            </form>
                        )}
                    </Formik>
                </DialogContent>
            </Dialog> */}
        </Box>
    );
}

export default TaskListWithCreate;
