import React, { useEffect, useState } from "react";
import { Input, Tag, Typography } from 'antd';
import Loading from "../../components/loading/Loading"; // Adjust the import path as necessary
const { Title } = Typography;

const SOURCES_URL = "https://agwater.org:5556/llm/sources";
const FILE_URL = "https://agwater.org:5556/llm/source?filename=";

const ShowSources = () => {
    const [allSources, setAllSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetch(SOURCES_URL)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch sources");
                return res.json();
            })  
            .then((data) => {
                if (!data.sources) throw new Error("Invalid data format");
                // Flatten all sources, de-duplicate by filename, keep tags
                const seen = new Set();
                const flat = [];
                data.sources.forEach((src) => {
                    if (!seen.has(src.filename)) {
                        flat.push({ title: src.title, filename: src.filename, tags: src.tags || [] });
                        seen.add(src.filename);
                    }
                });
                setAllSources(flat);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

    // Filter sources by search string (case-insensitive)
    const filtered = allSources.filter(({ title, tags }) => {
        const searchLower = search.toLowerCase();
        return (
            title.toLowerCase().includes(searchLower) ||
            (tags && tags.some(tag => tag.toLowerCase().includes(searchLower)))
        );
    });

    return (
        <div>
            {loading && <Loading tip="Loading sources..."/> }
            <Title level={2}>The Following Sources are Used in the AgWater Chat Large Language Model</Title>

            <div>Specify a search term below or click on a tag to filter the list.</div>

            <Input
                id="source-search"
                placeholder="Search titles..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ marginBottom: 24, maxWidth: 500, height: 40, fontSize: 16 }}
                allowClear
            />
            <ul>
                {filtered.map(({ title, filename, tags }) => (
                    <li key={filename}>
                        <a
                            href={`${FILE_URL}${encodeURIComponent(filename)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {title}
                        </a>
                        {tags && tags.length > 0 && (
                            <span style={{ marginLeft: 8 }}>
                                {tags.map(tag => (
                                    <Tag
                                        key={tag}
                                        style={{ cursor: "pointer" }}
                                        onClick={() => setSearch(tag)}
                                    >
                                        {tag}
                                    </Tag>
                                ))}
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ShowSources;