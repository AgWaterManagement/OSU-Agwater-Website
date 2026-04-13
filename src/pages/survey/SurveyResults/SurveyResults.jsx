import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Collapse, InputNumber, Space, Spin, Tag, Typography } from "antd";

const { Title, Text, Paragraph } = Typography;

const RESULTS_ENDPOINT = "https://agwater.org:5556/survey/results";

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

const buildQuestionSummary = (questionItem) => {
  const sortedAnswers = [...(questionItem.answers || [])].sort((a, b) => b.count - a.count);

  const mostCommon = sortedAnswers[0];

  return {
    key: questionItem.question_column || questionItem.question,
    question: questionItem.question,
    totalAnswers: questionItem.total_answers,
    uniqueAnswers: questionItem.unique_answers,
    firstAnsweredAt: questionItem.first_answered_at,
    lastAnsweredAt: questionItem.last_answered_at,
    mostCommonAnswer: mostCommon ? formatAnswerValue(mostCommon.answer) : "(No responses)",
    mostCommonCount: mostCommon?.count || 0,
    mostCommonPercent: mostCommon?.percent || 0,
    allAnswers: sortedAnswers.map((answer) => ({
      answer: formatAnswerValue(answer.answer),
      count: answer.count,
      percent: answer.percent,
    })),
  };
};

export default function SurveyResults() {
  const [surveyIdInput, setSurveyIdInput] = useState(2);
  const [surveyId, setSurveyId] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);

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

        if (!payload.success || !payload.data || !Array.isArray(payload.data.questions)) {
          throw new Error(payload.message || "Invalid survey results format");
        }

        setResults(payload.data);
      } catch (fetchError) {
        setError(fetchError?.message || "Failed to fetch survey results");
        setResults(null);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [surveyId]);

  const summaries = useMemo(() => {
    if (!results?.questions) return [];
    return results.questions.map(buildQuestionSummary);
  }, [results]);

  const totalResponses = useMemo(() => {
    if (!summaries.length) return 0;
    return Math.max(...summaries.map((item) => item.totalAnswers || 0));
  }, [summaries]);

  const questionPanels = useMemo(
    () =>
      summaries.map((summary, index) => ({
        key: summary.key || `${index}`,
        label: `Q${index + 1}: ${summary.question}`,
        children: (
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
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

            <Paragraph strong style={{ marginTop: 8, marginBottom: 0 }}>All responses</Paragraph>
            {summary.allAnswers.map((item, answerIndex) => (
              <Text key={`${summary.key}-answer-${answerIndex}`}>
                {answerIndex + 1}. {item.answer} — {item.count} ({item.percent.toFixed(1)}%)
              </Text>
            ))}
          </Space>
        ),
      })),
    [summaries]
  );

  return (
    <div style={{ padding: 16 }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Title level={3} style={{ marginBottom: 0 }}>Survey Results Summary</Title>

        <Card>
          <Space wrap>
            <Text strong>Survey ID</Text>
            <InputNumber min={1} value={surveyIdInput} onChange={(value) => setSurveyIdInput(value || 1)} />
            <Button type="primary" onClick={() => setSurveyId(surveyIdInput || 1)}>
              Load Results
            </Button>
          </Space>
        </Card>

        {error && <Alert type="error" showIcon message="Unable to load survey results" description={error} />}

        <Spin spinning={loading} tip="Fetching survey results...">
          {results && (
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Card>
                <Space wrap>
                  <Tag color="blue">Survey ID: {results.survey_id}</Tag>
                  <Tag color="green">Questions: {results.question_count}</Tag>
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