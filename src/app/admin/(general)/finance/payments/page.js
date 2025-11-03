'use client'
import React, { useEffect, useMemo, useState } from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import DynamicTitle from '@/components/common/DynamicTitle'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiGet, apiPost, apiPut, apiPatch } from '@/lib/api'
import Table from '@/components/shared/table/Table'
import { FiEdit3, FiTrash2 } from 'react-icons/fi'
import Swal from 'sweetalert2'
import { showSuccessToast, showErrorToast } from '@/utils/topTost'
import useOfftakerData from '@/hooks/useOfftakerData'
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

const PaymentsPage = () => {
    const { lang } = useLanguage()
    const { offtakers, loadingOfftakers } = useOfftakerData()

    const [items, setItems] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [modalType, setModalType] = useState('add') // add | edit
    const [editId, setEditId] = useState(null)
    // const [loading, setLoading] = useState(false)

    const [form, setForm] = useState({
        invoice_id: '',
        offtaker_id: '',
        amount: '',
        status: 1,
    })
    const [formError, setFormError] = useState({ amount: '' })

    const STATUS_OPTIONS = [
        { label: lang('common.active', 'Active'), value: 1 },
        { label: lang('common.inactive', 'Inactive'), value: 0 },
    ]

    // static invoice options
    const INVOICE_OPTIONS = useMemo(() => ([
        { label: 'INV-1001', value: 1001 },
        { label: 'INV-1002', value: 1002 },
        { label: 'INV-1003', value: 1003 },
    ]), [])

    const fetchItems = async () => {
        try {
            const res = await apiGet('/api/payments')
            if (res?.success) setItems(res.data)
        } catch (e) {
            // ignore
        }
    }

    useEffect(() => { fetchItems() }, [])

    const openAdd = () => {
        setModalType('add')
        setForm({ invoice_id: '', offtaker_id: '', amount: '', status: 1 })
        setFormError({ amount: '' })
        setEditId(null)
        setShowModal(true)
    }
    const openEdit = (row) => {
        setModalType('edit')
        setForm({
            invoice_id: row.invoice_id || '',
            offtaker_id: row.offtaker_id || '',
            amount: row.amount?.toString?.() || '',
            status: row.status
        })
        setFormError({ amount: '' })
        setEditId(row.id)
        setShowModal(true)
    }
    const closeModal = () => setShowModal(false)

    const handleSave = async (e) => {
        e.preventDefault();

        const errors = {};
        const intRegex = /^\d+$/;

        // Validate required fields
        if (!form.offtaker_id) {
            errors.offtaker_id = lang('payments.offtakerRequired', 'Offtaker is required');
        }

        if (!form.amount) {
            errors.amount = lang('payments.amountRequired', 'Amount is required');
        } else if (!intRegex.test(form.amount)) {
            errors.amount = lang('payments.onlynumbers', 'Only numbers are allowed (e.g. 123456)');
        }

        if (!form.status && form.status !== 0) {
            errors.status = lang('payments.statusRequired', 'Status is required');
        }

        // If any errors found, show them and stop submission
        if (Object.keys(errors).length > 0) {
            setFormError(errors);
            return;
        }

        // Clear previous errors and proceed
        setFormError({});
        // setLoading(true);

        try {
            const payload = {
                invoice_id: form.invoice_id ? parseInt(form.invoice_id) : 0,
                offtaker_id: parseInt(form.offtaker_id),
                amount: parseInt(form.amount),
                status: parseInt(form.status)
            };

            let res;
            if (modalType === 'add') {
                res = await apiPost('/api/payments', payload);
                if (res?.success)
                    showSuccessToast(lang('payments.createdSuccessfully', 'Payment Created Successfully'));
            } else {
                res = await apiPut(`/api/payments/${editId}`, payload);
                if (res?.success)
                    showSuccessToast(lang('payments.updatedSuccessfully', 'Payment Updated Successfully'));
            }

            if (res?.success) {
                closeModal();
                fetchItems();
            } else {
                showErrorToast(res?.message || lang('payments.errorOccurred', 'An error occurred. Please try again.'));
            }
        } catch (err) {
            showErrorToast(err?.message || lang('payments.errorOccurred', 'An error occurred. Please try again.'));
        } finally {
            // setLoading(false);
        }
    };

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
            const res = await apiPatch(`/api/payments/${row.id}/soft-delete`, {})
            if (res?.success) {
                showSuccessToast(lang('payments.deletedSuccessfully', 'Payment Deleted Successfully'))
                fetchItems()
            } else {
                showErrorToast(res?.message || lang('payments.errorOccurred', 'An error occurred. Please try again.'))
            }
        }
    }

    const columns = [
        {
            accessorKey: 'invoice_id',
            header: () => lang('payments.invoice', 'Invoice'),
            cell: info => {
                const id = info.getValue()
                const match = INVOICE_OPTIONS.find(o => o.value == id)
                return match ? match.label : id || '-'
            }
        },
        {
            accessorKey: 'offtaker',
            header: () => lang('payments.offtaker', 'Offtaker'),
            cell: ({ row }) => {
                const user = row.original?.offtaker
                return user ? `${user.fullName}` : '-'
            }
        },
        {
            accessorKey: 'amount',
            header: () => lang('payments.amount', 'Amount'),
            cell: info => info.getValue()
        },
        {
            accessorKey: 'status',
            header: () => lang('payments.status', 'Status'),
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
            meta: { disableSort: true}
        }
    ]

    return (
        <>
            <DynamicTitle titleKey="payments.title" />
            <PageHeader>
                <div className="ms-auto">
                    {/* <Button variant="contained" onClick={openAdd}>+ {lang('payments.addPayment', 'Add Payment')}</Button> */}
                    <button type="button" className="btn btn-primary" onClick={openAdd}>+ {lang('payments.addPayment', 'Add Payment')}</button>
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
                            {modalType === 'edit'
                                ? lang('payments.editPayment', 'Edit Payment')
                                : lang('payments.addPayment', 'Add Payment')}
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
                            <FormControl fullWidth>
                                <InputLabel id="invoice-select-label">{lang('payments.invoice', 'Invoice')}</InputLabel>
                                <Select
                                    labelId="invoice-select-label"
                                    value={form.invoice_id}
                                    label={lang('payments.invoice', 'Invoice')}
                                    onChange={(e) => setForm({ ...form, invoice_id: e.target.value })}
                                >
                                    <MenuItem value="">{lang('payments.selectInvoice', 'Select Invoice')}</MenuItem>
                                    {INVOICE_OPTIONS.map(opt => (
                                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth error={!!formError.offtaker_id}>
                                <InputLabel id="offtaker-select-label">{lang('payments.offtaker', 'Offtaker')} *</InputLabel>
                                <Select
                                    labelId="offtaker-select-label"
                                    value={form.offtaker_id}
                                    label={`${lang('payments.offtaker', 'Offtaker')} *`}
                                    onChange={(e) => setForm({ ...form, offtaker_id: e.target.value })}
                                    disabled={loadingOfftakers}
                                >
                                    <MenuItem value="">{lang('payments.selectOfftaker', 'Select Offtaker')}</MenuItem>
                                    {offtakers.map(o => (
                                        <MenuItem key={o.id} value={o.id}>{o.fullName}</MenuItem>
                                    ))}
                                </Select>
                                {formError.offtaker_id && <FormHelperText>{formError.offtaker_id}</FormHelperText>}
                            </FormControl>

                            <FormControl fullWidth error={!!formError.status}>
                                <InputLabel id="status-select-label">{lang('common.status', 'Status')} *</InputLabel>
                                <Select
                                    labelId="status-select-label"
                                    value={form.status}
                                    label={`${lang('common.status', 'Status')} *`}
                                    onChange={(e) => setForm({ ...form, status: parseInt(e.target.value) })}
                                >
                                    {STATUS_OPTIONS.map(opt => (
                                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                    ))}
                                </Select>
                                {formError.status && <FormHelperText>{formError.status}</FormHelperText>}
                            </FormControl>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5 }}>
                        <Button onClick={closeModal} color="error" variant="outlined">
                            {lang('common.cancel', 'Cancel')}
                        </Button>
                        <Button type="submit" variant="contained">
                            {lang('common.save', 'Save')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </>
    )
}

export default PaymentsPage


