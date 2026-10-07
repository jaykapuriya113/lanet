import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const MainAdminRoute = ({ children }) => {
  const { userInfo } = useSelector((state) => state.signIn);
  const role = Number(userInfo?.role?.role ?? userInfo?.role ?? 0);
  return userInfo && role === 2 ? children : <Navigate to="/" />;
};

export default MainAdminRoute;
