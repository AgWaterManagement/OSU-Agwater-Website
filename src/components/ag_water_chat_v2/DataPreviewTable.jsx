import { Table } from "antd";

// Renders SmartTap's data_preview ({ columns: string[], records: object[] }),
// the DataFramePayload shape from smarttap_api.py. Matches SmartTap's own
// DataTable component (web/src/features/smarttap/SmartTapWorkspace.tsx) —
// same Table config (title slot, no pagination, fixed-height vertical
// scroll, null-safe cell rendering) — rather than a generic table, so a
// SmartTap-grounded answer's table looks the way it does in SmartTap's own
// UI. No new dependency — antd's Table is already used elsewhere here.
export function DataPreviewTable({ dataPreview, title = "Data Preview" }) {
    if (!dataPreview || !dataPreview.columns || !dataPreview.records || dataPreview.records.length === 0) {
        return null;
    }

    const columns = dataPreview.columns.map((column) => ({
        title: column,
        dataIndex: column,
        key: column,
        render: (value) => (value == null ? "—" : String(value)),
    }));

    const dataSource = dataPreview.records.map((record, index) => ({
        key: `${title}-${index}`,
        ...record,
    }));

    return (
        <div style={{ width: "100%", marginTop: "0.75em" }}>
            <Table
                title={() => title}
                dataSource={dataSource}
                columns={columns}
                pagination={false}
                size="small"
                scroll={{ y: 320 }}
            />
        </div>
    );
}

export default DataPreviewTable;
