import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Divider, Button, Checkbox, Steps, Input, } from 'antd';
import agTapConfig from './agtap.json'; 

import { InboxOutlined } from '@ant-design/icons';
import { message, Upload } from 'antd';
const { Dragger } = Upload;
const { TextArea } = Input;


//const onChangeSubtopic = (checkedValues) => {
//    console.log('checked = ', checkedValues);
//}

const ATGetAssistance = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [currentTopic, setCurrentTopic] = useState(0);


    function GetTopicList() {
        let html = [];
        let i = 0;
        for (let topic of agTapConfig.assistance.topics) {
            //html.push(<hr />);
            //html.push(<span style={{ fontWeight: 'bold', paddingLeft:0, paddingBottom:20 }}>{topic.label}</span>);
            //html.push(<br />);
            html.push(<Divider orientation="left" orientationMargin="0" style={{ paddingTop:'0.5em' }} >{topic.label}</Divider>)

            // make Checkgroups of subtopics
            let j = 0;
            for (let subtopic of topic.subtopics) {
                const id = 'cb_' + i + '_' + j;
                let style = {};
                html.push(<Checkbox id={id} topic={currentTopic} style={style}>{subtopic.label}</Checkbox>);
                j++;
            }
            i++;
        }
        return html;
    }

    const props = {
        name: 'file',
        multiple: true,
        action: 'https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload',
        onChange(info) {
            const { status } = info.file;
            if (status !== 'uploading') {
                console.log(info.file, info.fileList);
            }
            if (status === 'done') {
                message.success(`${info.file.name} file uploaded successfully.`);
            } else if (status === 'error') {
                message.error(`${info.file.name} file upload failed.`);
            }
        },
        onDrop(e) {
            console.log('Dropped files', e.dataTransfer.files);
        },
    };

    const changeStep = (step) => {
        console.log('changing step to', step);
        setCurrentStep(step);
    }

    const onChangeStepFromBtn = (e) => {
        let step = e.currentTarget.id.substring(3);
        step = parseInt(step);
        step++;
        console.log('onChangeStep to:', step);
        changeStep(step);
        return;
    }

    const onChangeTopic = (key) => {
        console.log('onChangeTopic', key);
        setCurrentTopic(key);
    }

    const SendRequest = () => {
        const sendMsgURL = 'https://agwater.org:5556/SendMessage';

        // post msg to server
        
        const msg = 'test';

        // get the values from the form
        const firstName = document.getElementById('iFirstName').value;
        const lastName = document.getElementById('iLastName').value;
        const phone = document.getElementById('iPhone').value;
        const recipient_email = document.getElementById('iEmail').value;
        const subject = 'AgWaterTAP Request for Assistance';
        let body = document.getElementById('iBody').value;

        /////////////////////////////

        body += '\n\n' + 'First Name: ' + firstName;
        body += '\n' + 'Last Name: ' + lastName;
        body += '\n' + 'Phone: ' + phone;
        body += '\n' + 'Email: ' + recipient_email;
        body += '\n' + 'Topics: ';

        let i = 0
        let sendToDict = {};
        for (let topic of agTapConfig.assistance.topics) {
            let j = 0;
            for (let subtopic of topic.subtopics) {
                const id = 'cb_' + i + '_' + j;
                const checkBox = document.getElementById(id);
                if (checkBox.checked) {
                    body += '\t' + topic.label + ': ' + subtopic.label + '\n';
                    for (let recipient of subtopic.send_to);
                    sendToDict[subtopic.send_to] = 1;
                }
            }
        }
        const recipient_emails = Object.keys(sendToDict);

        const msgBody = JSON.stringify({
            recipient_emails: recipient_emails,
            subject: subject,
            body: body,
            attachment_paths:""
        });

        fetch(sendMsgURL, {
            method: "POST",
            body: msgBody,
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        })  .then(response => console.log('Email response: ' + response.text()))
            .catch(error => console.error('Error posting email message: ', error));
    }

    return (
        <>
            <Steps
                type="navigation"
                size='small'
                onChange={changeStep}
                className="site-navigation-steps"
                current={currentStep}
                items={[
                    { title: 'Select topic(s)' },
                    { title: 'Add Information' },
                    { title: 'Send Request' },
                ]}
            />
            <div style={{ display: currentStep == 0 ? 'block' : 'none' }}>
                <h4>Select the topics you need assistance with from the areas listed below</h4>

                {GetTopicList()}
        
                <hr/>
                <Button id='btn0' type="primary" size='large' onClick={onChangeStepFromBtn} >
                    Next
                </Button>
            </div>

            <div style={{ display: currentStep == 1 ? 'block' : 'none' }}>
                <h4>Tell us below what you need help with.</h4>

                <TextArea id='iBody' rows={4} placeholder="Add any additional information you would like to provide here..."
                    maxLength={6} />
                <br />
                <br />
                <span>Upload any attachments (pictures or PDF files) you want to include below.</span>
                <br />
                <Dragger {...props}>
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag file to this area to upload</p>
                    <p className="ant-upload-hint">
                        Support for a single or bulk upload. Strictly prohibited from uploading company data or other
                        banned files.
                    </p>
                </Dragger>

                <hr />
                <Button id='btn1' type="primary" size='large' onClick={onChangeStepFromBtn} >
                    Next
                </Button>
            </div>

            <div bordered={true} style={{ display: currentStep == 2 ? 'block' : 'none' }}>
                <h4>Please provide us contact information</h4>
                <span>We will use this information to get back to you. This information will NOT be retained or shared with anyone, ever.</span>
                <br/>
                <br />
                <div gutter={16}>
                    <div style={{ width: '8em', textAlign: 'left', display: 'inline-block' }}><label>First Name: </label></div>
                    <div style={{ width: '20em', display: 'inline-block' }}><Input id='iFirstName' placeholder="First Name" /></div>
                    <br />

                    <div style={{ width: '8em', textAlign: 'left', display: 'inline-block' }}><label>Last Name: </label></div>
                    <div style={{ width: '20em', display: 'inline-block' }}><Input id='iLastName' placeholder="Last Name" /></div>
                    <br />

                    <div style={{ width: '8em', textAlign: 'left', display: 'inline-block' }}><label>Email: </label></div>
                    <div style={{ width: '20em', display: 'inline-block' }}><Input id='iEmail' placeholder="Email" /></div>
                    <br />

                    <div style={{ width: '8em', textAlign: 'left', display: 'inline-block' }}><label>Phone: </label></div>
                    <div style={{ width: '20em', display: 'inline-block' }}><Input id='iPhone' placeholder="Phone" /></div>
                </div>

                <hr />
                <Button id='btn2' type="primary" size='large' onClick='SendRequest' >
                    Send Request
                </Button>
            </div>
        </>
    )
};


export default ATGetAssistance;

