import React from "react";
import { Moon, Bell, Shield } from "lucide-react";
import { getUserSettings, updateUserSettings } from "@backend/auth";
import { Toast } from "../components/Toast";

export function SettingsPage() {
    const [settings, setSettings] = React.useState<any>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        async function loadSettings() {
            try {
                const data = await getUserSettings();
                setSettings(data);
            } catch (error) {
                setError("Failed to load settings");
            } finally {
                setIsLoading(false);
            }
        }
        loadSettings();
    }, []);

    const handleThemeChange = async (theme: "light" | "dark") => {
        try {
            await updateUserSettings({ theme });
            setSettings((prev) => ({ ...prev, theme }));
            setSuccess("Theme updated successfully");
        } catch (error) {
            setError("Failed to update theme");
        }
    };

    const handleNotificationsChange = async (enabled: boolean) => {
        try {
            await updateUserSettings({ notifications_enabled: enabled });
            setSettings((prev) => ({
                ...prev,
                notifications_enabled: enabled,
            }));
            setSuccess("Notification settings updated");
        } catch (error) {
            setError("Failed to update notification settings");
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-2xl mx-auto py-8 px-4">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-gray-200 rounded"></div>
                    <div className="h-64 bg-gray-200 rounded-lg"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            {error && (
                <Toast
                    message={error}
                    type="error"
                    onClose={() => setError(null)}
                />
            )}
            {success && (
                <Toast
                    message={success}
                    type="success"
                    onClose={() => setSuccess(null)}
                />
            )}

            <h1 className="text-2xl font-semibold text-gray-900 mb-8">
                Settings
            </h1>

            <div className="space-y-6">
                <Appearance
                    settings={settings}
                    handleThemeChange={handleThemeChange}
                />
                <Notifications
                    settings={settings}
                    handleNotificationsChange={handleNotificationsChange}
                />
                <Security />
            </div>
        </div>
    );
}

const Appearance = ({
    settings,
    handleThemeChange,
}: {
    settings?: any;
    handleThemeChange: (theme: "light" | "dark") => void;
}) => (
    <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-gray-400" />
                <div>
                    <h2 className="text-lg font-medium">Appearance</h2>
                    <p className="text-sm text-gray-500">
                        Customize how the app looks
                    </p>
                </div>
            </div>
        </div>

        <div className="p-6">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Theme</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleThemeChange("light")}
                        className={`px-4 py-2 text-sm rounded-lg ${
                            settings?.theme === "light"
                                ? "bg-blue-600 text-white"
                                : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        Light
                    </button>
                    <button
                        onClick={() => handleThemeChange("dark")}
                        className={`px-4 py-2 text-sm rounded-lg ${
                            settings?.theme === "dark"
                                ? "bg-blue-600 text-white"
                                : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        Dark
                    </button>
                </div>
            </div>
        </div>
    </div>
);

const Security = () => (
    <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-gray-400" />
                <div>
                    <h2 className="text-lg font-medium">Security</h2>
                    <p className="text-sm text-gray-500">
                        Manage your security settings
                    </p>
                </div>
            </div>
        </div>

        <div className="p-6">
            <button className="text-sm text-blue-600 hover:text-blue-700">
                Change password
            </button>
        </div>
    </div>
);

const Notifications = ({
    settings,
    handleNotificationsChange,
}: {
    settings?: any;
    handleNotificationsChange: (enabled: boolean) => void;
}) => (
    <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-gray-400" />
                <div>
                    <h2 className="text-lg font-medium">Notifications</h2>
                    <p className="text-sm text-gray-500">
                        Manage your notification preferences
                    </p>
                </div>
            </div>
        </div>

        <div className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-sm font-medium text-gray-700">
                        Enable notifications
                    </span>
                    <p className="text-sm text-gray-500">
                        Receive updates about bookings and campers
                    </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings?.notifications_enabled}
                        onChange={(e) =>
                            handleNotificationsChange(e.target.checked)
                        }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>
        </div>
    </div>
);
