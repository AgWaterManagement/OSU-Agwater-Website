import { useCallback, useEffect, useRef, useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Row,
  Space,
  Tag,
  Typography,
  message,
} from "antd";

import { pilot3Api } from "./api.ts";
import type { ConfigResponse, HealthResponse, Job, JobOptions, ReadyResponse, ResultsResponse } from "./types.ts";
import { formatDate, hasArtifacts, isJobRunning, paperKey, paperLink, paperMeta, statusColor } from "./utils.ts";
import Pilot3Login from "./Pilot3Login.tsx";
import type { Pilot3User } from "./auth.ts";

const { Text, Title, Paragraph } = Typography;

type ResultsView = "digest" | "results" | null;

type FormValues = {
  year: number;
  max_results: number;
  email_k: number;
  recipient_name: string;
  subject?: string;
  summarize: boolean;
  scholar: boolean;
  map: boolean;
  emailCopy: boolean;
};

const DEFAULT_FORM_VALUES: FormValues = {
  year: new Date().getFullYear(),
  max_results: 100,
  email_k: 5,
  recipient_name: "Research team",
  subject: "",
  summarize: false,
  scholar: false,
  map: false,
  emailCopy: false,
};

export function SmartTapPilot3Workspace() {
  const [form] = Form.useForm<FormValues>();
  const [authUser, setAuthUser] = useState<Pilot3User | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [ready, setReady] = useState<ReadyResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [jobLookupDone, setJobLookupDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<{ text: string; type: "info" | "error" } | null>(null);
  const [resultsView, setResultsView] = useState<ResultsView>(null);
  const [digestText, setDigestText] = useState("");
  const [resultsData, setResultsData] = useState<ResultsResponse | null>(null);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);
  const pendingEmailRef = useRef<{ jobId: string; subject: string } | null>(null);

  const refreshLatest = useCallback(async () => {
    try {
      const latest = await pilot3Api.latestJob();
      setJob(latest);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error.";
      if (message.includes("No Pilot 3 jobs")) {
        setJob(null);
      } else {
        setFormMessage({ text: message, type: "error" });
      }
    } finally {
      setJobLookupDone(true);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        const [healthPayload, readyPayload, configPayload] = await Promise.all([
          pilot3Api.health(),
          pilot3Api.ready(),
          pilot3Api.config(),
        ]);
        if (!isMounted) {
          return;
        }
        setHealth(healthPayload);
        setReady(readyPayload);
        form.setFieldsValue({
          year: (configPayload as ConfigResponse).target_year,
          max_results: (configPayload as ConfigResponse).default_max_results,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setHealthError(error instanceof Error ? error.message : "Unknown error.");
      }
      await refreshLatest();
    }

    initialize();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const running = job ? isJobRunning(job.status) : false;

    if (running && pollRef.current === null) {
      pollRef.current = window.setInterval(refreshLatest, 3000);
    }
    if (!running && pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current !== null) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [job, refreshLatest]);

  useEffect(() => {
    const pending = pendingEmailRef.current;
    if (!job || !pending || job.id !== pending.jobId) {
      return;
    }
    if (job.status !== "completed" || !job.artifacts?.digest) {
      return;
    }
    pendingEmailRef.current = null;

    if (!authUser?.email) {
      return;
    }

    (async () => {
      try {
        const digestContent = await pilot3Api.digest(job.id);
        await pilot3Api.sendEmail({
          email: authUser.email!,
          subject: pending.subject,
          pilot3_digest: digestContent,
        });
        message.success(`Digest emailed to ${authUser.email}`);
      } catch (error) {
        message.error(error instanceof Error ? error.message : "Failed to email digest.");
      }
    })();
  }, [job, authUser]);

  async function handleSubmit(values: FormValues) {
    setSubmitting(true);
    setFormMessage({ text: "Submitting the run…", type: "info" });

    const payload: JobOptions = {
      year: values.year,
      max_results: values.max_results,
      email_k: values.email_k,
      recipient_name: values.recipient_name,
      subject: values.subject ?? "",
      summarize: values.summarize,
      include_google_scholar: values.scholar,
      include_map: values.map,
      model: "openrouter/elephant-alpha",
      scholar_pages: 2,
      scholar_num: 10,
    };

    try {
      const newJob = await pilot3Api.startJob(payload);
      setJob(newJob);
      pendingEmailRef.current = values.emailCopy && authUser?.email
        ? { jobId: newJob.id, subject: values.subject ?? "" }
        : null;
      setFormMessage({ text: "Run accepted. Status will refresh automatically.", type: "info" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error.";
      setFormMessage({ text: message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  function closeResults() {
    setResultsView(null);
    setDigestText("");
    setResultsData(null);
    setResultsError(null);
  }

  async function showDigest() {
    if (!job) {
      return;
    }
    setResultsError(null);
    try {
      const digest = await pilot3Api.digest(job.id);
      setDigestText(digest);
      setResultsData(null);
      setResultsView("digest");
    } catch (error) {
      setResultsError(error instanceof Error ? error.message : "Unknown error.");
    }
  }

  async function showResults() {
    if (!job) {
      return;
    }
    setResultsError(null);
    try {
      const results = await pilot3Api.results(job.id);
      setResultsData(results);
      setDigestText("");
      setResultsView("results");
    } catch (error) {
      setResultsError(error instanceof Error ? error.message : "Unknown error.");
    }
  }

  const serviceReady = health?.status === "ok" && ready?.status === "ready";
  const running = job ? isJobRunning(job.status) : false;
  const artifactsReady = hasArtifacts(job);

  if (!authUser) {
    return (
      <div className="space-y-6">
        <Card title={<Title level={2} className="m-0 font-display text-xl">Sign in required</Title>}>
          <Pilot3Login onLoginSuccess={(user) => setAuthUser(user)} />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2 text-xs text-ink/60">
        <span>
          Signed in as <b>{authUser.username}</b>
        </span>
        <Button type="link" size="small" onClick={() => setAuthUser(null)}>
          Sign Out
        </Button>
      </div>
      <div className="rounded-2xl bg-[linear-gradient(135deg,#0e3c36_0%,#1b614e_70%,#2f785b_100%)] px-6 py-5 text-sand shadow-soft">
        <Row justify="space-between" align="bottom" gutter={[24, 16]}>
          <Col xs={24} md={16}>
            <Text className="text-xs font-bold uppercase tracking-[0.15em] text-[#9fd4bd]">SmartTap · Pilot 3</Text>
            <Title level={1} className="mt-1 font-display text-4xl text-white">Hydrology research digest</Title>
            <Paragraph className="mt-2 text-sm text-[#d7ebe2]">
              Retrieve, rank, and review current Oregon and Pacific Northwest water research.
            </Paragraph>
          </Col>
          <Col xs={24} md={8}>
            <Space align="center" className="rounded-xl border border-white/20 bg-black/10 px-4 py-3">
              <Badge status={healthError ? "error" : serviceReady ? "success" : "processing"} />
              <div>
                <Text className="block font-semibold text-white">
                  {healthError ? "Service unavailable" : serviceReady ? "Service ready" : "Checking service"}
                </Text>
                {/* <Text className="block text-xs text-[#cae1d7]">
                  {healthError ?? ready?.status?.replace("_", " ") ?? "Connecting to Pilot 3"}
                </Text> */}
              </div>
            </Space>
          </Col>
        </Row>
      </div>

      {healthError ? (
        <Alert type="error" showIcon message="API metadata could not be loaded" description={healthError} />
      ) : null}

      <Row gutter={[24, 24]} align="top">
        <Col xs={24} lg={13}>
          <Card
            // title={
            //   <div>
            //     <Text className="block text-xs font-bold uppercase tracking-[0.15em] text-forest">New run</Text>
            //     <Title level={2} className="m-0 font-display text-xl">Build a literature digest</Title>
            //   </div>
            // }
            title={<Title level={2} className="m-0 font-display text-xl">Build a literature digest</Title>}
            extra={<Tag color="green">One run at a time</Tag>}
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={DEFAULT_FORM_VALUES}
              onFinish={handleSubmit}
              disabled={submitting || running}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Publication year" name="year" rules={[{ required: true }]}>
                    <InputNumber className="w-full" min={1900} max={2100} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="OpenAlex papers" name="max_results" rules={[{ required: true }]}>
                    <InputNumber className="w-full" min={1} max={2000} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Items per source" name="email_k" rules={[{ required: true }]}>
                    <InputNumber className="w-full" min={1} max={20} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Greeting name" name="recipient_name" rules={[{ required: true }]}>
                    <Input maxLength={200} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label={<span>Digest subject <Text type="secondary">optional</Text></span>} name="subject">
                <Input maxLength={200} placeholder="Weekly hydrology research update" />
              </Form.Item>

              <Divider orientation="left" plain>Optional stages</Divider>

              <Space direction="vertical" size="middle" className="w-full">
                <Form.Item name="summarize" valuePropName="checked" className="m-0">
                  <Checkbox>
                    <Text strong>OpenRouter summaries</Text>
                    <br />
                    <Text type="secondary" className="text-xs">
                      Requires the server-side OpenRouter key and may incur usage cost.
                    </Text>
                  </Checkbox>
                </Form.Item>
                <Form.Item name="scholar" valuePropName="checked" className="m-0">
                  <Checkbox>
                    <Text strong>Google Scholar results</Text>
                    <br />
                    <Text type="secondary" className="text-xs">
                      Requires the server-side SerpApi key.
                    </Text>
                  </Checkbox>
                </Form.Item>
                <Form.Item name="map" valuePropName="checked" className="m-0">
                  <Checkbox>
                    <Text strong>Oregon/PNW tag file</Text>
                    <br />
                    <Text type="secondary" className="text-xs">
                      Creates transparent keyword-based regional tags.
                    </Text>
                  </Checkbox>
                </Form.Item>
                <Form.Item name="emailCopy" valuePropName="checked" className="m-0">
                  <Checkbox disabled={!authUser?.email}>
                    <Text strong>Email me a copy</Text>
                    <br />
                    <Text type="secondary" className="text-xs">
                      {authUser?.email
                        ? `Sends the finished digest to ${authUser.email} once the run completes.`
                        : "Add an email address to your account to enable this option."}
                    </Text>
                  </Checkbox>
                </Form.Item>
              </Space>

              {formMessage ? (
                <Paragraph className={`mt-4 text-sm ${formMessage.type === "error" ? "text-[#a73b3b]" : "text-ink/65"}`}>
                  {formMessage.text}
                </Paragraph>
              ) : null}

              <Form.Item className="mt-4 mb-0">
                <Button type="primary" htmlType="submit" block loading={submitting} disabled={running}>
                  {running ? "Run in progress…" : "Start digest run"}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={11}>
          <Card
            // title={
            //   <div>
            //     <Text className="block text-xs font-bold uppercase tracking-[0.15em] text-forest">Latest activity</Text>
            //     <Title level={2} className="m-0 font-display text-xl">Run status</Title>
            //   </div>
            // }
            title={<Title level={2} className="m-0 font-display text-xl">Run status</Title>}
            extra={
              <Button onClick={refreshLatest} disabled={!jobLookupDone && !job}>
                Refresh
              </Button>
            }
          >
            {!job ? (
              <Empty description="No Pilot 3 runs have been recorded yet." />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <Tag color={statusColor(job.status)} className="uppercase">
                    {job.status}
                  </Tag>
                  <Text code className="text-xs">{job.id}</Text>
                </div>

                {/* <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label="Created">{formatDate(job.created_at_utc)}</Descriptions.Item>
                  <Descriptions.Item label="Year">{job.options?.year ?? "—"}</Descriptions.Item>
                  <Descriptions.Item label="Records requested">
                    {job.options?.max_results != null ? Number(job.options.max_results).toLocaleString() : "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Completed">{formatDate(job.completed_at_utc)}</Descriptions.Item>
                </Descriptions> */}

                <Row gutter={12}>
                  <Col span={12}>
                    <Card size="small" title="Created" className="text-center">
                      <Text>{formatDate(job.created_at_utc)}</Text>
                    </Card>
                    <Card size="small" title="Year" className="text-center">
                      <Text>{job.options?.year ?? "—"}</Text>
                    </Card>
                  </Col>

                  <Col span={12}>
                    <Card size="small" title="Records requested" className="text-center">
                      <Text>{job.options?.max_results != null ? Number(job.options.max_results).toLocaleString() : "—"}</Text>
                    </Card>
                    <Card size="small" title="Completed" className="text-center">
                      <Text>{formatDate(job.completed_at_utc)}</Text>
                    </Card>

                  </Col>
                </Row>

                {job.error ? <Alert type="error" showIcon message={job.error} /> : null}

                {artifactsReady ? (
                  <Row gutter={12}>
                    <Col span={12}>
                      <Button type="primary" block disabled={!job.artifacts?.digest} onClick={showDigest}>
                        View digest
                      </Button>
                    </Col>
                    <Col span={12}>
                      <Button block disabled={!job.artifacts?.results} onClick={showResults}>
                        View ranked results
                      </Button>
                    </Col>
                  </Row>
                ) : null}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {resultsView ? (
        <Card
          title={
            <div>
              <Text className="block text-xs font-bold uppercase tracking-[0.15em] text-forest">Output</Text>
              <Title level={2} className="m-0 font-display text-xl">
                {resultsView === "digest" ? "Latest digest" : "Ranked research"}
              </Title>
            </div>
          }
          extra={<Button onClick={closeResults}>Close</Button>}
        >
          {resultsError ? <Alert type="error" showIcon message={resultsError} className="mb-4" /> : null}

          {resultsView === "digest" ? (
            <pre className="max-h-[620px] overflow-auto rounded-md bg-[#102a2b] p-5 text-sm leading-6 text-[#e7f4ed]">
              {digestText}
            </pre>
          ) : null}

          {resultsView === "results" && resultsData ? (
            <div className="space-y-4">
              <Text type="secondary">
                {resultsData.global_highlights.length} OpenAlex highlights ·{" "}
                {(resultsData.google_scholar_top5 ?? []).length} Google Scholar highlights
              </Text>
              <List
                grid={{ gutter: 16, xs: 1, sm: 1, md: 2 }}
                dataSource={resultsData.global_highlights}
                renderItem={(paper, index) => {
                  const href = paperLink(paper);
                  return (
                    <List.Item key={paperKey(paper, index)}>
                      <Card size="small">
                        <Title level={5} className="m-0 font-display">{paper.title || "Untitled"}</Title>
                        <Text type="secondary" className="text-xs">{paperMeta(paper)}</Text>
                        {href ? (
                          <div className="mt-2">
                            <a href={href} target="_blank" rel="noopener noreferrer">Open source</a>
                          </div>
                        ) : null}
                      </Card>
                    </List.Item>
                  );
                }}
              />
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}

export default SmartTapPilot3Workspace;
