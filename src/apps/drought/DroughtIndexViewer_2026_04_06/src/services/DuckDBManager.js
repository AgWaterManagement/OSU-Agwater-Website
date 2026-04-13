import * as duckdb from '@duckdb/duckdb-wasm';

let db = null;
let conn = null;
let initializationPromise = null;

export async function initDuckDB() {
    if (conn) return conn;
    if (initializationPromise) return initializationPromise;

    initializationPromise = (async () => {
        console.log("Initializing DuckDB-WASM...");
        const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
        const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

        const worker_url = URL.createObjectURL(
            new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
        );

        const logger = new duckdb.ConsoleLogger();
        const worker = new Worker(worker_url);
        db = new duckdb.AsyncDuckDB(logger, worker);
        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
        URL.revokeObjectURL(worker_url);

        conn = await db.connect();
        console.log("DuckDB-WASM Ready!");
        return conn;
    })();

    return initializationPromise;
}

export async function queryParquet(parquetUrl, sql) {
    if (!conn) await initDuckDB();
    
    // Parquet fetching via web worker requires absolute host URLs
    const absoluteUrl = new URL(parquetUrl, window.location.origin + window.location.pathname).href;
    try {
        const result = await conn.query(sql.replace('__URL__', `'${absoluteUrl}'`));
        return result.toArray().map(row => row.toJSON());
    } catch (e) {
        console.error("DuckDB Query Error: ", e);
        throw e;
    }
}

export async function queryUnifiedHuc(huc8) {
    if (!conn) await initDuckDB();
    const metUrl = new URL("./data/huc8_drought_timeseries.parquet", window.location.href).href;
    const agUrl = new URL("./data/huc8_ag_timeseries.parquet", window.location.href).href;
    const hydroUrl = new URL("./data/huc8_hydro_timeseries.parquet", window.location.href).href;

    // Uses a full outer join to align timestamps and prevent duplicate keys.
    const sql = `
        SELECT 
            COALESCE(m.Date, a.Date, h.Date) as TargetDate, 
            m.USDM, m.PDSI, m.SPI, m.EDDI,
            a.VCI_Raw, a.VHI_Raw, a.CMI_Raw, a.SSMI_Raw,
            h.SWE_Pct_Normal, h.Streamflow_Pctile, h.SPI_1yr
        FROM '${metUrl}' m
        FULL OUTER JOIN '${agUrl}' a ON m.Date = a.Date AND m.HUC8 = a.HUC8
        FULL OUTER JOIN '${hydroUrl}' h ON COALESCE(m.Date, a.Date) = h.Date AND COALESCE(m.HUC8, a.HUC8) = h.HUC8
        WHERE m.HUC8 = '${huc8}' OR a.HUC8 = '${huc8}' OR h.HUC8 = '${huc8}'
        ORDER BY TargetDate ASC
    `;
    
    try {
        const result = await conn.query(sql);
        let rows = result.toArray().map(row => row.toJSON());
        
        // Converts data to standard JavaScript primitives to ensure Plotly serializes the data correctly.
        return rows.map(r => {
            let rawDate = r.TargetDate;
            if (typeof rawDate === 'bigint') rawDate = Number(rawDate);
            if (typeof rawDate === 'number') {
                rawDate = new Date(rawDate < 50000 ? rawDate * 86400000 : rawDate).toISOString().split('T')[0];
            } else if (rawDate instanceof Date) {
                rawDate = rawDate.toISOString().split('T')[0];
            } else if (typeof rawDate !== 'string') {
                 rawDate = String(rawDate);
            }
            
            let normalized = { Date: rawDate };
            ['USDM', 'PDSI', 'SPI', 'EDDI', 'VCI_Raw', 'VHI_Raw', 'CMI_Raw', 'SSMI_Raw', 'SWE_Pct_Normal', 'Streamflow_Pctile', 'SPI_1yr'].forEach(k => {
                let v = r[k];
                if (v === null || v === undefined) normalized[k] = null;
                else if (typeof v === 'bigint') normalized[k] = Number(v);
                else normalized[k] = typeof v === 'number' ? v : Number(v);
            });
            return normalized;
        });
    } catch (e) {
        console.error("Unified DuckDB Join Error: ", e);
        throw e;
    }
}

