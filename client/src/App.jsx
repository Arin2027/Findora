import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary.jsx";
import { Skeleton } from "./components/ui/Skeleton.jsx";

const Home = lazy(() => import("./pages/Home.jsx").then((m) => ({ default: m.Home })));
const Login = lazy(() => import("./pages/Login.jsx").then((m) => ({ default: m.Login })));
const Register = lazy(() => import("./pages/Register.jsx").then((m) => ({ default: m.Register })));
const PostItem = lazy(() => import("./pages/PostItem.jsx").then((m) => ({ default: m.PostItem })));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx").then((m) => ({ default: m.Dashboard })));
const Matches = lazy(() => import("./pages/Matches.jsx").then((m) => ({ default: m.Matches })));
const Chat = lazy(() => import("./pages/Chat.jsx").then((m) => ({ default: m.Chat })));
const ItemDetail = lazy(() => import("./pages/ItemDetail.jsx").then((m) => ({ default: m.ItemDetail })));
const Admin = lazy(() => import("./pages/Admin.jsx").then((m) => ({ default: m.Admin })));
const MapView = lazy(() => import("./pages/MapView.jsx").then((m) => ({ default: m.MapView })));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx").then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx").then((m) => ({ default: m.ResetPassword })));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail.jsx").then((m) => ({ default: m.VerifyEmail })));

function PageLoader() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function App() {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="verify-email" element={<VerifyEmail />} />
            <Route path="items/:id" element={<ItemDetail />} />
            <Route element={<ProtectedRoute />}>
              <Route path="post" element={<PostItem />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="matches" element={<Matches />} />
              <Route path="chat" element={<Chat />} />
              <Route path="map" element={<MapView />} />
            </Route>
            <Route element={<ProtectedRoute adminOnly />}>
              <Route path="admin" element={<Admin />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}
