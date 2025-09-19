import { useState, useEffect } from 'react';
import { templateAPI } from '../lib/api';

function TemplateManager() {
    const [templates, setTemplates] = useState([]);
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        templateAPI.listTemplates().then(res => setTemplates(res.templates || []));
    }, []);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;
        setMessage('Uploading...');
        try {
            await templateAPI.uploadTemplate(file);
            setMessage('Upload successful!');
            const res = await templateAPI.listTemplates();
            setTemplates(res.templates || []);
        } catch (err) {
            setMessage('Upload failed: ' + err.message);
        }
    };

    // Replace with your actual Supabase project ref
    const supabaseProjectRef = 'fqvfckxwhhvwlwmqzfkl';

    return (
        <div>
            <h2>Certificate Templates</h2>
            <form onSubmit={handleUpload} style={{ marginBottom: 16 }}>
                <input type="file" accept=".pdf,.docx" onChange={e => setFile(e.target.files[0])} />
                <button type="submit">Upload Template</button>
            </form>
            {message && <div>{message}</div>}
            <ul>
                {templates.map(t => (
                    <li key={t.id || t.filePath}>
                        {t.fileName} ({new Date(t.uploadedAt).toLocaleString()}){' '}
                        <a
                            href={`https://${supabaseProjectRef}.supabase.co/storage/v1/object/public/templates/${t.filePath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default TemplateManager;
