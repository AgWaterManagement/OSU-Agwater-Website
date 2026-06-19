import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { Input, Button, Select, message, Rate } from "antd";

import { secrets } from '../../secrets';

import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'


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
                    "X-API-Key": secrets.agwater_api_key,
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
        // --- Fetch phase ---
        // Isolated in its own try/catch so network errors never swallow stream or React errors.
        let response;
        try {
            // console.log("input: ", _prompt);
            response = await fetch(CHAT_API_URL, {
                method: 'POST',
                headers: {
                    'X-API-Key': secrets.agwater_api_key,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: _prompt,
                    additional_data: {},
                    model: selectedModel,
                    stream: true,
                    use_RAG: true,
                    chat_history: history
                })
            });
            if (!response.ok) {
                console.error('HTTP error response:', response);
                setError(`Error fetching response from the server (status ${response.status})`);
                setIsStreaming(false);
                return;
            }
        } catch (fetchError) {
            console.error('Network error:', fetchError);
            setError('Unable to reach the server. Please try again later.');
            setIsStreaming(false);
            return;
        }

        // --- Stream reading phase ---
        // Manually decode UTF-8 bytes and parse newline-delimited JSON so we control
        // exactly when each chunk is flushed to the DOM.
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Drain every complete JSON line from the buffer.
                let newlineIndex;
                while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                    const line = buffer.slice(0, newlineIndex).trim();
                    buffer = buffer.slice(newlineIndex + 1);
                    if (!line) continue;

                    let json;
                    try {
                        json = JSON.parse(line);
                    } catch (parseError) {
                        console.warn('Failed to parse JSON line:', line, parseError);
                        continue;
                    }

                    // console.log('LLM Streamed Data Received', json);

                    if (json.content_type && json.content_type[0] === 'l') {
                        // LLM response chunk — append and flush to DOM immediately.
                        currentAnswer.current += json['llm_response'];
                        flushSync(() => setCurrentMarkdown(currentAnswer.current));
                    } else if (json.content_type) {
                        // Final message — collect referenced document links.
                        const refs = json['referenced_documents'] || [];
                        const titles = json['referenced_titles'] || [];
                        if (refs.length > 0) {
                            let contentStr = '\n\n#### References:\n';
                            refs.forEach((ref, index) => {
                                const title = titles.length > 0 ? titles[index] : null;
                                contentStr += title
                                    ? `${index + 1}. [${title}](<https://agwater.org:5556/llm/source?filename=${ref}>)\n`
                                    : `${index + 1}. ${ref}\n`;
                            });
                            references.current = contentStr;
                        }
                    }
                }
            }
        } catch (streamError) {
            console.error('Error reading response stream:', streamError);
            setError('Stream interrupted. The partial response is shown above.');
        } finally {
            reader.releaseLock();
        }

        // Append references to the final answer, then move everything into history.
        currentAnswer.current += references.current;
        const _currentAnswer = currentAnswer.current;

        setIsStreaming(false);
        currentQuestion.current = '';
        currentAnswer.current = '';
        references.current = '';

        // Append a question mark if the prompt looks like a question.
        if (!_prompt.endsWith('?') && (_prompt[0] === 'w' || _prompt[0] === 'W' || _prompt[0] === 'h' || _prompt[0] === 'H'))
            _prompt = `${_prompt}?`;
        setHistory([...history, { question: _prompt, answer: _currentAnswer }]);
    }

    const sendQuery = async () => {
        setError(null);

        const _prompt = prompt.trim();
        if (!_prompt) return;

        // Show the user's question and the "Waiting for response..." placeholder
        // immediately — before the network round-trip begins.
        currentQuestion.current = _prompt.endsWith('?') ? _prompt : `${_prompt}?`;
        flushSync(() => {
            setPrompt('');
            setIsStreaming(true);
            setCurrentMarkdown('');
        });

        try {
            await processUserQuery(_prompt);
        } catch (err) {
            setError(err.message);
            console.error('Error sending message:', err);
        }

        promptCtrl.current?.focus();
    }



    const rateAnswer = async (qaPair, rating) => {
        // Here you can handle the rating logic, e.g., send it to a server or update the UI
        console.log(`Rating for question "${qaPair.question}": ${rating}`);

        //const url = `${RATING_API_URL}?question=${encodeURIComponent(qaPair.question)}&answer=${encodeURIComponent(qaPair.answer)}&rating=${rating}&context=RAG+${encodeURIComponent(selectedModel)}`
        try {
            const response = await fetch(RATING_API_URL, {
                method: 'POST',
                headers: {
                    'X-API-Key': secrets.agwater_api_key,
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
        <div>
            <main>
                <br />

                <div className="chat-prompt">
                    <div style={{display: 'flex', alignItems: 'center', width: '100%'}}>
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
