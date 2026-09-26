import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { Input, Button, Select, message, Rate } from "antd";

import { secrets } from '../../secrets';

import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

import { ChartRenderer } from './ChartRenderer';
import { DataPreviewTable } from './DataPreviewTable';

import './AgWaterChat_v2.css';


const { TextArea } = Input;
const { Option } = Select;

const CHAT_API_URL = "https://agwater.org:5556/llm/chat";
const MODELS_API_URL = "https://agwater.org:5556/llm/models";
const RATING_API_URL = "https://agwater.org:5556/llm/rating";

const AgWaterChat = (showPrompt = true, showHistory = true, showModels = true, chatPrompt = "") => {
    //const input = useRef("");
    const [prompt, setPrompt] = useState(chatPrompt); // to keep track of the current input
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

    // SmartTap integration: a data/advisory question may come back with a chart
    // (smartTap_info) instead of/alongside plain text, or with a confirmation
    // prompt (smarttap_confirmation) that needs a follow-up "Confirm" click before
    // SmartTap actually runs the query. These track that for the answer currently
    // streaming in; both get folded into the history entry once the turn finishes.
    const chartRef = useRef(null);
    const pendingConfirmationRef = useRef(null);
    const [currentChart, setCurrentChart] = useState(null);

    useEffect(() => {
        if (showModels) {
            fetchModels();
        }
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

    // extraFields lets confirmPendingQuery() send pending_spec/confirm/original_query
    // instead of a fresh query, without duplicating the streaming-read logic below.
    // historyQuestionLabel overrides what's shown as the question bubble once the
    // turn is added to history (used to show "Confirmed" instead of repeating the
    // original question text); when null, the label is computed from _prompt exactly
    // as before.
    async function processUserQuery(_prompt, extraFields = {}, historyQuestionLabel = null) {
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
                    chat_history: history,
                    ...extraFields,
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

                    if (json.content_type === 'llm_response') {
                        // LLM response chunk — append and flush to DOM immediately.
                        currentAnswer.current += json['llm_response'];
                        flushSync(() => setCurrentMarkdown(currentAnswer.current));
                    } else if (json.content_type === 'smarttap_info') {
                        // SmartTap's chart + data table for a data/advisory question, sent
                        // after the llm_response chunks. See ChartRenderer/DataPreviewTable
                        // for the chart_model/data_preview shapes.
                        chartRef.current = {
                            chartModel: json.chart_model || null,
                            chartImageUrl: json.chart_image_url || null,
                            dataPreview: json.data_preview || null,
                        };
                        flushSync(() => setCurrentChart(chartRef.current));
                    } else if (json.content_type === 'smarttap_clarification' || json.content_type === 'smarttap_confirmation') {
                        // SmartTap couldn't run the query yet — show its prompt as the
                        // answer text. For a confirmation, also remember pending_spec so
                        // a "Confirm" click can send it back and actually run the query.
                        const promptText = json.clarification_prompt || json.confirmation_prompt || '';
                        currentAnswer.current += promptText;
                        flushSync(() => setCurrentMarkdown(currentAnswer.current));
                        if (json.content_type === 'smarttap_confirmation') {
                            pendingConfirmationRef.current = {
                                spec: json.spec,
                                originalQuery: json.original_query || _prompt,
                            };
                        }
                    } else if (json.content_type === 'smarttap_error') {
                        // SmartTap ran the query but has no data for it (e.g. OpenET
                        // dataset not available) — show that message as the answer
                        // instead of leaving it blank.
                        currentAnswer.current += json.error || 'SmartTap could not find data for this request.';
                        flushSync(() => setCurrentMarkdown(currentAnswer.current));
                    } else if (json.content_type) {
                        // Final message (document_info) — collect referenced document links.
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
        const _currentChart = chartRef.current;
        const _currentPendingConfirmation = pendingConfirmationRef.current;

        setIsStreaming(false);
        currentQuestion.current = '';
        currentAnswer.current = '';
        references.current = '';
        chartRef.current = null;
        pendingConfirmationRef.current = null;
        setCurrentChart(null);

        let questionLabel = historyQuestionLabel;
        if (questionLabel === null) {
            questionLabel = _prompt;
            // Append a question mark if the prompt looks like a question.
            if (!questionLabel.endsWith('?') && (questionLabel[0] === 'w' || questionLabel[0] === 'W' || questionLabel[0] === 'h' || questionLabel[0] === 'H'))
                questionLabel = `${questionLabel}?`;
        }
        setHistory([...history, {
            question: questionLabel,
            answer: _currentAnswer,
            chartModel: _currentChart?.chartModel || null,
            chartImageUrl: _currentChart?.chartImageUrl || null,
            dataPreview: _currentChart?.dataPreview || null,
            pendingConfirmation: _currentPendingConfirmation,
        }]);
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
            setCurrentChart(null);
        });

        try {
            await processUserQuery(_prompt);
        } catch (err) {
            setError(err.message);
            console.error('Error sending message:', err);
        }

        if (showPrompt) {
            promptCtrl.current?.focus();
        }
    }

    // Sends the user's confirmation for a pending SmartTap query back to
    // /llm/chat. SmartTap only resolves the query into pendingConf.spec earlier —
    // it hasn't fetched any data yet, so this is the request that actually runs it.
    const confirmPendingQuery = async (pendingConf) => {
        if (!pendingConf) return;
        setError(null);

        currentQuestion.current = "Confirmed ✅";
        flushSync(() => {
            setIsStreaming(true);
            setCurrentMarkdown('');
            setCurrentChart(null);
        });

        try {
            await processUserQuery(
                pendingConf.originalQuery,
                { pending_spec: pendingConf.spec, confirm: true, original_query: pendingConf.originalQuery },
                "Confirmed ✅",
            );
        } catch (err) {
            setError(err.message);
            console.error('Error confirming query:', err);
        }

        if (showPrompt) {
            promptCtrl.current?.focus();
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

    if ( chatPrompt && chatPrompt.length > 0 ) {
        setPrompt(chatPrompt);
        sendQuery();
        }

    return (
        <div>
            <main>
                <br />
                {
                    showPrompt && (
                        <div className="chat-prompt">
                            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
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
                            <br />
                        </div>
                    )
                }
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
                                {currentChart && (currentChart.chartModel || currentChart.chartImageUrl) && (
                                    <ChartRenderer chartModel={currentChart.chartModel} fallbackImageUrl={currentChart.chartImageUrl} />
                                )}
                                {currentChart && currentChart.dataPreview && (
                                    <DataPreviewTable dataPreview={currentChart.dataPreview} />
                                )}
                            </div>
                        </div>
                    )
                }
                {
                    showHistory && history.length > 0 && [...history].reverse().map((qaPair, index) => (
                        <div key={index} className="message-container">
                            <div className="user-message">
                                {qaPair.question}
                            </div>
                            <br />
                            <div className="ai-message">
                                <Markdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
                                    {qaPair.answer || "No response available"}
                                </Markdown>
                                {(qaPair.chartModel || qaPair.chartImageUrl) && (
                                    <ChartRenderer chartModel={qaPair.chartModel} fallbackImageUrl={qaPair.chartImageUrl} />
                                )}
                                {qaPair.dataPreview && (
                                    <DataPreviewTable dataPreview={qaPair.dataPreview} />
                                )}
                                {qaPair.pendingConfirmation && (
                                    <div style={{ marginTop: '0.75em' }}>
                                        <Button type="primary" onClick={() => confirmPendingQuery(qaPair.pendingConfirmation)} disabled={isStreaming}>
                                            Confirm
                                        </Button>
                                    </div>
                                )}

                                <hr />
                                <div style={{ padding: '0.5em' }}>Rate this answer: <Rate onChange={(value) => { rateAnswer(qaPair, value); }} /></div>
                            </div>
                        </div>
                    ))
                }
            </main>

            {error && <div style={{ color: 'red' }}>Error: {error}</div>}
            <br />

            {showModels && (
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
            )
            }
        </div>
    );
};

export default AgWaterChat;
