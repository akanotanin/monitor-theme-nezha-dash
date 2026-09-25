# Monitor Nezha

把 [hamster1963/nezha-dash-v2](https://github.com/hamster1963/nezha-dash-v2)（哪吒监控的官方前端）移植到[极简探针 Monitor](https://github.com/monitor-probe/monitor) 的主题包。

上游是一套给哪吒监控用的 React 前端：服务器卡片 / 紧凑列表双视图、分组标签、节点详情多标签图表、全球地图、延迟监控、周期流量、15 种语言、深浅色主题、命令面板、PWA。
这个仓库把它接到极简探针的数据接口上，做成可以直接装进探针后台的主题。

- 显示名 **Monitor Nezha**，主题标识 `nezha-dash`
- 界面、组件、样式沿用上游，只在数据边界加了一层适配层（`src/monitor/`）
- 实时数据走 `/api/ws`，历史曲线走 `/api/nodes/{id}/metrics`，站点信息走 `/api/me`，站点级开关走主题设置
- 上游原来的 README 保留为 [README-upstream.md](./README-upstream.md)

## 安装

后台一键（推荐）：

1. 探针后台 → 主题 → 从 GitHub 安装 / 更新，地址填 `https://github.com/akanotanin/monitor-theme-nezha-dash`
2. 装完在主题列表里选择 **Monitor Nezha**

手动：下载 Release 里的 `theme.tar.gz`，解压到探针数据目录下的 `themes/nezha-dash/`（例如 `/opt/monitor/data/themes/nezha-dash/`），再到后台启用。

> 主题标识固定是 `nezha-dash`：安装目录名、配置键都依赖它，改名等于让已装实例丢设置。

## 主题设置

后台「主题 → 主题设置」里可改，都是站点级（覆盖访客的本地偏好）：

| 分组 | 配置项 | 说明 |
| --- | --- | --- |
| 站点外观 | 站点 Logo | 左上角 Logo 图片地址，默认探针自带的图标 |
| | 站点副标题 | Logo 右侧文字，留空显示探针后台的站点名 |
| | 强制主题 | 跟随访客 / 浅色 / 深色 |
| | 桌面端背景图、移动端背景图 | 图片地址，留空无背景 |
| | 首页插画 | 总览卡片旁的插画地址，可换可隐藏 |
| 首页行为 | 默认用紧凑列表视图 | 强制所有访客首次进入就用紧凑列表 |
| | 默认展开全球地图 / 延迟监控 | 强制展开对应区块 |
| | 显示周期流量 | 卡片 / 列表显示本计费周期上下行流量 |
| | 强制使用 SVG 国旗 | 不依赖系统 emoji 国旗字体 |
| | 紧凑列表固定表头 | 滚动时服务器名固定在上方 |
| | 图表剔除带宽峰值 | 避免个别尖峰压平曲线 |
| | 默认排序字段 / 方向 | 覆盖访客的排序选择 |
| 语言与自定义代码 | 站点默认语言 | 15 种语言，留空跟随访客 |
| | 自定义代码 | 注入到页面里的自定义 HTML／脚本（相当于哪吒后台的「自定义代码」） |

## 数据映射

适配层把探针的数据翻译成上游组件认识的「哪吒视图模型」，所以组件不用改：

| 上游视图模型 | 极简探针来源 |
| --- | --- |
| 服务器列表 / 实时指标 | `/api/ws`（与 `/api/nodes` 是同一个帧） |
| `state.cpu` / `mem_used` / `swap_used` / `disk_used` | `metrics.cpu` / `mem_used` / `swap_used` / `disk_used` |
| `state.net_in_speed` / `net_out_speed` | `metrics.net_rx` / `net_tx`（字节/秒） |
| `state.load_1/5/15` | `metrics.load[0..2]` |
| `state.tcp_conn_count` / `udp_conn_count` / `process_count` | `metrics.tcp` / `udp` / `procs` |
| `state.net_in_transfer` / `net_out_transfer` | `metrics.month_rx` / `month_tx`（**周期口径**，上游是自开机累计） |
| `host.boot_time` | 用 `metrics.uptime` 倒推 |
| `host.platform` | 把 `os`（`Debian GNU/Linux 12 (bookworm)`）归成上游认的短名（`debian`） |
| `country_code` | 节点的 `country` |
| 分组标签 | 节点的 `group` 字段 |
| 历史曲线（CPU／内存／磁盘／上下行） | `/api/nodes/{id}/metrics?hours=&series=metrics`（秒转毫秒） |
| 延迟监控 / 探测线路 | `/api/nodes/{id}/metrics?series=ping`（`latency < 0` 记为丢包） |
| 周期流量统计 | 节点的 `traffic_limit` / `month_used` / `month_start` |
| 账单标签（Price / Remaining） | 把 `price` / `currency` / `billing_cycle` / `expires_at` / `traffic_limit` 拼成上游的 `public_note` JSON |
| 站点名、默认语言、自定义代码 | `/api/me` + 主题设置 |

## 与原版的差异

**保留**：卡片 / 紧凑列表双视图、分组标签与排序、节点详情（CPU／内存／磁盘／网络的历史与实时曲线）、全球地图、延迟监控、周期流量、多语言、深浅色、命令面板（Ctrl/⌘ K）、PWA。

**去掉或改写**（极简探针没有对应数据，按「不显示空位」处理）：

1. **GPU、温度**：探针不下发，详情页与总览里的入口整块删掉。
2. **交换、进程数、TCP/UDP 连接数的历史曲线**：探针只保留 CPU／内存／磁盘／上下行速率的历史。内存卡片里仍然显示实时的交换用量，连接数与进程数不再出现。
3. **上下行累计流量的历史曲线**：同上；卡片与列表里的流量统一用「本计费周期」口径（与探针面板的流量列一致）。
4. **「服务监控」页 → 「延迟监控」**：探针没有 HTTP/TCP 拨测，改用 Ping 探测线路聚合 —— 每条线路一张卡（30 天可用性、平均延迟、丢包）。没有采样的日子与上游对「无数据」的处理一样显示为红色。
5. **周期流量统计按节点算**：探针每个节点各自一份额度，所以一张卡对应一个节点（上游是多个服务器共享额度的计费周期规则）。
6. **延迟监控的平均延迟只统计有采样的日子**：上游按 30 天平均，会把没有数据的日子当成 0ms 拉低均值。

**改动的上游代码（都很小，逐条列出）**：

1. `src/lib/utils.ts`：在线状态改为优先用适配层给的 `online`（探针 Hub 的判定），没有该字段时才退回上游「30 秒没上报即离线」的规则 —— 探针 agent 的上报间隔可能长于 30 秒，否则会误判离线；`src/types/nezha-api.ts` 相应加了可选字段。
2. `src/pages/Server.tsx`：上游那个「没有服务数据就把展开状态重置为 0」的 effect 会在首屏（数据还没到）把「强制展开延迟监控」一起清掉，导致站点级开关失效；移植时跳过强制展开的情况（地图没有这个问题）。
3. `src/components/Header.tsx`：登录 / 控制台入口指向探针后台 `/admin/`（上游是 `/dashboard`）。
4. `src/components/Footer.tsx`：署名改成「nezha-dash-v2 + 移植到极简探针 Monitor」，commit 链接指向本仓库。
5. `index.html`：标题、图标改成探针主题的信息；国旗与系统图标的 CSS 由 CDN 改为包内（见下）。
6. `src/main.tsx`：先取主题配置与站点信息、写回 `window` 全局再挂载 React。

**国旗与系统图标**：上游在 `index.html` 里从 jsdelivr 引 CSS，字体与国旗都是运行时的外部请求；换到自建面板上 CDN 一不可达就整片消失。`pnpm vendor`（`scripts/vendor-assets.mjs`，已挂在 `prebuild` / `predev` 上）会把它们搬进包里，构建产物自带 `flags/` 与 `vendor/`。

**上游的站点级开关怎么落地的**：上游靠哪吒的服务端模板往页面注入 `window.ForceShowMap`、`window.CustomLogo` 之类的全局变量。探针的主题包是纯静态文件，没有模板可注入，于是这些值改由主题设置下发：启动时先取配置，`applyWindowGlobals()` 写回 `window`，组件因此一行都不用改。

### 页脚

只保留命令面板的快捷键提示（`⌘K` / `Ctrl K`）：去掉了上游的「©2020-… Nezha ⟨版本⟩」与「Theme by nezha-dash-v2 (hash) · 移植到 极简探针 Monitor by akanotanin」两行。原作者署名仍在 `LICENSE`、`theme.json` 的 `author` 与仓库 README 里。

## 开发

```bash
pnpm install
pnpm vendor   # 把国旗/字体从依赖搬到 public/（build、dev 前会自动跑）
pnpm dev      # 本地开发；数据要同源，建议把 dev server 反代到探针，或配合上游的 mock
pnpm build    # typecheck + vite build
pnpm package  # 出 release/theme.tar.gz 与带版本号的副本 + sha256
```

打 tag（形如 `1.0.0`，须与 `theme.json` / `package.json` 的 version 一致）会触发 GitHub Actions 自动构建并发布 Release。

主题包结构：`theme.json` + `LICENSE` + `dist/`（+ 可选 `preview.png`）。探针 hub 只伺服静态文件，`dist/` 就是整站，前端路由靠 hub 的 SPA 兜底。

### 测试的现状（两条，都不是移植引入的 bug，但要知道）

1. **本机 Node 26 下整套跑不起来**：vitest 的 jsdom 环境拿不到 `localStorage`（Node 26 的实验性 localStorage 会抢占），`src/test/setup.ts` 的 `localStorage.clear()` 在 afterEach 抛错，148 个用例全失败。该现象在**未改动的上游代码**上同样复现（已实测），与移植无关；用上游 CI 使用的 Node 22 可正常运行。
2. **测试的 mock 打的是哪吒的 `/api/v1/*`**，而这套移植已把接口换成极简探针的 `/api/nodes`、`/api/ws`、`/api/nodes/{id}/metrics`、`/api/me`、`/api/themes/<short>/config`；另外被移除的区块（GPU / 进程数 / TCP-UDP / 交换历史）相关断言也随代码失效。已同步删掉 `server-detail-chart.test.tsx` 里那几个失效断言（GPU、进程、TCP/UDP，以及历史指标列表里的 gpu/swap/process_count/tcp_conn/udp_conn），其余文件的 mock 未做对齐——要一套全绿的测试需要单独一轮，把 mock 换成探针的接口。

## 版本记录

- **1.0.1** — 页脚去掉「©2020-… Nezha」与「Theme by nezha-dash-v2 (hash) · 移植到 极简探针 Monitor by akanotanin」两行，只留 `⌘K`/`Ctrl K` 提示。
- **1.0.0** — 首发：哪吒前端（nezha-dash-v2 v2.4.3）移植到极简探针。

## 许可

Apache-2.0，继承自[上游仓库](https://github.com/hamster1963/nezha-dash-v2)。原作者 hamster1963 的署名保留在 LICENSE、页脚与主题元信息中；移植到极简探针由 akanotanin 完成。
