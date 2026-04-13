import { useState, useEffect, useRef } from "react";
import { Input, Button, Select, Divider,message, Rate, Row, Col } from "antd";

import { Loading } from "../../components/loading/Loading";

import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm';

import readNDJSONStream from 'ndjson-readablestream';

import './OllamaChat.css';


const { TextArea } = Input;

const CHAT_API_URL = "https://agwater.org:5556/llm/chat";
//const MODELS_API_URL = "https://agwater.org:5556/llm/models";
const RATING_API_URL = "https://agwater.org:5556/llm/rating";


const EvalChat = () => {
    //const input = useRef("");
    const [prompt, setPrompt] = useState(""); // to keep track of the current input
    const promptCtrl = useRef(null);
    const currentQuestion = useRef(""); // to keep track of the current input
    const currentAnswer = useRef("")
    const currentIndex = useRef(0); // to keep track of the current index in the list
    const [currentMarkdown, setCurrentMarkdown] = useState(""); // to keep track of the current markdown content
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const availableModels = ['llama3.2', 'gemma3', 'orca2']; //, 'deepseek-r1', 'gemma3']; REMOVE NOT deepseek-r1
    const references = useRef(""); // to keep track of the references

    const order = useRef([]); // Order of questions to display
    const answers = useRef([]); // Answers for each question
    const contexts = useRef([]); // Context for each question, used for rating
    const comments = useRef([]); // Comments for each question, used for rating
    const ratings = useRef([]); // Ratings for each question, used for rating
    //const evaluated = useRef([]); // To keep track of which answers have been rated
    const [evaluated, setEvaluated] = useState([]); // To keep track of which answers have been rated 
    useEffect(() => {
        setModelInfo();
    }, []);

    // Warn user if not all answers are evaluated before leaving
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (evaluated.some(v => v === false)) {
                const message = "Some answers have not been evaluated. Are you sure you want to leave?";
                e.preventDefault();
                e.returnValue = message; // For most browsers
                return message; // For some older browsers
            }
            // No return needed if all are evaluated
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []);

    const setModelInfo = () => {
        order.current = [];
        answers.current = [];
        contexts.current = [];
        comments.current = [];
        ratings.current = [];
        //evaluated.current = [];
        const _evaluated = []
        availableModels.forEach((model, index) => {
            order.current.push(2 * index);
            order.current.push(2 * index + 1);
            answers.current.push("");
            answers.current.push("");
            answers.current.push("");
            contexts.current.push(`RAG+${model}`);
            contexts.current.push(model);
            comments.current.push("");
            comments.current.push("");
            ratings.current.push(0);
            ratings.current.push(0);
            //evaluated.current.push(false);
            //evaluated.current.push(false);
            _evaluated.push(false);
            _evaluated.push(false);
        });

        setEvaluated(_evaluated); // Initialize evaluated state
        // randomize?
    };

    async function processUserQuery(_prompt) {
        for (let i = 0; i < order.current.length; i++) {
            currentAnswer.current = ""; // Reset the current answer for each question
            currentIndex.current = order.current[i]; // Update the current index
            try {
                console.log("input: ", _prompt); // debug
                const encodedInput = encodeURIComponent(_prompt);

                const model = contexts.current[i][0] === 'R' ? contexts.current[i].slice(4) : contexts.current[i]; // Extract model name from context if it starts with 'RAG+'
                const useRAG = contexts.current[i][0] === 'R' ? true : false; // Determine if RAG is used based on context

                const response = await fetch(CHAT_API_URL, {
                    method: 'post',
                    headers: {
                        "X-API-Key": "agwater-web-app",
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: _prompt,
                        model: model,
                        stream: true,
                        use_RAG: useRAG,
                        chat_history: []
                    })
                });
                // Check if the response is OK
                if (!response.ok) {
                    console.log("response: ", response);
                    setError("Error fetching response from the server");
                    //setLoading(false);
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                for await (const json of readNDJSONStream(response.body)) {
                    //console.log("json: ", json); // debug
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
                                    contentStr += `${index + 1}. <a href='https://agwater.org:5556/llm/source?filename=${ref}&api_key=agwater-web-app' target='_blank'>${titles[index]}</a>\n`; // Use the title if available
                                } else {
                                    contentStr += `${index + 1}. ${ref}\n`;
                                }
                            });
                        }

                        references.current = contentStr; // Store the references for later use
                        //setLoading(false);
                    }
                    setCurrentMarkdown(currentAnswer.current); // Update the markdown content
                }

            } catch (error) {
                setError("Unable to fetch response. Please try again later.");
                console.error("Error fetching response:", error);
            }

            answers.current[currentIndex.current] = currentAnswer.current; // Store the answer in the answers array
            //currentQuestion.current = ""; // Clear the input field after processing
            //currentAnswer.current = ""; // Clear the response field after processing


            // add a question mark to end os _prompt if not present
            _prompt = _prompt.endsWith('?') ? _prompt : `${_prompt}?`;
            //setHistory([...history, { question: _prompt, answer: _currentAnswer }]); // Add the question/response pair to history
        }   // End of for each model loop
        setLoading(false); // Set loading to false after processing all models
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
        if (index === currentIndex.current)
            _answer = currentAnswer.current; // Use the current markdown content for the active index

        const btnID = 'submit_' + index; // Unique ID for the submit button
        const commentID = 'comment_' + index; // Unique ID for the comment textarea
        const ratingID = 'rating_' + index; // Unique ID for the rating

        const isSubmitted = evaluated[index] ? 'Response has been submitted! ' : ''; // Check if the answer has been submitted
        const btnText = evaluated[index] ? "Re-Submit Rating/Comment" : "Submit Rating/Comment";

        return (
            <div key={index} className="message-container">
                <div className="ai-message" style={{marginLeft: '1em'}}>
                    <Markdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
                        {_answer || "No response available yet"}
                    </Markdown>
                    <hr />
                    <div style={{ padding: '0.5em' }}><b>Rate this answer:</b> <Rate key={ratingID} id={ratingID} defaultValue={ratings.current[index]} style={{ marginLeft: '0.5em' }}
                        onChange={(value) => rateAnswer(value, ratingID)} /></div>
                    <hr/>
                    <div><b>Add any comment you&apos;d like about the quality of this answer in the box below:</b></div>
                    <TextArea key={commentID} id={commentID} onChange={(e) => commentAnswer(e.currentTarget.id)} defaultValue={comments.current[index]} />
                    <br />
                    <span>{isSubmitted}</span>
                    <Button key={btnID} id={btnID} disabled={false/*evaluated.current[index]*/} type="primary" style={{ margin: '0.5em' }}
                        onClick={(e) => submitEvaluation(e.currentTarget.id)}>
                        {btnText}
                    </Button>
                    <br/>
                </div>
            </div>
        )
    }

    // onClick={(e) => submitEvaluation(e.currentTarget.id, _answer, 0, contexts.current[index], promptCtrl.current.value)}>
    // NEEDS WORK, NEED same for TEXTAREA COmment
    const rateAnswer = (rating, id) => {
        const index = parseInt(id.split('_')[1]); // Extract the index from the button ID
        const ratingID = 'rating_' + index; // Unique ID for the rating
        //const rating = document.getElementById(ratingID).value; // Get the rating value from the Rate component
        ratings.current[index] = rating; // Store the rating in the ratings array
    }

    const commentAnswer = (btnID) => {
        const index = parseInt(btnID.split('_')[1]); // Extract the index from the button ID
        const commentID = 'comment_' + index; // Unique ID for the rating
        const comment = document.getElementById(commentID).value; // Get the rating value from the Rate component
        comments.current[index] = comment; // Store the rating in the ratings array
    }

    const submitEvaluation = async (btnID) => { //, answer, rating, context, comment) => {
        // Here you can handle the rating logic, e.g., send it to a server or update the UI
        const index = parseInt(btnID.split('_')[1]); // Extract the index from the button ID

        const model = contexts.current[index][0] === 'R' ? contexts.current[index].slice(4) : contexts.current[index]; // Extract model name from context if it starts with 'RAG+'
        const useRAG = contexts.current[index][0] === 'R' ? true : false; // Determine if RAG is used based on context

        //const ratingID = 'rating_' + index; // Unique ID for the rating
        //const rating = document.getElementById(ratingID).value; // Get the rating value from the Rate component
        //ratings.current[index] = rating; // Store the rating in the ratings array
        //
        //const commentID = 'comment_' + index; // Unique ID for the rating
        //const comment = document.getElementById(commentID).value; // Get the rating value from the Rate component
        //comments.current[index] = comment; // Store the rating in the ratings array

        const submitted_by = document.getElementById('submitter').value || "Anonymous"; // Get the submitter's name from the input field
        console.log(`Rating for answer ${index}: ${ratings.current[index]}, ${comments.current[index]}`);

        try {
            const response = await fetch(RATING_API_URL, {
                method: 'POST',
                headers: {
                    "X-API-Key": "agwater-web-app",
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    question: currentQuestion.current,
                    answer: answers.current[index],
                    rating: ratings.current[index],
                    model: contexts.current[index],
                    comment: comments.current[index],
                    submitted_by: submitted_by
                })
            });
            console.log("response: ", response); // debug
            const result = await response.json();
            console.log("response (json): ", response); // debug

            const _evaluated = [...evaluated]; // Create a copy of the evaluated state

            if (result.success == true) {
                //evaluated.current[index] = true; // Mark this answer as evaluated
                _evaluated[index] = true; // Mark this answer as evaluated
                setEvaluated(_evaluated); // Update the evaluated state)
                message.success(`Thank you for evaluation! Your rating was ${ratings.current[index]}, your comment was ${comments.current[index]}`);
            }
            else
                message.error("Failed to submit rating. Please try again later.");

        } catch (error) {
            message.error("Failed to submit rating. Please try again later.");
            console.error('Error recording rating', error);
        }
    }

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

      
                 <h4>LLM Evaluation Rubric and Rating Outline:</h4>
                 <table style={{ color: 'white', fontSize: '0.9em', fontWeight: '400', width: '100%', borderCollapse: 'collapse', marginTop: '0.5em', marginBottom: '0.5em' }}>
                    <thead>
                        <tr>
                            <th style={{ border: '1px solid #ccc', padding: '6px', background: '#222', color: 'white', width:'10em' }}>Rating</th>
                            <th style={{ border: '1px solid #ccc', padding: '6px', background: '#222', color: 'white' }}>Summary</th>
                            <th style={{ border: '1px solid #ccc', padding: '6px', background: '#222', color: 'white' }}>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>No Stars</td>
                            <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>Unacceptably Bad</td>
                            <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                                The LLM's response is completely incorrect and provides completely fabricated statistics and examples, or even conflicting information and examples. The LLM is confident in its wrong answer.
                            </td>
                        </tr>
                        <tr>
                            <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>
                                <Rate disabled defaultValue={1}/><br/>One Star
                            </td>
                            <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>Very Bad</td>
                            <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                                The LLM's response is incorrect and misleading, but there aren't any precise details included in the response. The answer is general and vague, but still incorrect. The LLM is not confident in its wrong answer.
                            </td>
                        </tr>
                        <tr>
                            <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>
                                <Rate disabled defaultValue={2} /><br />2 Stars</td>
                            <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>Bad</td>
                            <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                                The LLM's response contains around the same amount of correct and incorrect information, which might or might not conflict. This answer is confusing and misleading.
                            </td>
                        </tr>
                        <tr>
                            <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>
                                <Rate disabled defaultValue={3} /><br />3 Stars<br />
                            </td>
                            <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>Good</td>
                            <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                                The LLM's response is technically correct, but not very detailed. The answer may or may not include additional references or details, but if included, that additional information might not be relevant to the question itself.
                            </td>
                        </tr>
                        <tr>
                            <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>
                                <Rate disabled defaultValue={4} /><br />4 Stars<br />
                            </td>
                            <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>Very Good</td>
                            <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                                The LLM's response is correct, but it doesn't provide much additional information or details that are related to the question. The LLM is somewhat confident in its correct answer.
                            </td>
                        </tr>
                        <tr>
                            <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>
                                <Rate disabled defaultValue={5} /><br />5 Stars<br />
                            </td>
                            <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>Exceptionally Good</td>
                            <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                                The LLM's response is accurate, very detailed, and provides accurate extra information related to the question to ensure the user gains a more detailed understanding of the solution and the original question itself. The LLM is confident in its correct answer.
                            </td>
                        </tr>
                    </tbody>
                </table>
                <Divider />
                Your Name: <Input id='submitter' style={{ width: '30em' }} placeholder="Your name here please!" />
                <Divider/>

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
                {loading && (<Loading tip='Running Query...' />)}

                <Row gutter={16}>
                    {order.current.map((item, index) => (
                        <Col key={index} xs={24} sm={12} md={12} lg={12} xl={8}>
                            {resultCard(index, answers[item], contexts[item])}
                        </Col>
                    ))}
                </Row>

            </main>
            {error && <div style={{ color: 'red' }}>Error: {error}</div>}
            <br />
        </div>
    );
};

export default EvalChat;