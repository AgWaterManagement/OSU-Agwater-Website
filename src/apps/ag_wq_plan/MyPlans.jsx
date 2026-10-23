import { Alert, Button, Input, Modal, Space, Spin, Table, Typography, message } from 'antd';
import { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { DeleteOutlined, ShareAltOutlined } from '@ant-design/icons';
import { secrets } from '../../secrets.js';

import StartUp from './StartUp';

const { Text, Title } = Typography;
const API_BASE = 'https://agwater.org:5556';



const MyPlans = ({
    setCurrentPlan,
    userName, setUserName,
    userRole, setUserRole,
    setUserID,
    setLoggingIn,

    savePlan,
}) => {
    const [plans, setPlans] = useState([]);  // a list of plans for the current user
    const [plansLoading, setPlansLoading] = useState(false);
    const [plansError, setPlansError] = useState('');

    useEffect(() => {
        const controller = new AbortController();

        if (userName == null) {
            setPlans([]);
            setPlansError('');
            setPlansLoading(false);
            return () => controller.abort();
        }

        const fetchPlans = async () => {
            setPlansLoading(true);
            setPlansError('');

            try {
                const response = await fetch(`${API_BASE}/agwqplan/plans?user_name=${encodeURIComponent(userName)}`, 
                {
                    signal: controller.signal,
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': secrets.agwater_api_key,
                    },
                });


                const body = await response.json();
                setPlansLoading(false);
                if (!response.ok) {
                    throw new Error(body.error || 'Unable to load plans.');
                }

                const planList = body.reports || [];

                // fix up the commodities and goals to be arrays of strings instead of a single string             planList.forEach((plan) => {
                planList.forEach((plan) => {
                    if (plan.report_data) {
                        if ( plan.report_data.selected_commodities) {
                            plan.report_data.selected_commodities = plan.report_data.selected_commodities.split(",");   
                        }
                        if ( plan.report_data.selected_goals) {
                            plan.report_data.selected_goals = plan.report_data.selected_goals.split(",").map((goal) => parseInt(goal.trim()));   
                        }
                        if ( plan.report_data.selected_concerns) {
                            plan.report_data.selected_concerns = plan.report_data.selected_concerns.split(",");   
                        }
                        if ( plan.report_data.selected_questions) {
                            plan.report_data.selected_questions = plan.report_data.selected_questions.split(",").map((q) => parseInt(q.trim()));   
                        }
                        if ( plan.report_data.selected_practices) {
                            plan.report_data.selected_practices = plan.report_data.selected_practices.split(",").map((p) => parseInt(p.trim()));   
                        }
                    }
                });

                setPlans(Array.isArray(planList) ? planList : []);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    setPlans([]);
                    setPlansError(error.message || 'Unable to load plans.');
                }
            } finally {
                if (!controller.signal.aborted) setPlansLoading(false);
            }
        };

        fetchPlans();
        return () => controller.abort();
    }, [userName]);

    const startNewPlan = () => {
        const now = new Date().toISOString();

        setCurrentPlan({
            id: null,
            latitude: null,
            longitude: null,
            keywords: "",
            created_at: now,
            updated_at: now,
            created_by: userName,
            owner_role: userRole,
            shared_with: [],
            report_data: {
                site_id: null,
                site_name: "",
                site_description: "",
                site_locator: "",
                site_photos: [],  //  [{ filename: name, label: label, description: description}]
                agwqm_region: null,
                agwqm_area: null,
                tmdl_area: null,
                regional_specialist: null,
                regional_specialist_email: null,
                regional_specialist_phone: null,
                area_plan_link: null,
                admin_rules_link: null,
                selected_commodities: [],   // THESE ARE ALL ARRAYS OF STRINGS, NOT FULL OBJECTS
                selected_goals: [],
                selected_concerns: [],
                selected_questions: [],
                selected_practices: [],
            },
        });

        savePlan();
    }

    const deletePlan = (plan) => {
        Modal.confirm({
            title: 'Delete plan',
            content: `Are you sure you want to delete the plan for "${plan.report_data?.site_name || 'this site'}"?`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    const response = await fetch(`${API_BASE}/agwqplan/plans`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-API-Key': secrets.agwater_api_key,
                        },
                        body: JSON.stringify([{ id: plan.id }]),
                    });
                    const responseText = await response.text();
                    let body = {};

                    try {
                        body = responseText ? JSON.parse(responseText) : {};
                    } catch {
                        body = { error: responseText };
                    }

                    if (!response.ok || body.success === false) {
                        throw new Error(body.error || `Unable to delete plan (${response.status}).`);
                    }

                    setPlans((currentPlans) => currentPlans.filter(({ id }) => id !== plan.id));
                    setCurrentPlan((currentPlan) => currentPlan?.id === plan.id ? null : currentPlan);
                    message.success('Plan deleted successfully');
                } catch (error) {
                    message.error(error.message || 'Unable to delete plan.');
                    throw error;
                }
            },
        });
    };

    const sharePlan = (plan) => {
        let recipientEmails = '';

        Modal.confirm({
            title: 'Share plan',
            content: (
                <Space direction="vertical" style={{ display: 'flex' }}>
                    <span>To share this plan with others, enter their email addresses below:</span>
                    <Input.TextArea
                        aria-label="Recipient email addresses"
                        placeholder="Enter email addresses separated by commas or new lines"
                        rows={3}
                        onChange={(event) => {
                            recipientEmails = event.target.value;
                        }}
                    />
                </Space>
            ),
            okText: 'Share',
            okType: 'primary',
            cancelText: 'Cancel',
            onOk: async () => {
                if (!recipientEmails.trim()) {
                    message.error('Enter at least one email address.');
                    return;
                }

                const newRecipients = recipientEmails
                    .split(/[\s,;]+/)
                    .map((email) => email.trim())
                    .filter(Boolean);
                const existingRecipients = Array.isArray(plan.shared_with)
                    ? plan.shared_with
                    : String(plan.shared_with || '').split(/[\s,;]+/).filter(Boolean);
                const sharedWith = [...new Set([...existingRecipients, ...newRecipients])];
                const updatedPlan = { ...plan, shared_with: sharedWith };
                const record = {
                    id: plan.id,
                    report_data: JSON.stringify(plan.report_data || {}),
                    created_by: plan.created_by,
                    latitude: plan.latitude,
                    longitude: plan.longitude,
                    keywords: plan.keywords || '',
                    created_at: plan.created_at,
                    updated_at: new Date().toISOString(),
                    shared_with: sharedWith.join(','),
                };

                try {
                    const response = await fetch(`${API_BASE}/agwqplan/plans`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-API-Key': secrets.agwater_api_key,
                        },
                        body: JSON.stringify(record),
                    });
                    const responseText = await response.text();
                    let responseBody = {};

                    try {
                        responseBody = responseText ? JSON.parse(responseText) : {};
                    } catch {
                        responseBody = { error: responseText };
                    }

                    if (!response.ok || responseBody.success === false) {
                        throw new Error(responseBody.error || `Unable to share plan (${response.status}).`);
                    }

                    setPlans((currentPlans) => currentPlans.map((currentPlan) => (
                        currentPlan.id === plan.id ? updatedPlan : currentPlan
                    )));
                    setCurrentPlan((currentPlan) => (
                        currentPlan?.id === plan.id ? updatedPlan : currentPlan
                    ));
                    message.success('Plan shared successfully');
                } catch (error) {
                    message.error(error.message || 'Unable to share plan.');
                    throw error;
                }
            },
        });
    };

    const formatReportDate = (dateValue) => {
        if (!dateValue) return 'Unknown';
        const date = new Date(dateValue);
        return Number.isNaN(date.getTime())
            ? 'Unknown'
            : new Intl.DateTimeFormat('en-US', {
                month: 'long',
                day: '2-digit',
                year: 'numeric',
            }).format(date);
    };


    const columns = [
        {
            title: 'Site',
            dataIndex: 'name',
            showSorterTooltip: { target: 'full-header' },
            sorter: (a, b) => a.name.length - b.name.length,
            sortDirections: ['descend'],
        },
        {
            title: 'Last Update',
            dataIndex: 'last_update',
            showSorterTooltip: { target: 'full-header' },
            sorter: (a, b) => a.name.length - b.name.length,
            sortDirections: ['descend'],
        },
        {
            title: 'Owner',
            dataIndex: 'owner',
            showSorterTooltip: { target: 'full-header' },
            sorter: (a, b) => a.name.length - b.name.length,
            sortDirections: ['descend'],
        },
        {
            title: 'Action',
            dataIndex: 'action',
        }
    ];

    const plansData = plans.map((plan) => ({
        key: plan.id,
        name: plan.report_data?.site_name || 'Unknown',
        last_update: formatReportDate(plan.updated_at),
        owner: plan.created_by || 'Unknown',
        action: (
            <Space>
                <Button
                    type="primary"
                    onClick={() => {
                        setCurrentPlan(plan);
                    }}
                >
                    Edit Plan
                </Button>
                <Button
                    type="default"
                    onClick={() => {
                        window.open(`${API_BASE}/agwqplan/plans/${plan.id}/pdf`, '_blank');
                    }}
                >
                    View PDF
                </Button>

                <Button
                    type="text"
                    icon={<ShareAltOutlined />}
                    aria-label={`Share plan for ${plan.report_data?.site_name || 'this site'}`}
                    title="Share plan"
                    onClick={() => sharePlan(plan)}
                />

                <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    aria-label={`Delete plan for ${plan.report_data?.site_name || 'this site'}`}
                    title="Delete plan"
                    onClick={() => deletePlan(plan)}
                />

                
            </Space>
        ),
    }));

    return (
        <>
            <br />

            {/* display login prompt if userName is null */}
            {userName !== null && userName !== undefined ? (
                <>
                    <Title level={4}>My Plans
                        <span style={{ float: 'right' }}>
                            <Button type="primary" onClick={() => startNewPlan()}>
                                Start New Plan
                            </Button>
                        </span>
                    </Title>
                    
                    {plansError && <Alert type="error" showIcon message="Plans could not be loaded" description={plansError} />}

                    <Spin spinning={plansLoading} tip="Loading plans...">
                        
                        {!plansError && (
                            plans.length === 0 ? <Text type="secondary">No plans found for this user.</Text>
                                :
                                <Table
                                    columns={columns}
                                    dataSource={plansData}
                                    showSorterTooltip={{ target: 'sorter-icon' }}
                                />
                        )}
                    </Spin>
                </>
            ) : (
                <>
                <StartUp
                    userName={userName}
                    userRole={userRole} setUserRole={setUserRole}
                    setUserName={setUserName}
                    setUserID={setUserID}
                    setLoggingIn={setLoggingIn}
                />
                </>
            )}
        </>

    )
};

MyPlans.propTypes = {
    setCurrentPlan: PropTypes.func.isRequired,
    userName: PropTypes.string,
    userRole: PropTypes.string,
    setUserName: PropTypes.func.isRequired,
    setUserRole: PropTypes.func.isRequired,
    setUserID: PropTypes.func.isRequired,
    setLoggingIn: PropTypes.func.isRequired,
    savePlan: PropTypes.func.isRequired,
};

export default MyPlans;