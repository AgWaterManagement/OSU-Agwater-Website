import { Button, Divider, Space, Steps } from 'antd';
import { useState, useRef } from 'react';

import PropTypes from 'prop-types';

//import StartUp from './StartUp';
import StepWhoWhere from './StepWhoWhere';
import StepConditions from './StepConditions';
import StepGoals from './StepGoals';
import StepPractices from './StepPractices';
import StepSummary from './StepSummary';


const { Step } = Steps;

/* A "Plan" object structure is defined in MyPlans.jsx */

const PlanEditor = ({
    currentPlan, setCurrentPlan,
    userName,
    userID, //setUserID,
    userRole,
    stepLocationStatus,
    stepConditionsStatus,
    stepGoalsStatus,
    stepPracticesStatus,
    //sites, //setSites,
    setStepLocationStatus,
    setStepConditionsStatus,
    setStepGoalsStatus,
    setStepPracticesStatus,
    concernsData,
    concernQuestionsData,
    goalsData,
    commoditiesData,
    areaRulesData,
    practicesData,
    savePlan,
}) => {
    //const [isDirty, setIsDirty] = useState(false);
    const isDirty = useRef(false);
    const [currentStep, setCurrentStep] = useState(0);

    const next = () => setCurrentStep((step) => step + 1);
    const prev = () => setCurrentStep((step) => step - 1);

    // if editing a plan with a null plan id, save it first and get a proper id
    //  before proceeding to the next step
    //useEffect(() => {
    //    if (currentPlan?.id === null || currentPlan?.id === undefined) {
    //        // Save the plan to get a proper ID
    //        savePlan();
    //    }
    //}, [currentPlan]);

    return (
        <>
            {currentStep >= 0 && (
                <>
                    <Divider />
                    <Steps current={currentStep} onChange={setCurrentStep} style={{ marginBottom: 24 }}>
                        <Step title="Location" status={stepLocationStatus} />
                        <Step title="Conditions" status={stepConditionsStatus} />
                        <Step title="Goals" status={stepGoalsStatus} />
                        <Step title="Practices" status={stepPracticesStatus} />
                        <Step title="Plan Summary" />
                    </Steps>
                    <Divider />
                </>
            )}


            <Space style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                <span style={{width: '100%', textAlign: 'right'}}>
                {currentStep > 0 && (
                    <Button ghost onClick={prev}>
                        Back
                    </Button>
                )}
                &nbsp;
                &nbsp;
                {currentStep < 4 && stepLocationStatus !== 'error' && stepConditionsStatus !== 'error' && stepGoalsStatus !== 'error' && stepPracticesStatus !== 'error' && (
                    <Button type="primary" onClick={next}>
                        Next
                    </Button>
                )}
                {currentStep < 4 && (stepLocationStatus === 'error' || stepConditionsStatus === 'error' || stepGoalsStatus === 'error' || stepPracticesStatus === 'error') && (
                    <Button type="primary" disabled>
                        Next
                    </Button>
                )}

                <span style={{ marginLeft: 8, fontStyle: 'italic', fontSize: 14, color: 'red' }}>
                    {stepLocationStatus === 'error' && 'Please complete the Location step before proceeding.'}
                    {stepConditionsStatus === 'error' && 'Please complete the Conditions step before proceeding.'}
                    {stepGoalsStatus === 'error' && 'Please complete the Goals step before proceeding.'}
                    {stepPracticesStatus === 'error' && 'Please complete the Practices step before proceeding.'}
                </span>
                </span>
            </Space>

            <br/>
            <br/>

            {currentStep === 0 && (
                <StepWhoWhere
                    userName={userName}
                    currentPlan={currentPlan} setCurrentPlan={setCurrentPlan}
                    userID={userID.current}
                    commoditiesData={commoditiesData}
                    setError={setStepLocationStatus}
                    savePlan={savePlan}
                    isDirty={isDirty}
                />
            )}

            {currentStep === 1 && (
                <StepConditions
                    userName={userName}
                    currentPlan={currentPlan} setCurrentPlan={setCurrentPlan}
                    concernsData={concernsData}
                    concernQuestionsData={concernQuestionsData}
                    setError={setStepConditionsStatus}
                    savePlan={savePlan}
                    isDirty={isDirty}
                />
            )}

            {currentStep === 2 && (
                <StepGoals
                    userName={userName}
                    currentPlan={currentPlan} setCurrentPlan={setCurrentPlan}
                    goalData={goalsData}
                    setError={setStepGoalsStatus}
                    savePlan={savePlan}
                    isDirty={isDirty}
                />
            )}

            {currentStep === 3 && (
                <StepPractices
                    userName={userName}
                    currentPlan={currentPlan} setCurrentPlan={setCurrentPlan}
                    areaRulesData={areaRulesData}
                    userRole={userRole}
                    concernQuestionsData={concernQuestionsData}
                    practicesData={practicesData}
                    setError={setStepPracticesStatus}
                    savePlan={savePlan}
                    isDirty={isDirty}
                />
            )}

            {currentStep === 4 && (
                <StepSummary
                    currentPlan={currentPlan} setCurrentPlan={setCurrentPlan}
                    userRole={userRole}
                    userName={userName}
                    goalsData={goalsData}
                    concernQuestionsData={concernQuestionsData}
                    areaRulesData={areaRulesData}
                    practicesData={practicesData}
                    savePlan={savePlan}
                    isDirty={isDirty}
                />
            )}
            
            <Divider />

            <Space>
                {currentStep > 0 && (
                    <Button ghost onClick={prev}>
                        Back
                    </Button>
                )}
                {currentStep < 4 && stepLocationStatus !== 'error' && stepConditionsStatus !== 'error' && stepGoalsStatus !== 'error' && stepPracticesStatus !== 'error' && (
                    <Button type="primary" onClick={next}>
                        Next
                    </Button>
                )}
                {currentStep < 4 && (stepLocationStatus === 'error' || stepConditionsStatus === 'error' || stepGoalsStatus === 'error' || stepPracticesStatus === 'error') && (
                    <Button type="primary" disabled>
                        Next
                    </Button>
                )}

                <span style={{ marginLeft: 8, fontStyle: 'italic', fontSize: 14, color: 'red' }}>
                    {stepLocationStatus === 'error' && 'Please complete the Location step before proceeding.'}
                    {stepConditionsStatus === 'error' && 'Please complete the Conditions step before proceeding.'}
                    {stepGoalsStatus === 'error' && 'Please complete the Goals step before proceeding.'}
                    {stepPracticesStatus === 'error' && 'Please complete the Practices step before proceeding.'}
                </span>
            </Space>
        </>

    )
};

