import type React from "react";

/**
 * 页脚。
 *
 * 移植时去掉了上游的两行署名（©2020-… Nezha、Theme by nezha-dash-v2 (hash)），
 * 只留命令面板的快捷键提示；原作者署名保留在 LICENSE、theme.json 与仓库 README 里。
 */
const Footer: React.FC = () => {
	const isMac = /macintosh|mac os x/i.test(navigator.userAgent);

	return (
		<footer className="mx-auto w-full max-w-5xl px-4 lg:px-0 pb-4 server-footer">
			<section className="flex flex-col">
				<section className="mt-1 flex items-center justify-end gap-2 text-[13px] font-light tracking-tight text-neutral-600/50 dark:text-neutral-300/50 server-footer-name">
					<div className="server-footer-theme flex flex-col items-center sm:items-end">
						<p className="mt-1 text-[13px] font-light tracking-tight text-neutral-600/50 dark:text-neutral-300/50">
							<kbd className="pointer-events-none mx-1 inline-flex h-4 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
								{isMac ? <span className="text-xs">⌘</span> : "Ctrl "}K
							</kbd>
						</p>
					</div>
				</section>
			</section>
		</footer>
	);
};

export default Footer;
