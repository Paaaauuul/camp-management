import React from "react";
import { useNavigate } from "react-router-dom";
import { Settings, LogOut, User } from "lucide-react";
import { signOut } from "@backend/auth";

interface UserMenuProps {
    onClose: () => void;
}

export function UserMenu({ onClose }: UserMenuProps) {
    const navigate = useNavigate();
    const menuRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate("/login");
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <div
            ref={menuRef}
            className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
        >
            <button
                onClick={() => {
                    navigate("/profile");
                    onClose();
                }}
                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
                <User className="h-4 w-4" />
                Profile
            </button>
            <button
                onClick={() => {
                    navigate("/settings");
                    onClose();
                }}
                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
                <Settings className="h-4 w-4" />
                Settings
            </button>
            <hr className="my-1 border-gray-200" />
            <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
                <LogOut className="h-4 w-4" />
                Sign out
            </button>
        </div>
    );
}
