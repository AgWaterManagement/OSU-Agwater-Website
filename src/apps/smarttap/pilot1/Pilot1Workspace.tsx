import { FormEvent, useEffect, useMemo, useState } from "react";

import { Row, Col, Button, Card, Collapse, Input, Typography, Table } from "antd";

import { smartTapApi } from "./api.ts";
import { ChartRenderer } from "./ChartRenderer.tsx";
import type { ChatMessage, HealthResponse, JsonRecord, UiStatus, VisualizationResponse } from "./types.ts";
import {
  assistantMessageForResult,
  dataframeToCsv,
  displaySpec,
  downloadTextFile,
  formatLabel,
  formatValue,
  nextStatus,
  resolvedRequestItems,
  resultSnapshot,
} from "./utils.ts";

const {Text, Title, Paragraph} = Typography;

type EditField = "crop" | "location" | "time_range" | "metric";

function DefinitionGrid({ items }: { items: [string, unknown][] }) {
  if (!items.length) {
    return null;
  }

  const dataSource = items.map(([label, value]) => ({
    key: label,
    label: formatLabel(label),
    value: formatValue(value),
  }));

  const columns = [
    {
      title: "Field",
      dataIndex: "label",
      key: "label",
      className: "font-semibold text-ink",
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
    },
  ];

  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      pagination={false}
      size="small"
    />
  );
}

function DataTable({ frame, title }: { frame: { columns: string[]; records: JsonRecord[] } | null; title: string }) {
  if (!frame) {
    return null;
  }

  const columns = frame.columns.map((column) => ({
    title: column,
    dataIndex: column,
    key: column,
    render: (value: unknown) => (value == null ? "—" : String(value)),
  }));

  const dataSource = frame.records.map((record, index) => ({
    key: `${title}-${index}`,
    ...record,
  }));

  return (
    <Table
      title={() => title}
      dataSource={dataSource}
      columns={columns}
      pagination={false}
      size="small"
      scroll={{ y: 320 }}
    />
  );
}

function StatusChip({ status }: { status: UiStatus }) {
  const labelMap: Record<UiStatus, string> = {
    idle: "Idle",
    loading: "Running",
    clarification: "Clarification",
    confirmation: "Confirmation",
    success: "Ready",
    error: "Error",
  };

  return (
    <Text className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink/65">
      {labelMap[status]}
    </Text>
  );
}

