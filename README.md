# Monitor Nezha

把 [hamster1963/nezha-dash-v2](https://github.com/hamster1963/nezha-dash-v2)（哪吒监控的官方前端）移植到[极简探针 Monitor](https://github.com/monitor-probe/monitor) 的主题包。

上游是一套给哪吒监控用的 React 前端：服务器卡片 / 紧凑列表双视图、分组标签、节点详情多标签图表、全球地图、延迟监控、周期流量、15 种语言、深浅色主题、命令面板、PWA。
这个仓库把它接到极简探针的数据接口上，做成可以直接装进探针后台的主题。


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
| | 自定义导航链接 | JSON 数组，显示在页头右上角，例 `[{"name":"Blog","link":"https://example.com"}]` |
| | 强制主题 | 跟随访客 / 浅色 / 深色 |
| | 桌面端背景图、移动端背景图 | 图片地址，留空无背景 |
| | 首页插画 | 总览卡片旁的插画地址，可换可隐藏 |
| 首页行为 | 默认用紧凑列表视图 | 强制所有访客首次进入就用紧凑列表 |
| | 默认展开全球地图 / 延迟监控 | 强制展开对应区块 |
| | 卡片显示周期流量 | 卡片 / 列表显示本计费周期上下行流量（**默认开**，与源站一致） |
| | 强制使用 SVG 国旗 | 不依赖系统 emoji 国旗字体 |
| | 卡片：服务器名置顶 | 名称／国旗居中在上、指标排在下（**默认开**，与源站一致；关掉则名称在左、指标在右） |
| | 图表剔除带宽峰值 | 避免个别尖峰压平曲线 |
| | 默认排序字段 / 方向 | 覆盖访客的排序选择 |
| 语言与自定义代码 | 站点默认语言 | 15 种语言，留空跟随访客 |
| | 自定义代码 | 注入到页面里的自定义 HTML／脚本（相当于哪吒后台的「自定义代码」） |
| 卡片底部标签 | 标签规则 | 每行 `匹配 = 标签1,标签2`，给卡片补带宽（蓝）／IPv4（紫）／IPv6（粉）／灰标签 |

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
| 延迟监控 / 探测线路 | `/api/nodes/{id}/metrics?series=ping`；`latency < 0` 记为丢包，**`null`／字段缺失也按丢包处理**（hub 对丢包样本可能给 `null`，直接透传会让上游 `null.toFixed()` 崩页） |
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

### 首页插画

上游默认是那张黑白线条小人（`animated-man.webp`）。移植换成了 `character.webp`（方形贴纸，带透明通道，浅色/深色都能用），并把它的偏移从 `top:-85px` 调到 `top:-58px` —— 原来的偏移是给竖长插画算的，方形图照用会整块悬在卡片上方。想换成自己的图：在「主题设置 → 首页插画」填地址即可；不想要就用「隐藏首页插画」关掉。

### 计费信息与卡片标签

上游的计费（价格／剩余天数／免费／永久）与卡片底部那排彩色标签都来自站长在哪吒后台手写的「公开备注」JSON；移植按探针字段自动生成同一份 JSON：

| 探针字段 | 生成 | 卡片上显示 |
| --- | --- | --- |
| `price`>0 + `currency` + `expires_at` | `amount`=`¥1200`、`endDate` | 价格: ¥1200/年、剩余天数: N 天 + 进度条 |
| `price`=**0**（明确免费） | `amount`=`0` | 绿字**免费** |
| 无 `expires_at` | `endDate`=`0000-00-00` | 剩余天数: **永久** |
| `traffic_limit` + `traffic_reset_day` | `trafficVol`=`2.0 TB/月` | 绿色流量标签 |

**带宽**（蓝）、**IPv4／IPv6**（紫／粉）与灰标签探针没有数据源（公开接口 `/api/nodes` 不暴露 IP，后台只有 `ipv4_pin`／`ipv6_pin` 两个管理字段），改由主题设置「卡片底部标签 → 标签规则」手填，每行一条 `匹配 = 标签1,标签2`；匹配按「分组名」或「节点名」子串，`*` 兜底，`#` 注释；第一个非 IPv4／IPv6 标签当带宽（蓝），其余进灰标签。例：

```
东京 = 2.5Gbps,IPv4,IPv6
美西 = 1Gbps,IPv4
* = 100Mbps
```

标签行的位置随视图走，和上游（源站）一致：**卡片视图**在卡片底部居中（上游宽屏会左对齐，这里显式居中）；**紧凑列表**在右侧指标网格的下方一行、靠左 —— 因为右列被拉伸到整行宽度，视觉上正好落在左侧「剩余天数」那一行的右边。

## 开发

```bash
pnpm install
pnpm vendor   # 把国旗/字体从依赖搬到 public/（build、dev 前会自动跑）
pnpm dev      # 本地开发；数据要同源，建议把 dev server 反代到探针，或配合上游的 mock
pnpm build    # typecheck + vite build
pnpm package  # 出 release/theme.tar.gz 与带版本号的副本 + sha256
```

打 tag（形如 `1.0.0`，须与 `theme.json` / `package.json` 的 version 一致）会触发 GitHub Actions 自动构建并发布 Release。

`scripts/check-defaults.mjs` 会在打包前校验 **`theme.json` 的 `default` 与 `src/monitor/config.ts` 的 `defaultThemeConfig` 是否一致**，不一致直接报错。两处必须同步：后台面板显示 theme.json 的默认值，而配置为空（新装、或保存失败）时页面实际用的是 config.ts —— 两边不同步就会出现「面板显示已开启、页面还是旧形态」这种极难排查的现象。

主题包结构：`theme.json` + `LICENSE` + `dist/`（+ 可选 `preview.png`）。探针 hub 只伺服静态文件，`dist/` 就是整站，前端路由靠 hub 的 SPA 兜底。

## 版本记录

- **1.0.0** — 首发：哪吒前端（nezha-dash-v2 v2.4.3）移植到极简探针。

## 许可

Apache-2.0，继承自[上游仓库](https://github.com/hamster1963/nezha-dash-v2)。原作者 hamster1963 的署名保留在 LICENSE、页脚与主题元信息中。
