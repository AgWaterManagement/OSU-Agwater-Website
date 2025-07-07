import { useState, useEffect } from "react";
//import OllamaChat from '../../components/ollama_chat/OllamaChat'




const Test = () => {

  const [output, setOutput] = useState("");

  useEffect(() => {
    fetchStream();
  }, []);

   async function fetchStream() {

    const url = 'https://agwater.org:5556/stream';
    const response = await fetch(url);
    const readableStream = response.body;
    const reader = readableStream.getReader();
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        var text = new TextDecoder("utf-8").decode(value);
        console.log("Received ", text);
    }


/*
    const decoder = new TextDecoder();
 
    const response = await fetch(url);
    for await (const chunk of response.body) {

      let _chunk = decoder.decode(chunk, { stream: true });
      console.log("chunk: ", _chunk); // debug
    // Do something with each "chunk"
    } */
  // Exit when done
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
<div id="output">{output}</div>

  </div>
)};

export default Test;