PlanEditor.propTypes = {
    currentPlan: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        latitude: PropTypes.number,
        longitude: PropTypes.number,
        shared_with: PropTypes.string,
        report_data: PropTypes.shape({
            site_name: PropTypes.string,
            site_locator: PropTypes.string,
            site_description: PropTypes.string,
            selected_commodities: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
            selected_practices: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
            selected_goals: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
            selected_concerns: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
            selected_questions: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
            latitude: PropTypes.number,
            longitude: PropTypes.number,
            agwqm_region: PropTypes.string,
            agwqm_area: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
            tmdl_area: PropTypes.string,
            regional_specialist: PropTypes.string,
            regional_specialist_email: PropTypes.string,
            regional_specialist_phone: PropTypes.string,
            admin_rules_link: PropTypes.string,
            area_plan_link: PropTypes.string,
            site_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            site_photos: PropTypes.arrayOf(PropTypes.shape({
                url: PropTypes.string,
                name: PropTypes.string,
                description: PropTypes.string,
                uploaded: PropTypes.bool,
                isDirty: PropTypes.bool,
                serverInfo: PropTypes.object,
            })),
        }),
    }).isRequired,
    setCurrentPlan: PropTypes.func.isRequired,
    userName: PropTypes.string,
    userRole: PropTypes.string,
    userID: PropTypes.shape({ current: PropTypes.oneOfType([PropTypes.string, PropTypes.number]) }),
    concernsData: PropTypes.arrayOf(PropTypes.object),
    concernQuestionsData: PropTypes.arrayOf(PropTypes.object),
    goalsData: PropTypes.arrayOf(PropTypes.object),
    commoditiesData: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.object, PropTypes.string])),
    areaRulesData: PropTypes.arrayOf(PropTypes.object),
    practicesData: PropTypes.arrayOf(PropTypes.object),
    setStepLocationStatus: PropTypes.func.isRequired,
    setStepConditionsStatus: PropTypes.func.isRequired,
    setStepGoalsStatus: PropTypes.func.isRequired,
    setStepPracticesStatus: PropTypes.func.isRequired,
    stepLocationStatus: PropTypes.string,
    stepConditionsStatus: PropTypes.string,
    stepGoalsStatus: PropTypes.string,
    stepPracticesStatus: PropTypes.string,
    savePlan: PropTypes.func.isRequired,
};

