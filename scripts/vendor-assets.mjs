// 把国旗与系统 logo 的字形/样式从依赖里搬到 public/，让主题包自带这些资源。
//
// 上游是运行时从 jsdelivr 拉的（index.html 里两条 <link>）：换到自建的探针上
// 一旦 CDN 不可达，国旗和系统图标就整片消失。搬进包里就没这个问题。
// 只搬 4x3 一套国旗（上游只用 `fi fi-xx`，从不使用方形 `fis`）。
import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const VENDOR = "public/vendor";

mkdirSync(VENDOR, { recursive: true });

// 1) 国旗 SVG：整目录替换（只有这一份来源）
const flagsFrom = "node_modules/flag-icons/flags/4x3";
const flagsTo = "public/flags/4x3";
if (!existsSync(flagsFrom)) {
	console.error(`缺少 ${flagsFrom}，先跑 pnpm install`);
	process.exit(1);
}
rmSync(flagsTo, { recursive: true, force: true });
cpSync(flagsFrom, flagsTo, { recursive: true });
console.log(`vendored ${flagsFrom} -> ${flagsTo}`);

// 2) flag-icons 的样式：单个文件覆盖。
//    注意：别再对 public/vendor 整个目录 rmSync —— 会把刚拷进来的样式一起删掉。
const cssFrom = "node_modules/flag-icons/css/flag-icons.min.css";
const cssTo = join(VENDOR, "flag-icons.min.css");
if (!existsSync(cssFrom)) {
	console.error(`缺少 ${cssFrom}，先跑 pnpm install`);
	process.exit(1);
}
copyFileSync(cssFrom, cssTo);
console.log(`vendored ${cssFrom} -> ${cssTo}`);

// 3) font-logos 的字形与样式：逐文件拷贝，不动目录里的其他东西
const fontFrom = "node_modules/font-logos/assets";
const fontFiles = [
	"font-logos.css",
	"font-logos.woff",
	"font-logos.woff2",
	"font-logos.ttf",
];
if (!existsSync(fontFrom)) {
	console.error(`缺少 ${fontFrom}，先跑 pnpm install`);
	process.exit(1);
}
for (const file of fontFiles) {
	copyFileSync(join(fontFrom, file), join(VENDOR, file));
}
console.log(`vendored ${fontFrom} -> ${VENDOR}（${fontFiles.length} 个文件）`);
