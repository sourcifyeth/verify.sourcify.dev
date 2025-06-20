import type { Route } from "./+types/home";
import { redirect } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sourcify Verification UI" },
    { name: "description", content: "Verify your smart contracts with Sourcify" },
  ];
}

export default function Home() {
  redirect("/verify");
}
