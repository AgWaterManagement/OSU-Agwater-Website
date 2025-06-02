import { useState, useEffect, useRef } from 'react';
import { Row, Col, Button, DatePicker, Form, Input, Select, AutoComplete } from 'antd';
//import PropTypes from 'prop-types';
import dayjs from 'dayjs';

import { AWFeatureDisplay } from '../../components/articles/AWFeature';

//import Quill from "quill";
//import QuillEditor from "./QuillEditor";
import './SubmitArticle.css';

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';


const formItemLayout = {
    labelCol: { sm: { span: 24 }, md: { span: 24} },
    wrapperCol: { sm: { span: 24 }, md: { span: 24 } },
};


const wrapperCol = { offset: 6, span: 16 };

const SubmitArticle = () => {
    // State for form fields
    const [tags, setTags] = useState([]);
    const [authors, setAuthors] = useState([]);
    //const [avatars, setAvatars] = useState([]);
    const [sites, setSites] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [titles, setTitles] = useState([]); // State for article titles
    const [abstractCharCount, setAbstractCharCount] = useState(0); // State for abstract Char count
    const [form] = Form.useForm();

    const [articles, setArticles] = useState([]); // State for articles data
    const [currentArticle, setCurrentArticle] = useState(null); // State for current article
    const [isDirty, setIsDirty] = useState(false); // State for dirty flag

    const [bodyHtml, setBodyHtml] = useState('');



    //const Delta = Quill.import("delta");
    //const [range, setRange] = useState();
    //const [lastChange, setLastChange] = useState();
    //const [readOnly, setReadOnly] = useState(false);
    const quillRef = useRef();

    useEffect(() => {
        fetch("https://agwater.org:5556/ArticleList")
            .then((response) => {
                if (!response.ok) throw new Error("Failed to fetch articles");
                return response.json();
            })
            .then((articles) => {
                setArticles(articles);

                for (let article of articles)
                    article['_id'] = article.title.replaceAll(' ', '_'); // Ensure unique IDs

                const _authors = [...new Set(articles.map(article => article.lead_author))];
                const _sites = [...new Set(articles.map(article => article.lead_site))];
                const _tags = [...new Set(articles.flatMap(article => article.tags || []))];
                const _titles = articles.map(article => ({ value: article._id, label: article.title })); // Map titles
                //const _avatars = [...new Set(data.map(article => article.avatar))];

                setAuthors(_authors);
                //setAvatars(_avatars);
                setTags(_tags);
                setSites(_sites);
                setTitles(_titles); // Set article titles
            })
            .catch((error) => console.error("Error fetching articles:", error));
    }, []);

    const OnSelectedTagsChange = (value) => {
        console.log('Selected tags:', value);
        setSelectedTags(value);
    };

    const onSelectArticle = (value) => {
        console.log('Selected article ID:', value);

        const article = articles.find(article => article._id === value);
        if (article) {
            setCurrentArticle(article);

            form.setFieldsValue({
                title: article.title,
                subtitle: article.subtitle,
                lead_author: article.lead_author,
                additional_authors: article.additional_authors,
                lead_site: article.lead_site,
                additional_sites: article.additional_sites,
                pub_date: dayjs(article.pub_date),
                url: article.url,
                cover_image: article.cover_image,
                abstract: article.abstract,
                body_html: article.body_html,
                tags: article.tags,
            });
            setAbstractCharCount(article.abstract ? article.abstract.length : 0);
            setIsDirty(false); // Reset dirty flag when loading an article
        } else {
            console.error('Article not found:', value);
        }
    };

    const onNewArticle = () => {
        setCurrentArticle(null); // Reset current article
        form.resetFields(); // Reset the form fields
        setAbstractCharCount(0); // Reset the Char count
        setIsDirty(false); // Reset dirty flag
    };

    const onAbstractChange = (e) => {
        const charCount = e.target.value.length;
        setAbstractCharCount(charCount);
    };

    //quillRef.on('text-change', (delta, oldDelta, source) => {
    //    if (source == 'api') {
    //        console.log('An API call triggered this change.');
    //    } else if (source == 'user') {
    //        console.log('A user action triggered this change.');
    //    }
    //    });

    const OnBodyTextChange = (delta, oldDelta, source, editor) => {
        setIsDirty(true);
        const html = editor.getHTML();
        console.log('Body text changed:', html);

        // Update current article body_html
        //if (currentArticle) {
        //    const updatedArticle = {
        //        ...currentArticle,
        //        body_html: html,
        //    };
        //    setCurrentArticle(updatedArticle); // Update current article state
        //}
    }

    const onFormValuesChange = () => {
        // update article state when form values change
        const values = form.getFieldsValue();
        console.log('Form values changed:', values);
        const updatedArticle = {
            ...currentArticle,
            title: values.title,
            subtitle: values.subtitle,
            lead_author: values.lead_author,
            additional_authors: values.additional_authors,
            lead_site: values.lead_site,
            additional_sites: values.additional_sites,
            pub_date: values.pub_date.format('MM/DD/YYYY'),
            url: values.url,
            cover_image: values.cover_image,
            abstract: values.abstract,
            body_html: '', // Assuming body_html is handled separately
            tags: values.tags,
        };
        setCurrentArticle(updatedArticle); // Update current article state
        setIsDirty(true); // Set dirty flag whenever a form field changes
    };

    const SubmitArticle = (values) => {
        //const values = form.getFieldsValue();
        console.log('Form values changed:', values);
        //const updatedArticle = {
        //    ...currentArticle,
        //    title: values.title,
        //    subtitle: values.subtitle,
        //    lead_author: values.lead_author,
        //    additional_authors: values.additional_authors,
        //    lead_site: values.lead_site,
        //    additional_sites: values.additional_sites,
        //    pub_date: values.pub_date.format('MM/DD/YYYY'),
        //    url: values.url,
        //    cover_image: values.cover_image,
        //    abstract: values.abstract,
        //    body_html: values.body_html,
        //    tags: values.tags,
        //};

        console.log('Form Submitted:', values);
        setIsDirty(false); // Reset dirty flag on form submission
    }

    return (
        <div style={{ backgroundColor: 'rgb(245,245,245)', padding: '0.9em' }}>
            {/* Article Titles Select */}
            <h4 style={{ color: 'black' }}>Select an Article to edit, or start a new one</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Select
                    placeholder="Select an article to edit"
                    style={{ width: '40em' }}
                    options={titles}
                    onSelect={onSelectArticle}
                    aria-label="Select Article"
                />
                <Button onClick={onNewArticle}>New</Button>
            </div>
            <hr />
            {isDirty && (
                <div style={{ color: 'blue', marginTop: '10px',  padding:'1em', backgroundColor: 'lightgray' }}>
                    You have unsaved changes.
                </div>
            )}

            <Row>
                <Col sm={24} md={12}>
                    <Form
                        {...formItemLayout}
                        form={form}
                        layout="vertical"
                        labelCol={{ span: 24 }}
                        wrapperCol={{ span: 24 }}
                        style={{marginLeft:'2em', marginRight:'2em'} }
                        initialValues={{ variant: 'filled' }}
                        onValuesChange={onFormValuesChange} // Track changes to form fields
                        onFinish={SubmitArticle}
                    >
                        <Form.Item
                            label="Title"
                            name="title"
                            rules={[{ required: true, message: 'Please input the title!' }]}
                        >
                            <Input placeholder="Type article title here..."
                                aria-label="Article Title" />
                        </Form.Item>

                        <Form.Item
                            label="Subtitle"
                            name="subtitle"
                            rules={[{ required: true, message: 'Please input the subtitle!' }]}
                        >
                            <Input placeholder="Type article subtitle here..."
                                aria-label="Article Subtitle" />
                        </Form.Item>

                        <Form.Item
                            label="Lead Author"
                            name="lead_author"
                            rules={[{ required: true, message: 'Please select a lead author!' }]}
                        >
                            <AutoComplete
                                options={authors.map(author => ({ value: author }))}
                                placeholder="Type name of lead author..."
                                filterOption={(inputValue, option) =>
                                    option.value.toUpperCase().includes(inputValue.toUpperCase())
                                }
                                aria-label="Lead Author"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Additional Authors"
                            name="additional_authors"
                            rules={[{ required: false }]}
                        >
                            <Input placeholder="Provide names of any additional authors here..." aria-label="Additional Authors" />
                        </Form.Item>

                        <Form.Item
                            label="Lead Site"
                            name="lead_site"
                            rules={[{ required: true, message: 'Please select a site!' }]}
                        >
                            <AutoComplete
                                options={sites.map(site => ({ value: site }))}
                                placeholder="Type the name of lead site..."
                                filterOption={(inputValue, option) =>
                                    option.value.toUpperCase().includes(inputValue.toUpperCase())
                                }
                                aria-label="Primary Site"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Additional Sites"
                            name="additional_sites"
                            rules={[{ required: false }]}
                        >
                            <Input placeholder="Provide names of any additional sites here..." aria-label="Additional Authors" />
                        </Form.Item>

                        <Form.Item
                            label="Publication Date"
                            name="pub_date"
                            defaultValue={currentArticle == null ? dayjs(): currentArticle.pub_date}
                            rules={[{ required: true, message: 'Please select a publication date!' }]}
                        >
                            <DatePicker aria-label="Publication Date"
                                format={'MM/DD/YYYY'} />
                        </Form.Item>

                        <Form.Item
                            label="Source Article URL"
                            name="url"
                            rules={[
                                { required: false },
                                { type: 'url', message: 'Please enter a valid URL!' },
                            ]}
                        >
                            <Input placeholder="Type URL to article here..." aria-label="Article URL" />
                        </Form.Item>

                        <Form.Item
                            label="Cover Image URL"
                            name="cover_image"
                            rules={[
                                { required: false },
                                { type: 'url', message: 'Please enter a valid URL!' },
                            ]}
                        >
                            <Input placeholder="Type URL to article cover image here..." aria-label="Cover Image URL" />
                        </Form.Item>

                        <Form.Item
                            label={"Abstract (" + abstractCharCount + "/400 characters)"}
                            labelWrap
                            name="abstract"
                            hasFeedback
                            validateFirst
                            rules={[
                                { max: 400, message: 'Abstract can not exceed 400 characters' },
                                { required: true, message: 'Please input the abstract!' },
                            ]}
                        >
                            <Input.TextArea
                                rows={5}
                                maxLength={400}
                                placeholder="Type article abstract here..."
                                aria-label="Abstract"
                                onChange={onAbstractChange}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Article Text (text/html)"
                            name="body_html"
                            rules={[{ required: true, message: 'Please input the article body!' }]}
                        >
                            {/* Quill editor can be used here, but for simplicity using TextArea                           <Input.TextArea
                                id="editor"
                                onChange={() => setIsDirty(true)} // Set dirty flag when body changes
                                rows={12}
                                placeholder="Type article body (text or HTML) here..."
                                aria-label="Article Body"
                            /> */}
                            {/*}
                            <QuillEditor
                                ref={quillRef}
                                readOnly={false}
                                onSelectionChange={null}
                                onTextChange={OnBodyTextChange} // Set dirty flag when body changes
                                style={{ height: '24em', backgroundColor: 'white' }}
                            /> */}
                            
                          <ReactQuill theme="snow" value={bodyHtml} onChange={OnBodyTextChange} />;

                        </Form.Item>

                        <Form.Item
                            label="Tags"
                            name="tags"
                            rules={[{ required: true, message: 'Please select at least one tag!' }]}
                        >
                            <Select
                                mode="multiple"
                                placeholder="Select tag(s) for this article"
                                onChange={OnSelectedTagsChange}
                                style={{ width: '100%' }}
                                options={tags.map(tag => ({ value: tag, label: tag }))}
                                aria-label="Tags"
                            />
                        </Form.Item>

                        <Form.Item wrapperCol={wrapperCol}>
                            {isDirty && (
                                <div style={{ width: '100%', color: 'blue', margin: '10px', padding: '1em', backgroundColor: 'lightgray' }}>
                                    You have unsaved changes.
                                    <Button type="primary" htmlType="submit" style={{ float: 'right' }}>
                                        Save Changes
                                    </Button>

                                </div>
                            )}
                        </Form.Item>
                    </Form>
                </Col>
                <Col sm={24} md={12}>
                   <h5 style={{ color: 'black' }}>Article Preview</h5>
                    <div style={{ padding: '1em', color:'black', backgroundColor: '#fff', borderRadius: '8px' }}>
                        {currentArticle && (
                            <AWFeatureDisplay article={currentArticle} />
                        )}
                    </div>
               </Col>
            </Row>
        </div>
    );
};

export default SubmitArticle;
