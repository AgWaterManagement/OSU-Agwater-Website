import { useState, useEffect } from "react";
import { useMediaQuery } from 'react-responsive';
import PropTypes from 'prop-types';
import { Row, Col, Input, Select, Pagination, Image, Tag } from "antd";

const { Option } = Select;
const { Search } = Input;


const POSTS_PER_PAGE = 8;

const AWArticles = ({ showFilters = false, showSearch = false }) => {
    const [articles, setArticles] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAuthor, setSelectedAuthor] = useState("");
    const [selectedTag, setSelectedTag] = useState("");

    useEffect(() => {
        fetch("https://agwater.org:5556/ArticleList")
            .then((res) => res.json())
            .then((articles) => {
                for (let _article of articles)
                    _article['_id'] = _article.title.replaceAll(' ', '_');
                return articles;
            })
            .then((articles) => setArticles(articles));
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

    //const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
    const displayedPosts = filteredPosts.slice(
        (currentPage - 1) * POSTS_PER_PAGE,
        currentPage * POSTS_PER_PAGE
    );

    function OnArticleClick(e) {
        console.log('clicked');
        const id = e.currentTarget.id;
        const article = articles.find((article) => article._id === id);
        if (article) {
            const url = '/feature/' + article._id;
            window.open(url, '_blank');
        }
    }

    const handlePageChange = (page) => setCurrentPage(page);
    const isMobile = useMediaQuery({ query: '(max-width: 720px)' })

    return (
        <>
            <div style={{ width: '100%', marginLeft: 'auto', marginRight: 'auto', display: 'inline-block' }}>
                {showSearch && (
                    <Search placeholder="type your search text here..." allowClear
                        onSearch={(e) => {
                            setSearchQuery(e.target.value);
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
                            <Image
                                width={'95%'}
                                maxWidth={500}
                                maxHeight={360}
                                preview={false}
                                src={post.cover_image}
                                style={{ borderRadius: 8, margin: 0, padding: 0 }}
                            />

                            <p style={{ margin: 0, padding: 0 }} >
                                <span style={{ fontWeight: 'bold', fontSize: 'large', margin: 0, padding: 0 }}>{post.title}</span>
                            </p>
                            <p style={{ margin: 0, padding: 0, paddingRight:'1em'}}>{post.abstract}</p>

                            <p style={{ fontSize: "small", margin: 0, padding: 0, paddingTop: '1em' }} > By {post.lead_author} on {post.pub_date} </p>
                            
                            {post.tags && post.tags.map((tag,index) => (
                                <Tag key={index}>{tag}</Tag>
                            ))}

                            {isMobile && (<hr />)}

                        </Col>
                    ))}
                </Row>
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
    showSearch : PropTypes.bool,
}

export default AWArticles;
