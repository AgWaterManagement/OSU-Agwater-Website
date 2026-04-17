import { useState, useEffect } from "react";
import { useMediaQuery } from 'react-responsive';
import PropTypes from 'prop-types';
import { Row, Col, Input, Select, Pagination, Tag, Divider, Spin } from "antd";
import { secrets } from '../../secrets';

const { Option } = Select;
const { Search } = Input;

const POSTS_PER_PAGE = 8;

const ARTICLE_API_URL = "https://agwater.org:5556/articles/list"; // Original URL for production
//const ARTICLE_API_URL = "http://localhost:3000/articles/list";  // Use this for debugging

// LoadImage function: fetches, crops, and displays an image in a 480x360 box, filling the frame and maintaining aspect ratio (object-fit: cover)
function LoadImage({ url, alt = "", style = {} }) {
    const [imgSrc, setImgSrc] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        // Create an image object to load the image
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            // Create a canvas to crop/fit the image
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const targetW = 480;
            const targetH = 360;
            canvas.width = targetW;
            canvas.height = targetH;

            // Calculate aspect ratio for cover (fill the frame)
            const ratio = Math.max(targetW / img.width, targetH / img.height);
            const newW = img.width * ratio;
            const newH = img.height * ratio;
            const offsetX = (targetW - newW) / 2;
            const offsetY = (targetH - newH) / 2;

            // Draw the image so it fills the frame (cropped if needed)
            ctx.drawImage(img, offsetX, offsetY, newW, newH);

            if (isMounted) {
                setImgSrc(canvas.toDataURL());
                setLoading(false);
            }
        };
        img.onerror = () => {
            if (isMounted) {
                setImgSrc(null);
                setLoading(false);
            }
        };
        img.src = url;

        return () => { isMounted = false; };
    }, [url]);

    if (loading) {
        return (
            <div style={{
                width: '95%',
                height: 240,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f5f5f5",
                borderRadius: 8
            }}>
                <Spin />
            </div>
        );
    }

    if (!imgSrc) {
        return (
            <div style={{
                width: '95%',
                height: 240,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f5f5f5",
                borderRadius: 8,
                color: "#888"
            }}>
                Image not available
            </div>
        );
    }

    return (
        <img
            src={imgSrc}
            alt={alt}
            style={{
                borderRadius: 8,
                margin: 0,
                padding: 0,
                objectFit: "cover",
                width: '100%',
                display: "block",
                ...style
            }}
        />
    );
}

const AWArticles = ({ showFilters = false, showSearch = false }) => {
    const [articles, setArticles] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAuthor, setSelectedAuthor] = useState("");
    const [selectedTag, setSelectedTag] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch(ARTICLE_API_URL, {
            headers: {
                "X-API-Key": secrets.agwater_api_key,
            }
        })  .then((res) => res.json())
            .then((_articles) => {
                for (let _article of _articles.articles)
                    _article['_id'] = _article.title.replaceAll(' ', '_');  // replace ' '
                return _articles;
            })
            .then((_articles) => {
                setArticles(_articles.articles);
                setLoading(false);
            })
    }, []);

    useEffect(() => { })

    const authors = [...new Set(articles.map(post => post.lead_author))];
    const tags = [...new Set(articles.flatMap(post => post.tags || []))];

    const filteredPosts = articles.filter((post) => {
        const matchesSearch =
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.body_html.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesAuthor = selectedAuthor ? post.lead_author === selectedAuthor : true;
        const matchesTag = selectedTag ? (post.tags || []).includes(selectedTag) : true;
        return matchesSearch && matchesAuthor && matchesTag;
    });

    const displayedPosts = filteredPosts.slice(
        (currentPage - 1) * POSTS_PER_PAGE,
        currentPage * POSTS_PER_PAGE
    );

    function OnArticleClick(e) {
        console.log('clicked');
        const id = e.currentTarget.id;
        const article = articles.find((article) => article._id === id);
        if (article) {
            const url = '/feature/' + encodeURIComponent(article.title);
            window.open(url, '_blank');
        }
    }

    const handlePageChange = (page) => setCurrentPage(page);
    const isMobile = useMediaQuery({ query: '(max-width: 720px)' })

    return (
        <>
            {loading && (
                <div style={{ textAlign: "center", marginBottom: 16, backgroundColor: 'white' }}>
                    <Spin tip="Loading Articles..." size="large" fullscreen />
                </div>
            )}

            <div style={{ width: '100%', marginLeft: 'auto', marginRight: 'auto', display: 'inline-block' }}>
                {showSearch && (
                    <Search placeholder="type your search text here..." allowClear
                        onSearch={(e) => {
                            setSearchQuery(e.target.value); // Problems with onSearch e.target.value unable to be read
                            setCurrentPage(1);
                        }}
                        style={{ width: 320, marginLeft: '1em', marginBottom: '0.25em', marginRight: '4em' }} />
                )}
                {showFilters && (
                    <>
                        <Select
                            allowClear
                            placeholder="Filter by author"
                            value={selectedAuthor || undefined}
                            onChange={(value) => {
                                setSelectedAuthor(value || "");
                                setCurrentPage(1);
                            }}
                            style={{ width: '46%', marginLeft: '1em', maxWidth: 240 }}
                        >
                            {authors.map((author) => (
                                <Option key={author} value={author}>{author}</Option>
                            ))}
                        </Select>
                        <Select
                            allowClear
                            placeholder="Filter by tag"
                            value={selectedTag || undefined}
                            onChange={(value) => {
                                setSelectedTag(value || "");
                                setCurrentPage(1);
                            }}
                            style={{ width: '46%', marginLeft: '0.25em', maxWidth: 240 }}
                        >
                            {tags.map((tag) => (
                                <Option key={tag} value={tag}>{tag}</Option>
                            ))}
                        </Select>
                    </>
                )}
            </div>
            <div style={{ width: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
                <Row>
                    {displayedPosts.map((post) => (
                        <Col key={post._id} id={post._id} xs={{ flex: '100%' }} sm={{ flex: '50%' }} md={{ flex: '33%' }} lg={{ flex: '25%' }} xl={{ flex: '20%' }}
                            style={{ margin: "1em", height: "100%" }}
                            onClick={OnArticleClick}
                        >
                            <LoadImage url={post.cover_image} alt={post.title} />

                            <p style={{ margin: 0, padding: 0 }} >
                                <span style={{ fontWeight: 'bold', fontSize: 'large', margin: 0, padding: 0 }}>{post.title}</span>
                            </p>
                            <p style={{ margin: 0, padding: 0, paddingRight: '1em' }}>{post.abstract}</p>

                            <p style={{ fontSize: "small", margin: 0, padding: 0, paddingTop: '1em' }} > By {post.lead_author} on {post.pub_date} </p>

                            {post.tags && post.tags.map((tag, index) => (
                                <Tag key={index}>{tag}</Tag>
                            ))}

                            {isMobile && (<hr />)}

                        </Col>
                    ))}
                </Row>
                <Divider />
                <div className="flex justify-center">
                    <Pagination
                        current={currentPage}
                        total={filteredPosts.length}
                        pageSize={POSTS_PER_PAGE}
                        onChange={handlePageChange}
                        showSizeChanger={false}
                    />
                </div>
            </div>
        </>
    );
};

AWArticles.propTypes = {
    showFilters: PropTypes.bool,
    showSearch: PropTypes.bool,
}

export default AWArticles;
