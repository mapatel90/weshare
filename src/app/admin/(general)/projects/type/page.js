'use client'
import React, { useEffect, useState } from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import DynamicTitle from '@/components/common/DynamicTitle'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiGet, apiPost, apiPut, apiPatch } from '@/lib/api'
import Table from '@/components/shared/table/Table'
import { FiEdit3, FiTrash2 } from 'react-icons/fi'
import Swal from 'sweetalert2'
import { showSuccessToast, showErrorToast } from '@/utils/topTost'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Button,
  Chip,
  Box,
  IconButton,
  Typography,
  Stack,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

const ProjectTypePage = () => {
    const { lang } = useLanguage()

    const [items, setItems] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [modalType, setModalType] = useState('add') // add | edit
    const [form, setForm] = useState({ name: '', status: 1 })
    const [editId, setEditId] = useState(null)
    const [loading, setLoading] = useState(false)

    const STATUS_OPTIONS = [
        { label: lang('common.active', 'Active'), value: 1 },
        { label: lang('common.inactive', 'Inactive'), value: 0 },
    ]

    const fetchItems = async () => {
        try {
            const res = await apiGet('/api/project-types')
            if (res?.success) setItems(res.data)
        } catch (e) {
            // ignore
        }
    }

    useEffect(() => { fetchItems() }, [])

    const openAdd = () => {
        setModalType('add')
        setForm({ name: '', status: 1 })
        setEditId(null)
        setShowModal(true)
    }
    const openEdit = (row) => {
        setModalType('edit')
        setForm({ name: row.type_name, status: row.status })
        setEditId(row.id)
        setShowModal(true)
    }
    const closeModal = () => setShowModal(false)

    const handleSave = async (e) => {
        e.preventDefault()
        if (!form.name) return
        setLoading(true)
        try {
            let res
            if (modalType === 'add') {
                res = await apiPost('/api/project-types', { name: form.name, status: form.status })
                if (res?.success) showSuccessToast(lang('projectType.createdSuccessfully', 'Type Created Successfully'))
            } else {
                res = await apiPut(`/api/project-types/${editId}`, { name: form.name, status: form.status })
                if (res?.success) showSuccessToast(lang('projectType.updatedSuccessfully', 'Type Updated Successfully'))
            }
            if (res?.success) {
                closeModal()
                fetchItems()
            } else {
                showErrorToast(res?.message || lang('projectType.errorOccurred', 'An error occurred. Please try again.'))
            }
        } catch (err) {
            showErrorToast(err?.message || lang('projectType.errorOccurred', 'An error occurred. Please try again.'))
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (row) => {
        const confirm = await Swal.fire({
            icon: 'warning',
            title: lang('common.areYouSure', 'Are you sure?'),
            text: lang('modal.deleteWarning', 'This action cannot be undone!'),
            showCancelButton: true,
            confirmButtonText: lang('common.yesDelete', 'Yes, delete it!'),
            confirmButtonColor: '#d33',
        })
        if (confirm.isConfirmed) {
            const res = await apiPatch(`/api/project-types/${row.id}/soft-delete`, {})
            if (res?.success) {
                showSuccessToast(lang('projectType.deletedSuccessfully', 'Type Deleted Successfully'))
                fetchItems()
            } else {
                showErrorToast(res?.message || lang('projectType.errorOccurred', 'An error occurred. Please try again.'))
            }
        }
    }

    const columns = [
        {
            accessorKey: 'type_name',
            header: () => lang('projectType.name', 'Name'),
            cell: info => info.getValue()
        },
        {
            accessorKey: 'status',
            header: () => lang('projectType.status', 'Status'),
            cell: info => {
                const status = info.getValue();
                const config = {
                    1: { label: lang('common.active', 'Active'), color: '#17c666' },
                    0: { label: lang('common.inactive', 'Inactive'), color: '#ea4d4d' },
                }[status] || { label: String(status ?? '-'), color: '#999' };
                return (
                    <Chip
                        label={config.label}
                        sx={{
                            backgroundColor: config.color,
                            color: '#fff',
                            fontWeight: 500,
                            minWidth: 80,
                            '&:hover': {
                                backgroundColor: config.color,
                                opacity: 0.9,
                            },
                        }}
                    />
                );
            }
        },
        {
            accessorKey: 'actions',
            header: () => lang('common.actions', 'Actions'),
            cell: ({ row }) => {
                const item = row.original
                return (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'nowrap' }}>
                        <IconButton
                            size="small"
                            onClick={() => openEdit(item)}
                            title={lang('common.edit', 'Edit')}
                            sx={{
                                color: '#1976d2',
                                transition: 'transform 0.2s ease',
                                '&:hover': {
                                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                    transform: 'scale(1.1)',
                                },
                            }}
                        >
                            <FiEdit3 size={18} />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={() => handleDelete(item)}
                            title={lang('common.delete', 'Delete')}
                            sx={{
                                color: '#d32f2f',
                                transition: 'transform 0.2s ease',
                                '&:hover': {
                                    backgroundColor: 'rgba(211, 47, 47, 0.08)',
                                    transform: 'scale(1.1)',
                                },
                            }}
                        >
                            <FiTrash2 size={18} />
                        </IconButton>
                    </Stack>
                )
            },
            meta: { disableSort: true }
        }
    ]

    return (
        <>
            <DynamicTitle titleKey="projects.projecttype" />
            <PageHeader>
                <div className="ms-auto">
                    {/* <Button variant="contained" onClick={openAdd}>+ {lang('projectType.addType', 'Add Type')}</Button> */}
                    <button type="button" className="btn btn-primary" onClick={openAdd}>+ {lang('projectType.addType', 'Add Type')}</button>
                </div>
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <Table data={items} columns={columns} />
                </div>
            </div>

            <Dialog
                open={showModal}
                onClose={closeModal}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                    },
                }}
            >
                <form onSubmit={handleSave}>
                    <DialogTitle
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            pb: 1,
                        }}
                    >
                        <Typography variant="h6" component="span">
                            {modalType === 'edit' ? lang('projectType.editType', 'Edit Type') : lang('projectType.addType', 'Add Type')}
                        </Typography>
                        <IconButton
                            aria-label="close"
                            onClick={closeModal}
                            sx={{
                                color: (theme) => theme.palette.grey[500],
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
                            <TextField
                                label={lang('projectType.name', 'Name')}
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                                fullWidth
                            />
                            <FormControl fullWidth>
                                <InputLabel id="status-select-label">{lang('common.status', 'Status')}</InputLabel>
                                <Select
                                    labelId="status-select-label"
                                    value={form.status}
                                    label={lang('common.status', 'Status')}
                                    onChange={e => setForm({ ...form, status: parseInt(e.target.value) })}
                                >
                                    {STATUS_OPTIONS.map(opt => (
                                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5 }}>
                        <Button onClick={closeModal} color="error" variant="outlined">
                            {lang('common.cancel', 'Cancel')}
                        </Button>
                        <Button type="submit" variant="contained" disabled={loading || !form.name}>
                            {loading ? lang('common.loading', 'Loading...') : lang('common.save', 'Save')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </>
    )
}

export default ProjectTypePage


