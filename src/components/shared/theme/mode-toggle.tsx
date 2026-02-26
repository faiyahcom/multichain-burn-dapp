import { useTheme } from "@/components/providers/ThemeProvider";
import { Switch } from "./mode-switch";

export function ModeToggle() {
    const { theme, setTheme } = useTheme();

    const isDark = theme === "dark";

    return (
        <div className="flex w-full items-center justify-between gap-3 text-xs">
            <div className="flex flex-col">
                <span className="text-tiny text-sub-text">Theme</span>
                <span className="text-sm">
                    {theme === "dark" ? "Dark mode" : "Light mode"}
                </span>
            </div>
            <div className="items-end">
                <Switch
                    checked={isDark}
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    className="bg-inactive data-[state=checked]:bg-active"
                />
            </div>
        </div>
    );
}
