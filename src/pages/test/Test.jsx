import { useState, useEffect } from "react";
//import OllamaChat from '../../components/ollama_chat/OllamaChat'
import { Typography } from "antd";
import { LineChart, Line, XAxis, YAxis, ReferenceLine, ResponsiveContainer, CartesianGrid, Tooltip, Legend  } from "recharts";

const { Title } = Typography;

//import readNDJSONStream from 'ndjson-readablestream';

const Test = () => {



    const styles = {
        fontFamily: "sans-serif",
        textAlign: "center"
    };


    const data = [];

    const maxBudget = 300;
    for (let i = 0; i < 8; i++) {
        let d = {
            //Date: new Date('2025-07-0' + (i + 1)),
            Date: '2025-07-0' + (i + 1),
            value: Math.random() * (maxBudget + 50) + 100
        };

        data.push(d);
    }

    const testline = [{ day: 16, y: 300 }, { day: 25, y: 0 }]


    const chartData = [
        {
            "Date": "2025-07-12",
            "ETc": 0.056,
            "Evapotranspiration ASCE-EWRI Alfalfa (in)": 28,
            "Evapotranspiration ASCE-EWRI Grass (in)": 0.24,
            "Evapotranspiration Kimberly-Penman (in)": 0.31,
            "Growing Degree Days (base 50F)": 22.27
        },
        {
            "Date": "2025-07-13",
            "ETc": 0.068,
            "Evapotranspiration ASCE-EWRI Alfalfa (in)": 34,
            "Evapotranspiration ASCE-EWRI Grass (in)": 0.28,
            "Evapotranspiration Kimberly-Penman (in)": 0.36,
            "Growing Degree Days (base 50F)": 23.35,
        },
        {
            "Date": "2025-07-14",
            "ETc": 0.058,
            "Evapotranspiration ASCE-EWRI Alfalfa (in)": 29,
            "Evapotranspiration ASCE-EWRI Grass (in)": 0.24,
            "Evapotranspiration Kimberly-Penman (in)": 0.33,
            "Growing Degree Days (base 50F)": 22.31,
        },
        {
            "Date": "2025-07-15",
            "ETc": 0.062,
            "Evapotranspiration ASCE-EWRI Alfalfa (in)": 31,
            "Evapotranspiration ASCE-EWRI Grass (in)": 0.25,
            "Evapotranspiration Kimberly-Penman (in)": 0.35,
            "Growing Degree Days (base 50F)": 18.77,
        }
    ];



    return (
        <div style={styles}>


            <ResponsiveContainer width="100%" height={320} style={{ backgroundColor: 'white' }}>
                <Title level={4} style={{ color: 'black', textAlign: 'center' }}>Crop Water Use - Last Five Days</Title>
                <LineChart
                    width='100%'
                    height='340'
                    data={chartData}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 25,
                    }}
                >
                    <Line key='ETr' type="monotone" dataKey='ETc' stroke={"black"} />


                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="Date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />

                </LineChart>            </ResponsiveContainer>


            {/*
            <ResponsiveContainer width="100%" height={320} style={{ backgroundColor: 'white' }}>
                <LineChart
                    width='500'
                    height='400'
                    data={data}
                >
                    <Line key='value' type="monotone" dataKey='value' stroke={"black"} />
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="Date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />


                </LineChart>
            </ResponsiveContainer>
            */}

        </div>
    );
}




    /*

            <LineChart
                width={500}
                height={300}

                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
                <Line type="monotone" data={data} dataKey="value" stroke="#8884d8" dot={false} />
                <Line type="linear" data={testline} dataKey="y" stroke="#FF3333" dot={false} strokeWidth={2} />
                <XAxis dataKey="day" type="number" tickCount={11} />
                <YAxis />
                <ReferenceLine
                    y={maxBudget}
                    label={{
                        position: "center",
                        value: "Max budget"
                    }}
                    strokeDasharray="5 5"
                />
            </LineChart>









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
    */


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
  


export default Test;

