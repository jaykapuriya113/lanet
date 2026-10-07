import React, { useEffect, useState } from "react";
import { CometChatUI } from "../../cometchat-pro-react-ui-kit/CometChatWorkspace/src/components/CometChatUI";
import { CometChat } from "@cometchat-pro/chat";
import { useSelector } from "react-redux";

const AdminChat = () => {
  const [chatReady, setChatReady] = useState(false);
  const [chatError, setChatError] = useState("");
  const extractUsername = (email) => {
    const atIndex = email.indexOf("@");
    if (atIndex !== -1) {
      const username = email.substring(0, atIndex);
      return username;
    }
    return null;
  };
  const { userInfo } = useSelector((state) => state.signIn);
  useEffect(() => {
    let cancelled = false;

    const loginToChat = async () => {
      if (!userInfo) return;

      try {
        const authKey = "e63ce563417fcafa1de6187962db3eb3f80c240b";
        const uid = extractUsername(userInfo.role.email);
        const user = new CometChat.User(uid);
        user.setName(
          `${userInfo.role.firstName} ${userInfo.role.lastName || ""}`.trim(),
        );

        if (!CometChat.isInitialized()) {
          throw new Error(
            "Chat service is still initializing. Refresh and try again.",
          );
        }

        try {
          await CometChat.createUser(user, authKey);
        } catch (error) {
          if (error?.code !== "ERR_UID_ALREADY_EXISTS") throw error;
        }

        const loggedInUser = await CometChat.getLoggedinUser();
        if (loggedInUser && loggedInUser.getUid() !== uid) {
          await CometChat.logout();
        }

        await CometChat.login(uid, authKey);
        if (!cancelled) setChatReady(true);
      } catch (error) {
        if (!cancelled) {
          setChatError(error?.message || "Unable to connect to chat.");
        }
      }
    };

    loginToChat();
    return () => {
      cancelled = true;
    };
  }, [userInfo]);
  return (
    <>
      <div
        style={{
          width: "84vw",
          height: "700px",
          marginTop: "25px",
          backgroundColor: "#F2F2F2",
        }}
      >
        {chatError && <p>{chatError}</p>}
        {!chatError && !chatReady && <p>Connecting to chat...</p>}
        {chatReady && <CometChatUI />}
      </div>
    </>
  );
};

export default AdminChat;
