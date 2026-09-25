/**
 * 接口桥：上游 nezha-api 的每个函数在这里落地成「极简探针的请求 → 视图模型」。
 *
 * 两处合流是为了别把探针打爆：
 * - 详情页五条曲线各自 useQuery，会同时请求同一个历史接口，这里按 (节点, 窗口) 缓存并合并并发；
 * - 「服务监控」页要按节点逐个取 ping 历史，这里限制并发数。
 */
import type {
	LoginUserResponse,
	MetricPeriod,
	MetricType,
	MonitorResponse,
	ServerGroupResponse,
	ServerMetricsResponse,
	ServiceResponse,
	SettingResponse,
} from "@/types/nezha-api";
import { loadThemeConfig } from "./config";
import { fetchHistory, fetchMe, fetchSnapshot, type HistorySeries } from "./endpoints";
import {
	buildServiceResponse,
	historyToMonitor,
	historyToServerMetrics,
	toLoginUser,
	toNezhaServer,
	toServerGroups,
	toSetting,
} from "./mapping";
import type { MonitorHistory, MonitorMe, MonitorNode } from "./types";

const PERIOD_HOURS: Record<MetricPeriod, number> = { "1d": 24, "7d": 168, "30d": 720 };
const SERVICE_LOOKBACK_HOURS = 720;
const HISTORY_TTL_MS = 20_000;
const PING_TTL_MS = 55_000;
const SNAPSHOT_TTL_MS = 5_000;
const SERVICE_CONCURRENCY = 4;

let snapshotCache: { at: number; nodes: MonitorNode[] } | null = null;

async function snapshot(force = false): Promise<MonitorNode[]> {
	const now = Date.now();
	if (!force && snapshotCache && now - snapshotCache.at < SNAPSHOT_TTL_MS) {
		return snapshotCache.nodes;
	}
	const data = await fetchSnapshot();
	const nodes = data.nodes ?? [];
	snapshotCache = { at: now, nodes };
	return nodes;
}

async function meOrEmpty(): Promise<MonitorMe> {
	try {
		return await fetchMe();
	} catch {
		return {};
	}
}

async function nodeById(id: number): Promise<MonitorNode | undefined> {
	const nodes = await snapshot();
	return nodes.find((node) => node.id === id);
}

type HistoryEntry = { at: number; data: MonitorHistory };
const historyCache = new Map<string, HistoryEntry>();
const historyInflight = new Map<string, Promise<MonitorHistory>>();

async function historyFor(
	nodeId: number,
	hours: number,
	series?: HistorySeries,
): Promise<MonitorHistory> {
	const key = `${nodeId}:${hours}:${series ?? "both"}`;
	// ping 是分钟级数据，页面每 10 秒轮询一次没必要每次都回源；
	// 指标曲线要跟手，缓存时间短一些。
	const ttl = series === "ping" ? PING_TTL_MS : HISTORY_TTL_MS;
	const cached = historyCache.get(key);
	if (cached && Date.now() - cached.at < ttl) return cached.data;

	const inflight = historyInflight.get(key);
	if (inflight) return inflight;

	const task = fetchHistory(nodeId, hours, series)
		.then((data) => {
			historyCache.set(key, { at: Date.now(), data });
			return data;
		})
		.finally(() => {
			historyInflight.delete(key);
		});
	historyInflight.set(key, task);
	return task;
}

async function mapWithLimit<T, R>(
	items: T[],
	limit: number,
	worker: (item: T) => Promise<R>,
): Promise<R[]> {
	const results: R[] = [];
	let cursor = 0;
	const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
		while (cursor < items.length) {
			const index = cursor;
			cursor += 1;
			results[index] = await worker(items[index]);
		}
	});
	await Promise.all(runners);
	return results;
}

/** 站点设置：站点名、默认语言、自定义注入代码（上游拿它当哪吒的 setting 用）。 */
export async function bridgeFetchSetting(): Promise<SettingResponse> {
	const [me, config] = await Promise.all([meOrEmpty(), loadThemeConfig()]);
	// 顺带刷新一次快照，避免首屏两个接口都冷启动
	snapshot().catch(() => undefined);
	return toSetting(me, config);
}

export async function bridgeFetchLoginUser(): Promise<LoginUserResponse> {
	return toLoginUser(await fetchMe());
}

export async function bridgeFetchServerGroup(): Promise<ServerGroupResponse> {
	return toServerGroups(await snapshot(true));
}

/** 延迟监控 + 周期流量（替代哪吒的「服务监控」）。 */
export async function bridgeFetchService(): Promise<ServiceResponse> {
	const nodes = await snapshot();
	const targets = nodes.filter((node) => node.online !== false);
	const histories = await mapWithLimit(targets, SERVICE_CONCURRENCY, async (node) => {
		try {
			const data = await historyFor(node.id, SERVICE_LOOKBACK_HOURS, "ping");
			return [node.id, data] as const;
		} catch {
			return [node.id, null] as const;
		}
	});

	const byNode = new Map<number, MonitorHistory>();
	for (const [id, data] of histories) {
		if (data) byNode.set(id, data);
	}
	return buildServiceResponse(nodes, byNode);
}

export async function bridgeFetchServerMetrics(
	serverId: number,
	metric: MetricType,
	period: MetricPeriod = "1d",
): Promise<ServerMetricsResponse> {
	const [history, node] = await Promise.all([
		historyFor(serverId, PERIOD_HOURS[period] ?? 24, "metrics"),
		nodeById(serverId),
	]);
	return historyToServerMetrics(history, metric, serverId, node?.name ?? String(serverId));
}

export async function bridgeFetchMonitor(
	serverId: number,
	period: MetricPeriod = "1d",
): Promise<MonitorResponse> {
	const [history, node] = await Promise.all([
		historyFor(serverId, PERIOD_HOURS[period] ?? 24, "ping"),
		nodeById(serverId),
	]);
	const fallback: MonitorNode = node ?? {
		id: serverId,
		name: String(serverId),
	};
	return historyToMonitor(fallback, history);
}

/** 供 websocket-provider 把帧翻译成上游视图模型。 */
export async function bridgeNodeName(id: number): Promise<string> {
	const node = await nodeById(id);
	return node?.name ?? String(id);
}

export { toNezhaServer };