export default PlanEditor;


/*

            {currentStep === -1 && (
                <StartUp
                    userRole={userRole} setUserRole={setUserRole}
                    selectedTMDLs={selectedTMDLs} setSelectedTMDLs={setSelectedTMDLs}
                    availableTMDLs={availableTMDLs}
                    setUserName={setUserName}
                    setUserID={setUserID}
                    setLoggingIn={setLoggingIn}
                    setCurrentStep={setCurrentStep}
                />
            )}
            {currentStep >= 0 && (
                <>
                    <Divider />
                    <Steps currentStep={currentStep} onChange={setCurrentStep} style={{ marginBottom: 24 }}>
                        <Step title="Location" status={stepLocationStatus} />
                        <Step title="Conditions" status={stepConditionsStatus} />
                        <Step title="Goals" status={stepGoalsStatus} />
                        <Step title="Practices" status={stepPracticesStatus} />
                        <Step title="Plan Summary" />
                    </Steps>
                    <Divider />
                </>
            )}
            {currentStep === 0 && (
                <StepWhoWhere
                    currentPlan={currentPlan} setCurrentPlan={setCurrentPlan}
                    userID={userID.current}
                    commoditiesData={commodities}
                    setError={setStepLocationStatus}
                />
            )}

            {currentStep === 1 && (
                <StepConditions
                    currentPlan={currentPlan} setCurrentPlan={setCurrentPlan}
                    concernData={concerns}
                    selectedConcerns={selectedConcerns} setSelectedConcerns={setSelectedConcerns}
                    selectedQuestions={selectedQuestions} setSelectedQuestions={setSelectedQuestions}
                    setError={setStepConditionsStatus}
                />
            )}

            {currentStep === 2 && (
                <StepGoals
                    currentPlan={currentPlan} setCurrentPlan={setCurrentPlan}
                    goalData={goals}
                    setError={setStepGoalsStatus}
                />
            )}

            {currentStep === 3 && (
                <StepPractices
                    currentPlan={currentPlan} setCurrentPlan={setCurrentPlan}
                    setError={setStepPracticesStatus}
                />
            )}

            {currentStep === 4 && (
                <StepSummary
                    currentPlan={currentPlan} setCurrentPlan={setCurrentPlan}
                    userRole={userRole}
                    userName={userName}
                />
            )}

            <Divider />

            <Space>
                {currentStep > 0 && (
                    <Button ghost onClick={prev}>
                        Back
                    </Button>
                )}
                {currentStep < 4 && stepLocationStatus !== 'error' && stepConditionsStatus !== 'error' && stepGoalsStatus !== 'error' && stepPracticesStatus !== 'error' && (
                    <Button type="primary" onClick={next}>
                        Next
                    </Button>
                )}
                {currentStep < 4 && (stepLocationStatus === 'error' || stepConditionsStatus === 'error' || stepGoalsStatus === 'error' || stepPracticesStatus === 'error') && (
                    <Button type="primary" disabled>
                        Next
                    </Button>
                )}

                <span style={{ marginLeft: 8, fontStyle: 'italic', fontSize: 14, color: 'red' }}>
                    {stepLocationStatus === 'error' && 'Please complete the Location step before proceeding.'}
                    {stepConditionsStatus === 'error' && 'Please complete the Conditions step before proceeding.'}
                    {stepGoalsStatus === 'error' && 'Please complete the Goals step before proceeding.'}
                    {stepPracticesStatus === 'error' && 'Please complete the Practices step before proceeding.'}
                </span>
            </Space> 
            */