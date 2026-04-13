import { useState, useEffect, useRef } from "react";
import { Input, Button, Select, message, Rate } from "antd";

import { Loading } from '../../components/loading/Loading';

import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

import readNDJSONStream from 'ndjson-readablestream';

import './OllamaChat.css';


const { TextArea } = Input;
const { Option } = Select;

const CHAT_API_URL = "https://agwater.org:5556/llm/chat";
const MODELS_API_URL = "https://agwater.org:5556/llm/models";
const RATING_API_URL = "https://agwater.org:5556/llm/rating";

const OllamaChat = () => {
    //const input = useRef("");
    const [prompt, setPrompt] = useState(""); // to keep track of the current input
    const promptCtrl = useRef(null);
    const currentQuestion = useRef(""); // to keep track of the current input
    const currentAnswer = useRef("")
    const [currentMarkdown, setCurrentMarkdown] = useState(""); // to keep track of the current markdown content
    const [loading, setLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [history, setHistory] = useState([]); // a list of question/answer objects - key = input, value = response
    const [error, setError] = useState(null);
    const [selectedModel, setSelectedModel] = useState("gemma3"); // Default model");
    const [availableModels, setAvailableModels] = useState([]);
    const references = useRef(""); // to keep track of the references

    useEffect(() => {
        fetchModels();
    }, []);

    const fetchModels = async () => {
        try {
            const response = await fetch(MODELS_API_URL, {
                headers: {
                    "X-API-Key": "agwater-web-app",
                }
            });
            const result = await response.json();
            setAvailableModels(result.models);
        } catch (error) {
            message.error("Failed to fetch models. Please try again later.");
            console.error('Error fetching models', error);
        }
    };

    async function processUserQuery(_prompt) {
        try {
            console.log("input: ", _prompt); // debug
            let modelParam = '';
            if (selectedModel)
                modelParam = `&model=${selectedModel}`;

            const response = await fetch(CHAT_API_URL, {
                method: 'post',
                headers: {
                    "X-API-Key": "agwater-web-app",
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: _prompt,
                    model: selectedModel,
                    stream: true,
                    use_RAG: true,
                    chat_history: history
                })
            });
            // Check if the response is OK
            if (!response.ok) {
                console.log("response: ", response);
                setError("Error fetching response from the server");
                setLoading(false);
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            setIsStreaming(true);
            setCurrentMarkdown(""); // Clear previous markdown before streaming new response
            setLoading(false); // Remove fullscreen spinner so streamed text is visible
            for await (const json of readNDJSONStream(response.body)) {
                //console.log('Received', json);

                // Update the message UI progressively with each chunk
                if (json.content_type[0] === 'l') {   // 'llm_response' content type
                    currentAnswer.current += json['llm_response']; // Accumulate the response
                } else {
                    // Finalize the response when done
                    const refs = json['referenced_documents'] || [];
                    const titles = json['referenced_titles'] || [];
                    let contentStr = ""
                    if (refs.length > 0) {
                        contentStr += "\n\n#### References:\n";
                        refs.forEach((ref, index) => {
                            if (titles.length > 0 && titles[index] !== null) {
                                //contentStr += `${index + 1}. <a style={{color: '#1a0dab'}} href=\'https://agwater.org:5556/llm/source?filename=${ref}\' target='_blank'>${titles[index]}</a>\n`; // Use the title if available
                                // Use markdown link format to ensure compatibility with Markdown rendering in React
                                // IMPORTANT: the angle brackets <> around the URL help prevent markdown parsing issues with special characters in URLs
                                // specifically spaces or other whitespace characters that may be URL encoded.
                                contentStr += `${index + 1}. [${titles[index]}](<https://agwater.org:5556/llm/source?filename=${ref}>)\n`; // Use the title if available
                            } else {
                                contentStr += `${index + 1}. ${ref}\n`;
                            }
                        });
                    }
                    references.current = contentStr; // Store the references for later use
                }
                setCurrentMarkdown(currentAnswer.current); // Update the markdown content
            }
            currentAnswer.current += references.current;

        } catch (error) {
            setError("Unable to fetch response. Please try again later.");
            console.error("Error fetching response:", error);
        }

        const _currentAnswer = currentAnswer.current; // Get the final answer

        setIsStreaming(false);
        currentQuestion.current = ""; // Clear the input field after processing
        currentAnswer.current = ""; // Clear the response field after processing

        // add a question mark to end os _prompt if not present
        if (_prompt.endsWith('?') == false && (_prompt[0] == 'w' || _prompt[0] == 'W' || _prompt[0] == 'h' || prompt[0] == 'H'))
            _prompt =  `${_prompt}?`;
        setHistory([...history, { question: _prompt, answer: _currentAnswer }]); // Add the question/response pair to history
    }

    const sendQuery = async () => {
        setError(null); // Clear previous errors

        if (prompt.slice().trim() === "") return;

        try {
            setLoading(true);
            let _prompt = prompt.slice().trim()
            setPrompt(""); // Clear the input ref

            currentQuestion.current = _prompt.endsWith('?') ? _prompt : `${_prompt}?`; // Update the current question
            await processUserQuery(_prompt);
        } catch (error) {
            setError(error.message);
            console.error('Error sending message:', error);
        }

        if (promptCtrl.current) {
            promptCtrl.current.focus();
        }
    }



    const rateAnswer = async (qaPair, rating) => {
        // Here you can handle the rating logic, e.g., send it to a server or update the UI
        console.log(`Rating for question "${qaPair.question}": ${rating}`);

        //const url = `${RATING_API_URL}?question=${encodeURIComponent(qaPair.question)}&answer=${encodeURIComponent(qaPair.answer)}&rating=${rating}&context=RAG+${encodeURIComponent(selectedModel)}`
        try {
            const response = await fetch(RATING_API_URL, {
                method: 'POST',
                headers: {
                    'X-API-Key': 'agwater-web-app',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question: qaPair.question,
                    answer: qaPair.answer,
                    rating: rating,
                    context: `RAG+${selectedModel}`,
                    comment: ""
                })
            });
            const result = await response.json();
            if (result.success == true)
                message.success(`Thank you for rating! Your rating was ${rating}`);
            else
                message.error("Failed to submit rating. Please try again later.");

        } catch (error) {
            message.error("Failed to submit rating. Please try again later.");
            console.error('Error recording rating', error);
        }
    }

    return (
        <div className="container">
            <header className="header">
            </header>

            <main className="main">
                <br />

                <div className="chat-prompt">
                    <div className="input-container">
                        <span style={{ color: 'black', marginRight: '0.8em', fontSize: '0.9em' }}>Prompt: </span>
                        <TextArea
                            ref={promptCtrl}
                            className="textarea"
                            placeholder="Type your question or prompt..."
                            value={prompt}
                            onChange={(e) => { setPrompt(e.target.value); }}
                            autoSize={{ minRows: 1, maxRows: 6 }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    sendQuery();
                                }
                            }}
                        />
                        <Button type="primary" onClick={sendQuery}>
                            Submit
                        </Button>
                    </div>
                </div>
                <br />
                {loading && (<Loading tip="Running Query..." />)}
                {
                    isStreaming && (
                        <div className="message-container">
                            <div className="user-message">
                                {currentQuestion.current}
                            </div>
                            <br />
                            <div className="ai-message">
                                <Markdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
                                    {currentMarkdown || "Waiting for response..."}
                                </Markdown>
                            </div>
                        </div>
                    )
                }
                {
                    history.length > 0 && [...history].reverse().map((qaPair, index) => (
                        <div key={index} className="message-container">
                            <div className="user-message">
                                {qaPair.question}
                            </div>
                            <br />
                            <div className="ai-message">
                                <Markdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
                                    {qaPair.answer || "No response available"}
                                </Markdown>
                                <hr />
                                <div style={{ padding: '0.5em' }}>Rate this answer: <Rate onChange={(value) => { rateAnswer(qaPair, value); }} /></div>
                            </div>
                        </div>
                    ))}
            </main>
            {error && <div style={{ color: 'red' }}>Error: {error}</div>}
            <br />
            <div>
                <label htmlFor="model-select">Models: </label>
                <Select
                    id="model-select"
                    allowClear
                    placeholder="(Optional) Select a model ..."
                    value={selectedModel}
                    onChange={(value) => setSelectedModel(value)}
                    style={{ width: 300 }}
                >
                    {availableModels.map((model) => (
                        <Option key={model} value={model}>
                            {model}
                        </Option>
                    ))}
                </Select>
            </div>
        </div>
    );
};

export default OllamaChat;
