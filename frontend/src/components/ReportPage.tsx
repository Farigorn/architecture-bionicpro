import React, {useState} from 'react';
import {useKeycloak} from '@react-keycloak/web';

const ReportPage: React.FC = () => {
    const {keycloak, initialized} = useKeycloak();
    const today = new Date().toISOString().slice(0, 10);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [from, setFrom] = useState(today);
    const [to, setTo] = useState(today);

    const downloadReport = async () => {
        if (!keycloak?.authenticated || !keycloak.token) {
            setError('Пользователь не авторизован');
            return;
        }

        if (!from || !to) {
            setError('Выберите период отчёта');
            return;
        }

        if (from > to) {
            setError('Дата начала периода не может быть позже даты окончания');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            await keycloak.updateToken(30);

            const response = await fetch(`${process.env.REACT_APP_API_URL}/reports?from=${from}&to=${to}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${keycloak.token}`,
                    Accept: 'text/csv',
                },
            });
            if (!response.ok) {
                throw new Error(`Ошибка скачивания отчёта: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = getReportFileName(response.headers.get('Content-Disposition'), from, to);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка');
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        keycloak.logout({
            redirectUri: window.location.origin,
        });
    };

    if (!initialized) {
        return <div>Loading...</div>;
    }

    if (!keycloak.authenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
                <button
                    onClick={() => keycloak.login()}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Login
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-6xl">
                <h1 className="text-2xl font-bold mb-2">Usage Reports</h1>

                <p className="mb-6 text-gray-600">
                    Пользователь: <b>{keycloak.tokenParsed?.preferred_username}</b>
                </p>

                <div className="flex gap-4 mb-4">
                    <label className="flex flex-col">
                        <span className="mb-1 text-sm text-gray-600">Дата с</span>
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            className="border rounded px-3 py-2"
                        />
                    </label>

                    <label className="flex flex-col">
                        <span className="mb-1 text-sm text-gray-600">Дата по</span>
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="border rounded px-3 py-2"
                        />
                    </label>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={downloadReport}
                        disabled={loading}
                        className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
                            loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {loading ? 'Downloading report...' : 'download report'}
                    </button>

                    <button
                        onClick={logout}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Logout
                    </button>
                </div>

                {error && (
                    <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <p className="mt-4 text-gray-600">
                    Отчёт будет скачан CSV-файлом за выбранный период.
                </p>
            </div>
        </div>
    );
};

const getReportFileName = (contentDisposition: string | null, from: string, to: string) => {
    const match = contentDisposition?.match(/filename="([^"]+)"/);

    return match?.[1] ?? `prosthetic-report-${from}-${to}.csv`;
};

export default ReportPage;
