import { Alert, Button, Card, Divider, Space, Spin, Steps, Table, Typography } from 'antd';
import { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import StartUp from './StartUp';
import StepWhoWhere from './StepWhoWhere';
import StepConditions from './StepConditions';
import StepGoals from './StepGoals';
import StepPractices from './StepPractices';
import StepSummary from './StepSummary';


const { Step } = Steps;
const { Text, Title } = Typography;
const API_BASE = 'https://agwater.org:5556';

const PlanEditor = ({
    currentPlan,
    userRole, setUserRole,
    userName,
    userID, setUserID,
    selectedTMDLs, setSelectedTMDLs,
    availableTMDLs,
    setUserName,
    setLoggingIn,
    currentStep, setCurrentStep,
    stepLocationStatus,
    stepConditionsStatus,
    stepGoalsStatus,
    stepPracticesStatus,
    sites, setSites,
    commodities,
    selectedCommodities, setSelectedCommodities,
    sitePhotos, setSitePhotos,
    siteName, setSiteName,
    siteID, setSiteID,
    siteDescription, setSiteDescription,
    siteLocator, setSiteLocator,
    latitude, setLatitude,
    longitude, setLongitude,
    agwqmArea, setAgwqmArea,
    agwqRegion, setAgwqRegion,
    regionalSpecialist, setRegionalSpecialist,
    regionalSpecialistEmail, setRegionalSpecialistEmail,
    regionalSpecialistPhone, setRegionalSpecialistPhone,
    adminRulesLink, setAdminRulesLink,
    areaPlanLink, setAreaPlanLink,
    setStepLocationStatus, setStepConditionsStatus, setStepGoalsStatus, setStepPracticesStatus,
    concerns, selectedConcerns, filteredQuestions, selectedQuestions, setSelectedQuestions,
    setSelectedConcerns,
    goals, selectedGoals, setSelectedGoals,
    selectedPractices, concernQuestions, areaRules,
    filteredRecommendedPractices, selectedPracticeIds, setSelectedPracticeIds,


}) => {
    const next = () => setCurrentStep((step) => step + 1);
    const prev = () => setCurrentStep((step) => step - 1);

    return (
        <>

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
                    userRole={userRole} setUserRole={setUserRole}
                    userID={userID.current} setUserID={setUserID}
                    setUserName={setUserName} setLoggingIn={setLoggingIn}
                    sites={sites} setSites={setSites}
                    commoditiesData={commodities}
                    selectedCommodities={selectedCommodities}
                    setSelectedCommodities={setSelectedCommodities}
                    sitePhotos={sitePhotos} setSitePhotos={setSitePhotos}
                    siteName={siteName} setSiteName={setSiteName}
                    siteID={siteID.current} setSiteID={setSiteID}
                    siteDescription={siteDescription} setSiteDescription={setSiteDescription}
                    siteLocator={siteLocator} setSiteLocator={setSiteLocator}
                    _latitude={latitude} setLatitude={setLatitude}
                    _longitude={longitude} setLongitude={setLongitude}
                    agwqmArea={agwqmArea} setAgwqmArea={setAgwqmArea}
                    agwqRegion={agwqRegion} setAgwqRegion={setAgwqRegion}
                    regionalSpecialist={regionalSpecialist} setRegionalSpecialist={setRegionalSpecialist}
                    regionalSpecialistEmail={regionalSpecialistEmail} setRegionalSpecialistEmail={setRegionalSpecialistEmail}
                    regionalSpecialistPhone={regionalSpecialistPhone} setRegionalSpecialistPhone={setRegionalSpecialistPhone}
                    adminRulesLink={adminRulesLink} setAdminRulesLink={setAdminRulesLink}
                    areaPlanLink={areaPlanLink} setAreaPlanLink={setAreaPlanLink}
                    setError={setStepLocationStatus}
                />
            )}

            {currentStep === 1 && (
                <StepConditions
                    concernData={concerns}
                    selectedConcerns={selectedConcerns} setSelectedConcerns={setSelectedConcerns}
                    filteredQuestions={filteredQuestions}
                    selectedQuestions={selectedQuestions} setSelectedQuestions={setSelectedQuestions}
                    setError={setStepConditionsStatus}
                />
            )}

            {currentStep === 2 && (
                <StepGoals
                    selectedGoals={selectedGoals} setSelectedGoals={setSelectedGoals}
                    goalData={goals}
                    setError={setStepGoalsStatus}
                />
            )}

            {currentStep === 3 && (
                <StepPractices
                    userRole={userRole}
                    areaRules={areaRules}
                    agwqmArea={agwqmArea}
                    recommendedPractices={filteredRecommendedPractices}
                    selectedPracticeIds={selectedPracticeIds} setSelectedPracticeIds={setSelectedPracticeIds}
                    setError={setStepPracticesStatus}
                />
            )}

            {currentStep === 4 && (
                <StepSummary
                    userRole={userRole}
                    userName={userName}
                    latitude={latitude}
                    longitude={longitude}
                    agWqMArea={agwqmArea}
                    region={agwqRegion}
                    regionalSpecialist={regionalSpecialist}
                    regionalSpecialistEmail={regionalSpecialistEmail}
                    regionalSpecialistPhone={regionalSpecialistPhone}
                    adminRulesLink={adminRulesLink}
                    areaPlanLink={areaPlanLink}
                    siteName={siteName}
                    site={sites.find(s => s.id === siteID.current) || null}
                    sitePhotos={sitePhotos}
                    selectedCommodities={selectedCommodities}
                    selectedConcerns={selectedConcerns}
                    selectedQuestions={selectedQuestions}
                    selectedGoals={selectedGoals}
                    goalData={goals}
                    selectedPractices={selectedPractices}
                    concernQuestions={concernQuestions}
                    areaRules={areaRules}
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
    setCurrentPlanID: PropTypes.func.isRequired,
    userRole: PropTypes.string,
    userName: PropTypes.string,
    setUserRole: PropTypes.func.isRequired,
    userID: PropTypes.shape({ current: PropTypes.oneOfType([PropTypes.string, PropTypes.number]) }),
    setUserID: PropTypes.func.isRequired,
    selectedTMDLs: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object])),
    setSelectedTMDLs: PropTypes.func.isRequired,
    availableTMDLs: PropTypes.arrayOf(PropTypes.object),
    setUserName: PropTypes.func.isRequired,
    setLoggingIn: PropTypes.func.isRequired,
    setCurrentStep: PropTypes.func.isRequired,
    currentStep: PropTypes.number.isRequired,
    setAreaPlanLink: PropTypes.func.isRequired,
    areaPlanLink: PropTypes.string,
    setStepLocationStatus: PropTypes.func.isRequired,
    setStepConditionsStatus: PropTypes.func.isRequired,
    setStepGoalsStatus: PropTypes.func.isRequired,
    setStepPracticesStatus: PropTypes.func.isRequired,
    stepLocationStatus: PropTypes.string,
    stepConditionsStatus: PropTypes.string,
    stepGoalsStatus: PropTypes.string,
    stepPracticesStatus: PropTypes.string,
    sites: PropTypes.arrayOf(PropTypes.object),
    setSites: PropTypes.func.isRequired,
    commodities: PropTypes.arrayOf(PropTypes.object),
    selectedCommodities: PropTypes.arrayOf(PropTypes.object),
    setSelectedCommodities: PropTypes.func.isRequired,
    sitePhotos: PropTypes.arrayOf(PropTypes.object),
    setSitePhotos: PropTypes.func.isRequired,
    siteName: PropTypes.string,
    setSiteName: PropTypes.func.isRequired,
    siteID: PropTypes.shape({ current: PropTypes.oneOfType([PropTypes.string, PropTypes.number]) }),
    setSiteID: PropTypes.func.isRequired,
    siteDescription: PropTypes.string,
    setSiteDescription: PropTypes.func.isRequired,
    siteLocator: PropTypes.string,
    setSiteLocator: PropTypes.func.isRequired,
    latitude: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    setLatitude: PropTypes.func.isRequired,
    longitude: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    setLongitude: PropTypes.func.isRequired,
    agwqmArea: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    setAgwqmArea: PropTypes.func.isRequired,
    agwqRegion: PropTypes.string,
    setAgwqRegion: PropTypes.func.isRequired,
    regionalSpecialist: PropTypes.string,
    setRegionalSpecialist: PropTypes.func.isRequired,
    regionalSpecialistEmail: PropTypes.string,
    setRegionalSpecialistEmail: PropTypes.func.isRequired,
    regionalSpecialistPhone: PropTypes.string,
    setRegionalSpecialistPhone: PropTypes.func.isRequired,
    adminRulesLink: PropTypes.string,
    setAdminRulesLink: PropTypes.func.isRequired,
    concerns: PropTypes.arrayOf(PropTypes.object),
    selectedConcerns: PropTypes.arrayOf(PropTypes.object),
    setSelectedConcerns: PropTypes.func.isRequired,
    filteredQuestions: PropTypes.arrayOf(PropTypes.object),
    selectedQuestions: PropTypes.arrayOf(PropTypes.object),
    setSelectedQuestions: PropTypes.func.isRequired,
    goals: PropTypes.arrayOf(PropTypes.object),
    selectedGoals: PropTypes.arrayOf(PropTypes.object),
    setSelectedGoals: PropTypes.func.isRequired,
    filteredRecommendedPractices: PropTypes.arrayOf(PropTypes.object),
    selectedPracticeIds: PropTypes.arrayOf(PropTypes.number),
    setSelectedPracticeIds: PropTypes.func.isRequired,
    selectedPractices: PropTypes.arrayOf(PropTypes.object),
    concernQuestions: PropTypes.arrayOf(PropTypes.object),
    areaRules: PropTypes.arrayOf(PropTypes.object),
};

export default PlanEditor;