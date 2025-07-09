import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("jobs/:jobId", "routes/jobs.$jobId.tsx"),
] satisfies RouteConfig;
