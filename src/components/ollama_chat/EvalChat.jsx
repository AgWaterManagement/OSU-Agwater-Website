import { useState, useEffect, useRef } from "react";
import { Input, Button, Spin, Select, message, Rate, Row, Col } from "antd";

import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm';

import './OllamaChat.css';


const { TextArea } = Input;

const CHAT_API_URL = "https://agwater.org:5556/LLMChat";
const MODELS_API_URL = "https://agwater.org:5556/LLMModels";
const RATING_API_URL = "https://agwater.org:5556/LLMRating";


const EvalChat = () => {
    //const input = useRef("");
    const [prompt, setPrompt] = useState(""); // to keep track of the current input
    const promptCtrl = useRef(null);
    const currentQuestion = useRef(""); // to keep track of the current input
    const currentAnswer = useRef("")
    const currentIndex = useRef(0); // to keep track of the current index in the list
    //const [currentIndex, setCurrentIndex] = useState(0); // to keep track of the current index in the list
    const [currentMarkdown, setCurrentMarkdown] = useState(""); // to keep track of the current markdown content
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const availableModels = useRef('llama3.2');


    const order = useRef([]); // Order of questions to display
    const answers = useRef([]); // Answers for each question
    const contexts = useRef([]); // Context for each question, used for rating
    //const list = [...Array(2).keys()];
    //const inputRef = useRef([]);

    useEffect(() => {
        fetchModels();
    }, []);

    const fetchModels = async () => {
        try {
            const response = await fetch(MODELS_API_URL);
            const result = await response.json();
            availableModels.current = result.models;

            order.current = [];
            answers.current = [];
            contexts.current = [];

            result.models.forEach((model, index) => {
                order.current.push(2 * index);
                order.current.push(2 * index + 1);
                answers.current.push("");
                answers.current.push("");
                contexts.current.push(`RAG+${model}`);
                contexts.current.push(model);
            });

            // randomize?

        } catch (error) {
            message.error("Failed to fetch models. Please try again later.");
            console.error('Error fetching models', error);
        }
    };

    async function processUserQuery(_prompt) {
        for (let i = 0; i < order.current.length; i++) {
            currentAnswer.current = ""; // Reset the current answer for each question
            currentIndex.current = order.current[i]; // Update the current index
            try {
                console.log("input: ", _prompt); // debug
                const encodedInput = encodeURIComponent(_prompt);

                let model = contexts.current[i][0] === 'R' ? contexts.current[i].slice(4) : contexts.current[i]; // Extract model name from context if it starts with 'RAG+'
                const url = `${CHAT_API_URL}?query=${encodedInput}&model=${model}&stream=1`;
                console.log(url);
                const response = await fetch(url);

                // Check if the response is OK
                if (!response.ok) {
                    console.log("response: ", response);
                    setError("Error fetching response from the server");
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder("utf-8");

                setLoading(false);
                let chunks = 0;
                let chunk = "";
                let success = true;
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        console.log('done streaming');
                        break;
                    }

                    if (success) {
                        chunk = decoder.decode(value, { stream: true });
                    } else {
                        // If the previous chunk failed to parse, we skip it and continue reading
                        chunk += decoder.decode(value, { stream: true });
                    }

                    //console.log(`chunk ${chunks}: ${chunk}`); // debug
                    let json = {};
                    try {
                        // Attempt to parse the JSON chunk
                        json = JSON.parse(chunk);
                        success = true;
                        //console.log(`json: ${JSON.stringify(json)}`); // debug
                    } catch (error) {
                        // If parsing fails, log the error and continue
                        success = false;
                        console.error(`Error parsing JSON from chunk ${chunks}:`, error);
                        console.error(`Chunk content: ${chunk}`);
                        continue; // Skip to the next chunk
                    }
                    //accumulatedResponse += chunk;
                    chunks++;

                    // Update the message UI progressively with each chunk
                    if (json.done === false) {
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
                                    contentStr += `${index + 1}. <a href='https://agwater.org:5556/LLMSource?filename=${ref}' target='_blank'>${titles[index]}</a>\n`; // Use the title if available
                                } else {
                                    contentStr += `${index + 1}. ${ref}\n`;
                                }
                            });
                        }
                        currentAnswer.current += contentStr;
                    }
                    answers.current[i] = currentAnswer.current; // Update the answer for the current index
                    setCurrentMarkdown(currentAnswer.current); // Update the markdown content

                } // end of while loop

            } catch (error) {
                setError("Unable to fetch response. Please try again later.");
                console.error("Error fetching response:", error);
            }

            //const _currentAnswer = currentAnswer.current; // Get the final answer
            //setCurrentMarkdown(currentAnswer.current)
            //currentQuestion.current = ""; // Clear the input field after processing
            //currentAnswer.current = ""; // Clear the response field after processing
            //currentIndex.current += 1; // Increment the index for the next question

            // add a question mark to end os _prompt if not present
            _prompt = _prompt.endsWith('?') ? _prompt : `${_prompt}?`;
            //setHistory([...history, { question: _prompt, answer: _currentAnswer }]); // Add the question/response pair to history
        }
    }

    const sendQuery = async () => {
        setError(null); // Clear previous errors

        if (prompt.slice().trim() === "") return;

        try {
            setLoading(true);
            let _prompt = prompt.slice().trim()
            //setPrompt(""); // Clear the input ref

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

    const resultCard = (index) => {
        let _answer = answers.current[index];
        if (index === currentIndex)
            _answer = currentAnswer.current; // Use the current markdown content for the active index

        return (
            <div key={index} className="message-container">
                <div className="ai-message" style={{marginLeft: '1em'}}>
                    <Markdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
                        {_answer || "No response available yet"}
                    </Markdown>
                    <hr />
                    <div style={{ padding: '0.5em' }}>Rate this answer: <Rate onChange={(value) => { rateAnswer(_answer, value, contexts.current[index]); }} /></div>
                    <hr/>
                    <div>Add any comment you&apos;d like about the quality of this answer in the box below:</div>
                    <TextArea key={index} />
                    <br/>
                    <Button type="primary" style={{ margin: '0.5em' }} onClick={() => rateAnswer(_answer, 0, contexts.current[index], promptCtrl.current.value)}>
                        Submit Rating/Comment
                    </Button>
                    <br/>
                </div>
            </div>
        )
    }

    const rateAnswer = async (answer, rating, context, comment) => {
        // Here you can handle the rating logic, e.g., send it to a server or update the UI
        console.log(`Rating for question "${currentQuestion.current}": ${rating}`);

        //const url = `${RATING_API_URL}?question=${encodeURIComponent(qaPair.question)}&answer=${encodeURIComponent(qaPair.answer)}&rating=${rating}&context=RAG+${encodeURIComponent(selectedModel)}`
        try {
            const response = await fetch(RATING_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question: currentQuestion.current,
                    answer: answer,
                    rating: rating,
                    context: context,
                    comment: comment
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


    // Style for the content area in the loading spinner
    //const spinnerContentStyle = {
    //  padding: 50,
    //  color: '#fff',
    //  /*background: 'rgba(0, 0, 0, 0.05)',*/
    //  borderRadius: 'white',
    //  width: '12em'
    //};

    //const spinnerContent = <div style={spinnerContentStyle} />;

    return (
        <div className="container">
            <header className="header" style={{ color: 'white' }}>
                <h3 className="header-title">Ag Water Chat Evaluation Form</h3>
                <p style={{ color: 'white', fontSize: '0.9em' }}>
                    This form is designed to evaluate the performance of the Ag Water Chat AI system. 
                </p>
                <h4>Instructions:</h4>
                <ol style={{ color: 'white', fontSize: '0.9em' }}>
                    <li style={{ color: 'white', fontSize: '0.9em' }}>Type your question or prompt in the input box below.</li>
                    <li style={{ color: 'white', fontSize: '0.9em' }}>Click the "Submit" button to send your query.</li>
                    <li style={{ color: 'white', fontSize: '0.9em' }}>Wait for the AI to respond. The response will be displayed below, with one 
                        response from each models we are evaluating.</li>
                    <li style={{ color: 'white', fontSize: '0.9em' }}>Rate the quality of each of the AI's response using the star rating system.</li>
                    <li style={{ color: 'white', fontSize: '0.9em' }}>Optionally, provide additional comments about the response.</li>
                    <li style={{ color: 'white', fontSize: '0.9em' }}>Click the "Submit Rating/Comment" button to save your feedback.</li>
                </ol>

                <p style={{ color: 'white', fontSize: '0.9em' }}>
                    Note that you can only provide one rating per generated answer - please don't submit ratings/comments for the same answer multiple times.
                </p>
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
                {loading && (
                    <div style={{ textAlign: "center", marginBottom: 16, backgroundColor: 'white' }}>
                        <Spin tip="Running Query..." size="large" fullscreen />  {/* >{spinnerContent}</Spin> */}
                    </div>
                )}

                <Row gutter={16}>
                    {order.current.map((item, index) => (
                        <Col key={index} xs={24} sm={12} md={12} lg={12} xl={8}>
                            {resultCard(index, answers[item], contexts[item])}
                        </Col>
                    ))}
                </Row>


                { /*
          currentAnswer.current && currentAnswer.current.length > 0 && (
            <div className="message-container">
              <div className="user-message">
                {currentQuestion.current}
              </div>
              <br />
              <div className="ai-message">
                <Markdown rehypePlugins={[rehypeRaw]}>
                  {currentMarkdown || "Waiting for response..."}
                </Markdown>
              </div>
            </div>
          ) */
                }
                { /*
          history.length > 0 && [...history].reverse().map((qaPair, index) => (
            <div key={index} className="message-container">
              <div className="user-message">
                {qaPair.question}
              </div>
              <br />
              <div className="ai-message">
                <Markdown rehypePlugins={[rehypeRaw]}>
                  {qaPair.answer || "No response available"}
                </Markdown>
                <hr />
                <div style={{ padding: '0.5em' }}>Rate this answer: <Rate onChange={(value) => { rateAnswer(qaPair, value); }} /></div>
              </div>
            </div>
          ))  */}
            </main>
            {error && <div style={{ color: 'red' }}>Error: {error}</div>}
            <br />
        </div>
    );
};

export default EvalChat;