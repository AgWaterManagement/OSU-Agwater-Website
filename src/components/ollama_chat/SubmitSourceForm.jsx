import { useState, useEffect } from "react";
import { Select, Button, Input, Upload, message, Spin } from "antd";
import { UploadOutlined } from "@ant-design/icons";

const { Option } = Select;

const SubmitSourceForm = () => {
  const [title, setTitle] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [tags, setTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await fetch('https://agwater.org:5556/Tags');
      const result = await response.json();
      setAvailableTags(result.tags);
    } catch (error) {
      message.error("Failed to fetch tags. Please try again later.");
      console.error('Error fetching tabs', error);
    }
  };

  // Style for the content area in the loading spinner
  const contentStyle = {
    padding: 50,
    background: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
  };

  const spinnerContent = <div style={contentStyle} />;


  const handleFileChange = (info) => {
    if (info.file.status === "removed") {
      setPdfFile(null);
    } else {
      setPdfFile(info.file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title) {
      message.error("Please enter a title.");
      return;
    }
    if (!pdfFile) {
      message.error("Please select a PDF file.");
      return;
    }
    if (tags.length === 0) {
      message.error("Please select at least one tag.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("pdf", pdfFile);
    formData.append("tags", JSON.stringify(tags));

    setLoading(true);

    try {
      const response = await fetch("https://agwater.org:5556/LLMSubmitSource", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        message.success("Source article uploaded successfully!");
        // Reset form
        setTitle("");
        setPdfFile(null);
        setTags([]);
        setLoading(false);
      } else {
        setLoading(false);
        const errorData = await response.json();
        let errorMessage = errorData.message || "An error occurred during upload.";

        if ( errorMessage === 'UNIQUE constraint failed: LLM_Sources.locator')
          errorMessage = "An article with this filename already exists in the corpus. Please choose a different file.";
        else if (errorData.message === 'UNIQUE constraint failed: LLM_Sources.title') 
          errorMessage = "An article with this title already exists in the corpus. Please choose a different title.";

        console.error(errorMessage);
        message.error( errorMessage);
      }
    } catch (error) {
      console.error("Error uploading:", error);
      message.error("An error occurred trying to upload information.");
      setLoading(false);
    }

    setLoading(false);
  };

  return (
     <>
     <br/>
     <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        minHeight: "100vh",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          padding: 24,
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          width: "80%",
          maxWidth: 800,
          color: "black",
          backgroundColor: "#eee",
        }}
      >
        <h3 style={{ textAlign: "center" }}>Upload Source Article</h3>
 
        <p>To add an article to the AgWaterLLM corpus, use the form below.  You will need to provide the following:
         <ul>
          <li>The title of the article</li>
         <li>A PDF version of the article for uploading</li>
          <li>Tags to help categorize the article</li>
         </ul>
         <p>Once submitted, the article will be processed and added to the corpus. 
           The article will be available for use in the AgWaterLLM chat interface.</p>
         </p>
        <hr/>

 
        { loading && (
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <Spin tip="Saving source information..." size="large">{spinnerContent}</Spin>
          </div>
        )}
      
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="title">Title of source document (required)</label><br></br>
          <Input
            id="title"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="pdfFile">Upload a PDF of the source document (required)</label><br></br>
          <Upload
            id="pdfFile"
            accept="application/pdf"
            beforeUpload={() => false}
            maxCount={1}
            onChange={handleFileChange}
            onRemove={() => setPdfFile(null)}
          >
            <Button icon={<UploadOutlined />}>Select PDF File</Button>
          </Upload>
        </div>  
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="tags">Select tags for the source document (at least one required)</label><br></br>
          <Select
            id="tags"
            mode="multiple"
            allowClear
            placeholder="Select tags"
            value={tags}
            onChange={(value) => setTags(value)}
            style={{ width: "100%" }}
          >
            {availableTags.map((tag) => (
              <Option key={tag} value={tag}>
                {tag}
              </Option>
            ))}
          </Select>
        </div>
        <Button type="primary" htmlType="submit" >
          Submit
        </Button>
      </form>
    </div>
    </>
  );
}


export default SubmitSourceForm