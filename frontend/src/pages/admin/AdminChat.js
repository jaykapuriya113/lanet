import React, { useEffect, useState } from "react";
import { CometChatUI } from "../../cometchat-pro-react-ui-kit/CometChatWorkspace/src/components/CometChatUI";
import { CometChat } from "@cometchat-pro/chat";
import { useSelector } from "react-redux";

// Derive a stable CometChat UID from the local part of an email address.
const extractUsername = (email) => {
  if (typeof email !== "string") return null;
  const at = email.indexOf("@");
  return at !== -1 ? email.substring(0, at) : null;
};

const AdminChat = () => {
  const [chatReady, setChatReady] = useState(false);
  const [chatError, setChatError] = useState("");
  const { userInfo } = useSelector((state) => state.signIn);

  useEffect(() => {
    let cancelled = false;

    const loginToChat = async () => {
      if (!userInfo) return;

      try {
        const authKey = process.env.REACT_APP_COMETCHAT_AUTH_KEY;
        if (!authKey) throw new Error("CometChat auth key is not configured.");

        // Resolve email and name from either userInfo shape.
        const email = userInfo.role?.email || userInfo.email;
        const uid = extractUsername(email);
        if (!uid) throw new Error("Unable to determine chat user ID.");

        if (!CometChat.isInitialized()) {
          throw new Error("Chat service is still initializing. Refresh and try again.");
        }

        const displayName =
          `${userInfo.role?.firstName || userInfo.firstName || ""} ${userInfo.role?.lastName || userInfo.lastName || ""}`.trim() || uid;

        // Determine whether this user is a recruiter (role = 1).
        // Recruiters are tagged "recruiter" so the User chat page can filter
        // the contacts list to show only recruiter accounts.
        const userRole = Number(userInfo?.role?.role ?? userInfo?.role ?? 0);
        const isRecruiter = userRole === 1;
        const tags = isRecruiter ? ["recruiter"] : [];

        // Build the CometChat user object with the appropriate tags.
        const chatUser = new CometChat.User(uid);
        chatUser.setName(displayName);
        if (tags.length) chatUser.setTags(tags);

        // Create the user. ERR_UID_ALREADY_EXISTS means they already exist.
        let alreadyExists = false;
        try {
          await CometChat.createUser(chatUser, authKey);
        } catch (err) {
          if (err?.code !== "ERR_UID_ALREADY_EXISTS") throw err;
          alreadyExists = true;
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

        // For existing recruiter accounts that were created before tagging was
        // introduced, update their tags now using the logged-in session.
        // This ensures they appear in the User chat contacts list filter.
        if (isRecruiter && alreadyExists) {
          try {
            const updateUser = new CometChat.User(uid);
            updateUser.setTags(tags);
            await CometChat.updateCurrentUserDetails(updateUser);
          } catch {
            // Tag update is best-effort — do not block login on failure.
          }
        }

        if (!cancelled) setChatReady(true);
      } catch (error) {
        if (!cancelled) {
          const code = error?.code ? ` (${error.code})` : "";
          setChatError((error?.message || "Unable to connect to chat.") + code);
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
        height: "700px",
        marginTop: "25px",
        backgroundColor: "#F2F2F2",
      }}
    >
      {chatError && <p style={{ color: "red", padding: "16px" }}>{chatError}</p>}
      {!chatError && !chatReady && (
        <p style={{ padding: "16px" }}>Connecting to chat...</p>
      )}
      {chatReady && <CometChatUI />}
    </div>
  );
};

export default AdminChat;
