import { Alert, Button, Space, Spin, Table, Typography } from 'antd';
import { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

const { Text, Title } = Typography;
const API_BASE = 'https://agwater.org:5556';

const MyPlans = ({
    setCurrentPlan,
    userName,
    userRole,
}) => {
    const [plans, setPlans] = useState([]);
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
                const response = await fetch(`${API_BASE}/agwqplan/plans?user_name=${encodeURIComponent(userName)}`, {
                    signal: controller.signal,
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                const body = await response.json();

                if (!response.ok) {
                    throw new Error(body.error || 'Unable to load plans.');
                }

                const planList = body.reports || [];
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
        name: plan.report_data?.site?.name || 'Unknown',
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
            </Space>
        ),
    }));

    return (
        <>
            <Title level={4}>My Plans<span style={{float: 'right'}}><Button type="primary" onClick={() => setCurrentPlan(null)}>Start New Plan</Button></span></Title>
            {plansLoading && <Spin tip="Loading plans..." />}
            {plansError && <Alert type="error" showIcon message="Plans could not be loaded" description={plansError} />}
            {!plansLoading && !plansError && (
                plans.length === 0 ? <Text type="secondary">No plans found for this user.</Text>
                    :
                    <Table
                        columns={columns}
                        dataSource={plansData}
                        showSorterTooltip={{ target: 'sorter-icon' }}
                    />
            )}
        </>

    )
};

MyPlans.propTypes = {
    setCurrentPlan: PropTypes.func.isRequired,
    userRole: PropTypes.string,
    userName: PropTypes.string,
};

export default MyPlans;