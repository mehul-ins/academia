import { useState } from 'react';

const InstituteRegisterPage = ({ onSuccess }) => {
    const [form, setForm] = useState({ email: '', password: '', name: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                    name: form.name,
                    role: 'institution',
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.reasons?.[0] || 'Registration failed');
            setSuccess(true);
            if (onSuccess) onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Register Your Institute</h2>
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Institute Name</label>
                    <input type="text" name="name" value={form.name} onChange={handleChange} required className="input-field w-full" />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Email</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} required className="input-field w-full" />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 mb-2">Password</label>
                    <input type="password" name="password" value={form.password} onChange={handleChange} required className="input-field w-full" />
                </div>
                {error && <div className="text-red-600 mb-4 text-center">{error}</div>}
                {success && <div className="text-green-600 mb-4 text-center">Registration successful!</div>}
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </form>
        </div>
    );
};

export default InstituteRegisterPage;
