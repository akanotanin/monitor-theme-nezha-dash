/**
 * 主题设置（后台「主题 → 主题设置」里改），对应上游用 window 全局变量接的那些站点级开关。
 *
 * 上游原本靠哪吒的服务端模板往页面里塞 `window.ForceShowMap` 之类的变量；
 * 极简探针的主题包是纯静态文件，没有模板可注入，所以这些值改由主题配置下发，
 * 启动时由 applyWindowGlobals() 写回 window —— 组件因此一行都不用改。
 */
import { fetchThemeConfig } from "./endpoints";

export interface ThemeConfig {
	/** 站标（图片地址）。 */
	customLogo: string;
	/** 站标右侧的说明文字；留空时用探针站点名。 */
	customDesc: string;
	customBackgroundImage: string;
	customMobileBackgroundImage: string;
	customIllustration: string;
	/** JSON 数组：[{"name":"...","link":"..."}]。 */
	customLinks: string;
	/** 注入到页面的自定义 HTML/JS。 */
	customCode: string;
	/** 站点默认语言，留空表示跟随访客浏览器。 */
	language: string;
	forceTheme: string;
	forceSortType: string;
	forceSortOrder: string;
	forceShowMap: boolean;
	forceShowServices: boolean;
	forceCardInline: boolean;
	showNetTransfer: boolean;
	forceUseSvgFlag: boolean;
	fixedTopServerName: boolean;
	disableAnimatedMan: boolean;
	forcePeakCutEnabled: boolean;
}

/** 默认值：站标用极简探针自己的默认图标，不沿用原项目图标。 */
export const defaultThemeConfig: ThemeConfig = {
	customLogo: "/favicon.svg",
	customDesc: "",
	customBackgroundImage: "",
	customMobileBackgroundImage: "",
	customIllustration: "/animated-man.webp",
	customLinks: "",
	customCode: "",
	language: "",
	forceTheme: "",
	forceSortType: "",
	forceSortOrder: "",
	forceShowMap: false,
	forceShowServices: false,
	forceCardInline: false,
	showNetTransfer: false,
	forceUseSvgFlag: false,
	fixedTopServerName: false,
	disableAnimatedMan: false,
	forcePeakCutEnabled: false,
};

const asString = (value: unknown, fallback: string) =>
	typeof value === "string" ? value : fallback;
const asBoolean = (value: unknown, fallback: boolean) =>
	typeof value === "boolean" ? value : fallback;

function coerce(raw: Record<string, unknown>): ThemeConfig {
	const d = defaultThemeConfig;
	return {
		customLogo: asString(raw.customLogo, d.customLogo),
		customDesc: asString(raw.customDesc, d.customDesc),
		customBackgroundImage: asString(raw.customBackgroundImage, d.customBackgroundImage),
		customMobileBackgroundImage: asString(
			raw.customMobileBackgroundImage,
			d.customMobileBackgroundImage,
		),
		customIllustration: asString(raw.customIllustration, d.customIllustration),
		customLinks: asString(raw.customLinks, d.customLinks),
		customCode: asString(raw.customCode, d.customCode),
		language: asString(raw.language, d.language),
		forceTheme: asString(raw.forceTheme, d.forceTheme),
		forceSortType: asString(raw.forceSortType, d.forceSortType),
		forceSortOrder: asString(raw.forceSortOrder, d.forceSortOrder),
		forceShowMap: asBoolean(raw.forceShowMap, d.forceShowMap),
		forceShowServices: asBoolean(raw.forceShowServices, d.forceShowServices),
		forceCardInline: asBoolean(raw.forceCardInline, d.forceCardInline),
		showNetTransfer: asBoolean(raw.showNetTransfer, d.showNetTransfer),
		forceUseSvgFlag: asBoolean(raw.forceUseSvgFlag, d.forceUseSvgFlag),
		fixedTopServerName: asBoolean(raw.fixedTopServerName, d.fixedTopServerName),
		disableAnimatedMan: asBoolean(raw.disableAnimatedMan, d.disableAnimatedMan),
		forcePeakCutEnabled: asBoolean(raw.forcePeakCutEnabled, d.forcePeakCutEnabled),
	};
}

let cache: ThemeConfig | null = null;
let inflight: Promise<ThemeConfig> | null = null;

/** 读主题配置；接口挂了就退回默认值（页面照常能看，只是没了站点级开关）。 */
export function loadThemeConfig(): Promise<ThemeConfig> {
	if (cache) return Promise.resolve(cache);
	if (inflight) return inflight;
	inflight = fetchThemeConfig()
		.then((raw) => {
			cache = coerce(raw ?? {});
			return cache;
		})
		.catch(() => {
			cache = { ...defaultThemeConfig };
			return cache;
		})
		.finally(() => {
			inflight = null;
		});
	return inflight;
}

/**
 * 把配置写回 window，供上游组件读取。
 *
 * 注意：不要在这里给 Window 加全局类型声明 —— 上游各处用的是
 * `@ts-expect-error 全局变量`，一旦真的声明了属性，那些注释会变成
 * TS2578「未使用的 @ts-expect-error」而编译失败。
 */
export function applyWindowGlobals(cfg: ThemeConfig, siteName?: string): void {
	const w = window as unknown as Record<string, unknown>;
	w.CustomLogo = cfg.customLogo || defaultThemeConfig.customLogo;
	w.CustomDesc = cfg.customDesc || siteName || "Monitor";
	w.CustomBackgroundImage = cfg.customBackgroundImage;
	w.CustomMobileBackgroundImage = cfg.customMobileBackgroundImage;
	w.CustomIllustration = cfg.customIllustration;
	w.CustomLinks = cfg.customLinks;
	w.ForceTheme = cfg.forceTheme;
	w.ForceShowMap = cfg.forceShowMap;
	w.ForceShowServices = cfg.forceShowServices;
	w.ForceCardInline = cfg.forceCardInline;
	w.ShowNetTransfer = cfg.showNetTransfer;
	w.ForceUseSvgFlag = cfg.forceUseSvgFlag;
	w.FixedTopServerName = cfg.fixedTopServerName;
	w.DisableAnimatedMan = cfg.disableAnimatedMan;
	w.ForcePeakCutEnabled = cfg.forcePeakCutEnabled;
	// 排序项未设置时保持 undefined：sort-provider 就是按「有值才强制」来判断的
	w.ForceSortType = cfg.forceSortType || undefined;
	w.ForceSortOrder = cfg.forceSortOrder || undefined;
}
