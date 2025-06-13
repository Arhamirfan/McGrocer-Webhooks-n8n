import { useState } from "react";
import axios from "axios";
import { products } from "../public/products";

export default function Home() {
  const [form, setForm] = useState({ name: "", email: "" });
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Submitting...");
    try {
      let values = {form, products}
      // Send POST request to n8n webhook
      await axios.post(
        "https://georgetrs.app.n8n.cloud/webhook-test/90b8cf6c-b28e-403f-a293-06ecde6548b4",
        values
      );
      setStatus("Submitted successfully!");
    } catch (error) {
      setStatus("Submission failed.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl text-black font-bold mb-6 text-center">Submit to n8n Webhook</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="name">Name</label>
            <input
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              name="name"
              id="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="email">Email</label>
            <input
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              name="email"
              id="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Submit
          </button>
        </form>
        {status && <p className="mt-4 text-center text-sm">{status}</p>}
      </div>
    </div>
  );
}
