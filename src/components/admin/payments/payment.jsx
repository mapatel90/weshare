'use client'
import React, { useEffect, useMemo, useState } from 'react'
import PageHeader from '@/components/shared/pageHeader/PageHeader'
import DynamicTitle from '@/components/common/DynamicTitle'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiGet, apiPost, apiUpload } from '@/lib/api'
import Table from '@/components/shared/table/Table'
import { FiImage } from 'react-icons/fi'
import { showSuccessToast, showErrorToast } from '@/utils/topTost'
import useOfftakerData from '@/hooks/useOfftakerData'
import PaymentModal from '@/components/portal/billings/PaymentModal'
import {
    Button,
    Chip,
    IconButton,
    Typography,
    Stack,
} from "@mui/material";

const PaymentsPage = () => {
    const { lang } = useLanguage()
    const { offtakers, loadingOfftakers } = useOfftakerData()

    const [items, setItems] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({
        invoice_id: '',
        offtaker_id: '',
        amount: '',
        ss_url: '',
        status: 1,
    })



    const fetchItems = async () => {
        try {
            const res = await apiGet('/api/payments?page=1&pageSize=1000')
            if (res?.success && Array.isArray(res?.data)) {
                const formatted = res.data.map((payment) => ({
                    id: payment.id,
                    projectName: payment.invoices?.projects?.project_name || "N/A",
                    invoiceNumber: payment.invoices?.invoice_number || "N/A",
                    invoicePrefix: payment.invoices?.invoice_prefix || "",
                    paymentDate: payment.created_at
                        ? new Date(payment.created_at).toLocaleDateString("en-US")
                        : "N/A",
                    invoiceDate: payment.invoices?.invoice_date
                        ? new Date(payment.invoices.invoice_date).toLocaleDateString("en-US")
                        : "N/A",
                    dueDate: payment.invoices?.due_date
                        ? new Date(payment.invoices.due_date).toLocaleDateString("en-US")
                        : "N/A",
                    amount: payment.amount || 0,
                    status: payment.status === 1 ? "Paid" : "Pending",
                    ss_url: payment.ss_url || "",
                }))
                setItems(formatted)
            }
        } catch (e) {
            // ignore
        }
    }

    useEffect(() => { fetchItems() }, [])

    const openAdd = () => {
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setForm({ invoice_id: '', offtaker_id: '', amount: '', ss_url: '', status: 1 })
    }

    const handleSave = async (e) => {
        // e.preventDefault();
        
        try {
            // Upload screenshot first
            let ss_url = "";
            if (form.image) {
                const formData = new FormData();
                formData.append("file", form.image);
                formData.append("folder", "payment");

                const uploadResponse = await apiUpload("/api/upload", formData);
                if (uploadResponse?.success && uploadResponse?.data?.url) {
                    ss_url = uploadResponse.data.url;
                } else {
                    throw new Error("Failed to upload screenshot");
                }
            }

            // Prepare payload with correct types
            const payload = {
                invoice_id: form.invoice_id ? Number(form.invoice_id) : 0,
                offtaker_id: Number(form.offtaker_id),
                amount: Number(form.amount),
                ss_url: ss_url || form.ss_url || '',
                status: 1
            };

            const res = await apiPost('/api/payments', payload);
            if (res?.success) {
                showSuccessToast(lang('payments.createdSuccessfully', 'Payment Created Successfully'));
                closeModal();
                await fetchItems();
            } else {
                showErrorToast(res?.message || lang('payments.errorOccurred', 'An error occurred. Please try again.'));
            }
        } catch (err) {
            showErrorToast(err?.message || lang('payments.errorOccurred', 'An error occurred. Please try again.'));
        }
    };


    const columns = [
        {
            accessorKey: 'projectName',
            header: () => 'Project Name',
            cell: info => info.getValue() || 'N/A'
        },
        {
            accessorKey: 'invoiceNumber',
            header: () => 'Invoice',
            cell: ({ row }) => {
                const prefix = row.original?.invoicePrefix || ""
                const number = row.original?.invoiceNumber || "N/A"
                return `${prefix}${prefix ? '-' : ''}${number}`
            }
        },
        {
            accessorKey: 'amount',
            header: () => 'Amount',
            cell: info => info.getValue() || 0
        },
        {
            accessorKey: 'invoiceDate',
            header: () => 'Invoice Date',
            cell: info => info.getValue() || 'N/A'
        },
        {
            accessorKey: 'dueDate',
            header: () => 'Due Date',
            cell: info => info.getValue() || 'N/A'
        },
        {
            accessorKey: 'paymentDate',
            header: () => 'Payment Date',
            cell: info => info.getValue() || 'N/A'
        },
        {
            accessorKey: 'status',
            header: () => 'Status',
            cell: info => {
                const status = info.getValue();
                const config = {
                    'Paid': { label: 'Paid', color: '#17c666' },
                    'Pending': { label: 'Pending', color: '#ea4d4d' },
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
            accessorKey: 'ss_url',
            header: () => 'Screenshot',
            cell: ({ row }) => {
                const ss_url = row.original?.ss_url
                return ss_url ? (
                    <button
                        onClick={() => window.open(ss_url, '_blank', 'noopener,noreferrer')}
                        title="View Screenshot"
                        className="btn text-blue-600 hover:text-blue-800"
                        >
                        <FiImage size={18} />
                    </button>
                ) : (
                    <span className="text-gray-400">No Screenshot</span>
                )
            }
        }
    ]

    return (
        <>
            <DynamicTitle titleKey="payments.title" />
            <PageHeader>
                <div className="ms-auto">
                    <Button variant="contained" className="common-orange-color" onClick={openAdd}>+ {lang('payments.addPayment', 'Add Payment')}</Button>
                    {/* <button type="button" className="btn btn-primary" onClick={openAdd}>+ {lang('payments.addPayment', 'Add Payment')}</button> */}
                </div>
            </PageHeader>
            <div className='main-content'>
                <div className='row'>
                    <Table data={items} columns={columns} />
                </div>
            </div>

            <PaymentModal
                isOpen={showModal}
                onClose={closeModal}
                onSubmit={handleSave}
            />
        </>
    )
}

export default PaymentsPage


