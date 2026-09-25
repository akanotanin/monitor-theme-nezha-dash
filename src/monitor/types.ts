/**
 * 极简探针（Monitor）侧的数据结构。
 *
 * 这些类型只出现在 src/monitor/ 里：上游组件读的仍然是 nezha-api 的视图模型，
 * 由 mapping.ts 在这里翻译过去，因此组件、store、样式一行都不用改。
 */

/** 节点实时指标（`/api/nodes` 与 `/api/ws` 帧里的 metrics）。 */
export interface MonitorMetrics {
	cpu?: number;
	mem_used?: number;
	mem_total?: number;
	swap_used?: number;
	swap_total?: number;
	disk_used?: number;
	disk_total?: number;
	/** 瞬时速率，字节/秒。 */
	net_rx?: number;
	net_tx?: number;
	/** 1 / 5 / 15 分钟负载。 */
	load?: number[];
	procs?: number;
	tcp?: number;
	udp?: number;
	uptime?: number;
	total_rx?: number;
	total_tx?: number;
	month_rx?: number;
	month_tx?: number;
}

export interface MonitorNode {
	id: number;
	name: string;
	group?: string | null;
	country?: string | null;
	os?: string | null;
	arch?: string | null;
	kernel?: string | null;
	cpu_name?: string | null;
	cpu_cores?: number | null;
	virt?: string | null;
	mem_total?: number | null;
	swap_total?: number | null;
	disk_total?: number | null;
	online?: boolean;
	public?: boolean;
	sort?: number;
	last_seen?: number;
	agent_version?: string | null;
	expires_at?: string | null;
	expires_in?: number | null;
	billing_cycle?: string | null;
	price?: number | null;
	currency?: string | null;
	traffic_limit?: number | null;
	traffic_mode?: string | null;
	traffic_reset_day?: number | null;
	total_rx?: number;
	total_tx?: number;
	day_rx?: number;
	day_tx?: number;
	month_rx?: number;
	month_tx?: number;
	month_used?: number;
	month_start?: string | null;
	metrics?: MonitorMetrics;
}

/** `/api/nodes` 与 `/api/ws` 是同一个帧。 */
export interface MonitorSnapshot {
	admin?: boolean;
	nodes?: MonitorNode[];
}

export interface MonitorMe {
	authed?: boolean;
	github?: string | null;
	public_page?: boolean;
	site?: string;
	site_name?: string;
}

/** 一条 Ping 采样：latency 为 -1 表示这次探测失败（丢包）。 */
export interface MonitorPingRow {
	latency: number;
	task_id: number;
	ts: number;
}

/** 历史采样只有这几列，`ts` 是秒。 */
export interface MonitorHistorySample {
	ts: number;
	cpu?: number;
	mem_used?: number;
	disk_used?: number;
	net_rx?: number;
	net_tx?: number;
	loss?: number;
}

export interface MonitorHistory {
	metrics?: MonitorHistorySample[];
	ping?: MonitorPingRow[];
	/** task_id -> 线路名。 */
	probes?: Record<string, string>;
	/** task_id -> 整个窗口的丢包百分比。 */
	loss?: Record<string, number>;
}
