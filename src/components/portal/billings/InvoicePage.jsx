"use client";
import React, { useState } from "react";
import PaymentModal from "./PaymentModal";

const invoiceData = {
  company: {
    name: "WeShare",
    address: "Sparksuite, Inc.",
    street: "12345 Sunny Road",
    city: "Sunnyville, CA 12345",
  },
  invoice: {
    number: 123,
    created: "June 23, 2021",
    due: "July 23, 2021",
  },
  client: {
    name: "John Doe",
    email: "johndoe@example.com",
    address: "260 W. Storm Street New York, NY 10025.",
  },
  items: [
    {
      id: 1,
      title: "Solar Panel Installation",
      desc: "Installation of 5kW solar panels for residential use.",
      generation: "5kW",
      price: "$40,000",
      subtotal: "$2,00,000",
    },
    {
      id: 2,
      title: "Inverter Setup",
      desc: "High-efficiency solar inverter for grid connection.",
      generation: "5kW",
      price: "$15,000",
      subtotal: "$75,000",
    },
    {
      id: 3,
      title: "Battery Storage",
      desc: "Lithium-ion battery pack for backup power.",
      generation: "10kWh",
      price: "$20,000",
      subtotal: "$2,00,000",
    },
    {
      id: 4,
      title: "Mounting Structure",
      desc: "Aluminum mounting structure for rooftop panels.",
      generation: "5kW",
      price: "$5,000",
      subtotal: "$25,000",
    },
    {
      id: 5,
      title: "Wiring & Accessories",
      desc: "Complete wiring and safety accessories for solar setup.",
      generation: "5kW",
      price: "$3,000",
      subtotal: "$15,000",
    },
  ],
  payment: {
    method: "Visa ***** ***** 1234",
  },
  summary: {
    summary: "$515000",
    discount: "$20",
    tax: "20%",
    total: "$103000",
  },
};

const InvoicePage = () => {
  const { company, invoice, client, items, payment, summary } = invoiceData;
  const [modalOpen, setModalOpen] = useState(false);

  const handleModalSubmit = (data) => {
    // Handle payment submission logic here
    // Example: console.log(data);
    setModalOpen(false);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="w-full bg-white rounded-xl shadow-md p-8">
        <h2 className="text-xl font-semibold mb-6">Invoice</h2>
        <div className="border rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
            <div>
              <div className="text-2xl font-bold theme-org-color mb-1">{company.name}</div>
              <div className="text-gray-500">{company.address}</div>
              <div className="text-gray-500">{company.street}</div>
              <div className="text-gray-500">{company.city}</div>
            </div>
            <div className="flex items-center gap-2 mt-4 md:mt-0">
              <img src="/images/invoice_qr.jpg" alt="Company Logo" className="w-32 h-32 object-contain" />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between mb-4">
          <div>
            <div className="font-bold text-lg mb-2">INVOICE</div>
            <div className="text-gray-700">Invoice #: <span className="font-semibold">{invoice.number}</span></div>
            <div className="text-gray-700">Created: <span className="font-semibold">{invoice.created}</span></div>
            <div className="text-gray-700">Due: <span className="font-semibold">{invoice.due}</span></div>
          </div>
          <div className="text-right mt-4 md:mt-0">
            <div className="text-gray-500">Invoiced To:</div>
            <div className="font-bold">{client.name}</div>
            <div className="text-gray-500">{client.email}</div>
            <div className="text-gray-500">{client.address}</div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border mb-8">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">#</th>
                <th className="px-4 py-3 text-left font-semibold">DESCRIPTION</th>
                <th className="px-4 py-3 text-left font-semibold">HRS</th>
                <th className="px-4 py-3 text-left font-semibold">RATE</th>
                <th className="px-4 py-3 text-left font-semibold">SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} className={idx % 2 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-2 font-medium whitespace-nowrap">{item.id}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-gray-500 text-xs">{item.desc}</div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">{item.generation}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{item.price}</td>
                  <td className="px-4 py-2 whitespace-nowrap font-bold">{item.subtotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
          <div>
            {/* <div className="font-semibold mb-1">Payment Method:</div> */}
            {/* <div className="text-gray-700">{payment.method}</div> */}
          </div>
          <div className="text-right mt-4 md:mt-0">
            <div className="font-semibold">Total:</div>
            <div className="text-gray-700">Summary : {summary.summary}</div>
            <div className="text-gray-700">Discount : {summary.discount}</div>
            <div className="text-gray-700">Tax : {summary.tax}</div>
            <div className="text-blue-700 font-bold text-lg">Total: {summary.total}</div>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            className="theme-btn-org-color text-white font-bold py-2 px-6 rounded shadow"
            type="button"
            onClick={() => setModalOpen(true)}
          >
            Make a Payment
          </button>
        </div>
        <PaymentModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          invoiceNumber={invoice.number}
          totalAmount={summary.total}
          onSubmit={handleModalSubmit}
        />
      </div>
    </div>
  );
};

export default InvoicePage;
