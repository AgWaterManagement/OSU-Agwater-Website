import { useState, useEffect } from "react";
//import OllamaChat from '../../components/ollama_chat/OllamaChat'

import readNDJSONStream from 'ndjson-readablestream';

const Test = () => {

//  useEffect(() => {
    fetchStream();
//  }, []);

    async function fetchStream() {

        const encodedInput = encodeURIComponent("what is diazinon");

        const url = `https://agwater.org:5556/llm/chat?query=${encodedInput}&stream=1`;  //&chat_history=${chat_history}`;
        console.log(url);
        const response = await fetch(url, {
            method: 'post',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ chat_history: [] }) // Include the chat history in the request body
        });
        for await (const event of readNDJSONStream(response.body)) {
            console.log('Received', event);
        }
    }



   /*
    const reader = stream.getReader();
    let charsReceived = 0;

    // read() returns a promise that resolves
    // when a value has been received
    reader.read().then(function processText({ done, value }) {
      // Result objects contain two properties:
      // done  - true if the stream has already given you all its data.
      // value - some data. Always undefined when done is true.
      if (done) {
        console.log("Stream complete");
        setOutput(output + value + "  -all done");
        return;
      }

      // value for fetch streams is a Uint8Array
      charsReceived += value.length;
      const chunk = value;
      //listItem.textContent = `Received ${charsReceived} characters so far. Current chunk = ${chunk}`;
      //list2.appendChild(listItem);
      console.log(`Received ${charsReceived} characters so far. Current chunk = ${chunk}`);
      setOutput(output+ chunk);

      // Read some more, and call this function again
      return reader.read().then(processText);
  });
}*/





/*
      const response = await fetch('https://agwater.org:5556/stream');

      if (!response.ok) {
        setOutput('Error: ' + response.status);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done)
           break;
        let chunk = decoder.decode(value, { stream: true });
        console.log("value: ", chunk); // debug
        setOutput(() => output + chunk);
      }

      setOutput(output + "\n--- Stream Complete ---");
    }
  */
  
  return (
  <div className='content-container' >

        <h2 className='content-title'>Test Page</h2>

  </div>
)};

export default Test;