export async function queryAllHucsLatest() {
    if (!conn) await initDuckDB();
    const metUrl = new URL("./data/huc8_drought_timeseries.parquet", window.location.href).href;
    const agUrl = new URL("./data/huc8_ag_timeseries.parquet", window.location.href).href;
    const hydroUrl = new URL("./data/huc8_hydro_timeseries.parquet", window.location.href).href;

    const sql = `
        WITH latest_met AS (
            SELECT HUC8, arg_max(USDM, Date) as USDM, arg_max(PDSI, Date) as PDSI, arg_max(SPI, Date) as SPI, arg_max(EDDI, Date) as EDDI
            FROM '${metUrl}' GROUP BY HUC8
        ),
        latest_ag AS (
            SELECT HUC8, arg_max(VCI_Raw, Date) as VCI_Raw, arg_max(VHI_Raw, Date) as VHI_Raw, arg_max(CMI_Raw, Date) as CMI_Raw, arg_max(SSMI_Raw, Date) as SSMI_Raw
            FROM '${agUrl}' GROUP BY HUC8
        ),
        latest_hydro AS (
            SELECT HUC8, arg_max(SWE_Pct_Normal, Date) as SWE_Pct_Normal, arg_max(Streamflow_Pctile, Date) as Streamflow_Pctile, arg_max(SPI_1yr, Date) as SPI_1yr
            FROM '${hydroUrl}' GROUP BY HUC8
        )
        SELECT 
            COALESCE(m.HUC8, a.HUC8, h.HUC8) as HUC8,
            m.USDM, m.PDSI, m.SPI, m.EDDI,
            a.VCI_Raw, a.VHI_Raw, a.CMI_Raw, a.SSMI_Raw,
            h.SWE_Pct_Normal, h.Streamflow_Pctile, h.SPI_1yr
        FROM latest_met m
        FULL OUTER JOIN latest_ag a ON m.HUC8 = a.HUC8
        FULL OUTER JOIN latest_hydro h ON COALESCE(m.HUC8, a.HUC8) = h.HUC8
    `;
    
    try {
        const result = await conn.query(sql);
        let rows = result.toArray().map(row => row.toJSON());
        
        const conditions = {};
        for (const r of rows) {
            if (!r.HUC8) continue;
            let huc = String(r.HUC8).padStart(8, '0');
            conditions[huc] = {
                usdm: r.USDM !== null && r.USDM !== undefined ? Number(r.USDM) : null,
                pdsi: r.PDSI !== null && r.PDSI !== undefined ? Number(r.PDSI) : null,
                spi: r.SPI !== null && r.SPI !== undefined ? Number(r.SPI) : null,
                eddi: r.EDDI !== null && r.EDDI !== undefined ? Number(r.EDDI) : null,
                vci_raw: r.VCI_Raw !== null && r.VCI_Raw !== undefined ? Number(r.VCI_Raw) : null,
                vhi_raw: r.VHI_Raw !== null && r.VHI_Raw !== undefined ? Number(r.VHI_Raw) : null,
                cmi_raw: r.CMI_Raw !== null && r.CMI_Raw !== undefined ? Number(r.CMI_Raw) : null,
                ssmi_raw: r.SSMI_Raw !== null && r.SSMI_Raw !== undefined ? Number(r.SSMI_Raw) : null,
                swe_pct_normal: r.SWE_Pct_Normal !== null && r.SWE_Pct_Normal !== undefined ? Number(r.SWE_Pct_Normal) : null,
                streamflow_pctile: r.Streamflow_Pctile !== null && r.Streamflow_Pctile !== undefined ? Number(r.Streamflow_Pctile) : null,
                spi_1yr: r.SPI_1yr !== null && r.SPI_1yr !== undefined ? Number(r.SPI_1yr) : null
            };
        }
        return conditions;
    } catch (e) {
        console.error("DuckDB Latest Query Error: ", e);
        return {};
    }
}
