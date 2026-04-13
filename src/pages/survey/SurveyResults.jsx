import { useEffect, useMemo, useState } from "react";
import { Alert, Card, Collapse, Col, Row, Select, Space, Spin, Tag, Typography } from "antd";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useParams} from "react-router";
const { Title, Text, Paragraph } = Typography;

const RESULTS_ENDPOINT = "https://agwater.org:5556/survey/results";
//const SURVEY_QUESTIONS_ENDPOINT = "https://agwater.org:5556/survey/questions";
const SURVEY_LIST_ENDPOINT = "https://agwater.org:5556/survey/list";

const prettifyKey = (value) =>
  value
    ?.replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

const formatAnswerValue = (rawValue) => {
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return "(No response)";
  }

  if (typeof rawValue !== "string") {
    return String(rawValue);
  }

  const trimmed = rawValue.trim();
  if (!trimmed) return "(No response)";

  try {
    const parsed = JSON.parse(trimmed);

    if (Array.isArray(parsed)) {
      return parsed.length ? parsed.join(", ") : "(No response)";
    }

    if (parsed && typeof parsed === "object") {
      const entries = Object.entries(parsed).map(([key, value]) => `${prettifyKey(key)}: ${value}`);
      return entries.join("; ");
    }
  } catch {
    return trimmed;
  }

  return trimmed;
};

const buildResponseFrequencyData = (answers) => {


  return answers.map((answerItem) => {

    let weightDistributions = null;

    // if the answerItem has weights and they are all non-negative, compute
    // the histogram of the weights, assuming 5 bins
    if (answerItem?.weights && Array.isArray(answerItem.weights) && answerItem.weights.every(w => w >= 0)) {
      const _weightDistributions = [0, 0, 0, 0, 0]; // assuming weights are 1-5
      for (const weight of answerItem?.weights || []) {
        _weightDistributions[weight] += 1;
      }
      weightDistributions = [
        { label: 'Low Priority', count: _weightDistributions[0] },
        { label: 'Medium Priority', count: _weightDistributions[1] },
        { label: 'High Priority', count: _weightDistributions[2] },
        { label: 'Very High Priority', count: _weightDistributions[3] },
      ];
    }

    return {
      answer: formatAnswerValue(answerItem?.answer),
      count: Number(answerItem?.count) || 0,
      weights: answerItem?.weights || null,
      weightDistributions: weightDistributions
    }
  });
}

const buildResultsSummary = (questionItem) => {
  const sortedAnswers = [...(questionItem.answers || [])].sort((a, b) => b.count - a.count);

  const mostCommon = sortedAnswers[0];

  return {
    key: questionItem.question_column || questionItem.question,
    question: questionItem.question_label || questionItem.question_name,
    questionType: questionItem.question_type,
    totalAnswers: questionItem.total_answers,
    uniqueAnswers: questionItem.unique_answers,
    firstAnsweredAt: questionItem.first_answered_at,
    lastAnsweredAt: questionItem.last_answered_at,
    mostCommonAnswer: mostCommon ? formatAnswerValue(mostCommon.answer) : "(No responses)",
    mostCommonCount: mostCommon?.count || 0,
    mostCommonPercent: mostCommon?.percent || 0,
    responseFrequencyData: buildResponseFrequencyData(sortedAnswers, questionItem.question_type),
    topAnswers: sortedAnswers.slice(0, 5).map((answer) => ({
      answer: formatAnswerValue(answer.answer),
      count: answer.count,
      percent: answer.percent,
    })),
  };
};

