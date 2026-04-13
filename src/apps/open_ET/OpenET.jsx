import React, { useEffect, useState } from "react";

const API_URL = "https://jsonplaceholder.typicode.com/posts"; // Example REST API endpoint

const API_KEY = 'z89QuHGWmA9hvQiWczbIVyS9UGChEcPanjtGzJfuWplvhUv0a7rEpy0oprSw'

const OpenET = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(API_URL);
                if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                }
                const json = await response.json();
                setData(json);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

    return (
        <div>
            <h2>OpenET Data</h2>
            <ul>
                {data.map(item => (
                    <li key={item.id}>
                        <strong>{item.title}</strong>
                        <br />
                        {item.body}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default OpenET;