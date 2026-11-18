import { CometChat } from "@cometchat-pro/chat";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { CometChatUI } from "../../cometchat-pro-react-ui-kit/CometChatWorkspace/src/components/CometChatUI";
import { UIKitSettings } from "../../cometchat-pro-react-ui-kit/CometChatWorkspace/src/util/UIKitSettings";

// Derive a stable CometChat UID from an email address (local part only).
const extractUsername = (email) => {
  if (typeof email !== "string") return null;
  const at = email.indexOf("@");
  return at !== -1 ? email.substring(0, at) : null;
};

// Resolve the profile object from either login response shape:
// Shape A (fresh login stored in Redux): { role: { email, firstName, ... } }
// Shape B (flat, rehydrated from localStorage): { email, firstName, ... }
const resolveProfile = (userInfo) => {
  if (!userInfo) return null;
  if (userInfo.role && typeof userInfo.role === "object") return userInfo.role;
  if (typeof userInfo.email === "string") return userInfo;
  return null;
};

// Wrapper: sets UIKitSettings._defaultUserListMode before CometChatUI mounts
// and clears it on unmount so other chat pages are unaffected.
const UIKitSettingsScope = ({ mode, children }) => {
  UIKitSettings._defaultUserListMode = mode;
  useEffect(() => () => { UIKitSettings._defaultUserListMode = null; }, []);
  return children;
};

const UserChat = () => {
  const { userInfo } = useSelector((state) => state.signIn);
  const [chatReady, setChatReady] = useState(false);
  const [chatError, setChatError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loginToChat = async () => {
      if (!userInfo) return;

      const profile = resolveProfile(userInfo);
      if (!profile) {
        if (!cancelled) setChatError("Unable to resolve user profile for chat.");
        return;
      }

      const uid = extractUsername(profile.email);
      if (!uid) {
        if (!cancelled) setChatError("Unable to determine chat user ID.");
        return;
      }

      try {
        const authKey = process.env.REACT_APP_COMETCHAT_AUTH_KEY;
        if (!authKey) throw new Error("CometChat auth key is not configured.");

        if (!CometChat.isInitialized()) {
          throw new Error("Chat service is still initializing. Refresh and try again.");
        }

        const displayName =
          `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || uid;

        // Create the CometChat user if they do not exist yet.
        // createUser() uses the auth key as an admin key — this works for
        // CometChat v3 when the auth key has the correct permissions.
        const chatUser = new CometChat.User(uid);
        chatUser.setName(displayName);
        try {
          await CometChat.createUser(chatUser, authKey);
        } catch (err) {
          // ERR_UID_ALREADY_EXISTS is expected on every login after the first.
          if (err?.code !== "ERR_UID_ALREADY_EXISTS") throw err;
        }

        // Log out any different CometChat session open in this browser tab.
        const loggedInUser = await CometChat.getLoggedinUser();
        if (loggedInUser && loggedInUser.getUid() !== uid) {
          await CometChat.logout();
        }

        // Login with uid + authKey (two-arg form — standard for v3).
        if (!loggedInUser || loggedInUser.getUid() !== uid) {
          await CometChat.login(uid, authKey);
        }

        if (!cancelled) setChatReady(true);
      } catch (err) {
        if (!cancelled) {
          const code = err?.code ? ` (${err.code})` : "";
          setChatError(
            (err?.message || "Unable to connect to chat.") + code,
          );
        }
      }
    };

    loginToChat();
    return () => { cancelled = true; };
  }, [userInfo]);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        height: "800px",
        marginTop: "25px",
      }}
    >
      {chatError && (
        <p style={{ color: "red", padding: "16px" }}>{chatError}</p>
      )}
      {!chatError && !chatReady && (
        <p style={{ padding: "16px" }}>Connecting to chat…</p>
      )}
      {chatReady && (
        // UIKitSettingsScope sets the users list to show only recruiter
        // accounts (tagged "recruiter" via the provisioning controller).
        <UIKitSettingsScope mode={UIKitSettings.userListFilterOptions.RECRUITERS}>
          <CometChatUI />
        </UIKitSettingsScope>
      )}
    </div>
  );
};

export default UserChat;