export default function SurveyResults() {
 
  const params = useParams();
  let _surveyID = decodeURIComponent(params.id).replaceAll(' ','_');
  console.log('Survey Results for survey id ', params.id);
  if ( _surveyID && !isNaN(Number(_surveyID)) ) {
    _surveyID = Number(_surveyID);
    //setSurveyId(_surveyID);
  } else {
    _surveyID = null;
  }

  const [surveyId, setSurveyId] = useState(_surveyID ? _surveyID : 4);
  const [surveyOptions, setSurveyOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [surveyListLoading, setSurveyListLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);


  useEffect(() => {
    const fetchSurveyList = async () => {
      setSurveyListLoading(true);

      try {
        const response = await fetch(SURVEY_LIST_ENDPOINT, {
          headers: {
            "X-API-Key": "survey-web-app",
          },
        });

        if (!response.ok) {
          throw new Error(`Survey list request failed with status ${response.status}`);
        }

        const payload = await response.json();

        if (!payload.success || !Array.isArray(payload.data)) {
          throw new Error(payload.message || "Invalid survey list format");
        }

        const options = payload.data
          .filter((item) => item && item.id !== undefined && item.id !== null)
          .map((item) => ({
            label: `${item.name} (ID: ${item.id})`,
            value: Number(item.id),
          }));

        setSurveyOptions(options);

        if (options.length > 0) {
          setSurveyId((previousValue) => {
            const hasPreviousValue = options.some((option) => option.value === previousValue);
            return hasPreviousValue ? previousValue : options[0].value;
          });
        }
      } catch (fetchError) {
        setError(fetchError?.message || "Failed to fetch survey list");
      } finally {
        setSurveyListLoading(false);
      }
    };

    fetchSurveyList();
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${RESULTS_ENDPOINT}?survey_id=${encodeURIComponent(surveyId)}`, {
          headers: {
            "X-API-Key": "survey-web-app",
          },
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = await response.json();

        if (!payload.success || !payload.data || !Array.isArray(payload.data.question_results)) {
          throw new Error(payload.message || "Invalid survey results format");
        }

        setData(payload.data);

      } catch (fetchError) {
        setError(fetchError?.message || "Failed to fetch survey results");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [surveyId]);

  const summaries = useMemo(() => {
    if (!data?.question_results) return [];
    return data.question_results.map(buildResultsSummary);
  }, [data]);

  const totalResponses = useMemo(() => {
    if (!summaries.length) return 0;
    return Math.max(...summaries.map((item) => item.totalAnswers || 0));
  }, [summaries]);

  const getChart = (summary) => {
    if (!summary.responseFrequencyData || summary.responseFrequencyData.length === 0) {
      return <Text type="secondary">No response frequency data available for this question.</Text>;
    }

    if (Object.keys(summary.questionType)[0] === "RankingGroup") {
      // in this case, create a series of vertical bar charts, one for each answer,
      // showing the distribution of weights for that answer
      return (<>
        {summary.responseFrequencyData.map((answerItem, index) => (
          <ResponsiveContainer key={'rc' + index} width="100%" height={150}>
            <Text strong align='center'>{answerItem.answer}</Text>
            <BarChart
              key={"bar" + index}
              data={answerItem.weightDistributions}
              margin={{ top: 8, right: 0, left: 0, bottom: 8 }}
              style={{ width: '100%', height: '120px'}}
              responsive
            >
              <XAxis dataKey="label" stroke="white" />
              <YAxis stroke="white" />
               {/* <Tooltip formatter={(value) => [`${value}`, "Count"]} /> */}
              <Bar dataKey="count" fill="#1677ff" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>

        ))}
      </>
      )
    }

    return (<>
      <ResponsiveContainer>
        <BarChart layout="vertical" data={summary.responseFrequencyData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} stroke="white" />
          <YAxis
            type="category"
            dataKey="answer"
            width={200}
            stroke="white"
            tickFormatter={(value) => (value.length > 28 ? `${value.slice(0, 28)}...` : value)}
          />
          {/* <Tooltip formatter={(value) => [`${value}`, "Frequency"]} /> */}
          <Bar dataKey="count" fill="#1677ff" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </>)
  };

  const questionPanels = useMemo(
    () =>
      summaries.map((summary, index) => ({
        key: summary.key || `${index}`,
        label: `Q${index + 1}: ${summary.question || summary.key}`,
        children: (
          <Row gutter={[6, 6]} align="top" style={{height: '32em'}}>
            <Col xs={24} lg={summary.responseFrequencyData.length > 0 ? 10 : 24}>
              <Space direction="vertical" size="small" style={{ width: "100%" }}>
                <Text>
                  <Text strong>Question Code:</Text> {summary.key}</Text>
                <Text>
                  <Text strong>Total answers:</Text> {summary.totalAnswers} • <Text strong>Unique answers:</Text>{" "}
                  {summary.uniqueAnswers}
                </Text>
                <Text>
                  <Text strong>Most common:</Text> {summary.mostCommonAnswer} ({summary.mostCommonCount},{" "}
                  {summary.mostCommonPercent.toFixed(1)}%)
                </Text>
                <Text type="secondary">
                  {summary.firstAnsweredAt} → {summary.lastAnsweredAt}
                </Text>

                <Paragraph strong style={{ marginTop: 8, marginBottom: 0 }}>Responses</Paragraph>
                {summary.topAnswers.map((item, answerIndex) => (
                  <Text key={`${summary.key}-answer-${answerIndex}`}>
                    {answerIndex + 1}. {item.answer} — {item.count} ({item.percent.toFixed(1)}%)
                  </Text>
                ))}
              </Space>
            </Col>

            {summary.responseFrequencyData.length > 0 && (
              <Col xs={24} lg={14}>
                <Paragraph strong style={{ marginBottom: 8 }}>Response frequency</Paragraph>
                <div style={{ width: "100%", height: 360, overflowY: "auto", overflowX: "hidden" }}>
                  {getChart(summary)}
                </div>
              </Col>
            )}
          </Row>
        ),
      })),
    [summaries]
  );

  return (
    <div style={{ padding: 16 }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Title level={3} style={{ marginBottom: 0 }}>Survey Results Summary</Title>

        { _surveyID == null && (
        <Card>
          <Space wrap>
            <Text strong>Survey ID</Text>
            <Select
              style={{ minWidth: 320 }}
              options={surveyOptions}
              value={surveyId}
              loading={surveyListLoading}
              placeholder="Select a survey"
              onChange={(value) => setSurveyId(value)}
            />
          </Space>
        </Card>
        )}

        {error && <Alert type="error" showIcon message="Unable to load survey results" description={error} />}

        <Spin spinning={loading} tip="Fetching survey results...">
          {data && (
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Card>
                <Space wrap>
                  <Tag color="blue">Survey ID: {data.survey_id}</Tag>
                  <Tag color="green">Questions: {data.question_count}</Tag>
                  <Tag color="blue">Respondents: {data.unique_sessions}</Tag>
                  <Tag color="purple">Responses: {totalResponses}</Tag>
                </Space>
              </Card>

              <Collapse items={questionPanels} />
            </Space>
          )}
        </Spin>
      </Space>
    </div>
  );
}