export function SmartTapWorkspace() {
  const [status, setStatus] = useState<UiStatus>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState("");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<VisualizationResponse | null>(null);
  const [pendingSpec, setPendingSpec] = useState<JsonRecord | null>(null);
  const [confirmationSpec, setConfirmationSpec] = useState<JsonRecord | null>(null);
  const [originalQuery, setOriginalQuery] = useState<string | null>(null);
  const [followupMode, setFollowupMode] = useState<"clarification" | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editField, setEditField] = useState<EditField>("crop");
  const [editText, setEditText] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editMetric, setEditMetric] = useState("");

  useEffect(() => {
    let isMounted = true;

    smartTapApi
      .health()
      .then((payload) => {
        if (!isMounted) {
          return;
        }
        setHealth(payload);
      })
      .catch((error: Error) => {
        if (!isMounted) {
          return;
        }
        setHealthError(error.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const metricOptions = health?.metric_options ?? [];

  function clearCurrentResult() {
    setCurrentResult(null);
  }

  function resetQueryContext() {
    setPendingSpec(null);
    setConfirmationSpec(null);
    setOriginalQuery(null);
    setFollowupMode(null);
    setEditorOpen(false);
  }

  function clearResults() {
    setStatus("idle");
    setMessages([]);
    setQuery("");
    setCurrentResult(null);
    setPendingSpec(null);
    setConfirmationSpec(null);
    setOriginalQuery(null);
    setFollowupMode(null);
    setEditorOpen(false);
  }

  function seedEditor(spec: JsonRecord, field: EditField) {
    setEditField(field);
    if (field === "crop") {
      setEditText(String(spec.crop_filter ?? ""));
      return;
    }
    if (field === "location") {
      setEditText(String(spec.display_location ?? spec.location ?? ""));
      return;
    }
    if (field === "time_range") {
      const startDate = String(spec.start_date ?? "");
      const endDate = String(spec.end_date ?? "");
      const year = spec.year ? String(spec.year) : String(new Date().getFullYear());
      setEditStartDate(startDate || `${year}-01-01`);
      setEditEndDate(endDate || `${year}-12-31`);
      return;
    }
    const currentVariable = String(Array.isArray(spec.variables) ? spec.variables[0] ?? "" : "");
    const fallbackMetric = currentVariable || metricOptions[0]?.code || "";
    setEditMetric(fallbackMetric);
  }

  function openEditor() {
    if (!confirmationSpec || !originalQuery) {
      return;
    }
    setEditorOpen(true);
    seedEditor(confirmationSpec, editField);
  }

  function closeEditor() {
    setEditorOpen(false);
  }

  function applyResult(result: VisualizationResponse, queryText?: string) {
    setStatus(nextStatus(result));

    if (result.success) {
      setCurrentResult(result);
      setPendingSpec(null);
      setConfirmationSpec(null);
      setOriginalQuery(null);
      setFollowupMode(null);
      setEditorOpen(false);
      return;
    }

    clearCurrentResult();
    setEditorOpen(false);

    if (result.needs_confirmation) {
      setPendingSpec(null);
      setConfirmationSpec(result.spec);
      setOriginalQuery((existing) => existing ?? queryText ?? null);
      setFollowupMode(null);
      return;
    }

    if (result.needs_clarification) {
      setPendingSpec(result.spec);
      setConfirmationSpec(null);
      setOriginalQuery((existing) => existing ?? queryText ?? null);
      setFollowupMode("clarification");
    }
  }

  function appendAssistantMessage(queryText: string, result: VisualizationResponse) {
    setMessages((existing) => [
      ...existing,
      {
        role: "assistant",
        content: assistantMessageForResult(queryText, result),
      },
    ]);
  }

  async function handleQuerySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return;
    }

    setMessages((existing) => [...existing, { role: "user", content: trimmedQuery }]);
    setQuery("");
    setStatus("loading");

    try {
      let result: VisualizationResponse;
      if (followupMode === "clarification" && pendingSpec && originalQuery) {
        result = await smartTapApi.followup(trimmedQuery, pendingSpec, originalQuery);
      } else {
        resetQueryContext();
        result = await smartTapApi.query(trimmedQuery);
      }
      applyResult(result, trimmedQuery);
      appendAssistantMessage(trimmedQuery, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error.";
      setStatus("error");
      setMessages((existing) => [...existing, { role: "assistant", content: `Error: ${message}` }]);
    }
  }

  async function handleConfirm() {
    if (!confirmationSpec || !originalQuery) {
      return;
    }

    setStatus("loading");
    try {
      const result = await smartTapApi.confirm(confirmationSpec, originalQuery);
      applyResult(result);
      appendAssistantMessage(originalQuery, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error.";
      setStatus("error");
      setMessages((existing) => [...existing, { role: "assistant", content: `Error: ${message}` }]);
    }
  }

  async function handleApplyEdit() {
    if (!confirmationSpec || !originalQuery) {
      return;
    }

    let value: unknown = editText;
    if (editField === "time_range") {
      value = {
        start_date: editStartDate,
        end_date: editEndDate,
      };
    } else if (editField === "metric") {
      value = editMetric;
    }

    setStatus("loading");
    try {
      const result = await smartTapApi.applyConfirmationEdit(confirmationSpec, originalQuery, editField, value);
      applyResult(result);
      appendAssistantMessage(originalQuery, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error.";
      setStatus("error");
      setMessages((existing) => [...existing, { role: "assistant", content: `Error: ${message}` }]);
    }
  }

  const currentSnapshot = useMemo(
    () => resultSnapshot((currentResult?.summary ?? {}) as JsonRecord),
    [currentResult?.summary],
  );
  const currentResolvedRequest = useMemo(
    () => resolvedRequestItems((currentResult?.spec ?? null) as JsonRecord | null),
    [currentResult?.spec],
  );
  const confirmationRequest = useMemo(
    () => resolvedRequestItems(confirmationSpec),
    [confirmationSpec],
  );
  const clarificationSummary = useMemo(() => displaySpec(pendingSpec), [pendingSpec]);
  const advancedVisible = Boolean(
    currentResult?.vega_spec || currentResult?.secondary_views.some((view) => view.vega_spec) || Object.keys(currentResult?.files ?? {}).length,
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-[linear-gradient(135deg,#101418_0%,#24333d_100%)] px-6 py-5 text-sand shadow-soft">
        <Title level={1} className="font-display text-4xl">SmartTap</Title>
        <Paragraph className="mt-2 text-sm text-[#d8d0c3]">
          Ask about Oregon agricultural and weather data. SmartTap will parse, fetch, validate, and visualize the
          result.
        </Paragraph>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(320px,0.95fr)_minmax(360px,1.1fr)]">
        <div className="space-y-6">
          <Card>
            <div className="space-y-6">

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Title level={2} className="font-display text-xl text-ink">What SmartTap Does</Title>
                  <ul className="mt-3 space-y-2 text-sm text-ink/80">
                    <li>Builds charts from plain-English ag and weather questions</li>
                    <li>Shows a short explanation plus inspectable source rows</li>
                    <li>Supports crop summaries, trends, and comparisons</li>
                  </ul>
                </Col>

                <Col xs={24} md={12}>
                  <Title level={2} className="font-display text-xl text-ink">Example Queries</Title>
                  <ul className="mt-3 space-y-2 text-sm text-ink/80">
                    <li>`Show temperature in Corvallis for July 2024`</li>
                    <li>`What are the monthly ETa values in Hood River for the year 2022?`</li>
                    <li>`What crops are grown in Benton County?`</li>
                  </ul>
                </Col>
              </Row>


              <Title level={4} className="font-display text-lg text-ink">Disclaimer</Title>
              <Paragraph className="text-sm text-ink/80">
                Due to limited data coverage,
                the available OpenET data only covers up to October 1st, 2022.
                Queries made to the OpenET dataset after this date may not return accurate results.
              </Paragraph>
              <Paragraph className="text-sm text-ink/80">
                It should also be noted that, in general, queries to the OpenET dataset are very sensitive to the exact phrasing of the query.
                For instance, the query "What are the monthly ETa values for Hood River in 2020?" will operate under the assumption that the user
                wants to gather the monthly ETa values for a reference crop called Hood River. Instead, such a query should specify that these
                OpenET measurements are coming from in the specified city or county. For example, a better phrasing of the query would be
                "What are the monthly ETa values in Hood River in 2020?".
              </Paragraph>
              <Paragraph className="text-sm text-ink/80">
                Please use the tool with caution and verify the data before making any decisions based on it.
              </Paragraph>

              <div className="flex items-center justify-between gap-3">
                <Paragraph>SmartTAP API Status: <StatusChip status={status} /></Paragraph>
                <Button onClick={clearResults}>
                  Clear Results
                </Button>
              </div>

              {healthError ? (
                <Paragraph className="rounded-md bg-[#fbe8e3] px-4 py-3 text-sm text-[#7d3d29]">
                  API metadata could not be loaded: {healthError}
                </Paragraph>
              ) : null}
            </div>
          </Card>

          <Card title="Chat">
            {/* In the future, the chat history will likely be composed of ant-design/x Bubble elements.
                Unfortunately however, there are npm dependency conflicts that are preventing this from being implemented.
                For now, we are using a custom implementation for initial user testing. */}
            <div className="max-h-[26rem] space-y-3 overflow-auto pr-1" style={{ maxHeight: "26rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem", paddingRight: "0.25rem" }}>
              {messages.length === 0 ? (
                <div className="rounded-md border border-dashed border-border bg-white/50 p-5 text-sm text-ink/65">
                  Start with a question about Oregon weather, water, or crop patterns.
                </div>
              ) : null}
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  style={{
                    display: "flex",
                    justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <article
                    className={[
                      "max-w-[92%] rounded-xl px-4 py-3 text-sm leading-6",
                      message.role === "user"
                        ? "bg-forest text-sand"
                        : "bg-white/85 text-ink ring-1 ring-border",
                    ].join(" ")}
                    style={{
                      maxWidth: "92%",
                      backgroundColor: message.role === "user" ? "#2f5233" : "rgba(255,255,255,0.85)",
                      color: message.role === "user" ? "#f5f0e6" : "#1f2a24",
                      borderRadius: "1.25rem",
                      padding: "0.875rem 1.25rem",
                      boxShadow: message.role === "assistant" ? "0 0 0 1px rgba(0,0,0,0.1)" : "none",
                    }}
                  >
                    {message.content}
                  </article>
                </div>
              ))}
            </div>

            <form className="mt-4 space-y-3" onSubmit={handleQuerySubmit}>
              <Input.TextArea
                placeholder="Ask about Oregon weather, water, or crop patterns..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoSize={{ minRows: 4 }}
              />
              <div className="flex flex-wrap gap-3">
                <Button type="primary" htmlType="submit" disabled={status === "loading"}>
                  {status === "loading" ? "Running SmartTap..." : "Run Query"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Results">
            {confirmationSpec ? (
              <div className="space-y-4">
                <div className="rounded-md border border-[#edcf8d] bg-[#fff6dd] p-4 text-sm text-[#6f561d]">
                  <Paragraph className="font-semibold">Confirmation required before SmartTap runs this request.</Paragraph>
                  <Paragraph className="mt-2">{messages[messages.length - 1]?.content}</Paragraph>
                </div>
                <DefinitionGrid items={confirmationRequest} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button type="primary" block onClick={handleConfirm}>
                    Confirm And Run
                  </Button>
                  <Button
                    block
                    onClick={() => {
                      openEditor();
                    }}
                  >
                    Edit Request
                  </Button>
                </div>

                {editorOpen ? (
                  <div className="rounded-md bg-mist/85 p-4">
                    <Paragraph className="text-sm font-semibold text-ink">Edit Request</Paragraph>
                    <Paragraph className="mt-1 text-sm text-ink/70">
                      Apply one deterministic change at a time, then confirm the refreshed request.
                    </Paragraph>

                    <div className="mt-4 grid gap-4">
                      <label className="grid gap-2 text-sm font-medium text-ink">
                        Field
                        <select
                          className="rounded-md border border-border bg-white/80 px-3 py-2"
                          value={editField}
                          onChange={(event) => {
                            const value = event.target.value as EditField;
                            setEditField(value);
                            seedEditor(confirmationSpec, value);
                          }}
                        >
                          <option value="crop">Crop</option>
                          <option value="location">Location</option>
                          <option value="time_range">Time Range</option>
                          <option value="metric">Metric</option>
                        </select>
                      </label>

                      {(editField === "crop" || editField === "location") && (
                        <label className="grid gap-2 text-sm font-medium text-ink">
                          {editField === "crop" ? "Crop" : "Location"}
                          <input
                            className="rounded-md border border-border bg-white/80 px-3 py-2"
                            value={editText}
                            onChange={(event) => setEditText(event.target.value)}
                            placeholder={editField === "crop" ? "Winter Wheat" : "Corvallis or Morrow County"}
                          />
                        </label>
                      )}

                      {editField === "time_range" && (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="grid gap-2 text-sm font-medium text-ink">
                            Start date
                            <input
                              type="date"
                              className="rounded-md border border-border bg-white/80 px-3 py-2"
                              value={editStartDate}
                              onChange={(event) => setEditStartDate(event.target.value)}
                            />
                          </label>
                          <label className="grid gap-2 text-sm font-medium text-ink">
                            End date
                            <input
                              type="date"
                              className="rounded-md border border-border bg-white/80 px-3 py-2"
                              value={editEndDate}
                              onChange={(event) => setEditEndDate(event.target.value)}
                            />
                          </label>
                        </div>
                      )}

                      {editField === "metric" && (
                        <label className="grid gap-2 text-sm font-medium text-ink">
                          Metric
                          <select
                            className="rounded-md border border-border bg-white/80 px-3 py-2"
                            value={editMetric}
                            onChange={(event) => setEditMetric(event.target.value)}
                          >
                            {metricOptions.map((option) => (
                              <option key={option.code} value={option.code}>
                                {option.label} [{option.code}]
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <Button type="primary" block onClick={handleApplyEdit}>
                        Apply Change
                      </Button>
                      <Button block onClick={closeEditor}>
                        Cancel Edit
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {!confirmationSpec && status === "clarification" ? (
              <div className="space-y-4">
                <div className="rounded-md border border-[#c9d8cc] bg-white/70 p-4 text-sm text-ink/80">
                  <Paragraph className="font-semibold text-ink">Clarification needed</Paragraph>
                  <Paragraph className="mt-2">{messages[messages.length - 1]?.content}</Paragraph>
                </div>
                <DefinitionGrid items={clarificationSummary} />
              </div>
            ) : null}

            {!confirmationSpec && currentResult ? (
              <div className="space-y-5">
                <ChartRenderer
                  chartModel={currentResult.chart_model}
                  fallbackImageUrl={currentResult.chart_image_url}
                />

                {currentResult.explanation ? (
                  <div className="rounded-md border-l-4 border-forest bg-mist px-5 py-4">
                    <Paragraph className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">What this means</Paragraph>
                    <Paragraph className="mt-2 text-sm leading-7 text-ink">{currentResult.explanation}</Paragraph>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() =>
                      downloadTextFile(
                        `smarttap_data_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`,
                        dataframeToCsv(currentResult.data ?? currentResult.data_preview),
                        "text/csv",
                      )
                    }
                  >
                    Download Data (CSV)
                  </Button>
                  {currentResult.vega_spec ? (
                    <Button
                      onClick={() =>
                        downloadTextFile(
                          `smarttap_spec_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`,
                          JSON.stringify(currentResult.vega_spec, null, 2),
                          "application/json",
                        )
                      }
                    >
                      Download Vega Spec
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {!confirmationSpec && !currentResult && status !== "clarification" ? (
              <div className="rounded-md border border-dashed border-border bg-white/60 p-8 text-center text-sm text-ink/65">
                Run a query to see a visualization.
              </div>
            ) : null}
          </Card>

          {currentResult?.secondary_views?.length ? (
            <Card title="Companion Views">
              <div className="space-y-5">
                {currentResult.secondary_views.map((view, index) => (
                  <div key={`${view.caption}-${index}`} className="rounded-md bg-white/60 p-4">
                    <Title level={5} className="text-sm font-semibold text-ink">
                      View {index + 1}. {view.caption || "Companion chart"}
                    </Title>
                    <div className="mt-3">
                      <ChartRenderer
                        chartModel={view.chart_model}
                        fallbackImageUrl={view.chart_image_url}
                        testId={`companion-chart-${index + 1}`}
                      />
                    </div>
                    {view.data_preview ? (
                      <details className="mt-4 rounded-md bg-white/70 p-4">
                        <summary className="cursor-pointer text-sm font-semibold text-ink">
                          Companion Data Preview {index + 1}
                        </summary>
                        <div className="mt-4">
                          <DataTable frame={view.data_preview} title={`Companion Data Preview ${index + 1}`} />
                        </div>
                      </details>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          <Row gutter={[16, 16]}>
            {(currentSnapshot.length || currentResolvedRequest.length) ? (
              <Col xs={24} md={12}>
                <Card title="Result Details">
                  <Row gutter={[16, 16]}>
                    {currentSnapshot.length ? (
                      <Col xs={24} md={12}>
                        <Title level={5} className="text-sm font-semibold text-ink">Snapshot</Title>
                        <div className="mt-3">
                          <DefinitionGrid items={currentSnapshot} />
                        </div>
                      </Col>
                    ) : null}
                    {currentResolvedRequest.length ? (
                      <Col xs={24} md={12}>
                        <Title level={5} className="text-sm font-semibold text-ink">Resolved Request</Title>
                        <div className="mt-3">
                          <DefinitionGrid items={currentResolvedRequest} />
                        </div>
                      </Col>
                    ) : null}
                  </Row>
                </Card>
              </Col>
            ) : null}

            {currentResult?.data_preview ? (
              <Col xs={24} md={12}>
                <Card title="Data Preview">
                  <DataTable frame={currentResult.data_preview} title="Data Preview" />
                </Card>
              </Col>
            ) : null}
          </Row>

          {advancedVisible ? (
            <Collapse
              defaultActiveKey={[]}
              items={[
                {
                  key: "advanced",
                  label: "Advanced",
                  children: (
                    <div className="space-y-4">
                      {currentResult?.vega_spec ? (
                        <div>
                          <Title level={5} className="text-sm font-semibold text-ink">Primary Vega-Lite Spec</Title>
                          <pre className="mt-2 overflow-auto rounded-md bg-[#15221d] p-4 text-xs text-sand">
                            {JSON.stringify(currentResult.vega_spec, null, 2)}
                          </pre>
                        </div>
                      ) : null}

                      {currentResult?.secondary_views.map((view, index) =>
                        view.vega_spec ? (
                          <div key={`secondary-spec-${index}`}>
                            <Title level={5} className="text-sm font-semibold text-ink">Companion Vega-Lite Spec {index + 1}</Title>
                            <pre className="mt-2 overflow-auto rounded-md bg-[#15221d] p-4 text-xs text-sand">
                              {JSON.stringify(view.vega_spec, null, 2)}
                            </pre>
                          </div>
                        ) : null,
                      )}

                      {Object.keys(currentResult?.files ?? {}).length ? (
                        <div className="rounded-md bg-white/65 p-4">
                          <Title level={5} className="text-sm font-semibold text-ink">Saved Files</Title>
                          <div className="mt-3 space-y-2 text-sm text-ink/80">
                            {Object.entries(currentResult?.files ?? {}).map(([label, path]) => (
                              <Paragraph key={label}>
                                <span className="font-semibold">{formatLabel(label)}:</span> <code>{path}</code>
                              </Paragraph>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ),
                },
              ]}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default SmartTapWorkspace;